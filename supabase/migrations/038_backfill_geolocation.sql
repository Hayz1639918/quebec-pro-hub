-- Migration: Backfill geolocation for existing profiles and projects
-- Date: 2025-12-10
-- Description: Add default coordinates to existing records based on city name

-- ============================================
-- PART 1: UPDATE PROFILES WITHOUT COORDINATES
-- ============================================

-- Update professionals without coordinates based on their city
UPDATE profiles
SET 
  latitude = CASE 
    WHEN LOWER(city) LIKE '%montreal%' OR LOWER(city) LIKE '%montréal%' THEN 45.5017 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%quebec%' OR LOWER(city) LIKE '%québec%' THEN 46.8139 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%laval%' THEN 45.6066 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%gatineau%' THEN 45.4765 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%longueuil%' THEN 45.5312 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%sherbrooke%' THEN 45.4042 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saguenay%' THEN 48.4280 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%trois-rivi%' OR LOWER(city) LIKE '%trois rivi%' THEN 46.3432 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%terrebonne%' THEN 45.7050 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saint-jean%' OR LOWER(city) LIKE '%st-jean%' THEN 45.3073 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%brossard%' THEN 45.4657 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%repentigny%' THEN 45.7422 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%drummondville%' THEN 45.8838 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%granby%' THEN 45.4000 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saint-hyacinthe%' OR LOWER(city) LIKE '%st-hyacinthe%' THEN 45.6307 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%chicoutimi%' THEN 48.4284 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%rimouski%' THEN 48.4488 + (random() - 0.5) * 0.1
    ELSE NULL
  END,
  longitude = CASE 
    WHEN LOWER(city) LIKE '%montreal%' OR LOWER(city) LIKE '%montréal%' THEN -73.5673 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%quebec%' OR LOWER(city) LIKE '%québec%' THEN -71.2080 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%laval%' THEN -73.7124 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%gatineau%' THEN -75.7013 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%longueuil%' THEN -73.5180 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%sherbrooke%' THEN -71.8929 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saguenay%' THEN -71.0686 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%trois-rivi%' OR LOWER(city) LIKE '%trois rivi%' THEN -72.5477 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%terrebonne%' THEN -73.6470 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saint-jean%' OR LOWER(city) LIKE '%st-jean%' THEN -73.2628 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%brossard%' THEN -73.4491 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%repentigny%' THEN -73.4551 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%drummondville%' THEN -72.4846 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%granby%' THEN -72.7321 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saint-hyacinthe%' OR LOWER(city) LIKE '%st-hyacinthe%' THEN -72.9559 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%chicoutimi%' THEN -71.0656 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%rimouski%' THEN -68.5239 + (random() - 0.5) * 0.1
    ELSE NULL
  END
WHERE 
  user_type = 'professional'
  AND city IS NOT NULL 
  AND (latitude IS NULL OR longitude IS NULL);

-- Fallback: Update based on region if city match failed
UPDATE profiles
SET 
  latitude = CASE 
    WHEN LOWER(region) LIKE '%montreal%' OR LOWER(region) LIKE '%montréal%' THEN 45.5017 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%quebec%' OR LOWER(region) LIKE '%québec%' THEN 46.8139 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%laval%' THEN 45.6066 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%gatineau%' THEN 45.4765 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%longueuil%' THEN 45.5312 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%sherbrooke%' THEN 45.4042 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%saguenay%' THEN 48.4280 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%trois-rivi%' OR LOWER(region) LIKE '%trois rivi%' THEN 46.3432 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%terrebonne%' THEN 45.7050 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%saint-jean%' OR LOWER(region) LIKE '%st-jean%' THEN 45.3073 + (random() - 0.5) * 0.2
    ELSE 45.5017 + (random() - 0.5) * 0.3  -- Default to Montreal area with larger spread
  END,
  longitude = CASE 
    WHEN LOWER(region) LIKE '%montreal%' OR LOWER(region) LIKE '%montréal%' THEN -73.5673 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%quebec%' OR LOWER(region) LIKE '%québec%' THEN -71.2080 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%laval%' THEN -73.7124 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%gatineau%' THEN -75.7013 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%longueuil%' THEN -73.5180 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%sherbrooke%' THEN -71.8929 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%saguenay%' THEN -71.0686 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%trois-rivi%' OR LOWER(region) LIKE '%trois rivi%' THEN -72.5477 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%terrebonne%' THEN -73.6470 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%saint-jean%' OR LOWER(region) LIKE '%st-jean%' THEN -73.2628 + (random() - 0.5) * 0.2
    ELSE -73.5673 + (random() - 0.5) * 0.3  -- Default to Montreal area with larger spread
  END
WHERE 
  user_type = 'professional'
  AND (latitude IS NULL OR longitude IS NULL)
  AND region IS NOT NULL;

-- ============================================
-- PART 2: UPDATE PROJECTS WITHOUT COORDINATES
-- ============================================

