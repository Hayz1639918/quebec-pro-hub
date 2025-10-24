-- Migration: Milestone approval function
-- Date: 2025-10-22

CREATE OR REPLACE FUNCTION approve_milestone(p_milestone UUID)
RETURNS VOID AS $$
DECLARE
  c_client UUID;
BEGIN
  SELECT client_id INTO c_client
  FROM contracts WHERE id = (SELECT contract_id FROM contract_milestones WHERE id = p_milestone);

  IF c_client IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF auth.uid() <> c_client THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE contract_milestones
  SET status = 'approved', validated_at = NOW(), updated_at = NOW()
  WHERE id = p_milestone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

