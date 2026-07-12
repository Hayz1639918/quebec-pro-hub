-- =========================================================================
-- Migration 091 : Application de la 2FA au niveau base de données
-- -------------------------------------------------------------------------
-- La 2FA TOTP (Supabase MFA) est proposée dans l'interface (profils client
-- et pro) et exigée à la connexion (Auth.tsx). Sans cette migration, un
-- attaquant possédant le mot de passe pourrait IGNORER le défi 2FA en
-- appelant l'API REST directement avec une session aal1.
--
-- Principe (pattern officiel Supabase) : une politique RESTRICTIVE sur les
-- tables sensibles exige une session aal2 — mais UNIQUEMENT pour les comptes
-- ayant un facteur MFA vérifié. Les comptes sans 2FA ne sont pas affectés.
--
-- ⚠️ À appliquer manuellement (SQL Editor Supabase ou `supabase db push`),
--    comme 088/090.
-- =========================================================================

BEGIN;

-- SECURITY DEFINER : lit auth.mfa_factors (inaccessible au rôle authenticated)
-- et évite toute récursion de politiques.
CREATE OR REPLACE FUNCTION mfa_satisfied()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(auth.jwt()->>'aal', 'aal1') = 'aal2'
      OR NOT EXISTS (
        SELECT 1 FROM auth.mfa_factors
        WHERE user_id = auth.uid() AND status = 'verified'
      );
$$;

GRANT EXECUTE ON FUNCTION mfa_satisfied() TO authenticated;

COMMENT ON FUNCTION mfa_satisfied IS
  'Vrai si la session est aal2, ou si le compte n''a aucun facteur MFA vérifié. Utilisée par les politiques RESTRICTIVE enforce_mfa_aal2.';

-- Politique restrictive sur les tables sensibles (PII, argent, documents).
-- RESTRICTIVE = s''ajoute en ET aux politiques permissives existantes.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'projects',
    'contracts',
    'contract_proposals',
    'contract_milestones',
    'contractor_payments',
    'invoices',
    'conversations',
    'messages',
    'notifications',
    'disputes'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS "enforce_mfa_aal2" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "enforce_mfa_aal2" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (mfa_satisfied())',
        t
      );
    END IF;
  END LOOP;
END $$;

COMMIT;

-- =========================================================================
-- Vérification post-migration :
--   1. Compte SANS 2FA : aucun changement de comportement (mfa_satisfied()
--      renvoie true car aucun facteur vérifié).
--   2. Compte AVEC 2FA : se connecter mot de passe seulement (session aal1),
--      puis appeler /rest/v1/profiles → 0 ligne tant que le code TOTP n'a
--      pas été validé (aal2).
--   3. Après validation du code dans l'app → accès normal.
-- =========================================================================
