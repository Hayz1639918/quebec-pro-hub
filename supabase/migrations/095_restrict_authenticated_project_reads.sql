-- =========================================================================
-- Migration 095: Restrict authenticated reads of non-public projects
-- -------------------------------------------------------------------------
-- The legacy authenticated_read_projects policy used USING (true). Any free
-- signed-in account could therefore enumerate draft, assigned, cancelled or
-- completed projects belonging to unrelated clients. Open marketplace
-- projects stay visible; non-open projects are limited to their client,
-- assigned professional, invited/proposing/contracted professionals, and
-- admins.
-- =========================================================================

BEGIN;

DROP POLICY IF EXISTS "authenticated_read_projects" ON public.projects;

CREATE POLICY "authenticated_read_projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    status = 'open'
    OR client_id = (SELECT auth.uid())
    OR assigned_professional_id = (SELECT auth.uid())
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.proposals AS proposal
      WHERE proposal.project_id = projects.id
        AND proposal.professional_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.project_invitations AS invitation
      WHERE invitation.project_id = projects.id
        AND invitation.professional_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.contracts AS contract
      WHERE contract.project_id = projects.id
        AND (
          contract.client_id = (SELECT auth.uid())
          OR contract.professional_id = (SELECT auth.uid())
        )
    )
  );

COMMIT;
