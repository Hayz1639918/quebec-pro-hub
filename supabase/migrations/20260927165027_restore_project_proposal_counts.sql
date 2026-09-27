-- Count every stored proposal (pending, accepted or rejected), as the project
-- cards and original COUNT(*) implementation expect. Rejecting a proposal no
-- longer deletes it or decrements the count (production_readiness_hardening).
BEGIN;
SET LOCAL lock_timeout = '5s';

-- Serialize the initial repair with proposal/project writes. Fail and retry
-- this migration if the locks cannot be acquired promptly; do not backfill
-- against a moving snapshot and subsequently double count an insert.
LOCK TABLE public.proposals, public.projects IN SHARE ROW EXCLUSIVE MODE;

CREATE SCHEMA IF NOT EXISTS proposal_counters_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA proposal_counters_private FROM PUBLIC, anon, authenticated;

-- This is an internal aggregate-maintenance trigger, not a callable RPC.
-- RLS authorizes the originating proposal mutation before this AFTER trigger
-- runs. It must update a project owned by a different person; giving the
-- professional UPDATE access to that project would be incorrect. The sole
-- elevated operation is an atomic delta to the server-managed count. There
-- are no caller-supplied function arguments or dynamic SQL.
CREATE OR REPLACE FUNCTION proposal_counters_private.maintain_project_proposals_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  old_project_id uuid;
  new_project_id uuid;
BEGIN
  IF TG_TABLE_SCHEMA <> 'public' OR TG_TABLE_NAME <> 'proposals'
     OR TG_WHEN <> 'AFTER' OR TG_LEVEL <> 'ROW' THEN
    RAISE EXCEPTION 'Invalid proposal count trigger context';
  END IF;

  -- Signed-in API mutations must retain an attributable subject. Trusted
  -- postgres/service maintenance and FK cascades remain possible. This is
  -- additional validation; the proposal table's unchanged RLS is the gate.
  IF current_setting('role', true) IN ('anon', 'authenticated')
     AND (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'An authenticated subject is required';
  END IF;

  IF TG_OP IN ('DELETE', 'UPDATE') THEN old_project_id := OLD.project_id; END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN new_project_id := NEW.project_id; END IF;
  IF old_project_id IS NOT DISTINCT FROM new_project_id THEN RETURN NULL; END IF;

  -- Lock both parents in deterministic order for reassignment. NO KEY UPDATE
  -- is compatible with the FK's KEY SHARE locks. Atomic deltas serialize
  -- concurrent inserts without a COUNT(*) snapshot or lost updates.
  PERFORM project.id FROM public.projects AS project
    WHERE project.id IN (old_project_id, new_project_id)
    ORDER BY project.id FOR NO KEY UPDATE;

  IF old_project_id IS NOT NULL THEN
    UPDATE public.projects
      SET proposals_count = COALESCE(proposals_count, 0) - 1
      WHERE id = old_project_id;
  END IF;
  IF new_project_id IS NOT NULL THEN
    UPDATE public.projects
      SET proposals_count = COALESCE(proposals_count, 0) + 1
      WHERE id = new_project_id;
  END IF;
  RETURN NULL;
END;
$$;
ALTER FUNCTION proposal_counters_private.maintain_project_proposals_count() OWNER TO postgres;
REVOKE ALL ON FUNCTION proposal_counters_private.maintain_project_proposals_count()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS update_proposals_count_on_change ON public.proposals;
CREATE TRIGGER update_proposals_count_on_change
AFTER INSERT OR DELETE OR UPDATE OF project_id ON public.proposals
FOR EACH ROW EXECUTE FUNCTION proposal_counters_private.maintain_project_proposals_count();

-- Preserve project UPDATE grants and ownership policies while preventing
-- browser clients from assigning the derived count themselves.
CREATE OR REPLACE FUNCTION proposal_counters_private.guard_project_proposals_count()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF COALESCE(NEW.proposals_count, 0) <> 0 THEN
        RAISE EXCEPTION 'Proposal count is server-managed';
      END IF;
      NEW.proposals_count := 0;
    ELSIF NEW.proposals_count IS DISTINCT FROM OLD.proposals_count THEN
      RAISE EXCEPTION 'Proposal count is server-managed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
ALTER FUNCTION proposal_counters_private.guard_project_proposals_count() OWNER TO postgres;
REVOKE ALL ON FUNCTION proposal_counters_private.guard_project_proposals_count()
  FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS trigger_guard_project_proposals_count ON public.projects;
CREATE TRIGGER trigger_guard_project_proposals_count
BEFORE INSERT OR UPDATE OF proposals_count ON public.projects
FOR EACH ROW EXECUTE FUNCTION proposal_counters_private.guard_project_proposals_count();

UPDATE public.projects AS project
SET proposals_count = actual.total
FROM (
  SELECT p.id, count(proposal.id)::integer AS total
  FROM public.projects AS p
  LEFT JOIN public.proposals AS proposal ON proposal.project_id = p.id
  GROUP BY p.id
) AS actual
WHERE project.id = actual.id
  AND project.proposals_count IS DISTINCT FROM actual.total;

COMMENT ON COLUMN public.projects.proposals_count IS
  'Server-maintained total of stored proposals, including pending, accepted and rejected.';
COMMIT;
