-- =========================================================================
-- Migration 083: Dedicated review moderation table (US-040)
-- -------------------------------------------------------------------------
-- Replaces the previous "report = self-notification" workaround in
-- ProfessionalProfile.tsx with a real moderation queue visible to admins.
-- Idempotent.
-- =========================================================================

CREATE TABLE IF NOT EXISTS review_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL,
  detail       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT review_reports_unique UNIQUE (review_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_review_reports_review  ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status  ON review_reports(status);

ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reporters read their own review reports" ON review_reports;
CREATE POLICY "Reporters read their own review reports"
  ON review_reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create review reports" ON review_reports;
CREATE POLICY "Users create review reports"
  ON review_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins manage review reports" ON review_reports;
CREATE POLICY "Admins manage review reports"
  ON review_reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
