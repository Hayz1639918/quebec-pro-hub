-- Migration 055: Add entrepreneur profile fields
-- Adds linkedin_url, certifications, languages, service_zones to profiles table
-- Required by ProProfile.tsx (US-048, US-049, US-050)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_zones TEXT[] DEFAULT '{}';

COMMENT ON COLUMN profiles.linkedin_url IS 'LinkedIn profile URL (US-048)';
COMMENT ON COLUMN profiles.certifications IS 'JSON array of {name, year} certification objects (US-049)';
COMMENT ON COLUMN profiles.languages IS 'Array of language codes spoken by the entrepreneur (US-050)';
COMMENT ON COLUMN profiles.service_zones IS 'Array of Quebec region names where entrepreneur offers services (US-050)';
