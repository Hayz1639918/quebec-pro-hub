-- Structural checks for 20260811035457_production_readiness_hardening.sql.
-- Read-only: run after the migration and before opening the beta.

DO $$
BEGIN
  IF has_schema_privilege('anon', 'public', 'CREATE')
     OR has_schema_privilege('authenticated', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'KO: browser roles can create objects in public';
  END IF;

  IF has_table_privilege('anon', 'public.profiles', 'SELECT')
     OR has_table_privilege('anon', 'public.profiles', 'UPDATE') THEN
    RAISE EXCEPTION 'KO: anon still has direct profile table privileges';
  END IF;

  IF has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.profiles', 'stripe_account_id', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.profiles', 'is_rbq_verified', 'UPDATE') THEN
    RAISE EXCEPTION 'KO: privileged profile columns remain user-editable';
  END IF;

  RAISE NOTICE 'OK: profile and schema privileges are constrained';
END $$;

DO $$
BEGIN
  IF to_regclass('public.public_professional_profiles') IS NULL
     OR to_regclass('public.public_project_clients') IS NULL
     OR to_regclass('public.public_professional_certifications') IS NULL THEN
    RAISE EXCEPTION 'KO: a safe public projection is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'public_professional_profiles',
        'public_professional_certifications'
      )
      AND column_name IN (
        'is_admin', 'stripe_account_id', 'stripe_customer_id',
        'rbq_certification_url', 'insurance_info', 'certificate_url',
        'cert_number', 'id_document_url'
      )
  ) THEN
    RAISE EXCEPTION 'KO: a public projection contains a private column';
  END IF;

  RAISE NOTICE 'OK: public profile projections exclude private columns';
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contract_templates'
      AND policyname = 'Professionals can manage contract templates'
  ) THEN
    RAISE EXCEPTION 'KO: professionals can still manage templates they do not own';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contract_templates'
      AND policyname = 'Users can delete their own custom templates'
      AND cmd = 'DELETE'
      AND COALESCE(qual, '') ILIKE '%created_by%auth.uid%'
  ) THEN
    RAISE EXCEPTION 'KO: template deletion policy is not owner-scoped';
  END IF;

  IF pg_get_functiondef(
       'public.delete_custom_template(uuid)'::regprocedure
     ) NOT ILIKE '%created_by = current_user_id%'
     OR pg_get_functiondef(
       'public.delete_custom_template(uuid)'::regprocedure
     ) ILIKE '%created_by IS NULL%'
  THEN
    RAISE EXCEPTION 'KO: template deletion RPC accepts unowned templates';
  END IF;

  RAISE NOTICE 'OK: custom template deletion is owner-scoped';
END $$;

DO $$
BEGIN
  IF has_table_privilege('authenticated', 'public.proposals', 'DELETE')
     OR EXISTS (
       SELECT 1
       FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'proposals'
         AND policyname IN (
           'Clients can update proposals on own projects',
           'Clients can delete proposals on own projects'
         )
     ) THEN
    RAISE EXCEPTION 'KO: clients can directly delete or decide proposals';
  END IF;

  IF pg_get_functiondef(
       'public.reject_proposal(uuid)'::regprocedure
     ) ILIKE '%DELETE FROM public.proposals%'
     OR pg_get_functiondef(
       'public.reject_proposal(uuid)'::regprocedure
     ) NOT ILIKE '%status = ''rejected''%'
  THEN
    RAISE EXCEPTION 'KO: proposal rejection does not preserve audit history';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.proposals'::regclass
      AND tgname = 'trigger_guard_proposal_status_mutations'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'KO: direct proposal status mutation guard is missing';
  END IF;

  RAISE NOTICE 'OK: proposal decisions are server-managed and non-destructive';
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_invitations'
      AND policyname IN (
        'Clients manage their own invitations',
        'Professionals can respond to invitations'
      )
  ) THEN
    RAISE EXCEPTION 'KO: invitation rows remain directly mutable';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_invitations'
      AND policyname = 'Clients can create invitations for own projects'
      AND cmd = 'INSERT'
      AND COALESCE(with_check, '') ILIKE '%projects%client_id%'
  ) THEN
    RAISE EXCEPTION 'KO: invitation creation is not project-owner scoped';
  END IF;

  IF has_column_privilege(
       'authenticated', 'public.project_invitations', 'responded_at', 'INSERT'
     ) OR has_column_privilege(
       'authenticated', 'public.project_invitations', 'project_id', 'UPDATE'
     ) THEN
    RAISE EXCEPTION 'KO: invitation audit or ownership fields are browser-writable';
  END IF;

  IF pg_get_functiondef(
       'public.respond_to_invitation(uuid,text)'::regprocedure
     ) NOT ILIKE '%FOR UPDATE%'
     OR pg_get_functiondef(
       'public.respond_to_invitation(uuid,text)'::regprocedure
     ) NOT ILIKE '%professional_id IS DISTINCT FROM caller_id%'
  THEN
    RAISE EXCEPTION 'KO: invitation response RPC lacks actor or concurrency checks';
  END IF;

  RAISE NOTICE 'OK: invitations are owner-created and RPC-responded';
