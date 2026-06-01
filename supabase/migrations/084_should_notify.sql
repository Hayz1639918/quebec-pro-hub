-- =========================================================================
-- Migration 084: Honour notification preferences (US-042)
-- -------------------------------------------------------------------------
-- Centralises preference enforcement: a BEFORE INSERT trigger on
-- `notifications` skips the insert when the recipient has explicitly
-- disabled the matching push_* preference. Default behaviour is to allow
-- (only an explicit `false` suppresses the notification), so existing
-- triggers keep working unchanged.
-- Idempotent.
-- =========================================================================

-- Map a notification type to its notification_preferences key.
CREATE OR REPLACE FUNCTION notification_pref_key(notif_type TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN notif_type LIKE '%message%'                                  THEN 'push_messages'
    WHEN notif_type LIKE '%proposal%' OR notif_type LIKE '%quote%'    THEN 'push_proposals'
    WHEN notif_type LIKE '%contract%' OR notif_type LIKE '%signature%' THEN 'push_contracts'
    WHEN notif_type LIKE '%milestone%' OR notif_type = 'payment_pending' THEN 'push_milestones'
    WHEN notif_type IN ('payment_released', 'invoice_issued')         THEN 'push_payment_released'
    WHEN notif_type LIKE '%subscription%'                             THEN 'push_subscription_reminder'
    WHEN notif_type LIKE '%project%' OR notif_type LIKE '%invitation%' THEN 'push_new_projects'
    ELSE 'push_system'
  END;
$$;

-- should_notify(user, type): false only when the user explicitly disabled it.
CREATE OR REPLACE FUNCTION should_notify(target_user UUID, notif_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefs JSONB;
  pref_key TEXT;
BEGIN
  SELECT notification_preferences INTO prefs FROM profiles WHERE id = target_user;
  IF prefs IS NULL THEN
    RETURN TRUE;
  END IF;
  pref_key := notification_pref_key(notif_type);
  -- Allow unless the preference is explicitly the boolean false.
  RETURN COALESCE((prefs->>pref_key)::boolean, TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION notification_pref_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION should_notify(UUID, TEXT) TO authenticated;

-- BEFORE INSERT gate on notifications.
CREATE OR REPLACE FUNCTION gate_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT should_notify(NEW.user_id, NEW.type::text) THEN
    RETURN NULL; -- silently drop disabled notifications
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_gate_notification_preferences ON notifications;
CREATE TRIGGER trigger_gate_notification_preferences
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION gate_notification_preferences();
