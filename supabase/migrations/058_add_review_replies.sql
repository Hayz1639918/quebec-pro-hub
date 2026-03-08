-- Migration 058: Add review_replies table
-- Allows entrepreneurs to reply to client reviews (US-066)
-- One reply per review (UNIQUE constraint on review_id)

CREATE TABLE IF NOT EXISTS review_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);

-- RLS
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

-- Author can insert and update their own replies
CREATE POLICY "Authors can manage their own replies"
  ON review_replies
  FOR ALL
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Anyone can read replies (publicly visible on profile)
CREATE POLICY "Anyone can read review replies"
  ON review_replies
  FOR SELECT
  USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_review_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_replies_updated_at
  BEFORE UPDATE ON review_replies
  FOR EACH ROW EXECUTE FUNCTION update_review_replies_updated_at();
