-- ISOLATED EMPTY POSTGRES DATABASE ONLY. Run this file, the
-- restore_project_proposal_counts migration, then proposal_count_regression_checks.sql.
-- Models relevant production permissions/RLS, not the full Supabase schema.
CREATE ROLE authenticated;
CREATE ROLE anon;
CREATE ROLE service_role;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth, public TO authenticated, anon, service_role;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL,
  title text DEFAULT 'Count regression',
  proposals_count integer DEFAULT 0
);
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  status text DEFAULT 'pending'
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects, public.proposals TO authenticated;
CREATE POLICY project_read ON public.projects FOR SELECT USING (true);
CREATE POLICY project_insert ON public.projects FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY project_update ON public.projects FOR UPDATE
  USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
CREATE POLICY project_delete ON public.projects FOR DELETE USING (client_id = auth.uid());
CREATE POLICY proposal_read ON public.proposals FOR SELECT
  USING (professional_id = auth.uid() OR EXISTS
    (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.client_id = auth.uid()));
CREATE POLICY proposal_insert ON public.proposals FOR INSERT WITH CHECK (professional_id = auth.uid());
CREATE POLICY proposal_update ON public.proposals FOR UPDATE
  USING (professional_id = auth.uid()) WITH CHECK (professional_id = auth.uid());
CREATE POLICY proposal_delete ON public.proposals FOR DELETE USING (professional_id = auth.uid());
CREATE FUNCTION public.guard_proposal_status_mutations() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' AND NEW.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'Proposal status is server-managed';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Proposal status is server-managed';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trigger_guard_proposal_status_mutations BEFORE INSERT OR UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.guard_proposal_status_mutations();
INSERT INTO public.projects (id,client_id,proposals_count) VALUES
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',0),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001',90),
  ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001',null);
INSERT INTO public.proposals VALUES
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','pending'),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','rejected');
