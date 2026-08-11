-- Performance hardening for the production database.
--
-- 1. Add the covering indexes reported by the Supabase advisor for foreign
--    keys. PostgreSQL does not create these indexes automatically.
-- 2. Cache auth.uid() once per statement in legacy RLS policies. This is a
--    planner optimization only: the policy predicates and access rules stay
--    otherwise identical.

DO $indexes$
DECLARE
  index_record record;
  relation_oid regclass;
  column_number smallint;
BEGIN
  FOR index_record IN
    SELECT *
    FROM (
      VALUES
        ('public', 'contract_amendments', 'created_by', 'idx_contract_amendments_created_by'),
        ('public', 'contract_milestones', 'requested_by', 'idx_contract_milestones_requested_by'),
        ('public', 'contract_proposals', 'template_id', 'idx_contract_proposals_template_id'),
        ('public', 'contractor_payments', 'project_id', 'idx_contractor_payments_project_id'),
        ('public', 'contracts', 'parent_contract_id', 'idx_contracts_parent_contract_id'),
        ('public', 'disputes', 'resolved_by', 'idx_disputes_resolved_by'),
        ('public', 'invoices', 'payment_id', 'idx_invoices_payment_id'),
        ('public', 'mediations', 'review_id', 'idx_mediations_review_id'),
        ('public', 'meetings', 'conversation_id', 'idx_meetings_conversation_id'),
        ('public', 'meetings', 'organizer_id', 'idx_meetings_organizer_id'),
        ('public', 'meetings', 'participant_id', 'idx_meetings_participant_id'),
        ('public', 'messages', 'project_id', 'idx_messages_project_id'),
        ('public', 'messages', 'proposal_id', 'idx_messages_proposal_id'),
        ('public', 'notifications', 'related_message_id', 'idx_notifications_related_message_id'),
        ('public', 'notifications', 'related_project_id', 'idx_notifications_related_project_id'),
        ('public', 'notifications', 'related_proposal_id', 'idx_notifications_related_proposal_id'),
        ('public', 'notifications', 'related_user_id', 'idx_notifications_related_user_id'),
        ('public', 'profiles', 'id_document_verified_by', 'idx_profiles_id_document_verified_by'),
        ('public', 'profiles', 'rbq_verified_by', 'idx_profiles_rbq_verified_by'),
        ('public', 'project_images', 'project_id', 'idx_project_images_project_id'),
        ('public', 'projects', 'contract_id', 'idx_projects_contract_id'),
        ('public', 'rbq_licenses', 'verified_by', 'idx_rbq_licenses_verified_by'),
        ('public', 'review_replies', 'author_id', 'idx_review_replies_author_id'),
        ('public', 'review_reports', 'reporter_id', 'idx_review_reports_reporter_id'),
        ('public', 'subcontractor_tasks', 'project_id', 'idx_subcontractor_tasks_project_id')
    ) AS indexes(schema_name, table_name, column_name, index_name)
  LOOP
    relation_oid := to_regclass(format('%I.%I', index_record.schema_name, index_record.table_name));
    IF relation_oid IS NULL THEN
      RAISE EXCEPTION 'Cannot index missing relation %.%',
        index_record.schema_name,
        index_record.table_name;
    END IF;

    SELECT attnum
    INTO column_number
    FROM pg_attribute
    WHERE attrelid = relation_oid
      AND attname = index_record.column_name
      AND NOT attisdropped;

    IF column_number IS NULL THEN
      RAISE EXCEPTION 'Cannot index missing column %.%.%',
        index_record.schema_name,
        index_record.table_name,
        index_record.column_name;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_index
      WHERE indrelid = relation_oid
        AND indisvalid
        AND indisready
        AND indpred IS NULL
        AND indkey[0] = column_number
    ) THEN
      EXECUTE format(
        'CREATE INDEX %I ON %I.%I (%I)',
        index_record.index_name,
        index_record.schema_name,
        index_record.table_name,
        index_record.column_name
      );
    END IF;
  END LOOP;
END;
$indexes$;

DO $migration$
DECLARE
  policy_record record;
  alter_statement text;
  remaining_policy_count integer;
BEGIN
  -- Keep auth outside search_path so pg_policies deparses auth.uid() with its
  -- schema qualifier; unqualified table references inside policies still
  -- resolve through public.
  PERFORM set_config('search_path', 'public, extensions, pg_temp', true);

  FOR policy_record IN
    SELECT
      schemaname,
      tablename,
      policyname,
      qual,
      with_check,
      (
        qual ~ 'auth\.uid\(\)'
        AND qual !~* 'select[[:space:]]+auth\.uid\(\)'
      ) AS optimize_using,
      (
        with_check ~ 'auth\.uid\(\)'
        AND with_check !~* 'select[[:space:]]+auth\.uid\(\)'
      ) AS optimize_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (
          qual ~ 'auth\.uid\(\)'
          AND qual !~* 'select[[:space:]]+auth\.uid\(\)'
        )
        OR (
          with_check ~ 'auth\.uid\(\)'
          AND with_check !~* 'select[[:space:]]+auth\.uid\(\)'
        )
      )
    ORDER BY tablename, policyname
  LOOP
    alter_statement := format(
      'ALTER POLICY %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );

    IF policy_record.optimize_using THEN
      alter_statement := alter_statement || format(
        ' USING (%s)',
        replace(policy_record.qual, 'auth.uid()', '(select auth.uid())')
      );
    END IF;

    IF policy_record.optimize_check THEN
      alter_statement := alter_statement || format(
        ' WITH CHECK (%s)',
        replace(policy_record.with_check, 'auth.uid()', '(select auth.uid())')
      );
    END IF;

    EXECUTE alter_statement;
  END LOOP;

  SELECT count(*)
  INTO remaining_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      (
        qual ~ 'auth\.uid\(\)'
        AND qual !~* 'select[[:space:]]+auth\.uid\(\)'
      )
      OR (
        with_check ~ 'auth\.uid\(\)'
        AND with_check !~* 'select[[:space:]]+auth\.uid\(\)'
      )
    );

  IF remaining_policy_count <> 0 THEN
    RAISE EXCEPTION '% RLS policies still evaluate auth.uid() per row',
      remaining_policy_count;
  END IF;
END;
$migration$;
