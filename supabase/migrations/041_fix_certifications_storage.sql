-- Migration: Fix certifications storage bucket
-- Date: 2025-12-30
-- Description: Creates/updates certifications bucket configuration
-- NOTE: Storage policies must be configured via Supabase Dashboard UI

-- Ensure the bucket exists with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certifications', 
  'certifications', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

-- IMPORTANT: Storage policies (SELECT, INSERT, UPDATE, DELETE) 
-- must be configured manually via Supabase Dashboard:
-- 1. Go to Storage > certifications bucket > Policies
-- 2. Create SELECT policy: "Anyone can view" with expression: bucket_id = 'certifications'
-- 3. Create INSERT policy: "Authenticated upload" with expression: 
--    bucket_id = 'certifications' AND (storage.foldername(name))[1] = auth.uid()::text
