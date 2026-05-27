-- Migration 070: Auto-notify admins when a dispute is created
-- Date: 2026-05-27
-- When a new row is inserted in the `disputes` table, every user with profiles.is_admin = TRUE
-- receives a notification. The notification deep-links to /admin/dashboard.

CREATE OR REPLACE FUNCTION on_dispute_created()
RETURNS TRIGGER AS $$
DECLARE
  v_admin RECORD;
  v_opener_name TEXT;
  v_contract_title TEXT;
BEGIN
  -- Resolve display strings
  SELECT COALESCE(company_name, full_name, 'Utilisateur') INTO v_opener_name
  FROM profiles WHERE id = NEW.opened_by;

  SELECT title INTO v_contract_title
  FROM contracts WHERE id = NEW.contract_id;

  -- Fan-out a notification to every admin
  FOR v_admin IN
    SELECT id FROM profiles WHERE is_admin = TRUE
  LOOP
    INSERT INTO notifications (
      user_id, type, title, message,
      related_user_id, action_url, metadata
    ) VALUES (
      v_admin.id,
      'dispute_opened',
      'Nouveau litige à examiner',
      COALESCE(v_opener_name, 'Un utilisateur') || ' a ouvert un litige sur le contrat "' || COALESCE(v_contract_title, '—') || '".',
      NEW.opened_by,
      '/admin/dashboard',
      jsonb_build_object(
        'dispute_id', NEW.id,
        'contract_id', NEW.contract_id,
        'category', NEW.category,
        'opened_by', NEW.opened_by
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_dispute_created ON disputes;
CREATE TRIGGER trigger_dispute_created
  AFTER INSERT ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION on_dispute_created();

COMMENT ON FUNCTION on_dispute_created IS 'Notifies all admins when a new dispute is opened on a contract.';
