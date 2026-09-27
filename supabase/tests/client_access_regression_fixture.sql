-- ISOLATED EMPTY POSTGRES DATABASE ONLY. This fixture models the relevant
-- production grants and policy interactions, not the full Supabase schema.
-- Run this file, the restore_client_access migration, then
-- client_access_regression_checks.sql. The checks never need production data.
CREATE ROLE authenticated;
CREATE ROLE anon;
CREATE SCHEMA auth;
CREATE SCHEMA storage;
GRANT USAGE ON SCHEMA public, auth, storage TO authenticated, anon;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE FUNCTION public.mfa_satisfied() RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('test.mfa_satisfied', true), 'true') = 'true'
$$;
CREATE TABLE public.profiles (id uuid PRIMARY KEY, is_admin boolean DEFAULT false,
  favorites_count integer DEFAULT 0);
GRANT SELECT(id, favorites_count) ON public.profiles TO authenticated;
CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
$$;
INSERT INTO public.profiles (id,is_admin) VALUES
  ('00000000-0000-0000-0000-000000000001',false),
  ('00000000-0000-0000-0000-000000000002',false),
  ('00000000-0000-0000-0000-000000000003',true),
  ('00000000-0000-0000-0000-000000000004',false);

DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('contracts','Admins can view all contracts'),
    ('contractor_payments','Admins can view all payments'),
    ('invoices','Admins can view all invoices'),
    ('project_invitations','Admins can view all invitations'),
    ('disputes','Admins can view all disputes'),
    ('admin_audit_logs','Admins can read audit logs')
  ) AS names(table_name, policy_name)
  LOOP
    EXECUTE format('CREATE TABLE public.%I (id integer PRIMARY KEY, client_id uuid, professional_id uuid)', item.table_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', item.table_name);
    EXECUTE format('GRANT SELECT, UPDATE ON public.%I TO authenticated, anon', item.table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))', item.policy_name, item.table_name);
    IF item.table_name <> 'admin_audit_logs' THEN
      EXECUTE format('CREATE POLICY parties ON public.%I FOR SELECT USING (client_id = auth.uid() OR professional_id = auth.uid())', item.table_name);
    END IF;
    IF item.table_name IN ('contracts', 'contractor_payments', 'invoices', 'disputes') THEN
      EXECUTE format('CREATE POLICY enforce_mfa_aal2 ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.mfa_satisfied())', item.table_name);
    END IF;
    EXECUTE format('INSERT INTO public.%I VALUES (1, %L, %L)', item.table_name,
      '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
  END LOOP;
END $$;
CREATE POLICY "Admins can update all disputes" ON public.disputes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

CREATE TABLE storage.objects (bucket_id text, name text, PRIMARY KEY(bucket_id,name));
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated, anon;
CREATE POLICY "Admins read all insurance certificates" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'insurance-certificates' AND EXISTS
    (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));
CREATE POLICY avatars_read ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY avatars_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND split_part(name,'/',1) = auth.uid()::text);
CREATE POLICY avatars_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND split_part(name,'/',1) = auth.uid()::text);
INSERT INTO storage.objects VALUES ('insurance-certificates','private.pdf');

CREATE TABLE public.favorites (client_id uuid REFERENCES public.profiles,
  professional_id uuid REFERENCES public.profiles, PRIMARY KEY(client_id,professional_id));
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
CREATE POLICY favorites_read ON public.favorites FOR SELECT
  USING (client_id = auth.uid() OR professional_id = auth.uid());
CREATE POLICY favorites_insert ON public.favorites FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY favorites_delete ON public.favorites FOR DELETE USING (client_id = auth.uid());
CREATE FUNCTION public.update_favorites_count() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET favorites_count = favorites_count + 1 WHERE id = NEW.professional_id;
  ELSE
    UPDATE public.profiles SET favorites_count = GREATEST(favorites_count - 1,0) WHERE id = OLD.professional_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trigger_update_favorites_count AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_favorites_count();
