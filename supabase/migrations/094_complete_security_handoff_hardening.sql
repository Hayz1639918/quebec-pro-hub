-- =========================================================================
-- Migration 094: Complete the production security handoff
-- -------------------------------------------------------------------------
-- Follow-up discovered while validating migrations 090-093 against the live
-- project. It closes legacy Storage policies whose dashboard-generated names
-- were not covered by 092, keeps the message rate-limit trigger functional
-- once 093 enables RLS, and makes exposed views honor the caller's RLS.
-- Idempotent.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. Sensitive Storage buckets: remove every known legacy public policy and
--    recreate a single least-privilege policy set.
-- -------------------------------------------------------------------------
UPDATE storage.buckets
SET public = false
WHERE id IN ('certifications', 'chat-attachments');

-- Certifications policies created by migrations and/or the Dashboard.
DROP POLICY IF EXISTS "Anyone can view" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view certifications" ON storage.objects;
DROP POLICY IF EXISTS "Public can view certifications" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view optq7t_0" ON storage.objects;
DROP POLICY IF EXISTS "Public certifications access" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own certifications" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all certifications" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads optq7t_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload certifications" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own certifications" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own certifications" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own certifications" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own certifications" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own certifications" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin can read certifications" ON storage.objects;

CREATE POLICY "Owner or admin can read certifications"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certifications'
    AND (
      (SELECT auth.uid())::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );

CREATE POLICY "Users can upload their own certifications"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certifications'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own certifications"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certifications'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'certifications'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own certifications"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certifications'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

-- Chat attachment policies created by migration 046 and migration 092.
DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Participants can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat attachments" ON storage.objects;

CREATE POLICY "Participants can view chat attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (
      -- The uploader can always read their own object.
      (SELECT auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1
        FROM public.messages AS m
        WHERE (
          m.attachment_url = storage.objects.name
          OR m.attachment_url LIKE '%/chat-attachments/' || storage.objects.name
        )
          -- Only the uploader may grant access by attaching the object. This
          -- prevents a user from referencing somebody else's guessed path.
          AND m.sender_id::text = (storage.foldername(storage.objects.name))[1]
          AND (
            m.sender_id = (SELECT auth.uid())
            OR m.receiver_id = (SELECT auth.uid())
          )
      )
    )
  );

CREATE POLICY "Users can upload their own chat attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own chat attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own chat attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

-- The insurance bucket was already private, but the original policy set had
-- no UPDATE/DELETE path. The UI uses upsert when a professional renews a
-- certificate, so define those operations explicitly and owner-scoped.
DROP POLICY IF EXISTS "Professionals update own insurance certificates" ON storage.objects;
CREATE POLICY "Professionals update own insurance certificates"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'insurance-certificates'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'insurance-certificates'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Professionals delete own insurance certificates" ON storage.objects;
CREATE POLICY "Professionals delete own insurance certificates"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'insurance-certificates'
    AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
  );

-- -------------------------------------------------------------------------
-- 2. Rate limiting: migration 093 enables RLS, so its trigger must execute
--    with a tightly scoped definer context. The upsert also makes the counter
--    atomic when several messages arrive concurrently.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_message_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_count integer;
  current_window timestamptz;
  max_messages constant integer := 20;
BEGIN
  INSERT INTO public.message_rate_limits AS limits (
    user_id,
    message_count,
    window_start,
    updated_at
  )
  VALUES (NEW.sender_id, 1, statement_timestamp(), statement_timestamp())
  ON CONFLICT (user_id) DO UPDATE
  SET
    message_count = CASE
      WHEN limits.window_start < statement_timestamp() - interval '1 minute' THEN 1
      ELSE limits.message_count + 1
    END,
    window_start = CASE
      WHEN limits.window_start < statement_timestamp() - interval '1 minute'
        THEN statement_timestamp()
      ELSE limits.window_start
    END,
    updated_at = statement_timestamp()
  RETURNING message_count, window_start
  INTO current_count, current_window;

  IF current_count > max_messages THEN
    RAISE EXCEPTION
      'Rate limit exceeded: maximum % messages per minute. Try again in % seconds.',
      max_messages,
      GREATEST(
        1,
        EXTRACT(EPOCH FROM (current_window + interval '1 minute' - statement_timestamp()))::integer
      )
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.check_message_rate_limit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_message_rate_limit() TO service_role;

-- Default function privileges grant EXECUTE to PUBLIC. These helpers are
-- internal RLS predicates and do not need an anonymous RPC surface.
REVOKE ALL ON FUNCTION public.has_business_relationship(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_business_relationship(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.mfa_satisfied() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mfa_satisfied() TO authenticated, service_role;

-- -------------------------------------------------------------------------
-- 3. Exposed views must evaluate table privileges and RLS as the caller.
-- PostgreSQL 17 supports security_invoker on existing views.
-- -------------------------------------------------------------------------
ALTER VIEW IF EXISTS public.admin_rejected_professionals
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.professionals_with_distance
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.conversations_with_details
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.projects_map_view
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.professionals_map_view
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.admin_verified_professionals
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.admin_dashboard_stats
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.tenders_complete
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.proposals_complete
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.favorites_with_details
  SET (security_invoker = true);
ALTER VIEW IF EXISTS public.admin_pending_verifications
  SET (security_invoker = true);

COMMIT;
