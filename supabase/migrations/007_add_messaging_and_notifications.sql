-- Migration: Add messaging and notifications system
-- Date: 2025-10-21
-- Description: Adds conversations, messages, and notifications tables with real-time support

-- ============================================
-- PART 1: MESSAGING SYSTEM
-- ============================================

-- Create conversations table (1-to-1 conversations between users)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  -- Ensure unique conversation between two users (regardless of order)
  CONSTRAINT unique_conversation CHECK (participant_1_id < participant_2_id),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Optional: attach to a specific project or proposal
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  -- Optional: file attachment
  attachment_url TEXT,
  attachment_type VARCHAR(50)
);

-- Add comments for documentation
COMMENT ON TABLE conversations IS 'Stores 1-to-1 conversations between users';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON COLUMN conversations.participant_1_id IS 'First participant (always lower UUID)';
COMMENT ON COLUMN conversations.participant_2_id IS 'Second participant (always higher UUID)';
COMMENT ON COLUMN conversations.last_message_preview IS 'Preview of the last message (first 100 chars)';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read by the receiver';
COMMENT ON COLUMN messages.project_id IS 'Optional reference to a project';
COMMENT ON COLUMN messages.proposal_id IS 'Optional reference to a proposal';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- PART 2: NOTIFICATIONS SYSTEM
-- ============================================

-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'new_message',
  'new_proposal',
  'proposal_accepted',
  'proposal_rejected',
  'project_update',
  'review_received',
  'payment_received',
  'milestone_completed',
  'contract_signed',
  'system_announcement'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Optional: link to related entities
  related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  related_proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  related_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  -- Optional: action URL (e.g., link to project, proposal, etc.)
  action_url TEXT,
  -- Optional: metadata as JSON
  metadata JSONB
);

-- Add comments
COMMENT ON TABLE notifications IS 'Stores all user notifications';
COMMENT ON COLUMN notifications.type IS 'Type of notification';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate when notification is clicked';
COMMENT ON COLUMN notifications.metadata IS 'Additional data as JSON';

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update message read status"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Anyone can create (will be controlled by app logic)

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 4: TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update conversation timestamp when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    updated_at = NOW(),
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to create notification when new message is received
CREATE OR REPLACE FUNCTION create_notification_on_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender's name
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification for receiver
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
    '/dashboard/messages?conversation=' || NEW.conversation_id,
    jsonb_build_object('sender_name', sender_name, 'preview', LEFT(NEW.content, 50))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_notification_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_message();

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user_1_id UUID,
  user_2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  p1_id UUID;
  p2_id UUID;
BEGIN
  -- Ensure participant_1_id < participant_2_id
  IF user_1_id < user_2_id THEN
    p1_id := user_1_id;
    p2_id := user_2_id;
  ELSE
    p1_id := user_2_id;
    p2_id := user_1_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant_1_id = p1_id AND participant_2_id = p2_id;
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (p1_id, p2_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = TRUE, read_at = NOW()
  WHERE id = message_id AND receiver_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all messages in conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(conv_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = TRUE, read_at = NOW()
  WHERE conversation_id = conv_id 
    AND receiver_id = auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread messages count
CREATE OR REPLACE FUNCTION get_unread_messages_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM messages
    WHERE receiver_id = user_uuid AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = user_uuid AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: VIEWS FOR EASY QUERYING
-- ============================================

-- View for conversations with participant details and unread count
CREATE OR REPLACE VIEW conversations_with_details AS
SELECT 
  c.id,
  c.participant_1_id,
  c.participant_2_id,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  c.last_message_preview,
  p1.full_name as participant_1_name,
  p1.profile_picture_url as participant_1_avatar,
  p1.user_type as participant_1_type,
  p2.full_name as participant_2_name,
  p2.profile_picture_url as participant_2_avatar,
  p2.user_type as participant_2_type,
  (
    SELECT COUNT(*)::INTEGER
    FROM messages m
    WHERE m.conversation_id = c.id 
      AND m.is_read = FALSE
  ) as unread_count
FROM conversations c
JOIN profiles p1 ON c.participant_1_id = p1.id
JOIN profiles p2 ON c.participant_2_id = p2.id;

-- Add function comments
COMMENT ON FUNCTION get_or_create_conversation IS 'Get existing conversation or create new one between two users';
COMMENT ON FUNCTION mark_message_as_read IS 'Mark a specific message as read';
COMMENT ON FUNCTION mark_conversation_as_read IS 'Mark all messages in a conversation as read';
COMMENT ON FUNCTION get_unread_messages_count IS 'Get count of unread messages for a user';
COMMENT ON FUNCTION get_unread_notifications_count IS 'Get count of unread notifications for a user';

