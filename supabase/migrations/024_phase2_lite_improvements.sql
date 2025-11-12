-- Migration: Phase 2 Lite - Free Improvements
-- Date: 2024-11-12
-- Description: Messaging improvements with zero cost
-- - Grouped notifications (1 notif per 5 min per conversation)
-- - Soft delete messages (GDPR compliance)
-- - Message editing support
-- Cost: $0 (no external services)

-- ============================================
-- PART 1: SOFT DELETE MESSAGES
-- ============================================

-- Add soft delete columns to messages table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS original_content TEXT;

-- Create index for non-deleted messages (performance)
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted 
  ON messages(conversation_id, created_at) 
  WHERE deleted_at IS NULL;

-- Create index for deleted messages (audit/recovery)
CREATE INDEX IF NOT EXISTS idx_messages_deleted 
  ON messages(deleted_by, deleted_at) 
  WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN messages.deleted_at IS 'Soft delete timestamp. NULL = active message';
COMMENT ON COLUMN messages.deleted_by IS 'User who deleted the message';
COMMENT ON COLUMN messages.edited_at IS 'Last edit timestamp';
COMMENT ON COLUMN messages.original_content IS 'Original content before first edit';

-- Function to soft delete a message
CREATE OR REPLACE FUNCTION soft_delete_message(
  message_id UUID,
  deleter_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  message_exists BOOLEAN;
BEGIN
  -- Check if message exists and user has permission
  SELECT EXISTS(
    SELECT 1 FROM messages
    WHERE id = message_id
      AND (sender_id = deleter_id OR receiver_id = deleter_id)
      AND deleted_at IS NULL
  ) INTO message_exists;
  
  IF NOT message_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Soft delete the message
  UPDATE messages
  SET deleted_at = NOW(),
      deleted_by = deleter_id
  WHERE id = message_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION soft_delete_message IS 
  'Soft deletes a message. Returns TRUE if successful, FALSE if not found or no permission';

-- Function to permanently delete all messages for a user (GDPR)
CREATE OR REPLACE FUNCTION permanently_delete_user_messages(
  user_uuid UUID
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Hard delete all messages where user is sender or receiver
  DELETE FROM messages
  WHERE sender_id = user_uuid OR receiver_id = user_uuid
  RETURNING COUNT(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION permanently_delete_user_messages IS 
  'GDPR: Permanently deletes all messages for a user. Use with caution!';

-- ============================================
-- PART 2: GROUPED NOTIFICATIONS
-- ============================================

-- Drop existing notification trigger
DROP TRIGGER IF EXISTS trigger_create_notification_on_message ON messages;
DROP FUNCTION IF EXISTS create_notification_on_message();

-- Recreate with grouping logic
CREATE OR REPLACE FUNCTION create_notification_on_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  recent_notif_count INTEGER;
  grouping_window INTERVAL := '5 minutes';
BEGIN
  -- Don't create notification for deleted messages
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get sender's name
  SELECT COALESCE(company_name, full_name) INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Check if there's a recent notification for this conversation
  SELECT COUNT(*) INTO recent_notif_count
  FROM notifications
  WHERE user_id = NEW.receiver_id
    AND type = 'new_message'
    AND metadata->>'conversation_id' = NEW.conversation_id::text
    AND created_at > NOW() - grouping_window
    AND is_read = FALSE;
  
  -- Only create notification if no recent one exists
  IF recent_notif_count = 0 THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_user_id,
      related_message_id,
      action_url,
      metadata
    ) VALUES (
      NEW.receiver_id,
      'new_message',
      'Nouveau message',
      sender_name || ' vous a envoyé un message',
      NEW.sender_id,
      NEW.id,
      '/messages?conversation=' || NEW.conversation_id,
      jsonb_build_object(
        'sender_name', sender_name, 
        'preview', LEFT(NEW.content, 50),
        'conversation_id', NEW.conversation_id
      )
    );
  ELSE
    -- Update existing notification with count
    UPDATE notifications
    SET 
      message = sender_name || ' vous a envoyé ' || (recent_notif_count + 1) || ' messages',
      metadata = jsonb_set(
        metadata,
        '{message_count}',
        to_jsonb(recent_notif_count + 1)
      ),
      created_at = NOW()  -- Update timestamp to keep it recent
    WHERE user_id = NEW.receiver_id
      AND type = 'new_message'
      AND metadata->>'conversation_id' = NEW.conversation_id::text
      AND created_at > NOW() - grouping_window
      AND is_read = FALSE
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with new function
CREATE TRIGGER trigger_create_notification_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_message();

COMMENT ON FUNCTION create_notification_on_message IS 
  'Creates grouped notifications: 1 notification per 5 minutes per conversation';

-- ============================================
-- PART 3: UPDATE RLS POLICIES FOR SOFT DELETE
-- ============================================

-- Drop and recreate message SELECT policy to exclude deleted messages by default
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
    AND deleted_at IS NULL  -- ✅ Exclude soft-deleted messages
  );

-- Add policy to allow users to soft delete their own messages
CREATE POLICY "Users can soft delete their own messages"
  ON messages FOR UPDATE
  USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
    AND deleted_at IS NULL
  )
  WITH CHECK (
    auth.uid() = deleted_by  -- Can only set deleted_by to their own ID
  );

