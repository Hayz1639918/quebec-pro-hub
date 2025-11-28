-- Migration: Add geolocation support for projects and professionals
-- Date: 2025-11-28
-- Description: Adds latitude/longitude columns to enable map-based search

-- ============================================
-- PART 1: ADD GEOLOCATION TO PROJECTS
-- ============================================

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_projects_geolocation 
ON projects (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN projects.latitude IS 'Latitude coordinate of the project location';
COMMENT ON COLUMN projects.longitude IS 'Longitude coordinate of the project location';

-- ============================================
-- PART 2: ADD GEOLOCATION TO PROFILES
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 50;

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_profiles_geolocation 
ON profiles (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN profiles.latitude IS 'Latitude coordinate of the professional/client location';
COMMENT ON COLUMN profiles.longitude IS 'Longitude coordinate of the professional/client location';
COMMENT ON COLUMN profiles.service_radius_km IS 'Radius in km within which professional offers services';

-- ============================================
-- PART 3: FUNCTION TO CALCULATE DISTANCE
-- ============================================

-- Haversine formula to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371; -- Earth's radius in km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  a := SIN(dlat / 2) * SIN(dlat / 2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlon / 2) * SIN(dlon / 2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- PART 4: VIEWS FOR MAP DATA
-- ============================================

-- View for projects with geolocation (for map display)
CREATE OR REPLACE VIEW projects_map_view AS
SELECT 
  p.id,
  p.title,
  p.category,
  p.budget_min,
  p.budget_max,
  p.city,
  p.region,
  p.status,
  p.latitude,
  p.longitude,
  p.created_at,
  pr.full_name as client_name
FROM projects p
LEFT JOIN profiles pr ON p.client_id = pr.id
WHERE p.status = 'open'
  AND p.latitude IS NOT NULL 
  AND p.longitude IS NOT NULL;

-- View for professionals with geolocation (for map display)
CREATE OR REPLACE VIEW professionals_map_view AS
SELECT 
  p.id,
  p.full_name,
  p.company_name,
  p.city,
  p.region,
  p.latitude,
  p.longitude,
  p.service_radius_km,
  p.services_offered,
  p.years_experience,
  p.is_rbq_verified,
  p.rbq_number,
  COALESCE(
    (SELECT AVG(r.rating)::DECIMAL(3,2) FROM reviews r WHERE r.professional_id = p.id),
    0
  ) as average_rating,
  COALESCE(
    (SELECT COUNT(*) FROM reviews r WHERE r.professional_id = p.id),
    0
  ) as total_reviews
FROM profiles p
WHERE p.user_type = 'professional'
  AND p.latitude IS NOT NULL 
  AND p.longitude IS NOT NULL;

-- ============================================
-- PART 5: RPC FUNCTIONS FOR NEARBY SEARCH
-- ============================================

-- Find projects within a radius
CREATE OR REPLACE FUNCTION find_projects_nearby(
  user_lat DECIMAL(10, 8),
  user_lon DECIMAL(11, 8),
  radius_km INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  city TEXT,
  region TEXT,
  status TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ,
  client_name TEXT,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.category,
    p.budget_min,
    p.budget_max,
    p.city,
    p.region,
    p.status::TEXT,
    p.latitude,
    p.longitude,
    p.created_at,
    pr.full_name as client_name,
    calculate_distance_km(user_lat, user_lon, p.latitude, p.longitude) as distance_km
  FROM projects p
  LEFT JOIN profiles pr ON p.client_id = pr.id
  WHERE p.status = 'open'
    AND p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND calculate_distance_km(user_lat, user_lon, p.latitude, p.longitude) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Find professionals within a radius
CREATE OR REPLACE FUNCTION find_professionals_nearby(
  user_lat DECIMAL(10, 8),
  user_lon DECIMAL(11, 8),
  radius_km INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  company_name TEXT,
  city TEXT,
  region TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_radius_km INTEGER,
  services_offered TEXT,
  years_experience INTEGER,
  is_rbq_verified BOOLEAN,
  rbq_number TEXT,
  average_rating DECIMAL,
  total_reviews BIGINT,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.company_name,
    p.city,
    p.region,
    p.latitude,
    p.longitude,
    p.service_radius_km,
    p.services_offered,
    p.years_experience,
    p.is_rbq_verified,
    p.rbq_number,
    COALESCE(
      (SELECT AVG(r.rating)::DECIMAL(3,2) FROM reviews r WHERE r.professional_id = p.id),
      0
    ) as average_rating,
    COALESCE(
      (SELECT COUNT(*) FROM reviews r WHERE r.professional_id = p.id),
      0
    ) as total_reviews,
    calculate_distance_km(user_lat, user_lon, p.latitude, p.longitude) as distance_km
  FROM profiles p
  WHERE p.user_type = 'professional'
    AND p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND calculate_distance_km(user_lat, user_lon, p.latitude, p.longitude) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PART 6: DEFAULT COORDINATES FOR MAJOR CITIES
-- ============================================

-- Helper function to get default coordinates for a city
CREATE OR REPLACE FUNCTION get_city_coordinates(city_name TEXT)
RETURNS TABLE (lat DECIMAL(10, 8), lon DECIMAL(11, 8)) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN LOWER(city_name) LIKE '%montreal%' OR LOWER(city_name) LIKE '%montréal%' THEN 45.5017::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%quebec%' OR LOWER(city_name) LIKE '%québec%' THEN 46.8139::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%laval%' THEN 45.6066::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%gatineau%' THEN 45.4765::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%longueuil%' THEN 45.5312::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%sherbrooke%' THEN 45.4042::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%saguenay%' THEN 48.4280::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%trois-rivi%' OR LOWER(city_name) LIKE '%trois rivi%' THEN 46.3432::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%terrebonne%' THEN 45.7050::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%saint-jean%' OR LOWER(city_name) LIKE '%st-jean%' THEN 45.3073::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%toronto%' THEN 43.6532::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%ottawa%' THEN 45.4215::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%vancouver%' THEN 49.2827::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%calgary%' THEN 51.0447::DECIMAL(10, 8)
      WHEN LOWER(city_name) LIKE '%edmonton%' THEN 53.5461::DECIMAL(10, 8)
      ELSE NULL
    END as lat,
    CASE 
      WHEN LOWER(city_name) LIKE '%montreal%' OR LOWER(city_name) LIKE '%montréal%' THEN -73.5673::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%quebec%' OR LOWER(city_name) LIKE '%québec%' THEN -71.2080::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%laval%' THEN -73.7124::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%gatineau%' THEN -75.7013::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%longueuil%' THEN -73.5180::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%sherbrooke%' THEN -71.8929::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%saguenay%' THEN -71.0686::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%trois-rivi%' OR LOWER(city_name) LIKE '%trois rivi%' THEN -72.5477::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%terrebonne%' THEN -73.6470::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%saint-jean%' OR LOWER(city_name) LIKE '%st-jean%' THEN -73.2628::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%toronto%' THEN -79.3832::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%ottawa%' THEN -75.6972::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%vancouver%' THEN -123.1207::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%calgary%' THEN -114.0719::DECIMAL(11, 8)
      WHEN LOWER(city_name) LIKE '%edmonton%' THEN -113.4938::DECIMAL(11, 8)
      ELSE NULL
    END as lon;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- DONE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 027 completed: Geolocation support added';
  RAISE NOTICE '📍 Added latitude/longitude columns to projects and profiles';
  RAISE NOTICE '🔍 Created distance calculation function';
  RAISE NOTICE '🗺️ Created map views and nearby search functions';
END $$;

