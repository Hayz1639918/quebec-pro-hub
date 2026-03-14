-- Migration 054: Search improvements and pre-entrepreneur cleanup
-- Date: 2025-02-XX
-- Description: Final cleanup before the entrepreneur profile features (055+).
--   - Conversations with details view refresh
--   - Additional search indexes
--   - Ensure all notification types exist

-- ============================================================
-- PART 1: Refresh conversations_with_details view
-- ============================================================
-- This view was first defined in migration 007/023. We refresh it here
-- to include any columns added in subsequent migrations.

CREATE OR REPLACE VIEW conversations_with_details AS
SELECT
  c.id,
  c.client_id,
  c.professional_id,
  c.created_at,
  c.updated_at,
  -- Client info
  cp.full_name         AS client_name,
  cp.profile_picture_url AS client_avatar,
  -- Professional info
  pp.full_name         AS professional_name,
  pp.company_name      AS professional_company,
  pp.profile_picture_url AS professional_avatar,
  pp.is_rbq_verified,
  -- Last message summary
  lm.content           AS last_message,
  lm.created_at        AS last_message_at,
  lm.sender_id         AS last_message_sender_id,
  lm.message_type      AS last_message_type,
  -- Unread count (from the perspective of the current user)
  (
    SELECT COUNT(*)
    FROM messages m2
    WHERE m2.conversation_id = c.id
      AND m2.receiver_id = auth.uid()
      AND m2.is_read = FALSE
  ) AS unread_count
FROM conversations c
JOIN profiles cp ON c.client_id      = cp.id
JOIN profiles pp ON c.professional_id = pp.id
LEFT JOIN LATERAL (
  SELECT content, created_at, sender_id, message_type
  FROM messages
  WHERE conversation_id = c.id
    AND (deleted_at IS NULL OR deleted_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1
) lm ON true
WHERE c.client_id = auth.uid() OR c.professional_id = auth.uid();

GRANT SELECT ON conversations_with_details TO authenticated;

-- ============================================================
-- PART 2: Additional notification types
-- ============================================================

DO $$
DECLARE
  types TEXT[] := ARRAY[
    'new_message', 'new_proposal', 'meeting_reminder',
    'payment_received', 'review_reply', 'subscription_expiring'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY types LOOP
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = t AND enumtypid = 'notification_type'::regtype
      ) THEN
        EXECUTE format('ALTER TYPE notification_type ADD VALUE IF NOT EXISTS %L', t);
      END IF;
    EXCEPTION
      WHEN undefined_object THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- PART 3: Ensure messages.is_read column exists
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(receiver_id, is_read, conversation_id)
  WHERE is_read = FALSE;

-- ============================================================
-- PART 4: Ensure projects have latitude/longitude columns
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE projects ADD COLUMN latitude DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE projects ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
END $$;

-- ============================================================
-- PART 5: Cleanup duplicate/orphaned indexes
-- ============================================================

-- Re-create important composite index for professional listings
CREATE INDEX IF NOT EXISTS idx_profiles_pro_listing
  ON profiles(user_type, is_rbq_verified, average_rating DESC)
  WHERE user_type = 'professional';

COMMENT ON VIEW conversations_with_details IS
  'Full conversation details with participant info and unread count for current user';
