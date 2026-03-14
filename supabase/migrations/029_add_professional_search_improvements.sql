-- Migration 029: Professional search improvements
-- Date: 2025-01-XX
-- Description: Add performance indexes and search optimizations for the professional marketplace.
--   - GIN index for full-text search on professional services
--   - Composite indexes for common filter combinations
--   - Function to calculate profile completeness score

-- ============================================================
-- PART 1: Full-text search index on services and bio
-- ============================================================

-- Add generated tsvector column for full-text search (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE profiles ADD COLUMN search_vector TSVECTOR;
  END IF;
END $$;

-- Update existing rows
UPDATE profiles
SET search_vector = to_tsvector('french',
  COALESCE(full_name, '') || ' ' ||
  COALESCE(company_name, '') || ' ' ||
  COALESCE(services_offered, '') || ' ' ||
  COALESCE(bio, '') || ' ' ||
  COALESCE(city, '') || ' ' ||
  COALESCE(region, '')
)
WHERE user_type = 'professional';

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector
  ON profiles USING GIN(search_vector)
  WHERE user_type = 'professional';

-- Function to keep search_vector up to date
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_type = 'professional' THEN
    NEW.search_vector := to_tsvector('french',
      COALESCE(NEW.full_name, '') || ' ' ||
      COALESCE(NEW.company_name, '') || ' ' ||
      COALESCE(NEW.services_offered, '') || ' ' ||
      COALESCE(NEW.bio, '') || ' ' ||
      COALESCE(NEW.city, '') || ' ' ||
      COALESCE(NEW.region, '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_search_vector ON profiles;
CREATE TRIGGER trigger_update_profile_search_vector
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_search_vector();

-- ============================================================
-- PART 2: Composite indexes for common filters
-- ============================================================

-- Index for professionals filtered by region + service
CREATE INDEX IF NOT EXISTS idx_profiles_professional_region
  ON profiles(user_type, region, is_rbq_verified)
  WHERE user_type = 'professional';

-- Index for professionals filtered by city
CREATE INDEX IF NOT EXISTS idx_profiles_professional_city
  ON profiles(user_type, city)
  WHERE user_type = 'professional';

-- Index for professionals sorted by rating
CREATE INDEX IF NOT EXISTS idx_profiles_professional_rating
  ON profiles(user_type, average_rating DESC, total_reviews DESC)
  WHERE user_type = 'professional';

-- ============================================================
-- PART 3: Profile completeness function
-- ============================================================

CREATE OR REPLACE FUNCTION get_profile_completeness(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  prof RECORD;
BEGIN
  SELECT * INTO prof FROM profiles WHERE id = profile_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Basic info (40 points)
  IF prof.full_name IS NOT NULL THEN score := score + 10; END IF;
  IF prof.phone IS NOT NULL THEN score := score + 5; END IF;
  IF prof.city IS NOT NULL THEN score := score + 5; END IF;
  IF prof.region IS NOT NULL THEN score := score + 5; END IF;
  IF prof.bio IS NOT NULL AND length(prof.bio) > 50 THEN score := score + 10; END IF;
  IF prof.profile_picture_url IS NOT NULL THEN score := score + 5; END IF;

  -- Professional-specific (60 points)
  IF prof.user_type = 'professional' THEN
    IF prof.company_name IS NOT NULL THEN score := score + 10; END IF;
    IF prof.services_offered IS NOT NULL THEN score := score + 10; END IF;
    IF prof.years_experience IS NOT NULL THEN score := score + 5; END IF;
    IF prof.website_url IS NOT NULL THEN score := score + 5; END IF;
    IF prof.insurance_info IS NOT NULL THEN score := score + 10; END IF;
    IF prof.rbq_number IS NOT NULL THEN score := score + 10; END IF;
    IF prof.is_rbq_verified THEN score := score + 10; END IF;
  END IF;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_profile_completeness(UUID) TO authenticated;

COMMENT ON FUNCTION get_profile_completeness IS
  'Returns a 0-100 score representing how complete a professional profile is';
