-- Migration: Add address field to profiles
-- Date: 2025-01-XX
-- Description: Add street address for contracts and documents

-- Add address field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN profiles.address IS 'Street address for contracts and official documents';

-- Create index for address searches
CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address) WHERE address IS NOT NULL;

