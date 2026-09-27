-- ISOLATED fixture only. No real users or notifications. See companion fixture.
BEGIN;
CREATE FUNCTION public.test_assert(ok boolean, message text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', message; END IF;
END $$;
SELECT public.test_assert((SELECT proposals_count = 2 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000001'), 'backfill includes rejected proposals');
SELECT public.test_assert((SELECT proposals_count = 0 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000002'), 'backfill resets stale nonzero counts');
SELECT public.test_assert((SELECT proposals_count = 0 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000003'), 'backfill normalizes null');
SELECT public.test_assert(NOT has_schema_privilege('authenticated','proposal_counters_private','USAGE'), 'private schema inaccessible');
SELECT public.test_assert(NOT has_function_privilege('authenticated','proposal_counters_private.maintain_project_proposals_count()','EXECUTE'), 'trigger cannot be called by client');
SELECT public.test_assert(NOT has_function_privilege('anon','proposal_counters_private.maintain_project_proposals_count()','EXECUTE'), 'trigger cannot be called anonymously');
SELECT public.test_assert(NOT has_function_privilege('service_role','proposal_counters_private.maintain_project_proposals_count()','EXECUTE'), 'no service RPC needed');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
INSERT INTO public.proposals VALUES
  ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','pending'),
  ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','pending');
SELECT public.test_assert((SELECT proposals_count = 4 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000001'), 'professional inserts count across owner boundary');
UPDATE public.projects SET title = 'Not allowed' WHERE id = '10000000-0000-0000-0000-000000000001';
SELECT public.test_assert((SELECT title = 'Count regression' FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000001'), 'project ownership still enforced');
UPDATE public.proposals SET project_id = '10000000-0000-0000-0000-000000000002'
WHERE id = '20000000-0000-0000-0000-000000000003';
SELECT public.test_assert((SELECT proposals_count = 3 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000001'), 'reassignment decrements old project');
SELECT public.test_assert((SELECT proposals_count = 1 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000002'), 'reassignment increments new project');
UPDATE public.proposals SET project_id = project_id WHERE id = '20000000-0000-0000-0000-000000000003';
SELECT public.test_assert((SELECT proposals_count = 1 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000002'), 'same parent update does not recount');
DELETE FROM public.proposals WHERE id = '20000000-0000-0000-0000-000000000003';
SELECT public.test_assert((SELECT proposals_count = 0 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000002'), 'delete decrements count');
DELETE FROM public.proposals WHERE id = '20000000-0000-0000-0000-000000000002';
SELECT public.test_assert((SELECT proposals_count = 3 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000001'), 'other professional delete remains denied');

SAVEPOINT rejected_insert;
INSERT INTO public.proposals VALUES
  ('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','pending');
ROLLBACK TO rejected_insert;
SELECT public.test_assert((SELECT proposals_count = 0 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000002'), 'transaction rollback restores count');
DO $$ BEGIN
  BEGIN
    INSERT INTO public.proposals VALUES
      ('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','pending');
    RAISE EXCEPTION 'FAIL: proposal ownership bypassed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.proposals SET status = 'accepted' WHERE id = '20000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'FAIL: status guard bypassed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Proposal status is server-managed' THEN RAISE; END IF;
  END;
END $$;

RESET ROLE;
UPDATE public.proposals SET status = 'rejected' WHERE id = '20000000-0000-0000-0000-000000000001';
UPDATE public.proposals SET status = 'accepted' WHERE id = '20000000-0000-0000-0000-000000000004';
SELECT public.test_assert((SELECT proposals_count = 3 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000001'), 'accept/reject preserves total');
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
UPDATE public.projects SET title = 'Owner edit' WHERE id = '10000000-0000-0000-0000-000000000001';
SELECT public.test_assert((SELECT title = 'Owner edit' FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000001'), 'ordinary owner edits still work');
DO $$ BEGIN
  BEGIN
    UPDATE public.projects SET proposals_count = 99 WHERE id = '10000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'FAIL: owner changed count';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Proposal count is server-managed' THEN RAISE; END IF;
  END;
  BEGIN
    INSERT INTO public.projects VALUES ('10000000-0000-0000-0000-000000000004',auth.uid(),'Fabricated',99);
    RAISE EXCEPTION 'FAIL: owner inserted inflated count';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Proposal count is server-managed' THEN RAISE; END IF;
  END;
END $$;
INSERT INTO public.projects (id,client_id) VALUES ('10000000-0000-0000-0000-000000000004',auth.uid());
SELECT public.test_assert((SELECT proposals_count = 0 FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000004'), 'new project starts at zero');
DELETE FROM public.projects WHERE id = '10000000-0000-0000-0000-000000000001';
RESET ROLE;
SELECT public.test_assert(NOT EXISTS (SELECT 1 FROM public.proposals WHERE project_id = '10000000-0000-0000-0000-000000000001'), 'project deletion cascade succeeds');
SELECT public.test_assert(NOT EXISTS (
  SELECT p.id FROM public.projects p LEFT JOIN public.proposals s ON s.project_id=p.id
  GROUP BY p.id HAVING p.proposals_count <> count(s.id)
), 'all surviving counts match source rows');
ROLLBACK;