-- Update projects without coordinates based on their city
UPDATE projects
SET 
  latitude = CASE 
    WHEN LOWER(city) LIKE '%montreal%' OR LOWER(city) LIKE '%montréal%' THEN 45.5017 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%quebec%' OR LOWER(city) LIKE '%québec%' THEN 46.8139 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%laval%' THEN 45.6066 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%gatineau%' THEN 45.4765 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%longueuil%' THEN 45.5312 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%sherbrooke%' THEN 45.4042 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saguenay%' THEN 48.4280 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%trois-rivi%' OR LOWER(city) LIKE '%trois rivi%' THEN 46.3432 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%terrebonne%' THEN 45.7050 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saint-jean%' OR LOWER(city) LIKE '%st-jean%' THEN 45.3073 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%brossard%' THEN 45.4657 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%repentigny%' THEN 45.7422 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%drummondville%' THEN 45.8838 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%granby%' THEN 45.4000 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saint-hyacinthe%' OR LOWER(city) LIKE '%st-hyacinthe%' THEN 45.6307 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%chicoutimi%' THEN 48.4284 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%rimouski%' THEN 48.4488 + (random() - 0.5) * 0.1
    ELSE NULL
  END,
  longitude = CASE 
    WHEN LOWER(city) LIKE '%montreal%' OR LOWER(city) LIKE '%montréal%' THEN -73.5673 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%quebec%' OR LOWER(city) LIKE '%québec%' THEN -71.2080 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%laval%' THEN -73.7124 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%gatineau%' THEN -75.7013 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%longueuil%' THEN -73.5180 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%sherbrooke%' THEN -71.8929 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saguenay%' THEN -71.0686 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%trois-rivi%' OR LOWER(city) LIKE '%trois rivi%' THEN -72.5477 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%terrebonne%' THEN -73.6470 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saint-jean%' OR LOWER(city) LIKE '%st-jean%' THEN -73.2628 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%brossard%' THEN -73.4491 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%repentigny%' THEN -73.4551 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%drummondville%' THEN -72.4846 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%granby%' THEN -72.7321 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%saint-hyacinthe%' OR LOWER(city) LIKE '%st-hyacinthe%' THEN -72.9559 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%chicoutimi%' THEN -71.0656 + (random() - 0.5) * 0.1
    WHEN LOWER(city) LIKE '%rimouski%' THEN -68.5239 + (random() - 0.5) * 0.1
    ELSE NULL
  END
WHERE 
  city IS NOT NULL 
  AND (latitude IS NULL OR longitude IS NULL);

-- Fallback: Update based on region if city match failed
UPDATE projects
SET 
  latitude = CASE 
    WHEN LOWER(region) LIKE '%montreal%' OR LOWER(region) LIKE '%montréal%' THEN 45.5017 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%quebec%' OR LOWER(region) LIKE '%québec%' THEN 46.8139 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%laval%' THEN 45.6066 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%gatineau%' THEN 45.4765 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%longueuil%' THEN 45.5312 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%sherbrooke%' THEN 45.4042 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%saguenay%' THEN 48.4280 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%trois-rivi%' OR LOWER(region) LIKE '%trois rivi%' THEN 46.3432 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%terrebonne%' THEN 45.7050 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%saint-jean%' OR LOWER(region) LIKE '%st-jean%' THEN 45.3073 + (random() - 0.5) * 0.2
    ELSE 45.5017 + (random() - 0.5) * 0.3  -- Default to Montreal area
  END,
  longitude = CASE 
    WHEN LOWER(region) LIKE '%montreal%' OR LOWER(region) LIKE '%montréal%' THEN -73.5673 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%quebec%' OR LOWER(region) LIKE '%québec%' THEN -71.2080 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%laval%' THEN -73.7124 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%gatineau%' THEN -75.7013 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%longueuil%' THEN -73.5180 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%sherbrooke%' THEN -71.8929 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%saguenay%' THEN -71.0686 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%trois-rivi%' OR LOWER(region) LIKE '%trois rivi%' THEN -72.5477 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%terrebonne%' THEN -73.6470 + (random() - 0.5) * 0.2
    WHEN LOWER(region) LIKE '%saint-jean%' OR LOWER(region) LIKE '%st-jean%' THEN -73.2628 + (random() - 0.5) * 0.2
    ELSE -73.5673 + (random() - 0.5) * 0.3  -- Default to Montreal area
  END
WHERE 
  (latitude IS NULL OR longitude IS NULL)
  AND region IS NOT NULL;

-- ============================================
-- DONE
-- ============================================

DO $$
DECLARE
  profiles_updated INTEGER;
  projects_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_updated 
  FROM profiles 
  WHERE user_type = 'professional' AND latitude IS NOT NULL AND longitude IS NOT NULL;
  
  SELECT COUNT(*) INTO projects_updated 
  FROM projects 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

  RAISE NOTICE '✅ Migration 038 completed: Geolocation backfill';
  RAISE NOTICE '📍 Professionals with coordinates: %', profiles_updated;
  RAISE NOTICE '📍 Projects with coordinates: %', projects_updated;
END $$;

