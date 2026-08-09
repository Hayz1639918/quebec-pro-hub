-- =========================================================================
-- Migration 092: Lock down sensitive storage buckets
-- -------------------------------------------------------------------------
-- CRITICAL security fix.
--
-- Two buckets were public (world-readable via getPublicUrl) even though they
-- hold private / sensitive data:
--
--   * certifications  -> RBQ licences, insurance certificates AND government
--                        identity documents (passport, driver's licence,
--                        RAMQ health card). Migration 001 created it private;
--                        migration 041 flipped it to public. This exposed
--                        PII to anyone with (or guessing) the object URL.
--   * chat-attachments -> files exchanged inside private 1:1 conversations.
--
-- This migration makes both buckets private and replaces the public read
-- policies with least-privilege ones:
--   * certifications  -> readable only by the owner (its folder) and admins.
--   * chat-attachments -> readable only by the uploader and the participants
--                         of the conversation the file was shared in.
--
-- After applying this migration, the front-end must read these objects with
-- createSignedUrl() instead of getPublicUrl() (done in the app code).
-- Idempotent.
-- =========================================================================

-- ------------------------------------------------------------------
-- certifications: RBQ / insurance / identity documents
-- ------------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'certifications';

-- Remove any permissive public-read policies left over from earlier setup
-- (created via dashboard or migration 041 instructions).
DROP POLICY IF EXISTS "Anyone can view" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view certifications" ON storage.objects;
DROP POLICY IF EXISTS "Public can view certifications" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;

DROP POLICY IF EXISTS "Owner or admin can read certifications" ON storage.objects;
CREATE POLICY "Owner or admin can read certifications"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certifications'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR is_admin()
    )
  );

-- Re-assert owner-scoped write policies (idempotent).
DROP POLICY IF EXISTS "Users can upload their own certifications" ON storage.objects;
CREATE POLICY "Users can upload their own certifications"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own certifications" ON storage.objects;
CREATE POLICY "Users can update their own certifications"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own certifications" ON storage.objects;
CREATE POLICY "Users can delete their own certifications"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ------------------------------------------------------------------
-- chat-attachments: private conversation files
-- ------------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;

DROP POLICY IF EXISTS "Participants can view chat attachments" ON storage.objects;
CREATE POLICY "Participants can view chat attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (
      -- uploader (files live under "<uploader_id>/...")
      auth.uid()::text = (storage.foldername(name))[1]
      -- or a participant of the message this file was attached to
      OR EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.attachment_url LIKE '%' || storage.objects.name
          AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
      )
    )
  );
