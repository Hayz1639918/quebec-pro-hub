-- Profile hardening revoked SELECT(is_admin) and UPDATE(favorites_count)
-- from authenticated. Old policy subqueries and the optional favorites cache
-- trigger still require those privileges, so even legitimate requests fail.
-- Keep the column grants, profile guard and restrictive MFA policies intact.

-- Reuse the existing uid-bound, fixed-search_path admin helper. No new
-- SECURITY DEFINER function or client privilege is needed.
ALTER POLICY "Admins can read audit logs" ON public.admin_audit_logs
  TO authenticated USING ((SELECT public.is_admin()));

ALTER POLICY "Admins can view all disputes" ON public.disputes
  TO authenticated USING ((SELECT public.is_admin()));

ALTER POLICY "Admins can update all disputes" ON public.disputes
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY "Admins can view all payments" ON public.contractor_payments
  TO authenticated USING ((SELECT public.is_admin()));

ALTER POLICY "Admins can view all invoices" ON public.invoices
  TO authenticated USING ((SELECT public.is_admin()));

ALTER POLICY "Admins can view all contracts" ON public.contracts
  TO authenticated USING ((SELECT public.is_admin()));

ALTER POLICY "Admins can view all invitations" ON public.project_invitations
  TO authenticated USING ((SELECT public.is_admin()));

ALTER POLICY "Admins read all insurance certificates" ON storage.objects
  TO authenticated
  USING (bucket_id = 'insurance-certificates' AND (SELECT public.is_admin()));

-- Favorites are the source of truth. The app does not consume the optional
-- profiles.favorites_count cache, and public_professional_profiles has exposed
-- NULL for this metric since 20260812014411. Removing this obsolete side effect
-- restores add/remove without allowing clients to modify another profile or
-- weakening guard_profile_privileged_fields. Existing count RPCs derive their
-- result from favorites and continue to work. Keep the column for compatibility.
DROP TRIGGER IF EXISTS trigger_update_favorites_count ON public.favorites;
DROP FUNCTION IF EXISTS public.update_favorites_count();

COMMENT ON COLUMN public.profiles.favorites_count IS
  'Deprecated legacy cache; not maintained. Use favorites rows for current counts.';
