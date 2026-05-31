-- 079_payment_handling_choice.sql
-- Permet au client (préférence) et au contrat (accord signé) de choisir
-- la modalité de règlement : via la plateforme (Stripe) ou hors plateforme
-- (virement / chèque / comptant entre client et entrepreneur).

-- 1. Préférence exprimée par le client à la création du projet
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS payment_handling_preference TEXT
  NOT NULL DEFAULT 'negotiable';

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_payment_handling_preference_check;
ALTER TABLE projects
  ADD CONSTRAINT projects_payment_handling_preference_check
  CHECK (payment_handling_preference IN ('platform', 'offline', 'negotiable'));

-- 2. Modalité convenue et signée dans le contrat (source de vérité)
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS payment_handling TEXT
  NOT NULL DEFAULT 'platform';

ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_payment_handling_check;
ALTER TABLE contracts
  ADD CONSTRAINT contracts_payment_handling_check
  CHECK (payment_handling IN ('platform', 'offline'));

-- 3. Modalité proposée dans une proposition de contrat
ALTER TABLE contract_proposals
  ADD COLUMN IF NOT EXISTS payment_handling TEXT
  NOT NULL DEFAULT 'platform';

ALTER TABLE contract_proposals DROP CONSTRAINT IF EXISTS contract_proposals_payment_handling_check;
ALTER TABLE contract_proposals
  ADD CONSTRAINT contract_proposals_payment_handling_check
  CHECK (payment_handling IN ('platform', 'offline'));

-- 4. Propager la modalité lors de l'acceptation d'une proposition
CREATE OR REPLACE FUNCTION accept_contract_proposal(proposal_uuid UUID)
RETURNS UUID AS $$
DECLARE
  p RECORD;
  new_contract_id UUID;
BEGIN
  SELECT * INTO p FROM contract_proposals WHERE id = proposal_uuid;
  IF p IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
  IF auth.uid() <> p.client_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'Proposal not pending'; END IF;

  INSERT INTO contracts (
    project_id, template_id, client_id, professional_id,
    title, description, contract_content, variables,
    total_amount, currency, deposit_percentage,
    start_date, end_date, status, payment_handling
  ) VALUES (
    p.project_id, p.template_id, p.client_id, p.professional_id,
    p.title, p.description, p.contract_content_draft, p.variables,
    p.total_amount, COALESCE(p.currency,'CAD'), COALESCE(p.deposit_percentage,0),
    p.start_date, p.end_date, 'draft', COALESCE(p.payment_handling, 'platform')
  ) RETURNING id INTO new_contract_id;

  UPDATE contract_proposals SET status = 'accepted', updated_at = NOW() WHERE id = proposal_uuid;

  RETURN new_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
