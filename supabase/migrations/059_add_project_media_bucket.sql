-- Migration 059: Add project media storage bucket and projects.media_urls column
-- Required by ProjectProgress.tsx media upload feature (US-061)

-- Add media_urls column to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]';

COMMENT ON COLUMN projects.media_urls IS 'Array of {url, caption} objects for project progress photos/videos';

-- Create project-media storage bucket (public, 50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-media',
  'project-media',
  true,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/mpeg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload project media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: anyone can read project media (public bucket)
CREATE POLICY "Anyone can view project media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'project-media');

-- Storage RLS: users can delete their own files
CREATE POLICY "Users can delete their own project media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
