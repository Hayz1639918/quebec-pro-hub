-- =========================================================================
-- Smoke test des garde-fous paiement (migrations 078 → 081)
-- -------------------------------------------------------------------------
-- À exécuter dans l'éditeur SQL Supabase APRÈS avoir appliqué 078..081.
-- Chaque bloc lève une exception si l'objet de sécurité attendu est absent.
-- Aucune donnée de test requise : ce sont des assertions structurelles.
-- Si le script s'exécute sans erreur, les garde-fous sont en place.
-- =========================================================================

-- 1. Méthodes hors plateforme autorisées (cheque/cash)
DO $$
DECLARE v_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_def
  FROM pg_constraint
  WHERE conname = 'contractor_payments_payment_method_check';
  IF v_def IS NULL OR v_def NOT LIKE '%cheque%' OR v_def NOT LIKE '%cash%' THEN
    RAISE EXCEPTION 'KO: cheque/cash absents de la contrainte payment_method (migration 078)';
  END IF;
  RAISE NOTICE 'OK 078: payment_method autorise cheque/cash';
END $$;

-- 2. RPC de règlement hors plateforme présente et restreinte
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'settle_offline_payment'
  ) THEN
    RAISE EXCEPTION 'KO: fonction settle_offline_payment absente (migration 080)';
  END IF;
  RAISE NOTICE 'OK 080: settle_offline_payment existe';
END $$;

-- 3. La policy permissive de release directe a été remplacée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contractor_payments'
      AND policyname = 'Contractors can update their own payments (dispute)'
  ) THEN
    RAISE EXCEPTION 'KO: ancienne policy permissive encore présente (migration 080)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contractor_payments'
      AND policyname = 'Contractors can dispute escrow payments'
  ) THEN
    RAISE EXCEPTION 'KO: policy dispute-only absente (migration 080)';
  END IF;
  RAISE NOTICE 'OK 080: UPDATE direct restreint au litige';
END $$;

-- 4. Garde-fou approbation de jalon (client only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_guard_milestone_approval'
  ) THEN
    RAISE EXCEPTION 'KO: trigger guard_milestone_approval absent (migration 081)';
  END IF;
  RAISE NOTICE 'OK 081: approbation de jalon protégée';
END $$;

-- 5. payment_handling immuable après signature
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_guard_payment_handling'
  ) THEN
    RAISE EXCEPTION 'KO: trigger guard_payment_handling absent (migration 081)';
  END IF;
  RAISE NOTICE 'OK 081: payment_handling verrouillé après signature';
END $$;

-- 6. Restriction des updates client sur les propositions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_guard_proposal_client_update'
  ) THEN
    RAISE EXCEPTION 'KO: trigger guard_proposal_client_update absent (migration 081)';
  END IF;
  RAISE NOTICE 'OK 081: client limité au statut sur les propositions';
END $$;

-- 7. Colonnes de modalité présentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'payment_handling'
  ) THEN
    RAISE EXCEPTION 'KO: contracts.payment_handling absent (migration 079)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'payment_handling_preference'
  ) THEN
    RAISE EXCEPTION 'KO: projects.payment_handling_preference absent (migration 079)';
  END IF;
  RAISE NOTICE 'OK 079: colonnes de modalité présentes';
END $$;

-- Si toutes les NOTICE OK s'affichent sans EXCEPTION : garde-fous en place.
