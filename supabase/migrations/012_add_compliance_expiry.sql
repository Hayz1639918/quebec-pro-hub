-- Migration: Add compliance expiry fields and notification helper
-- Date: 2025-10-22

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rbq_expires_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_expires_at DATE;

COMMENT ON COLUMN profiles.rbq_expires_at IS 'Expiry date of RBQ license';
COMMENT ON COLUMN profiles.insurance_expires_at IS 'Expiry date of insurance';

-- Optional helper to create a notification (can be called by a scheduled task)
CREATE OR REPLACE FUNCTION notify_compliance_expiry()
RETURNS VOID AS $$
BEGIN
  -- 7 and 30 day reminders
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT p.id, 'system_announcement', 'RBQ proche de l''expiration', 'Votre licence RBQ expire bientôt', jsonb_build_object('rbq_expires_at', p.rbq_expires_at)
  FROM profiles p
  WHERE p.user_type = 'professional'
    AND p.rbq_expires_at IS NOT NULL
    AND p.rbq_expires_at <= CURRENT_DATE + INTERVAL '30 days'
    AND p.rbq_expires_at >= CURRENT_DATE
  ON CONFLICT DO NOTHING;

  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT p.id, 'system_announcement', 'Assurance proche de l''expiration', 'Votre assurance expire bientôt', jsonb_build_object('insurance_expires_at', p.insurance_expires_at)
  FROM profiles p
  WHERE p.user_type = 'professional'
    AND p.insurance_expires_at IS NOT NULL
    AND p.insurance_expires_at <= CURRENT_DATE + INTERVAL '30 days'
    AND p.insurance_expires_at >= CURRENT_DATE
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

