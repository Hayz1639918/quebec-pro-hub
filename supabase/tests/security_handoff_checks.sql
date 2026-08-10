-- =========================================================================
-- Structural checks for migrations 090-094.
-- Run in the Supabase SQL editor after applying the migrations. The script
-- is read-only and raises an exception when an expected control is missing.
-- =========================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id IN ('certifications', 'chat-attachments') AND public
  ) THEN
    RAISE EXCEPTION 'KO: a sensitive Storage bucket is still public';
  END IF;
  RAISE NOTICE 'OK: sensitive Storage buckets are private';
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables AS t
    JOIN pg_class AS c ON c.relname = t.tablename
    JOIN pg_namespace AS n
      ON n.oid = c.relnamespace AND n.nspname = t.schemaname
    LEFT JOIN pg_depend AS d ON d.objid = c.oid AND d.deptype = 'e'
    WHERE t.schemaname = 'public'
      AND NOT c.relrowsecurity
      AND d.objid IS NULL -- exclude extension-owned tables (PostGIS)
  ) THEN
    RAISE EXCEPTION 'KO: an application-owned public table has RLS disabled';
  END IF;
  RAISE NOTICE 'OK: every application-owned public table has RLS enabled';
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND ('public' = ANY (roles) OR 'anon' = ANY (roles))
      AND (
        COALESCE(qual, '') ILIKE '%certifications%'
        OR COALESCE(with_check, '') ILIKE '%certifications%'
        OR COALESCE(qual, '') ILIKE '%chat-attachments%'
        OR COALESCE(with_check, '') ILIKE '%chat-attachments%'
      )
  ) THEN
    RAISE EXCEPTION 'KO: a public/anonymous policy still targets a sensitive bucket';
  END IF;
  RAISE NOTICE 'OK: sensitive Storage policies are authenticated and scoped';
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE oid = 'public.message_rate_limits'::regclass
      AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'KO: message_rate_limits RLS is disabled';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'check_message_rate_limit'
      AND p.prosecdef
      AND 'search_path=""' = ANY (p.proconfig)
  ) THEN
    RAISE EXCEPTION 'KO: rate-limit trigger is not a fixed-path SECURITY DEFINER';
  END IF;
  RAISE NOTICE 'OK: message rate limiting remains compatible with RLS';
END $$;

DO $$
DECLARE
  project_policy text;
BEGIN
  SELECT qual
  INTO project_policy
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'projects'
    AND policyname = 'authenticated_read_projects'
    AND cmd = 'SELECT';

  IF project_policy IS NULL OR project_policy = 'true' THEN
    RAISE EXCEPTION 'KO: authenticated users can still enumerate every project';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'can_access_project'
      AND p.prosecdef
      AND 'search_path=""' = ANY (p.proconfig)
  ) THEN
    RAISE EXCEPTION 'KO: project access predicate is not fixed-path SECURITY DEFINER';
  END IF;

  IF has_function_privilege('anon', 'public.can_access_project(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'KO: anonymous users can execute can_access_project';
  END IF;
  RAISE NOTICE 'OK: non-public projects are limited to related users';
END $$;

DO $$
DECLARE
  view_name text;
BEGIN
  FOREACH view_name IN ARRAY ARRAY[
    'admin_rejected_professionals',
    'professionals_with_distance',
    'conversations_with_details',
    'projects_map_view',
    'professionals_map_view',
    'admin_verified_professionals',
    'admin_dashboard_stats',
    'tenders_complete',
    'proposals_complete',
    'favorites_with_details',
    'admin_pending_verifications'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class AS c
      JOIN pg_namespace AS n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = view_name
        AND c.relkind = 'v'
        AND NOT (COALESCE(c.reloptions, '{}') @> ARRAY['security_invoker=true'])
    ) THEN
      RAISE EXCEPTION 'KO: view %.% is not security_invoker', 'public', view_name;
    END IF;
  END LOOP;
  RAISE NOTICE 'OK: exposed views execute with caller privileges';
END $$;
