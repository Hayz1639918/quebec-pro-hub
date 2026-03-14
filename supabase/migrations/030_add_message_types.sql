-- Migration 030: Add message type support and quote requests
-- Date: 2025-01-XX
-- Description: Extends the messaging system to support typed messages (US-030).
--   - message_type column for distinguishing regular vs quote_request vs system messages
--   - quote_amount column for quote request messages
--   - attachment_url column for file attachments (used by chat-attachments bucket in 046)

-- ============================================================
-- PART 1: Add message type columns
-- ============================================================

-- Add message_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages
      ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text'
        CHECK (message_type IN ('text', 'quote_request', 'system', 'attachment'));
  END IF;
END $$;

-- Add quote_amount for quote request messages (US-030)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'quote_amount'
  ) THEN
    ALTER TABLE messages ADD COLUMN quote_amount NUMERIC(12, 2);
  END IF;
END $$;

-- Add attachment_url for file/image attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'attachment_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN attachment_url TEXT;
  END IF;
END $$;

-- Add attachment_name for display purposes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'attachment_name'
  ) THEN
    ALTER TABLE messages ADD COLUMN attachment_name TEXT;
  END IF;
END $$;

-- ============================================================
-- PART 2: Index for message types
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_messages_type
  ON messages(conversation_id, message_type, created_at DESC);

-- ============================================================
-- PART 3: Notification type for quote requests
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'quote_request'
      AND enumtypid = 'notification_type'::regtype
  ) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quote_request';
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PART 4: Function to send a quote request via message (US-030)
-- ============================================================

CREATE OR REPLACE FUNCTION send_quote_request(
  p_conversation_id UUID,
  p_amount         NUMERIC(12, 2),
  p_description    TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_receiver_id UUID;
  v_sender_name TEXT;
BEGIN
  -- Verify caller is a participant of the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_conversation_id
      AND (client_id = auth.uid() OR professional_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not a participant of this conversation';
  END IF;

  -- Determine receiver
  SELECT CASE
    WHEN client_id = auth.uid() THEN professional_id
    ELSE client_id
  END INTO v_receiver_id
  FROM conversations WHERE id = p_conversation_id;

  -- Get sender name for notification
  SELECT full_name INTO v_sender_name FROM profiles WHERE id = auth.uid();

  -- Insert message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    receiver_id,
    content,
    message_type,
    quote_amount
  ) VALUES (
    p_conversation_id,
    auth.uid(),
    v_receiver_id,
    COALESCE(p_description, 'Demande de devis: ' || p_amount || ' $CAD'),
    'quote_request',
    p_amount
  ) RETURNING id INTO v_message_id;

  -- Send notification to receiver
  INSERT INTO notifications (
    user_id, type, title, message, related_user_id, action_url, metadata
  ) VALUES (
    v_receiver_id,
    'quote_request',
    'Nouvelle demande de devis 💰',
    v_sender_name || ' vous a envoyé une demande de devis pour ' || p_amount || ' $CAD',
    auth.uid(),
    '/messages',
    jsonb_build_object(
      'conversation_id', p_conversation_id,
      'amount', p_amount,
      'message_id', v_message_id
    )
  );

  -- Update conversation last_message_at
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_quote_request(UUID, NUMERIC, TEXT) TO authenticated;

COMMENT ON FUNCTION send_quote_request IS
  'Sends a quote request message in a conversation and notifies the other party (US-030)';

COMMENT ON COLUMN messages.message_type IS
  'Type of message: text (default), quote_request (US-030), system, attachment';
COMMENT ON COLUMN messages.quote_amount IS
  'Amount in CAD for quote_request type messages';
COMMENT ON COLUMN messages.attachment_url IS
  'URL to file attachment stored in chat-attachments bucket';