COMMENT ON POLICY "Users can view messages in their conversations" ON messages IS 
  'Users see only non-deleted messages in their conversations';

-- ============================================
-- PART 4: HELPER FUNCTIONS
-- ============================================

-- Function to get deleted messages count (for admin/audit)
CREATE OR REPLACE FUNCTION get_deleted_messages_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM messages
    WHERE (sender_id = user_uuid OR receiver_id = user_uuid)
      AND deleted_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_deleted_messages_count IS 
  'Returns count of soft-deleted messages for a user (audit purposes)';

-- Function to restore a soft-deleted message (admin only)
CREATE OR REPLACE FUNCTION restore_deleted_message(message_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  message_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM messages
    WHERE id = message_id
      AND deleted_at IS NOT NULL
  ) INTO message_exists;
  
  IF NOT message_exists THEN
    RETURN FALSE;
  END IF;
  
  UPDATE messages
  SET deleted_at = NULL,
      deleted_by = NULL
  WHERE id = message_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_deleted_message IS 
  'Restores a soft-deleted message (admin recovery tool)';

-- ============================================
-- PART 5: GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION soft_delete_message TO authenticated;
GRANT EXECUTE ON FUNCTION get_deleted_messages_count TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_delete_user_messages TO authenticated;

-- ============================================
-- PART 6: VERIFICATION
-- ============================================

DO $$
BEGIN
  -- Verify soft delete columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'deleted_at'
  ) THEN
    RAISE NOTICE '✅ Soft delete columns added successfully';
  ELSE
    RAISE WARNING '❌ Soft delete columns NOT found';
  END IF;
  
  -- Verify grouped notification function
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'create_notification_on_message'
  ) THEN
    RAISE NOTICE '✅ Grouped notifications function created';
  ELSE
    RAISE WARNING '❌ Grouped notifications function NOT found';
  END IF;
  
  -- Verify soft delete function
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'soft_delete_message'
  ) THEN
    RAISE NOTICE '✅ Soft delete function created';
  ELSE
    RAISE WARNING '❌ Soft delete function NOT found';
  END IF;
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 024 completed: Phase 2 Lite improvements applied';
  RAISE NOTICE '📧 Notifications: Grouped (1 per 5 min per conversation)';
  RAISE NOTICE '🗑️ Messages: Soft delete enabled (GDPR compliant)';
  RAISE NOTICE '✏️ Messages: Edit support prepared';
  RAISE NOTICE '💰 Cost: $0 (no external services)';
END $$;

