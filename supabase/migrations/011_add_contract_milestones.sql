-- Migration: Add contract milestones and validation requests
-- Date: 2025-10-22

CREATE TYPE milestone_status AS ENUM ('pending','requested','approved','rejected','paid');

CREATE TABLE IF NOT EXISTS contract_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE,
  status milestone_status NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_contract ON contract_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON contract_milestones(status);

ALTER TABLE contract_milestones ENABLE ROW LEVEL SECURITY;

-- Only contract parties can view/modify
CREATE POLICY "Parties can view milestones"
  ON contract_milestones FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts WHERE client_id = auth.uid() OR professional_id = auth.uid()
    )
  );

CREATE POLICY "Parties can update milestones"
  ON contract_milestones FOR UPDATE
  USING (
    contract_id IN (
      SELECT id FROM contracts WHERE client_id = auth.uid() OR professional_id = auth.uid()
    )
  )
  WITH CHECK (
    contract_id IN (
      SELECT id FROM contracts WHERE client_id = auth.uid() OR professional_id = auth.uid()
    )
  );

CREATE POLICY "Parties can insert milestones"
  ON contract_milestones FOR INSERT
  WITH CHECK (
    contract_id IN (
      SELECT id FROM contracts WHERE client_id = auth.uid() OR professional_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION request_milestone_validation(p_milestone UUID)
RETURNS VOID AS $$
DECLARE
  c_client UUID;
  c_pro UUID;
BEGIN
  SELECT client_id, professional_id INTO c_client, c_pro
  FROM contracts WHERE id = (SELECT contract_id FROM contract_milestones WHERE id = p_milestone);

  IF c_client IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF auth.uid() <> c_client AND auth.uid() <> c_pro THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE contract_milestones
  SET status = 'requested', requested_by = auth.uid(), requested_at = NOW(), updated_at = NOW()
  WHERE id = p_milestone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

