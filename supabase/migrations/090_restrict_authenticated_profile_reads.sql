-- =========================================================================
-- Migration 090 : Lecture des profils clients limitée au « besoin de savoir »
-- -------------------------------------------------------------------------
-- Complète la migration 088 (fuite anon colmatée). Risque résiduel documenté
-- dans 088 et CONTINUITY.md : la politique `authenticated_read_profiles
-- USING (true)` permettait à N'IMPORTE QUEL compte gratuit de lire les
-- courriels et téléphones de TOUS les clients via l'API REST (Loi 25 / GDPR).
--
-- Nouveau modèle d'accès pour le rôle authenticated sur `profiles` :
--   1. Son propre profil (toujours, toutes colonnes).
--   2. Les profils `professional` (annuaire public assumé — leurs coordonnées
--      sont affichées volontairement sur /professionals).
--   3. Les admins lisent tout (fonction is_admin(), SECURITY DEFINER).
--   4. Les profils CLIENTS uniquement s'il existe une relation d'affaires
--      réelle avec l'utilisateur courant : conversation, contrat, proposition
--      de contrat, invitation à un projet, paiement, soumission sur un projet
--      du client, avis laissé au pro — ou si le client a un projet `open`
--      (place de marché : les pros doivent voir qui publie l'offre).
--
-- Dégradation prévue et sans danger : là où une relation n'existe pas, les
-- UIs affichent déjà un repli (« Client anonyme », « Client », etc.).
--
-- ⚠️ À appliquer manuellement (SQL Editor Supabase ou `supabase db push`),
--    comme 088. Vérifications post-migration en bas de fichier.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. Fonction relationnelle (SECURITY DEFINER : contourne la RLS des tables
--    consultées → pas de récursion de politiques, coût prévisible)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_business_relationship(target_profile UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Conversation entre les deux usagers
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE (c.participant_1_id = auth.uid() AND c.participant_2_id = target_profile)
         OR (c.participant_2_id = auth.uid() AND c.participant_1_id = target_profile)
    )
    -- Contrat entre les deux usagers
    OR EXISTS (
      SELECT 1 FROM contracts k
      WHERE (k.client_id = target_profile AND k.professional_id = auth.uid())
         OR (k.professional_id = target_profile AND k.client_id = auth.uid())
    )
    -- Proposition de contrat entre les deux usagers
    OR EXISTS (
      SELECT 1 FROM contract_proposals cp
      WHERE (cp.client_id = target_profile AND cp.professional_id = auth.uid())
         OR (cp.professional_id = target_profile AND cp.client_id = auth.uid())
    )
    -- Invitation à un projet entre les deux usagers
    OR EXISTS (
      SELECT 1 FROM project_invitations pi
      WHERE (pi.client_id = target_profile AND pi.professional_id = auth.uid())
         OR (pi.professional_id = target_profile AND pi.client_id = auth.uid())
    )
    -- Paiement entre les deux usagers
    OR EXISTS (
      SELECT 1 FROM contractor_payments p
      WHERE (p.client_id = target_profile AND p.contractor_id = auth.uid())
         OR (p.contractor_id = target_profile AND p.client_id = auth.uid())
    )
    -- Le pro courant a soumissionné sur un projet du client cible
    OR EXISTS (
      SELECT 1 FROM proposals pr
      JOIN projects pj ON pj.id = pr.project_id
      WHERE pr.professional_id = auth.uid() AND pj.client_id = target_profile
    )
    -- Le client cible a laissé un avis au pro courant (nom du signataire)
    OR EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.client_id = target_profile AND r.professional_id = auth.uid()
    )
    -- Le client cible a un projet ouvert sur la place de marché
    OR EXISTS (
      SELECT 1 FROM projects pj
      WHERE pj.client_id = target_profile AND pj.status = 'open'
    )
$$;

GRANT EXECUTE ON FUNCTION has_business_relationship(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION has_business_relationship(UUID) FROM anon;

COMMENT ON FUNCTION has_business_relationship IS
  'Vrai si l''utilisateur courant a une relation d''affaires (conversation, contrat, proposition, invitation, paiement, soumission, avis, projet ouvert) avec le profil cible. Utilisée par la RLS de profiles.';

-- -------------------------------------------------------------------------
-- 2. Remplacer la politique de lecture authenticated (088 : USING (true))
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated_read_profiles" ON public.profiles;

CREATE POLICY "authenticated_read_profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR user_type = 'professional'
    OR is_admin()
    OR has_business_relationship(id)
  );

COMMIT;

-- =========================================================================
-- Vérifications post-migration (SQL Editor, ou REST avec un JWT de test) :
--
-- En tant que compte CLIENT fraîchement créé (aucune relation) :
--   SELECT email FROM profiles WHERE user_type = 'client' AND id <> auth.uid();
--     → 0 ligne
--   SELECT id FROM profiles WHERE user_type = 'professional' LIMIT 1;
--     → visible (annuaire)
--
-- En tant que PRO ayant une conversation/contrat avec un client :
--   → le profil de CE client reste lisible (noms dans messagerie, contrats,
--     paiements), les autres clients → 0 ligne.
--
-- Régressions attendues : AUCUNE côté annuaire /professionals ni marketplace
-- /projects. Les noms de clients sans relation retombent sur les replis UI
-- (« Client anonyme »).
-- =========================================================================
