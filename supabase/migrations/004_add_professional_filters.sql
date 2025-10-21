-- Migration: Add fields for professional filtering
-- Date: 2025-10-21
-- Description: Adds budget, availability, and response time fields for professionals

-- Add availability status enum
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'unavailable');

-- Add new columns to profiles table for professional filtering
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate_min DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate_max DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_rate_min DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_rate_max DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status availability_status DEFAULT 'available';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_from DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT 24;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepts_small_projects BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS minimum_project_budget DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS travel_distance_km INTEGER DEFAULT 50;

-- Add comments for documentation
COMMENT ON COLUMN profiles.hourly_rate_min IS 'Minimum hourly rate in CAD';
COMMENT ON COLUMN profiles.hourly_rate_max IS 'Maximum hourly rate in CAD';
COMMENT ON COLUMN profiles.daily_rate_min IS 'Minimum daily rate in CAD';
COMMENT ON COLUMN profiles.daily_rate_max IS 'Maximum daily rate in CAD';
COMMENT ON COLUMN profiles.availability_status IS 'Current availability status';
COMMENT ON COLUMN profiles.available_from IS 'Date from which the professional is available';
COMMENT ON COLUMN profiles.response_time_hours IS 'Average response time in hours';
COMMENT ON COLUMN profiles.accepts_small_projects IS 'Whether the professional accepts small projects';
COMMENT ON COLUMN profiles.minimum_project_budget IS 'Minimum project budget accepted in CAD';
COMMENT ON COLUMN profiles.travel_distance_km IS 'Maximum travel distance in kilometers';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_hourly_rate ON profiles(hourly_rate_min, hourly_rate_max) WHERE user_type = 'professional';
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON profiles(availability_status) WHERE user_type = 'professional';
CREATE INDEX IF NOT EXISTS idx_profiles_available_from ON profiles(available_from) WHERE user_type = 'professional';
CREATE INDEX IF NOT EXISTS idx_profiles_response_time ON profiles(response_time_hours) WHERE user_type = 'professional';

-- Add constraint to ensure rate ranges are valid
ALTER TABLE profiles ADD CONSTRAINT valid_hourly_rate_range 
  CHECK (hourly_rate_max IS NULL OR hourly_rate_min IS NULL OR hourly_rate_max >= hourly_rate_min);

ALTER TABLE profiles ADD CONSTRAINT valid_daily_rate_range 
  CHECK (daily_rate_max IS NULL OR daily_rate_min IS NULL OR daily_rate_max >= daily_rate_min);

-- Sample data for testing (optional - comment out in production)
-- UPDATE profiles 
-- SET 
--   hourly_rate_min = 50 + (RANDOM() * 50)::int,
--   hourly_rate_max = 100 + (RANDOM() * 100)::int,
--   availability_status = (ARRAY['available', 'busy', 'unavailable'])[1 + (RANDOM() * 2)::int],
--   available_from = CURRENT_DATE + (RANDOM() * 30)::int,
--   response_time_hours = (ARRAY[2, 6, 12, 24, 48])[1 + (RANDOM() * 4)::int],
--   accepts_small_projects = RANDOM() > 0.3,
--   minimum_project_budget = (ARRAY[1000, 2500, 5000, 10000, 25000])[1 + (RANDOM() * 4)::int],
--   travel_distance_km = (ARRAY[25, 50, 75, 100, 150])[1 + (RANDOM() * 4)::int]
-- WHERE user_type = 'professional';

-- Grant necessary permissions (if using RLS)
-- Professionals can update their own rates and availability
-- Public can read rates and availability for search/filtering

