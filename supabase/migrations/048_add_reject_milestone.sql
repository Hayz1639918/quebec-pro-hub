-- Migration: Add reject_milestone function
-- Date: 2026-05-27

CREATE OR REPLACE FUNCTION reject_milestone(p_milestone UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  c_client UUID;
  c_pro UUID;
  v_contract_id UUID;
  v_title TEXT;
BEGIN
  SELECT contract_id, title INTO v_contract_id, v_title
  FROM contract_milestones WHERE id = p_milestone;

  SELECT client_id, professional_id INTO c_client, c_pro
  FROM contracts WHERE id = v_contract_id;

  IF c_client IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF auth.uid() <> c_client THEN
    RAISE EXCEPTION 'Only the client can reject milestones';
  END IF;

  UPDATE contract_milestones
  SET status = 'rejected', updated_at = NOW()
  WHERE id = p_milestone;

  INSERT INTO notifications (
    user_id, type, title, message,
    related_user_id, related_project_id, metadata
  ) VALUES (
    c_pro,
    'milestone_rejected',
    'Jalon rejeté',
    'Le jalon "' || v_title || '" a été rejeté' || COALESCE('. Motif: ' || p_reason, ''),
    c_client,
    (SELECT project_id FROM contracts WHERE id = v_contract_id),
    jsonb_build_object(
      'milestone_id', p_milestone,
      'contract_id', v_contract_id,
      'reason', COALESCE(p_reason, '')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reject_milestone IS 'Allows the client to reject a milestone with an optional reason';
