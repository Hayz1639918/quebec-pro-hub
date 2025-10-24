-- Migration: Reviews and Mediation system
-- Date: 2025-10-22

-- Create types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mediation_status') THEN
        CREATE TYPE mediation_status AS ENUM ('open','in_review','resolved','rejected');
    END IF;
END $$;

-- Create reviews table first (required for mediations)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_project ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_professional ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews(client_id);

-- Enable RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
DROP POLICY IF EXISTS "Clients can view their reviews" ON reviews;
CREATE POLICY "Clients can view their reviews"
  ON reviews FOR SELECT
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Professionals can view their reviews" ON reviews;
CREATE POLICY "Professionals can view their reviews"
  ON reviews FOR SELECT
  USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;
CREATE POLICY "Clients can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update their reviews" ON reviews;
CREATE POLICY "Clients can update their reviews"
  ON reviews FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE TABLE IF NOT EXISTS mediations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status mediation_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mediations_professional ON mediations(professional_id);
CREATE INDEX IF NOT EXISTS idx_mediations_status ON mediations(status);

ALTER TABLE mediations ENABLE ROW LEVEL SECURITY;

-- Professional can create/view their mediations
DROP POLICY IF EXISTS "Pros can view their mediations" ON mediations;
CREATE POLICY "Pros can view their mediations"
  ON mediations FOR SELECT
  USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Pros can create mediations" ON mediations;
CREATE POLICY "Pros can create mediations"
  ON mediations FOR INSERT
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Pros can update their mediations" ON mediations;
CREATE POLICY "Pros can update their mediations"
  ON mediations FOR UPDATE
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

