-- Migration 046: Add meetings table and chat-attachments storage bucket

-- Meetings table for scheduling virtual meetings from chat
CREATE TABLE IF NOT EXISTS meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Réunion de projet',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  notes TEXT,
  meeting_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = organizer_id OR auth.uid() = participant_id);

CREATE POLICY "Users can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizer can update meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizer can delete meetings"
  ON meetings FOR DELETE
  USING (auth.uid() = organizer_id);

-- Enable realtime for meetings
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;

-- Create chat-attachments storage bucket (public read, auth write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-attachments
CREATE POLICY "Authenticated users can upload chat attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view chat attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their own chat attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
