-- Run after 20260811173252_optimize_rls_and_foreign_keys.sql.
-- The script raises an exception when the performance hardening is incomplete.

DO $checks$
DECLARE
  missing_indexes text[];
  unoptimized_policy_count integer;
BEGIN
  SELECT array_agg(
    format('%I.%I(%I)', expected.schema_name, expected.table_name, expected.column_name)
    ORDER BY expected.table_name, expected.column_name
  )
  INTO missing_indexes
  FROM (
    VALUES
      ('public', 'contract_amendments', 'created_by'),
      ('public', 'contract_milestones', 'requested_by'),
      ('public', 'contract_proposals', 'template_id'),
      ('public', 'contractor_payments', 'project_id'),
      ('public', 'contracts', 'parent_contract_id'),
      ('public', 'disputes', 'resolved_by'),
      ('public', 'invoices', 'payment_id'),
      ('public', 'mediations', 'review_id'),
      ('public', 'meetings', 'conversation_id'),
      ('public', 'meetings', 'organizer_id'),
      ('public', 'meetings', 'participant_id'),
      ('public', 'messages', 'project_id'),
      ('public', 'messages', 'proposal_id'),
      ('public', 'notifications', 'related_message_id'),
      ('public', 'notifications', 'related_project_id'),
      ('public', 'notifications', 'related_proposal_id'),
      ('public', 'notifications', 'related_user_id'),
      ('public', 'profiles', 'id_document_verified_by'),
      ('public', 'profiles', 'rbq_verified_by'),
      ('public', 'project_images', 'project_id'),
      ('public', 'projects', 'contract_id'),
      ('public', 'rbq_licenses', 'verified_by'),
      ('public', 'review_replies', 'author_id'),
      ('public', 'review_reports', 'reporter_id'),
      ('public', 'subcontractor_tasks', 'project_id')
  ) AS expected(schema_name, table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_index index_definition
    JOIN pg_attribute indexed_column
      ON indexed_column.attrelid = index_definition.indrelid
      AND indexed_column.attnum = index_definition.indkey[0]
    WHERE index_definition.indrelid = to_regclass(
        format('%I.%I', expected.schema_name, expected.table_name)
      )
      AND index_definition.indisvalid
      AND index_definition.indisready
      AND index_definition.indpred IS NULL
      AND indexed_column.attname = expected.column_name
  );

  IF missing_indexes IS NOT NULL THEN
    RAISE EXCEPTION 'Missing foreign-key indexes: %', missing_indexes;
  END IF;

  SELECT count(*)
  INTO unoptimized_policy_count
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

  IF unoptimized_policy_count <> 0 THEN
    RAISE EXCEPTION '% RLS policies still evaluate auth.uid() per row',
      unoptimized_policy_count;
  END IF;
END;
$checks$;

SELECT 'performance hardening checks passed' AS result;
