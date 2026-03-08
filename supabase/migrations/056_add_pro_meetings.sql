-- Migration 056: Add pro_meetings table
-- Dedicated meetings table for entrepreneurs (US-057, US-058)
-- Independent from the existing 'meetings' table (which is tied to conversations)

CREATE TABLE IF NOT EXISTS pro_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  project_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_url TEXT,
  notes TEXT,
  pre_questions TEXT,
  has_reminder BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pro_meetings_organizer_id ON pro_meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_pro_meetings_scheduled_at ON pro_meetings(scheduled_at);

-- RLS
ALTER TABLE pro_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entrepreneurs can manage their own meetings"
  ON pro_meetings
  FOR ALL
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_pro_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pro_meetings_updated_at
  BEFORE UPDATE ON pro_meetings
  FOR EACH ROW EXECUTE FUNCTION update_pro_meetings_updated_at();
