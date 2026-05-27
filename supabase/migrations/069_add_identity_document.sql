-- Migration 069: Add identity document field for entrepreneur verification
-- Date: 2026-05-27
-- US-048: client requested all types of ID accepted (passport, driver license, RAMQ, etc.)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_type TEXT,
  ADD COLUMN IF NOT EXISTS id_document_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS id_document_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS id_document_verified_by UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_profiles_id_doc_verified ON profiles(id_document_verified) WHERE id_document_verified = FALSE;

COMMENT ON COLUMN profiles.id_document_url IS 'URL to identity document (passport, driver license, RAMQ, etc). Stored in certifications bucket.';
COMMENT ON COLUMN profiles.id_document_type IS 'Type of ID document: passport, driver_license, ramq, other';
