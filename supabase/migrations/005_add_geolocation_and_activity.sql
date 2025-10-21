-- Migration: Add geolocation and activity metrics for sorting
-- Date: 2025-10-21
-- Description: Adds latitude/longitude for proximity sorting and activity metrics

-- Add geolocation fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_last_updated TIMESTAMP WITH TIME ZONE;

-- Add activity metrics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_proposals_sent INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS proposals_last_30_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_score DECIMAL(5, 2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN profiles.latitude IS 'Latitude coordinate for geolocation';
COMMENT ON COLUMN profiles.longitude IS 'Longitude coordinate for geolocation';
COMMENT ON COLUMN profiles.location_last_updated IS 'Last time location was updated';
COMMENT ON COLUMN profiles.last_active_at IS 'Last time the user was active on the platform';
COMMENT ON COLUMN profiles.total_proposals_sent IS 'Total number of proposals sent (for professionals)';
COMMENT ON COLUMN profiles.proposals_last_30_days IS 'Number of proposals sent in the last 30 days';
COMMENT ON COLUMN profiles.profile_views_count IS 'Number of times profile has been viewed';
COMMENT ON COLUMN profiles.activity_score IS 'Calculated activity score (0-100)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE user_type = 'professional';
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at) WHERE user_type = 'professional';
CREATE INDEX IF NOT EXISTS idx_profiles_activity_score ON profiles(activity_score DESC) WHERE user_type = 'professional';

-- Enable PostGIS extension for geospatial queries (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add a geography column for better distance calculations
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Create a trigger to automatically update the geography column when lat/lng changes
CREATE OR REPLACE FUNCTION update_profile_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    NEW.location_last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_location();

-- Function to calculate activity score
-- Score is based on: recent activity (40%), proposals sent (30%), profile views (20%), total projects (10%)
CREATE OR REPLACE FUNCTION calculate_activity_score(profile_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL := 0;
  days_since_active INTEGER;
  recent_proposals INTEGER;
  views INTEGER;
  projects INTEGER;
BEGIN
  SELECT 
    EXTRACT(DAY FROM NOW() - last_active_at)::INTEGER,
    proposals_last_30_days,
    profile_views_count,
    total_projects
  INTO days_since_active, recent_proposals, views, projects
  FROM profiles
  WHERE id = profile_id;
  
  -- Recent activity score (0-40 points)
  -- Active in last 7 days: 40 points
  -- Active in last 30 days: 20 points
  -- Active in last 90 days: 10 points
  -- Older: 0 points
  IF days_since_active IS NULL OR days_since_active <= 7 THEN
    score := score + 40;
  ELSIF days_since_active <= 30 THEN
    score := score + 20;
  ELSIF days_since_active <= 90 THEN
    score := score + 10;
  END IF;
  
  -- Recent proposals score (0-30 points)
  -- Scale: 0-10+ proposals in last 30 days
  IF recent_proposals IS NOT NULL THEN
    score := score + LEAST(recent_proposals * 3, 30);
  END IF;
  
  -- Profile views score (0-20 points)
  -- Scale: 0-100+ views
  IF views IS NOT NULL THEN
    score := score + LEAST(views * 0.2, 20);
  END IF;
  
  -- Total projects score (0-10 points)
  -- Scale: 0-50+ projects
  IF projects IS NOT NULL THEN
    score := score + LEAST(projects * 0.2, 10);
  END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to update all activity scores
CREATE OR REPLACE FUNCTION update_all_activity_scores()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET activity_score = calculate_activity_score(id)
  WHERE user_type = 'professional';
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update activity score when relevant fields change
CREATE OR REPLACE FUNCTION trigger_update_activity_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.activity_score = calculate_activity_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_activity_score
  BEFORE UPDATE OF last_active_at, proposals_last_30_days, profile_views_count, total_projects ON profiles
  FOR EACH ROW
  WHEN (OLD.user_type = 'professional')
  EXECUTE FUNCTION trigger_update_activity_score();

-- Trigger to update last_active_at when profile is updated
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update last_active_at for significant changes (not every field update)
  -- This should ideally be called from the application when user performs actions
  IF TG_OP = 'UPDATE' AND (
    NEW.bio IS DISTINCT FROM OLD.bio OR
    NEW.services_offered IS DISTINCT FROM OLD.services_offered OR
    NEW.insurance_info IS DISTINCT FROM OLD.insurance_info
  ) THEN
    NEW.last_active_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_active
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- Optional: Populate existing profiles with sample geolocation data for Quebec cities
-- This is just for testing - remove or comment out in production
/*
UPDATE profiles 
SET 
  -- Montreal area
  latitude = CASE 
    WHEN city ILIKE '%montréal%' OR city ILIKE '%montreal%' THEN 45.5017 + (RANDOM() * 0.2 - 0.1)
    WHEN city ILIKE '%québec%' OR city ILIKE '%quebec%' THEN 46.8139 + (RANDOM() * 0.2 - 0.1)
    WHEN city ILIKE '%laval%' THEN 45.6066 + (RANDOM() * 0.1 - 0.05)
    WHEN city ILIKE '%gatineau%' THEN 45.4765 + (RANDOM() * 0.1 - 0.05)
    WHEN city ILIKE '%longueuil%' THEN 45.5312 + (RANDOM() * 0.1 - 0.05)
    WHEN city ILIKE '%sherbrooke%' THEN 45.4042 + (RANDOM() * 0.1 - 0.05)
    ELSE 45.5017 + (RANDOM() * 2.0 - 1.0)
  END,
  longitude = CASE 
    WHEN city ILIKE '%montréal%' OR city ILIKE '%montreal%' THEN -73.5673 + (RANDOM() * 0.2 - 0.1)
    WHEN city ILIKE '%québec%' OR city ILIKE '%quebec%' THEN -71.2080 + (RANDOM() * 0.2 - 0.1)
    WHEN city ILIKE '%laval%' THEN -73.6927 + (RANDOM() * 0.1 - 0.05)
    WHEN city ILIKE '%gatineau%' THEN -75.7013 + (RANDOM() * 0.1 - 0.05)
    WHEN city ILIKE '%longueuil%' THEN -73.5182 + (RANDOM() * 0.1 - 0.05)
    WHEN city ILIKE '%sherbrooke%' THEN -71.8929 + (RANDOM() * 0.1 - 0.05)
    ELSE -73.5673 + (RANDOM() * 4.0 - 2.0)
  END,
  last_active_at = NOW() - (RANDOM() * INTERVAL '90 days'),
  proposals_last_30_days = (RANDOM() * 15)::int,
  profile_views_count = (RANDOM() * 200)::int
WHERE user_type = 'professional';

-- Calculate initial activity scores
SELECT update_all_activity_scores();
*/

-- Create a view for easy querying with distance calculation
CREATE OR REPLACE VIEW professionals_with_distance AS
SELECT 
  p.*,
  -- This will be used for distance calculation in queries
  -- Usage: WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, 50000)
  0 as distance_km -- Placeholder, will be calculated in queries
FROM profiles p
WHERE p.user_type = 'professional';

-- Grant permissions
-- GRANT SELECT ON professionals_with_distance TO authenticated;
-- GRANT UPDATE (last_active_at, profile_views_count) ON profiles TO authenticated;

COMMENT ON COLUMN profiles.location IS 'PostGIS geography point for efficient distance calculations';
COMMENT ON FUNCTION calculate_activity_score IS 'Calculates activity score (0-100) based on recent activity, proposals, views, and projects';
COMMENT ON FUNCTION update_all_activity_scores IS 'Batch update all professional activity scores';

