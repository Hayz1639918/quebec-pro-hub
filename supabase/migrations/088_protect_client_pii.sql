-- 088 — Protection des données personnelles des clients (Loi 25 / GDPR, US-120/121)
--
-- Constat d'audit (2026-07-03, testé avec la clé publishable anonyme) :
--   1. La table `profiles` était lisible en entier par le rôle `anon` :
--      emails et téléphones des 33 utilisateurs, CLIENTS INCLUS, accessibles
--      à n'importe quel visiteur non authentifié via l'API REST.
--   2. Les projets `in_progress` étaient visibles publiquement.
--
-- Correctif :
--   - anon ne peut lire que les profils `professional` (annuaire public voulu :
--     les coordonnées des pros sont affichées volontairement sur /professionals).
--   - anon ne peut lire que les projets `open` (place de marché).
--   - Les utilisateurs authentifiés gardent la lecture (jointures de noms dans
--     messagerie/propositions/contrats). Risque résiduel documenté dans
--     CONTINUITY.md : un compte gratuit peut encore lire les emails via l'API ;
--     le correctif complet (vue `profiles_directory` sans PII) est un chantier
--     séparé car ~30 points d'appel joignent `profiles` pour les noms.
--
-- ⚠️ À appliquer manuellement (SQL Editor Supabase ou `supabase db push`).
--    Vérifier au préalable les noms exacts des politiques existantes :
--    SELECT policyname, cmd, roles FROM pg_policies WHERE tablename IN ('profiles','projects');

BEGIN;

-- 1) profiles : retirer la lecture publique globale, la remplacer par
--    « anon → professionnels uniquement ».
DO $$
DECLARE pol record;
BEGIN
  -- Supprime toute politique SELECT existante qui couvre le rôle anon/public.
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT'
      AND (roles = '{public}' OR 'anon' = ANY (roles))
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "anon_read_professional_profiles"
  ON public.profiles FOR SELECT TO anon
  USING (user_type = 'professional');

CREATE POLICY "authenticated_read_profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- 2) projects : anon ne voit que les projets ouverts ; les participants et
--    les utilisateurs authentifiés gardent l'accès existant.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects' AND cmd = 'SELECT'
      AND (roles = '{public}' OR 'anon' = ANY (roles))
  LOOP
    EXECUTE format('DROP POLICY %I ON public.projects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "anon_read_open_projects"
  ON public.projects FOR SELECT TO anon
  USING (status = 'open');

CREATE POLICY "authenticated_read_projects"
  ON public.projects FOR SELECT TO authenticated
  USING (true);

COMMIT;

-- Vérification post-migration (avec la clé publishable, non authentifié) :
--   curl "$URL/rest/v1/profiles?select=email&user_type=eq.client&limit=1" -H "apikey: $ANON"
--     → doit renvoyer []
--   curl "$URL/rest/v1/projects?select=status&status=eq.in_progress&limit=1" -H "apikey: $ANON"
--     → doit renvoyer []