END $$;

DO $$
BEGIN
  IF has_column_privilege(
       'authenticated', 'public.contractor_payments', 'amount', 'UPDATE'
     ) OR has_column_privilege(
       'authenticated', 'public.contractor_payments', 'client_id', 'UPDATE'
     ) OR NOT has_column_privilege(
       'authenticated', 'public.contractor_payments', 'status', 'UPDATE'
     ) THEN
    RAISE EXCEPTION 'KO: payment dispute update privileges are too broad or missing';
  END IF;

  IF has_table_privilege('authenticated', 'public.invoices', 'INSERT')
     OR has_table_privilege('authenticated', 'public.invoices', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.invoices', 'DELETE') THEN
    RAISE EXCEPTION 'KO: browser clients can forge or rewrite invoices';
  END IF;

  RAISE NOTICE 'OK: payment disputes are column-scoped and invoices are trusted-write only';
END $$;

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.contract_audit_trail', 'INSERT')
     OR has_table_privilege('authenticated', 'public.contract_audit_trail', 'INSERT')
     OR EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'contract_audit_trail'
         AND cmd = 'INSERT'
     ) THEN
    RAISE EXCEPTION 'KO: browser clients can forge contract audit entries';
  END IF;

  IF has_function_privilege(
       'authenticated',
       'public.sign_contract_secure(uuid,uuid,jsonb,text,text)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'anon',
       'public.sign_contract_secure(uuid,uuid,jsonb,text,text)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'KO: secure signing mutation is browser-callable';
  END IF;

  IF NOT has_function_privilege(
       'service_role',
       'public.sign_contract_secure(uuid,uuid,jsonb,text,text)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'KO: signing backend cannot execute secure signing mutation';
  END IF;

  IF NOT has_function_privilege(
       'anon',
       'public.verify_contract_signature(text)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'KO: holder verification endpoint is unavailable';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.contracts'::regclass
      AND tgname = 'trigger_guard_contract_sensitive_updates'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'KO: contract signature mutation guard is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.contracts'::regclass
      AND tgname = 'trigger_guard_contract_sensitive_updates'
      AND (tgtype & 4) = 4
      AND (tgtype & 16) = 16
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'KO: contract guard does not cover INSERT and UPDATE';
  END IF;

  RAISE NOTICE 'OK: audit and signature controls are server-authoritative';
END $$;

DO $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM storage.buckets
    WHERE id IN ('projects', 'portfolio-images', 'insurance-certificates')
  ) <> 3 THEN
    RAISE EXCEPTION 'KO: an expected upload bucket is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE (id = 'projects' AND file_size_limit <> 10485760)
       OR (id IN ('portfolio-images', 'insurance-certificates') AND file_size_limit <> 5242880)
  ) THEN
    RAISE EXCEPTION 'KO: a public upload bucket has an unexpected size limit';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Project owners can upload project files'
      AND cmd = 'INSERT'
      AND COALESCE(with_check, '') ILIKE '%projects%client_id%'
  ) THEN
    RAISE EXCEPTION 'KO: project upload ownership policy is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Professionals upload own portfolio images'
      AND cmd = 'INSERT'
      AND COALESCE(with_check, '') ILIKE '%foldername%'
  ) THEN
    RAISE EXCEPTION 'KO: portfolio upload ownership policy is missing';
  END IF;

  RAISE NOTICE 'OK: upload buckets enforce size, type and ownership controls';
