-- =========================================================================
-- Migration 096: Fix recursive project RLS introduced by migration 095
-- -------------------------------------------------------------------------
-- Related-table policies query projects themselves, so embedding those
-- related-table EXISTS clauses directly in the projects policy can recurse.
-- A narrow SECURITY DEFINER predicate evaluates the relationship without RLS
-- recursion; the exposed table policy remains the enforcement point.
-- =========================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.can_access_project(target_project uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects AS project
    WHERE project.id = target_project
      AND (
        project.status = 'open'
        OR project.client_id = (SELECT auth.uid())
        OR project.assigned_professional_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.profiles AS profile
          WHERE profile.id = (SELECT auth.uid())
            AND profile.is_admin = true
        )
        OR EXISTS (
          SELECT 1
          FROM public.proposals AS proposal
          WHERE proposal.project_id = project.id
            AND proposal.professional_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.project_invitations AS invitation
          WHERE invitation.project_id = project.id
            AND invitation.professional_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.contracts AS contract
          WHERE contract.project_id = project.id
            AND (
              contract.client_id = (SELECT auth.uid())
              OR contract.professional_id = (SELECT auth.uid())
            )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_project(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_project(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "authenticated_read_projects" ON public.projects;
CREATE POLICY "authenticated_read_projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.can_access_project(id));

COMMIT;
