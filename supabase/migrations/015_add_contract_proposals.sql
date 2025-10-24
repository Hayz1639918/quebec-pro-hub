-- Migration: Contract proposals by professionals
-- Date: 2025-10-22

-- Create types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_proposal_status') THEN
        CREATE TYPE contract_proposal_status AS ENUM ('pending','accepted','rejected','withdrawn');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS contract_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '{}',
  contract_content_draft TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  deposit_percentage DECIMAL(5,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status contract_proposal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Constraints removed - validation will be done via triggers
);

CREATE INDEX IF NOT EXISTS idx_cp_project ON contract_proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_cp_client ON contract_proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_cp_professional ON contract_proposals(professional_id);
CREATE INDEX IF NOT EXISTS idx_cp_status ON contract_proposals(status);

ALTER TABLE contract_proposals ENABLE ROW LEVEL SECURITY;

-- Trigger to validate user types
CREATE OR REPLACE FUNCTION validate_contract_proposal_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if client is actually a client
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.client_id AND user_type = 'client'
  ) THEN
    RAISE EXCEPTION 'client_id must reference a user with user_type = ''client''';
  END IF;
  
  -- Check if professional is actually a professional
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.professional_id AND user_type = 'professional'
  ) THEN
    RAISE EXCEPTION 'professional_id must reference a user with user_type = ''professional''';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_contract_proposal_users_trigger ON contract_proposals;
CREATE TRIGGER validate_contract_proposal_users_trigger
  BEFORE INSERT OR UPDATE ON contract_proposals
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_proposal_users();

-- Pros can insert and manage their proposals
DROP POLICY IF EXISTS "Pro can view own proposals" ON contract_proposals;
CREATE POLICY "Pro can view own proposals" ON contract_proposals FOR SELECT USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Pro can create proposals" ON contract_proposals;
CREATE POLICY "Pro can create proposals" ON contract_proposals FOR INSERT WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Pro can update own proposals" ON contract_proposals;
CREATE POLICY "Pro can update own proposals" ON contract_proposals FOR UPDATE USING (professional_id = auth.uid()) WITH CHECK (professional_id = auth.uid());

-- Clients can view proposals targeting them and update status
DROP POLICY IF EXISTS "Client can view proposals" ON contract_proposals;
CREATE POLICY "Client can view proposals" ON contract_proposals FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Client can update status" ON contract_proposals;
CREATE POLICY "Client can update status" ON contract_proposals FOR UPDATE USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

-- Accept proposal: creates contract and marks proposal accepted
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
    start_date, end_date, status
  ) VALUES (
    p.project_id, p.template_id, p.client_id, p.professional_id,
    p.title, p.description, p.contract_content_draft, p.variables,
    p.total_amount, COALESCE(p.currency,'CAD'), COALESCE(p.deposit_percentage,0),
    p.start_date, p.end_date, 'draft'
  ) RETURNING id INTO new_contract_id;

  UPDATE contract_proposals SET status = 'accepted', updated_at = NOW() WHERE id = proposal_uuid;

  RETURN new_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