END $$;

DO $$
BEGIN
  IF has_function_privilege('anon', 'public.get_my_profile()', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.get_my_profile()', 'EXECUTE') THEN
    RAISE EXCEPTION 'KO: owner-only profile RPC grants are incorrect';
  END IF;

  IF has_table_privilege(
       'authenticated', 'public.admin_pending_verifications', 'SELECT'
     ) OR has_table_privilege(
       'authenticated', 'public.admin_rejected_professionals', 'SELECT'
     ) THEN
    RAISE EXCEPTION 'KO: private admin verification views are directly readable';
  END IF;

  IF has_table_privilege('anon', 'public.tenders_complete', 'SELECT')
     OR has_table_privilege('anon', 'public.proposals_complete', 'SELECT')
     OR has_table_privilege('anon', 'public.favorites_with_details', 'SELECT')
     OR has_table_privilege('anon', 'public.admin_dashboard_stats', 'SELECT') THEN
    RAISE EXCEPTION 'KO: a legacy convenience view remains anonymously readable';
  END IF;

  IF NOT has_function_privilege(
       'authenticated', 'public.get_admin_dashboard_stats()', 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'KO: actor-checked admin statistics RPC is unavailable';
  END IF;

  IF has_table_privilege('authenticated', 'public.admin_audit_logs', 'INSERT')
     OR has_table_privilege('authenticated', 'public.admin_audit_logs', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.admin_audit_logs', 'DELETE') THEN
    RAISE EXCEPTION 'KO: browser clients can mutate the admin audit log';
  END IF;

  IF NOT has_function_privilege(
       'authenticated', 'public.get_admin_pending_verifications()', 'EXECUTE'
     ) OR NOT has_function_privilege(
       'authenticated', 'public.get_admin_rejected_professionals()', 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'KO: actor-checked admin verification RPCs are unavailable';
  END IF;

  IF pg_get_functiondef(
       'public.handle_new_user_signup()'::regprocedure
     ) NOT ILIKE '%SET search_path TO ''''%'
     OR pg_get_functiondef(
       'public.handle_new_user_signup()'::regprocedure
     ) ILIKE '%is_admin%raw_user_meta_data%'
  THEN
    RAISE EXCEPTION 'KO: signup trigger trusts unvalidated privileged metadata';
  END IF;

  IF to_regprocedure('public.admin_delete_rejected_account(uuid)') IS NOT NULL THEN
    IF has_function_privilege(
         'authenticated', 'public.admin_delete_rejected_account(uuid)', 'EXECUTE'
       ) THEN
      RAISE EXCEPTION 'KO: permanent account deletion remains browser-callable';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc AS procedure
    JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
    WHERE namespace.nspname = 'public'
      AND procedure.prosecdef
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend AS dependency
        WHERE dependency.classid = 'pg_proc'::regclass
          AND dependency.objid = procedure.oid
          AND dependency.deptype = 'e'
      )
      AND (
        procedure.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM unnest(procedure.proconfig) AS setting
          WHERE setting LIKE 'search_path=%'
        )
      )
  ) THEN
    RAISE EXCEPTION 'KO: a SECURITY DEFINER function has a mutable search_path';
  END IF;

  RAISE NOTICE 'OK: owner RPC and SECURITY DEFINER search paths are constrained';
END $$;
