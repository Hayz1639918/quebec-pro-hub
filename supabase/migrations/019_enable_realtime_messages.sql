-- Enable Realtime for messages table
-- This allows real-time subscriptions to work properly

-- Enable replica identity for messages table (required for Realtime)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable Realtime publication for messages table
-- Note: This needs to be done via Supabase Dashboard as well
-- Go to Database > Replication and enable Realtime for the 'messages' table

-- Also ensure conversations table has Realtime enabled for conversation updates
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Comment: After running this migration, you must also:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Database > Replication
-- 3. Enable Realtime for 'messages' table
-- 4. Enable Realtime for 'conversations' table

