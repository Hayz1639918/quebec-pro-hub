-- 089 — Colonnes manquantes de la table projects (corrige l'échec de création de projet)
--
-- Constat : la page NewProject.tsx insère trois colonnes qui n'existaient pas
-- dans la table `projects` (erreur Postgres 42703 « column does not exist »),
-- ce qui faisait échouer TOUTE création de projet, même avec le formulaire
-- entièrement rempli :
--   - preferred_entrepreneur_type : type d'entrepreneur préféré (US-016)
--   - required_certifications     : certifications requises (US-016)
--   - payment_mode                : modalité de paiement choisie (US-014)
--
-- Ajout non destructif de colonnes nullable (aucune donnée existante affectée).

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS preferred_entrepreneur_type text,
  ADD COLUMN IF NOT EXISTS required_certifications text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS payment_mode text;
