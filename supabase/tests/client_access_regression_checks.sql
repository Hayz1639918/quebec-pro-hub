-- Run only after client_access_regression_fixture.sql and the migration in an
-- isolated database. These tests use synthetic UUIDs and roll back their writes.
BEGIN;
CREATE FUNCTION public.test_assert(ok boolean, message text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', message; END IF;
END $$;

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
SELECT public.test_assert((SELECT count(*) = 1 FROM public.contracts), 'owner contracts');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.contractor_payments), 'owner payments');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.invoices), 'owner invoices');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.project_invitations), 'owner invitations');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.disputes), 'owner disputes');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.admin_audit_logs), 'owner cannot read admin logs');
SELECT public.test_assert((SELECT count(*) = 0 FROM storage.objects), 'owner cannot read others insurance');
SELECT public.test_assert(NOT has_column_privilege(current_user, 'public.profiles', 'is_admin', 'SELECT'), 'admin flag stays private');
SELECT public.test_assert(NOT has_column_privilege(current_user, 'public.profiles', 'favorites_count', 'UPDATE'), 'counter stays protected');

INSERT INTO storage.objects VALUES ('avatars','00000000-0000-0000-0000-000000000001/photo.png')
  ON CONFLICT (bucket_id,name) DO UPDATE SET name = excluded.name;
INSERT INTO storage.objects VALUES ('avatars','00000000-0000-0000-0000-000000000001/photo.png')
  ON CONFLICT (bucket_id,name) DO UPDATE SET name = excluded.name;
SELECT public.test_assert((SELECT count(*) = 1 FROM storage.objects), 'avatar insert and replacement');
INSERT INTO public.favorites VALUES
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.favorites), 'favorite added');

SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004';
SELECT public.test_assert((SELECT count(*) = 0 FROM public.contracts), 'outsider contracts denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.contractor_payments), 'outsider payments denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.invoices), 'outsider invoices denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.project_invitations), 'outsider invitations denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.disputes), 'outsider disputes denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.favorites), 'outsider favorites denied');
DELETE FROM public.favorites;
DO $$ BEGIN
  BEGIN
    INSERT INTO public.favorites VALUES
      ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004');
    RAISE EXCEPTION 'FAIL: another client favorite accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO storage.objects VALUES ('avatars','00000000-0000-0000-0000-000000000001/photo.png')
      ON CONFLICT (bucket_id,name) DO UPDATE SET name = excluded.name;
    RAISE EXCEPTION 'FAIL: another client avatar replaced';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
SELECT public.test_assert((SELECT count(*) = 1 FROM public.contracts), 'admin contracts');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.contractor_payments), 'admin payments');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.invoices), 'admin invoices');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.project_invitations), 'admin invitations');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.admin_audit_logs), 'admin logs');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.disputes), 'admin disputes');
UPDATE public.disputes SET id = 2 WHERE id = 1;
SELECT public.test_assert((SELECT id = 2 FROM public.disputes), 'admin dispute update');
SELECT public.test_assert((SELECT count(*) = 1 FROM storage.objects WHERE bucket_id = 'insurance-certificates'), 'admin insurance');

SET LOCAL test.mfa_satisfied = 'false';
SELECT public.test_assert((SELECT count(*) = 0 FROM public.contracts), 'MFA still restricts admin');
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
SELECT public.test_assert((SELECT count(*) = 0 FROM public.contracts), 'MFA restricts owner contracts');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.contractor_payments), 'MFA restricts owner payments');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.invoices), 'MFA restricts owner invoices');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.disputes), 'MFA restricts owner disputes');
SET LOCAL test.mfa_satisfied = 'true';
SELECT public.test_assert((SELECT count(*) = 1 FROM public.favorites), 'outsider could not delete favorite');
DELETE FROM public.favorites;
SELECT public.test_assert((SELECT count(*) = 0 FROM public.favorites), 'favorite removed');

SET LOCAL ROLE anon;
SET LOCAL request.jwt.claim.sub = '';
SELECT public.test_assert((SELECT count(*) = 0 FROM public.contracts), 'anonymous contracts denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.contractor_payments), 'anonymous payments denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.invoices), 'anonymous invoices denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.project_invitations), 'anonymous invitations denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.disputes), 'anonymous disputes denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.admin_audit_logs), 'anonymous logs denied');
SELECT public.test_assert((SELECT count(*) = 0 FROM storage.objects WHERE bucket_id = 'insurance-certificates'), 'anonymous insurance denied');
ROLLBACK;
