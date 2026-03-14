-- Migration 050: Profile enhancements for entrepreneur dashboard
-- Date: 2025-02-XX
-- Description: Adds remaining profile fields needed by Pro dashboard pages.
--   - verified_at timestamp for professional profiles
--   - stripe_customer_id placeholder for future payment integration
--   - subscription_tier for display purposes
--   - profile_views counter

-- ============================================================
-- PART 1: Profile verification timestamp
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.verified_at IS
  'Timestamp when the professional was RBQ-verified by an admin';

-- Backfill from existing rbq_verified_at
UPDATE profiles
SET verified_at = rbq_verified_at
WHERE rbq_verified_at IS NOT NULL AND verified_at IS NULL;

-- ============================================================
-- PART 2: Profile views counter
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

COMMENT ON COLUMN profiles.profile_views IS
  'Number of times this profile has been viewed';

-- ============================================================
-- PART 3: Subscription tier for display (linked to subscriptions table)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise'));

COMMENT ON COLUMN profiles.subscription_tier IS
  'Current subscription tier for quick display (synchronized with subscriptions table)';

-- ============================================================
-- PART 4: Function to increment profile views
-- ============================================================

CREATE OR REPLACE FUNCTION increment_profile_views(p_profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_profile_views(UUID) TO authenticated, anon;

COMMENT ON FUNCTION increment_profile_views IS
  'Increments the profile_views counter for a professional profile';

-- ============================================================
-- PART 5: Update favorites_with_details view to include new fields
-- ============================================================

-- DROP first to allow column changes (CREATE OR REPLACE cannot remove columns)
DROP VIEW IF EXISTS favorites_with_details;

CREATE VIEW favorites_with_details AS
SELECT
  f.id          AS favorite_id,
  f.client_id   AS user_id,
  f.professional_id,
  f.created_at  AS favorited_at,
  f.notes,
  f.priority,
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.company_name,
  p.rbq_number,
  p.services_offered,
  p.city,
  p.region,
  p.bio,
  p.years_experience,
  p.average_rating,
  p.total_reviews,
  p.total_projects,
  p.profile_picture_url,
  p.is_rbq_verified,
  p.hourly_rate_min,
  p.hourly_rate_max,
  p.availability_status,
  p.available_from,
  p.response_time_hours,
  p.activity_score,
  p.latitude,
  p.longitude,
  p.subscription_tier
FROM favorites f
JOIN profiles p ON f.professional_id = p.id
WHERE p.user_type = 'professional';

GRANT SELECT ON favorites_with_details TO authenticated;
