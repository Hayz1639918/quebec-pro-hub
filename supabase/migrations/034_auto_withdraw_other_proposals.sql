-- Migration: Auto-withdraw other proposals when one is accepted
-- Date: 2025-12-05
-- Description: Automatically mark all other pending proposals as "withdrawn" when a proposal is accepted

-- ============================================
-- FUNCTION: Withdraw other proposals when one is accepted
-- ============================================

CREATE OR REPLACE FUNCTION withdraw_other_proposals()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- Mark all other pending proposals for the same project as 'withdrawn'
    UPDATE proposals
    SET
      status = 'withdrawn',
      updated_at = NOW()
    WHERE
      project_id = NEW.project_id
      AND id != NEW.id
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Apply function on proposal update
-- ============================================

DROP TRIGGER IF EXISTS trigger_withdraw_other_proposals ON proposals;
CREATE TRIGGER trigger_withdraw_other_proposals
  AFTER UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION withdraw_other_proposals();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION withdraw_other_proposals IS 'Automatically withdraws all other pending proposals when one proposal is accepted for a project';
COMMENT ON TRIGGER trigger_withdraw_other_proposals ON proposals IS 'Ensures only one proposal can be accepted per project by withdrawing others';
