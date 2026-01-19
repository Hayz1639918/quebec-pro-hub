-- Migration: Add support for uploaded contracts (PDF or scanned documents)
-- Date: 2025-12-30
-- Description: Allows users to upload existing contracts instead of creating them on the platform

-- =====================================================
-- STEP 1: Add columns for uploaded contracts
-- =====================================================

-- Add uploaded file URL to contracts table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'uploaded_file_url'
  ) THEN
    ALTER TABLE contracts ADD COLUMN uploaded_file_url TEXT;
  END IF;

  -- Flag to indicate if this is an uploaded contract vs created on platform
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'is_uploaded'
  ) THEN
    ALTER TABLE contracts ADD COLUMN is_uploaded BOOLEAN DEFAULT FALSE;
  END IF;

  -- Original filename for reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'uploaded_filename'
  ) THEN
    ALTER TABLE contracts ADD COLUMN uploaded_filename TEXT;
  END IF;

  -- Upload date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'uploaded_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN uploaded_at TIMESTAMPTZ;
  END IF;
END $$;

-- =====================================================
-- STEP 2: Create storage bucket for contract files
-- =====================================================

-- Create the contracts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false, -- Private bucket - only parties can access
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

-- =====================================================
-- STEP 3: Storage policies for contracts bucket
-- NOTE: These must be created via Supabase Dashboard
-- =====================================================

-- The following policies should be created in Supabase Dashboard > Storage > contracts > Policies:
--
-- 1. SELECT policy: "Users can view their contracts"
--    - Target roles: authenticated
--    - Expression: (storage.foldername(name))[1] = auth.uid()::text 
--                  OR (storage.foldername(name))[2] = auth.uid()::text
--
-- 2. INSERT policy: "Users can upload contracts"
--    - Target roles: authenticated
--    - Expression: true (or restrict by folder)
--
-- For now, we'll document this and the user can set it up manually.

-- =====================================================
-- STEP 4: Add index for faster queries on uploaded contracts
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_contracts_is_uploaded ON contracts(is_uploaded) WHERE is_uploaded = TRUE;
CREATE INDEX IF NOT EXISTS idx_contracts_uploaded_at ON contracts(uploaded_at DESC) WHERE uploaded_at IS NOT NULL;

-- =====================================================
-- STEP 5: Comment documentation
-- =====================================================

COMMENT ON COLUMN contracts.uploaded_file_url IS 'URL to the uploaded contract file in Supabase Storage';
COMMENT ON COLUMN contracts.is_uploaded IS 'TRUE if contract was uploaded as a file, FALSE if created on platform';
COMMENT ON COLUMN contracts.uploaded_filename IS 'Original filename of the uploaded contract';
COMMENT ON COLUMN contracts.uploaded_at IS 'Timestamp when the contract file was uploaded';


