-- =========================================================================
-- Production readiness hardening
--
-- Closes the highest-risk gaps found during the 2026-08-11 production audit:
--   * SECURITY DEFINER functions inherited EXECUTE from PUBLIC/anon.
--   * contract_audit_trail accepted client-forged rows.
--   * signatures and their evidence were written directly by the browser.
--   * profile rows exposed private columns and allowed privileged-field edits.
--   * public upload buckets did not enforce ownership, type or size limits.
-- =========================================================================

BEGIN;

-- Fail safely instead of waiting indefinitely for locks on the live schema.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '2min';

-- -------------------------------------------------------------------------
-- 1. Schema and future-function defaults
-- -------------------------------------------------------------------------

REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- -------------------------------------------------------------------------
-- 2. Profiles: safe public projections and protected private fields
-- -------------------------------------------------------------------------

DROP VIEW IF EXISTS public.public_professional_profiles;
CREATE VIEW public.public_professional_profiles
WITH (security_barrier = true)
AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.user_type,
  p.company_name,
  p.company_type,
  p.rbq_number,
  p.services_offered,
  p.is_rbq_verified,
  p.city,
  p.region,
  p.bio,
  p.years_experience,
  p.average_rating,
  p.total_reviews,
  p.total_projects,
  p.total_projects_external,
  p.business_volume_cad,
  p.profile_picture_url,
  p.website_url,
  p.linkedin_url,
  p.created_at,
  p.latitude,
  p.longitude,
  p.last_active_at,
  p.total_proposals_sent,
  p.proposals_last_30_days,
  p.profile_views_count,
  p.profile_views,
  p.activity_score,
  p.hourly_rate_min,
  p.hourly_rate_max,
  p.daily_rate_min,
  p.daily_rate_max,
  p.availability_status,
  p.available_from,
  p.response_time_hours,
  p.accepts_small_projects,
  p.minimum_project_budget,
  p.travel_distance_km,
  p.favorites_count,
  p.service_radius_km,
  p.rbq_subcat,
  p.trade_specialty,
  p.certifications,
  p.languages,
  p.service_zones,
  p.professional_type,
  p.subscription_tier,
  (NULLIF(BTRIM(p.insurance_info), '') IS NOT NULL) AS has_insurance_document,
  (NULLIF(BTRIM(p.rbq_certification_url), '') IS NOT NULL) AS has_rbq_document
FROM public.profiles AS p
WHERE p.user_type = 'professional'::public.user_type;

REVOKE ALL ON public.public_professional_profiles FROM PUBLIC;
GRANT SELECT ON public.public_professional_profiles TO anon, authenticated;

DROP VIEW IF EXISTS public.public_project_clients;
CREATE VIEW public.public_project_clients
WITH (security_barrier = true)
AS
SELECT DISTINCT
  project.id AS project_id,
  profile.id,
  profile.full_name,
  profile.company_name,
  profile.city,
  profile.region,
  profile.profile_picture_url
FROM public.projects AS project
JOIN public.profiles AS profile ON profile.id = project.client_id
WHERE project.status = 'open';

REVOKE ALL ON public.public_project_clients FROM PUBLIC;
GRANT SELECT ON public.public_project_clients TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT profile.*
  FROM public.profiles AS profile
  WHERE profile.id = (SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL;
$$;

COMMENT ON FUNCTION public.get_my_profile() IS
  'Returns the full profile only for the authenticated owner.';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.is_admin = true
  ), false);
$$;

ALTER FUNCTION public.mfa_satisfied() SET search_path = '';

DROP POLICY IF EXISTS "anon_read_professional_profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_read_profiles" ON public.profiles;
CREATE POLICY "authenticated_read_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
    OR public.has_business_relationship(id)
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname IN (
        'Users can update own profile',
        'Admins can update any profile',
        'Admins can update verification status'
      )
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON public.profiles TO authenticated',
      policy_record.policyname
    );
  END LOOP;
END;
$$;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE SELECT, INSERT, UPDATE ON public.profiles FROM authenticated;

-- Columns that may be read for the current user or a user with an established
-- business relationship. Private documents, Stripe identifiers, admin flags
-- and verification internals are deliberately omitted.
GRANT SELECT (
  id, email, full_name, phone, user_type, company_name, rbq_number,
  services_offered, is_rbq_verified, city, region, postal_code, bio,
  years_experience, average_rating, total_reviews, total_projects,
  profile_picture_url, website_url, created_at, updated_at, latitude,
  longitude, location_last_updated, last_active_at, total_proposals_sent,
  proposals_last_30_days, profile_views_count, activity_score,
  hourly_rate_min, hourly_rate_max, daily_rate_min, daily_rate_max,
  availability_status, available_from, response_time_hours,
  accepts_small_projects, minimum_project_budget, travel_distance_km,
  favorites_count, service_radius_km, address, profile_completed,
  total_projects_external, business_volume_cad, company_type, rbq_subcat,
  trade_specialty, linkedin_url, certifications, languages, service_zones,
  professional_type, subscription_tier, profile_views
) ON public.profiles TO authenticated;

-- User-editable fields. Verification decisions, platform metrics, billing
-- identifiers and administrative attributes remain server-only.
GRANT UPDATE (
  full_name, phone, user_type, company_name, rbq_number,
  rbq_certification_url, services_offered, insurance_info, city, region,
  postal_code, bio, years_experience, profile_picture_url, website_url,
  updated_at, latitude, longitude, location_last_updated, last_active_at,
  hourly_rate_min, hourly_rate_max, daily_rate_min, daily_rate_max,
  availability_status, available_from, response_time_hours,
  accepts_small_projects, minimum_project_budget, travel_distance_km,
  service_radius_km, address, profile_completed, total_projects_external,
  business_volume_cad, notification_preferences, company_type, rbq_subcat,
  trade_specialty, linkedin_url, certifications, languages, service_zones,
  professional_type, id_document_url, id_document_type
) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(auth.jwt()->>'role', '') = 'authenticated'
     AND NOT public.is_admin() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
       OR NEW.is_rbq_verified IS DISTINCT FROM OLD.is_rbq_verified
       OR NEW.rbq_verified_at IS DISTINCT FROM OLD.rbq_verified_at
       OR NEW.rbq_verified_by IS DISTINCT FROM OLD.rbq_verified_by
       OR NEW.rbq_rejection_reason IS DISTINCT FROM OLD.rbq_rejection_reason
       OR NEW.rbq_verification_notes IS DISTINCT FROM OLD.rbq_verification_notes
       OR NEW.rbq_expires_at IS DISTINCT FROM OLD.rbq_expires_at
       OR NEW.insurance_expires_at IS DISTINCT FROM OLD.insurance_expires_at
       OR NEW.average_rating IS DISTINCT FROM OLD.average_rating
       OR NEW.total_reviews IS DISTINCT FROM OLD.total_reviews
       OR NEW.total_projects IS DISTINCT FROM OLD.total_projects
       OR NEW.total_proposals_sent IS DISTINCT FROM OLD.total_proposals_sent
       OR NEW.proposals_last_30_days IS DISTINCT FROM OLD.proposals_last_30_days
       OR NEW.profile_views_count IS DISTINCT FROM OLD.profile_views_count
       OR NEW.profile_views IS DISTINCT FROM OLD.profile_views
       OR NEW.activity_score IS DISTINCT FROM OLD.activity_score
       OR NEW.favorites_count IS DISTINCT FROM OLD.favorites_count
       OR NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
       OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id
       OR NEW.payout_enabled IS DISTINCT FROM OLD.payout_enabled
       OR NEW.id_document_verified IS DISTINCT FROM OLD.id_document_verified
       OR NEW.id_document_verified_at IS DISTINCT FROM OLD.id_document_verified_at
       OR NEW.id_document_verified_by IS DISTINCT FROM OLD.id_document_verified_by
       OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'Privileged profile fields are server-managed';
    END IF;

    IF NEW.user_type IS DISTINCT FROM OLD.user_type
       AND NOT (
         OLD.user_type = 'client'::public.user_type
         AND NEW.user_type = 'professional'::public.user_type
         AND COALESCE(OLD.profile_completed, false) = false
       ) THEN
      RAISE EXCEPTION 'This account type transition is not allowed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trigger_guard_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileged_fields();

-- Create the initial profile from a deliberately small, validated subset of
-- signup metadata. Metadata selects the onboarding path but never grants admin
-- or verification privileges.
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_user_type text := NEW.raw_user_meta_data->>'user_type';
  safe_user_type public.user_type := CASE
    WHEN requested_user_type = 'professional'
      THEN 'professional'::public.user_type
    ELSE 'client'::public.user_type
  END;
  safe_professional_type text := CASE
    WHEN requested_user_type = 'professional'
      AND NEW.raw_user_meta_data->>'professional_type'
        IN ('entrepreneur', 'trade_professional')
      THEN NEW.raw_user_meta_data->>'professional_type'
    ELSE NULL
  END;
  safe_full_name text := LEFT(
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'Utilisateur'),
    160
  );
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    professional_type,
    company_type,
    rbq_subcat,
    trade_specialty,
    profile_completed,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    safe_full_name,
    safe_user_type,
    safe_professional_type,
    CASE WHEN safe_user_type = 'professional'::public.user_type
      THEN LEFT(NEW.raw_user_meta_data->>'company_type', 120)
      ELSE NULL
    END,
    CASE WHEN safe_user_type = 'professional'::public.user_type
      THEN LEFT(NEW.raw_user_meta_data->>'rbq_subcat', 200)
      ELSE NULL
    END,
    CASE WHEN safe_user_type = 'professional'::public.user_type
      THEN LEFT(NEW.raw_user_meta_data->>'trade_specialty', 200)
      ELSE NULL
    END,
    safe_user_type = 'client'::public.user_type,
    statement_timestamp(),
    statement_timestamp()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- Public certification pages receive a safe projection rather than raw
-- certificate numbers and private storage paths.
DROP VIEW IF EXISTS public.public_professional_certifications;
CREATE VIEW public.public_professional_certifications
WITH (security_barrier = true)
AS
SELECT
  certification.id,
  certification.professional_id,
  certification.cert_type,
  certification.cert_name,
  certification.issuer,
  certification.issued_at,
  certification.expires_at,
  (certification.certificate_url IS NOT NULL) AS has_document
FROM public.professional_certifications AS certification;

REVOKE ALL ON public.public_professional_certifications FROM PUBLIC;
GRANT SELECT ON public.public_professional_certifications TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read certifications" ON public.professional_certifications;
DROP POLICY IF EXISTS "Public can read rbq licenses" ON public.rbq_licenses;
DROP POLICY IF EXISTS "Public can read insurance certificates" ON public.insurance_certificates;
REVOKE SELECT ON public.professional_certifications FROM anon;
REVOKE SELECT ON public.rbq_licenses FROM anon;
REVOKE SELECT ON public.insurance_certificates FROM anon;

-- The existing admin views contain private verification documents. They use
-- security_invoker, so granting their underlying columns to the shared
-- authenticated role would also expose those columns outside the admin UI.
-- Keep the views closed and expose them through actor-checked RPCs instead.
REVOKE ALL ON public.admin_pending_verifications
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_rejected_professionals
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_dashboard_stats
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_verified_professionals
  FROM PUBLIC, anon, authenticated;

-- Legacy convenience views inherited every table privilege from PUBLIC. Keep
-- only the two authenticated, RLS-aware projections still used by the app;
-- all public directory/tender reads now use the narrow projections above or
-- the RLS-protected base table.
REVOKE ALL ON public.conversations_with_details
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.favorites_with_details
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.professionals_map_view
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.professionals_with_distance
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.projects_map_view
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.proposals_complete
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.tenders_complete
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.conversations_with_details TO authenticated;
GRANT SELECT ON public.proposals_complete TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS SETOF public.admin_dashboard_stats
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY SELECT stats.* FROM public.admin_dashboard_stats AS stats;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_pending_verifications()
RETURNS SETOF public.admin_pending_verifications
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT pending.*
  FROM public.admin_pending_verifications AS pending
  ORDER BY pending.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_rejected_professionals()
RETURNS SETOF public.admin_rejected_professionals
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT rejected.*
  FROM public.admin_rejected_professionals AS rejected
  ORDER BY rejected.updated_at DESC;
END;
$$;

-- -------------------------------------------------------------------------
-- 3. Messaging RPC authorization
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  user_1_id uuid,
  user_2_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
  first_participant uuid;
  second_participant uuid;
  conversation_id uuid;
BEGIN
  IF caller_id IS NULL OR caller_id NOT IN (user_1_id, user_2_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF user_1_id IS NULL OR user_2_id IS NULL OR user_1_id = user_2_id THEN
    RAISE EXCEPTION 'Two distinct participants are required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = CASE WHEN caller_id = user_1_id THEN user_2_id ELSE user_1_id END
  ) THEN
    RAISE EXCEPTION 'Participant not found';
  END IF;

  first_participant := LEAST(user_1_id, user_2_id);
  second_participant := GREATEST(user_1_id, user_2_id);

  INSERT INTO public.conversations (participant_1_id, participant_2_id)
  VALUES (first_participant, second_participant)
  ON CONFLICT (participant_1_id, participant_2_id) DO NOTHING;

  SELECT conversation.id INTO conversation_id
  FROM public.conversations AS conversation
  WHERE conversation.participant_1_id = first_participant
    AND conversation.participant_2_id = second_participant;

  RETURN conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_message(
  message_id uuid,
  deleter_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
BEGIN
  IF caller_id IS NULL OR deleter_id IS DISTINCT FROM caller_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.messages
  SET deleted_at = statement_timestamp(), deleted_by = caller_id
  WHERE id = message_id
    AND caller_id IN (sender_id, receiver_id)
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_messages_count(user_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages
  WHERE receiver_id = (SELECT auth.uid())
    AND user_uuid = (SELECT auth.uid())
    AND is_read = false;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(user_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*)::integer
  FROM public.notifications
  WHERE user_id = (SELECT auth.uid())
    AND user_uuid = (SELECT auth.uid())
    AND is_read = false;
$$;

CREATE OR REPLACE FUNCTION public.get_deleted_messages_count(user_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages
  WHERE user_uuid = (SELECT auth.uid())
    AND (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()))
    AND deleted_at IS NOT NULL;
$$;

-- -------------------------------------------------------------------------
-- 4. Contract audit trail and server-authoritative signatures
-- -------------------------------------------------------------------------

-- A legacy FOR ALL policy and delete RPC allowed professionals to delete
-- templates they did not own, including legacy rows with NULL ownership.
DROP POLICY IF EXISTS "Professionals can manage contract templates"
  ON public.contract_templates;
DROP POLICY IF EXISTS "Users can delete their own custom templates"
  ON public.contract_templates;
DROP POLICY IF EXISTS "Professionals can create own contract templates"
  ON public.contract_templates;
DROP POLICY IF EXISTS "Professionals can update own contract templates"
  ON public.contract_templates;

CREATE POLICY "Professionals can create own contract templates"
  ON public.contract_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.user_type = 'professional'::public.user_type
    )
  );

CREATE POLICY "Professionals can update own contract templates"
  ON public.contract_templates
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own custom templates"
  ON public.contract_templates
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.delete_custom_template(template_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := (SELECT auth.uid());
  deleted_template_id uuid;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = current_user_id
      AND profile.user_type = 'professional'::public.user_type
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only professionals can delete custom templates'
    );
  END IF;

  DELETE FROM public.contract_templates
  WHERE id = template_id
    AND created_by = current_user_id
  RETURNING id INTO deleted_template_id;

  IF deleted_template_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Template not found or not owned by the current user'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', deleted_template_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_custom_template(uuid)
  FROM PUBLIC, anon, authenticated;

-- Proposal decisions must preserve the audit history and may only be made by
-- the client who owns the project. Browser clients cannot change status or
-- delete proposal rows directly.
DROP POLICY IF EXISTS "Clients can update proposals on own projects"
  ON public.proposals;
DROP POLICY IF EXISTS "Clients can delete proposals on own projects"
  ON public.proposals;
REVOKE DELETE ON public.proposals FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_proposal_status_mutations()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' AND NEW.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'Proposal status is server-managed';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Proposal status is server-managed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_proposal_status_mutations
  ON public.proposals;
CREATE TRIGGER trigger_guard_proposal_status_mutations
  BEFORE INSERT OR UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_proposal_status_mutations();

CREATE OR REPLACE FUNCTION public.accept_proposal(proposal_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
  proposal_record public.proposals%ROWTYPE;
  project_record public.projects%ROWTYPE;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO proposal_record
  FROM public.proposals
  WHERE id = proposal_uuid
  FOR UPDATE;

  IF NOT FOUND OR proposal_record.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Proposal not found or already processed';
  END IF;

  SELECT * INTO project_record
  FROM public.projects
  WHERE id = proposal_record.project_id
  FOR UPDATE;

  IF NOT FOUND OR project_record.client_id IS DISTINCT FROM caller_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF project_record.assigned_professional_id IS NOT NULL THEN
    RAISE EXCEPTION 'Project already has an assigned professional';
  END IF;

  UPDATE public.proposals
  SET status = 'accepted', updated_at = statement_timestamp()
  WHERE id = proposal_uuid
    AND status = 'pending';

  WITH rejected AS (
    UPDATE public.proposals
    SET status = 'rejected', updated_at = statement_timestamp()
    WHERE project_id = proposal_record.project_id
      AND id <> proposal_uuid
      AND status = 'pending'
    RETURNING professional_id
  )
  INSERT INTO public.notifications (
    user_id, type, title, message, related_project_id, action_url
  )
  SELECT
    rejected.professional_id,
    'proposal_rejected',
    'Projet attribué à un autre professionnel',
    'Le projet "' || COALESCE(project_record.title, 'Projet') ||
      '" a été attribué à un autre professionnel.',
    proposal_record.project_id,
    '/projects'
  FROM rejected;

  UPDATE public.projects
  SET assigned_professional_id = proposal_record.professional_id,
      status = 'in_progress',
      updated_at = statement_timestamp()
  WHERE id = proposal_record.project_id;

  INSERT INTO public.notifications (
    user_id, type, title, message, related_project_id, action_url
  ) VALUES (
    proposal_record.professional_id,
    'proposal_accepted',
    'Proposition acceptée',
    'Votre proposition pour "' || COALESCE(project_record.title, 'Projet') ||
      '" a été acceptée.',
    proposal_record.project_id,
    '/pro/my-projects'
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_proposal(proposal_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
  proposal_record public.proposals%ROWTYPE;
  project_record public.projects%ROWTYPE;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO proposal_record
  FROM public.proposals
  WHERE id = proposal_uuid
  FOR UPDATE;

  IF NOT FOUND OR proposal_record.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Proposal not found or already processed';
  END IF;

  SELECT * INTO project_record
  FROM public.projects
  WHERE id = proposal_record.project_id
  FOR UPDATE;

  IF NOT FOUND OR project_record.client_id IS DISTINCT FROM caller_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.proposals
  SET status = 'rejected', updated_at = statement_timestamp()
  WHERE id = proposal_uuid
    AND status = 'pending';

  INSERT INTO public.notifications (
    user_id, type, title, message, related_project_id, action_url
  ) VALUES (
    proposal_record.professional_id,
    'proposal_rejected',
    'Proposition non retenue',
    'Votre proposition pour "' || COALESCE(project_record.title, 'Projet') ||
      '" n''a pas été retenue.',
    proposal_record.project_id,
    '/projects'
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_proposal(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_proposal(uuid)
  FROM PUBLIC, anon, authenticated;

-- Invitations are created by the client who owns the project, and responses
-- are processed only by the actor-checking RPC. The legacy FOR ALL/UPDATE
-- policies allowed callers to rewrite project, participant and audit fields.
DROP POLICY IF EXISTS "Clients manage their own invitations"
  ON public.project_invitations;
DROP POLICY IF EXISTS "Clients can read own invitations"
  ON public.project_invitations;
DROP POLICY IF EXISTS "Clients can create invitations for own projects"
  ON public.project_invitations;
DROP POLICY IF EXISTS "Professionals can respond to invitations"
  ON public.project_invitations;

CREATE POLICY "Clients can read own invitations"
  ON public.project_invitations
  FOR SELECT
  TO authenticated
  USING (client_id = (SELECT auth.uid()));

CREATE POLICY "Clients can create invitations for own projects"
  ON public.project_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = (SELECT auth.uid())
    AND status = 'pending'
    AND responded_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.projects AS project
      WHERE project.id = project_id
        AND project.client_id = (SELECT auth.uid())
    )
  );

REVOKE INSERT, UPDATE, DELETE ON public.project_invitations
  FROM anon, authenticated;
GRANT INSERT (project_id, client_id, professional_id, message, status)
  ON public.project_invitations TO authenticated;

CREATE OR REPLACE FUNCTION public.respond_to_invitation(
  p_invitation_id uuid,
  p_response text
)
RETURNS public.project_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
  invitation_record public.project_invitations%ROWTYPE;
BEGIN
  IF caller_id IS NULL OR p_response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Not authorized or invalid response';
  END IF;

  SELECT * INTO invitation_record
  FROM public.project_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF NOT FOUND
     OR invitation_record.professional_id IS DISTINCT FROM caller_id
     OR invitation_record.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Invitation not found or not available';
  END IF;

  UPDATE public.project_invitations
  SET status = p_response,
      responded_at = statement_timestamp(),
      updated_at = statement_timestamp()
  WHERE id = p_invitation_id
    AND status = 'pending'
  RETURNING * INTO invitation_record;

  RETURN invitation_record;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_invitation(uuid, text)
  FROM PUBLIC, anon, authenticated;

-- Financial records are created by trusted triggers/backends. A contractor
-- may dispute an escrow payment, but may not rewrite its amount, parties or
-- settlement metadata through a broad UPDATE policy.
DROP POLICY IF EXISTS "Contractors can update their own payments (dispute)"
  ON public.contractor_payments;
DROP POLICY IF EXISTS "Contractors can dispute escrow payments"
  ON public.contractor_payments;
CREATE POLICY "Contractors can dispute escrow payments"
  ON public.contractor_payments
  FOR UPDATE
  TO authenticated
  USING (
    contractor_id = (SELECT auth.uid())
    AND status = 'in_escrow'
  )
  WITH CHECK (
    contractor_id = (SELECT auth.uid())
    AND status = 'disputed'
    AND dispute_reason IS NOT NULL
  );

REVOKE UPDATE ON public.contractor_payments FROM anon, authenticated;
GRANT UPDATE (status, dispute_reason, dispute_details)
  ON public.contractor_payments TO authenticated;

DROP POLICY IF EXISTS "Professionals can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Issuers can update their invoices" ON public.invoices;
REVOKE INSERT, UPDATE, DELETE ON public.invoices FROM anon, authenticated;

DROP POLICY IF EXISTS "System can insert audit trail" ON public.contract_audit_trail;
DROP POLICY IF EXISTS "System can insert audit trail entries" ON public.contract_audit_trail;
REVOKE INSERT, UPDATE, DELETE ON public.contract_audit_trail FROM anon, authenticated;
REVOKE SELECT ON public.contract_audit_trail FROM anon;
GRANT SELECT ON public.contract_audit_trail TO authenticated;

DROP POLICY IF EXISTS "Users can view audit trail for their contracts" ON public.contract_audit_trail;
CREATE POLICY "Contract parties view audit trail"
  ON public.contract_audit_trail
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contracts AS contract
      WHERE contract.id = contract_audit_trail.contract_id
        AND (
          contract.client_id = (SELECT auth.uid())
          OR contract.professional_id = (SELECT auth.uid())
          OR (SELECT public.is_admin())
        )
    )
  );

CREATE OR REPLACE FUNCTION public.add_contract_audit_event(
  p_contract_id uuid,
  p_event_type text,
  p_user_agent text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := (SELECT auth.uid());
  caller_name text;
  entry_id uuid;
BEGIN
  IF caller_id IS NULL OR p_event_type NOT IN ('viewed', 'downloaded') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF jsonb_typeof(COALESCE(p_details, '{}'::jsonb)) <> 'object'
     OR octet_length(COALESCE(p_details, '{}'::jsonb)::text) > 8192 THEN
    RAISE EXCEPTION 'Invalid audit details';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.contracts AS contract
    WHERE contract.id = p_contract_id
      AND caller_id IN (contract.client_id, contract.professional_id)
  ) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(profile.full_name, 'Utilisateur') INTO caller_name
  FROM public.profiles AS profile
  WHERE profile.id = caller_id;

  INSERT INTO public.contract_audit_trail (
    contract_id, event_type, user_id, user_name, created_at,
    ip_address, user_agent, details
  ) VALUES (
    p_contract_id, p_event_type, caller_id, caller_name, statement_timestamp(),
    'not-collected', LEFT(COALESCE(p_user_agent, 'unknown'), 512),
    COALESCE(p_details, '{}'::jsonb)
  )
  RETURNING id INTO entry_id;

  RETURN entry_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contract_audit_trail(contract_uuid uuid)
RETURNS TABLE (
  id uuid,
  event_type varchar,
  user_name varchar,
  created_at timestamptz,
  ip_address varchar,
  details jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    audit.id,
    audit.event_type,
    audit.user_name,
    audit.created_at,
    audit.ip_address,
    audit.details
  FROM public.contract_audit_trail AS audit
  JOIN public.contracts AS contract ON contract.id = audit.contract_id
  WHERE audit.contract_id = contract_uuid
    AND (
      contract.client_id = (SELECT auth.uid())
      OR contract.professional_id = (SELECT auth.uid())
      OR (SELECT public.is_admin())
    )
  ORDER BY audit.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.guard_contract_sensitive_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  jwt_role text := COALESCE(auth.jwt()->>'role', '');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF jwt_role <> 'service_role'
       AND (
         NEW.client_signature_data IS NOT NULL
         OR NEW.professional_signature_data IS NOT NULL
         OR NEW.client_signed_at IS NOT NULL
         OR NEW.professional_signed_at IS NOT NULL
         OR NEW.signed_at IS NOT NULL
         OR NEW.status IS NULL
         OR NEW.status NOT IN (
           'draft'::public.contract_status,
           'pending_both_signatures'::public.contract_status
         )
       ) THEN
      RAISE EXCEPTION 'Initial signatures and signature status are server-managed';
    END IF;
    RETURN NEW;
  END IF;

  IF jwt_role <> 'service_role' THEN
    IF NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.professional_id IS DISTINCT FROM OLD.professional_id
       OR NEW.project_id IS DISTINCT FROM OLD.project_id
       OR NEW.template_id IS DISTINCT FROM OLD.template_id THEN
      RAISE EXCEPTION 'Contract parties and references are immutable';
    END IF;

    IF NEW.client_signature_data IS DISTINCT FROM OLD.client_signature_data
       OR NEW.professional_signature_data IS DISTINCT FROM OLD.professional_signature_data
       OR NEW.client_signed_at IS DISTINCT FROM OLD.client_signed_at
       OR NEW.professional_signed_at IS DISTINCT FROM OLD.professional_signed_at
       OR NEW.signed_at IS DISTINCT FROM OLD.signed_at THEN
      RAISE EXCEPTION 'Signatures must be submitted through the secure signing service';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Contract signature status is server-managed';
    END IF;
  END IF;

  IF OLD.client_signed_at IS NOT NULL OR OLD.professional_signed_at IS NOT NULL THEN
    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.contract_content IS DISTINCT FROM OLD.contract_content
       OR NEW.variables IS DISTINCT FROM OLD.variables
       OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
       OR NEW.currency IS DISTINCT FROM OLD.currency
       OR NEW.payment_schedule IS DISTINCT FROM OLD.payment_schedule
       OR NEW.deposit_percentage IS DISTINCT FROM OLD.deposit_percentage
       OR NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.end_date IS DISTINCT FROM OLD.end_date
       OR NEW.estimated_duration_days IS DISTINCT FROM OLD.estimated_duration_days
       OR NEW.payment_handling IS DISTINCT FROM OLD.payment_handling
       OR NEW.terms_and_conditions IS DISTINCT FROM OLD.terms_and_conditions
       OR NEW.special_conditions IS DISTINCT FROM OLD.special_conditions
       OR NEW.warranty_period_months IS DISTINCT FROM OLD.warranty_period_months
       OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.parent_contract_id IS DISTINCT FROM OLD.parent_contract_id
       OR NEW.attachments IS DISTINCT FROM OLD.attachments
       OR NEW.contract_pdf_url IS DISTINCT FROM OLD.contract_pdf_url
       OR NEW.is_uploaded IS DISTINCT FROM OLD.is_uploaded
       OR NEW.uploaded_at IS DISTINCT FROM OLD.uploaded_at
       OR NEW.uploaded_file_url IS DISTINCT FROM OLD.uploaded_file_url
       OR NEW.uploaded_filename IS DISTINCT FROM OLD.uploaded_filename THEN
      RAISE EXCEPTION 'Signed contract content is immutable';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_contract_sensitive_updates ON public.contracts;
CREATE TRIGGER trigger_guard_contract_sensitive_updates
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_contract_sensitive_updates();

CREATE OR REPLACE FUNCTION public.update_contract_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.client_signed_at IS NOT NULL AND NEW.professional_signed_at IS NOT NULL THEN
    NEW.status := 'signed'::public.contract_status;
    NEW.signed_at := GREATEST(NEW.client_signed_at, NEW.professional_signed_at);
  ELSIF NEW.client_signed_at IS NOT NULL THEN
    NEW.status := 'pending_professional_signature'::public.contract_status;
  ELSIF NEW.professional_signed_at IS NOT NULL THEN
    NEW.status := 'pending_client_signature'::public.contract_status;
  ELSE
    NEW.status := 'pending_both_signatures'::public.contract_status;
    NEW.signed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_audit_contract_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor_id uuid := COALESCE((SELECT auth.uid()), NEW.client_id);
  actor_name text;
BEGIN
  SELECT COALESCE(profile.full_name, 'Utilisateur') INTO actor_name
  FROM public.profiles AS profile WHERE profile.id = actor_id;

  INSERT INTO public.contract_audit_trail (
    contract_id, event_type, user_id, user_name, created_at,
    ip_address, user_agent, details
  ) VALUES (
    NEW.id, 'created', actor_id, COALESCE(actor_name, 'Utilisateur'),
    statement_timestamp(), 'server', 'database-trigger',
    jsonb_build_object('contract_title', NEW.title)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_audit_signature_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  signer_id uuid;
  signer_name text;
  signature_data jsonb;
  signature_event text;
BEGIN
  IF OLD.client_signature_data IS NULL AND NEW.client_signature_data IS NOT NULL THEN
    signer_id := NEW.client_id;
    signature_data := NEW.client_signature_data;
    signature_event := 'client_signed';
  ELSIF OLD.professional_signature_data IS NULL
        AND NEW.professional_signature_data IS NOT NULL THEN
    signer_id := NEW.professional_id;
    signature_data := NEW.professional_signature_data;
    signature_event := 'professional_signed';
  ELSE
    RETURN NEW;
  END IF;

  SELECT COALESCE(profile.full_name, 'Utilisateur') INTO signer_name
  FROM public.profiles AS profile WHERE profile.id = signer_id;

  INSERT INTO public.contract_audit_trail (
    contract_id, event_type, user_id, user_name, created_at,
    ip_address, user_agent, details
  ) VALUES (
    NEW.id,
    signature_event,
    signer_id,
    COALESCE(signer_name, 'Utilisateur'),
    COALESCE((signature_data->>'signed_at')::timestamptz, statement_timestamp()),
    LEFT(COALESCE(signature_data->>'ip_address', 'unknown'), 64),
    LEFT(COALESCE(signature_data->>'user_agent', 'unknown'), 512),
    jsonb_build_object(
      'verification_code', signature_data->>'verification_code',
      'document_hash', signature_data->>'document_hash',
      'signature_hash', signature_data->>'signature_hash',
      'signature_method', signature_data->>'signature_method'
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sign_contract_secure(
  p_contract_id uuid,
  p_signer_id uuid,
  p_signature_data jsonb,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  contract_row public.contracts%ROWTYPE;
  signed_at_value timestamptz := clock_timestamp();
  verification_code_value text;
  final_signature jsonb;
  updated_contract jsonb;
  signer_role text;
BEGIN
  IF COALESCE(auth.jwt()->>'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;
  IF p_signer_id IS NULL OR p_signature_data IS NULL
     OR jsonb_typeof(p_signature_data) <> 'object' THEN
    RAISE EXCEPTION 'Invalid signature payload';
  END IF;
  IF octet_length(p_signature_data::text) > 900000
     OR COALESCE(p_signature_data->>'signature_image', '')
        !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$'
     OR length(COALESCE(p_signature_data->>'signature_image', '')) > 850000 THEN
    RAISE EXCEPTION 'Invalid or oversized signature image';
  END IF;

  SELECT * INTO contract_row
  FROM public.contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  IF p_signer_id = contract_row.client_id THEN
    signer_role := 'client';
    IF contract_row.client_signed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Contract already signed by this client';
    END IF;
  ELSIF p_signer_id = contract_row.professional_id THEN
    signer_role := 'professional';
    IF contract_row.professional_signed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Contract already signed by this professional';
    END IF;
  ELSE
    RAISE EXCEPTION 'Signer is not a contract party';
  END IF;
  IF contract_row.status IN ('cancelled', 'expired') THEN
    RAISE EXCEPTION 'Contract cannot be signed in its current state';
  END IF;
  IF contract_row.expires_at IS NOT NULL
     AND contract_row.expires_at < signed_at_value THEN
    RAISE EXCEPTION 'Contract has expired';
  END IF;

  verification_code_value := 'BTN-' || UPPER(
    encode(extensions.gen_random_bytes(18), 'hex')
  );

  final_signature := (
    p_signature_data
      - 'signed_at'
      - 'verification_code'
      - 'ip_address'
      - 'user_agent'
      - 'document_hash'
      - 'signature_hash'
  ) || jsonb_build_object(
    'signed_at', signed_at_value,
    'verification_code', verification_code_value,
    'ip_address', LEFT(COALESCE(NULLIF(p_ip_address, ''), 'unknown'), 64),
    'user_agent', LEFT(COALESCE(NULLIF(p_user_agent, ''), 'unknown'), 512),
    'document_hash', encode(extensions.digest(
      jsonb_build_object(
        'id', contract_row.id,
        'project_id', contract_row.project_id,
        'template_id', contract_row.template_id,
        'client_id', contract_row.client_id,
        'professional_id', contract_row.professional_id,
        'title', contract_row.title,
        'description', contract_row.description,
        'contract_content', contract_row.contract_content,
        'variables', contract_row.variables,
        'total_amount', contract_row.total_amount,
        'currency', contract_row.currency,
        'payment_schedule', contract_row.payment_schedule,
        'deposit_percentage', contract_row.deposit_percentage,
        'start_date', contract_row.start_date,
        'end_date', contract_row.end_date,
        'estimated_duration_days', contract_row.estimated_duration_days,
        'terms_and_conditions', contract_row.terms_and_conditions,
        'special_conditions', contract_row.special_conditions,
        'warranty_period_months', contract_row.warranty_period_months,
        'expires_at', contract_row.expires_at,
        'version', contract_row.version,
        'parent_contract_id', contract_row.parent_contract_id,
        'attachments', contract_row.attachments,
        'payment_handling', contract_row.payment_handling,
        'contract_pdf_url', contract_row.contract_pdf_url,
        'is_uploaded', contract_row.is_uploaded,
        'uploaded_at', contract_row.uploaded_at,
        'uploaded_file_url', contract_row.uploaded_file_url,
        'uploaded_filename', contract_row.uploaded_filename
      )::text,
      'sha256'
    ), 'hex'),
    'signature_hash', encode(
      extensions.digest(p_signature_data->>'signature_image', 'sha256'),
      'hex'
    )
  );

  IF signer_role = 'client' THEN
    UPDATE public.contracts AS contract
    SET client_signature_data = final_signature,
        client_signed_at = signed_at_value
    WHERE contract.id = p_contract_id
    RETURNING to_jsonb(contract.*) INTO updated_contract;
  ELSE
    UPDATE public.contracts AS contract
    SET professional_signature_data = final_signature,
        professional_signed_at = signed_at_value
    WHERE contract.id = p_contract_id
    RETURNING to_jsonb(contract.*) INTO updated_contract;
  END IF;

  RETURN jsonb_build_object(
    'contract', updated_contract,
    'signature_data', final_signature,
    'signer_role', signer_role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_contract_signature(
  p_verification_code text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  contract_row public.contracts%ROWTYPE;
  matched_signature jsonb;
  signer_role text;
BEGIN
  IF p_verification_code IS NULL
     OR p_verification_code !~ '^BTN-[A-F0-9]{36}$' THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT * INTO contract_row
  FROM public.contracts AS contract
  WHERE contract.client_signature_data->>'verification_code' = p_verification_code
     OR contract.professional_signature_data->>'verification_code' = p_verification_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF contract_row.client_signature_data->>'verification_code' = p_verification_code THEN
    matched_signature := contract_row.client_signature_data;
    signer_role := 'client';
  ELSE
    matched_signature := contract_row.professional_signature_data;
    signer_role := 'professional';
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'contract_id', contract_row.id,
    'contract_title', contract_row.title,
    'contract_status', contract_row.status,
    'contract_signed_at', contract_row.signed_at,
    'signer_role', signer_role,
    'signature_signed_at', matched_signature->>'signed_at',
    'document_hash', matched_signature->>'document_hash',
    'signature_hash', matched_signature->>'signature_hash'
  );
END;
$$;

-- -------------------------------------------------------------------------
-- 5. Financial/statistical RPCs must not expose another user's activity
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_professional_revenue_summary(
  p_professional_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_revenue numeric(12,2) := 0;
  pending_revenue numeric(12,2) := 0;
  invoice_count integer := 0;
  paid_invoice_count integer := 0;
BEGIN
  IF (SELECT auth.uid()) IS DISTINCT FROM p_professional_id
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN payment.status = 'released' THEN payment.net_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment.status IN ('pending','in_escrow') THEN payment.net_amount ELSE 0 END), 0)
  INTO total_revenue, pending_revenue
  FROM public.contractor_payments AS payment
  WHERE payment.contractor_id = p_professional_id;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE invoice.status = 'paid')
  INTO invoice_count, paid_invoice_count
  FROM public.invoices AS invoice
  WHERE invoice.contractor_id = p_professional_id;

  RETURN jsonb_build_object(
    'total_revenue', total_revenue,
    'pending_revenue', pending_revenue,
    'invoices_count', invoice_count,
    'paid_invoices', paid_invoice_count,
    'payment_rate', CASE
      WHEN invoice_count > 0
        THEN ROUND((paid_invoice_count::numeric / invoice_count) * 100, 1)
      ELSE 0
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_proposal_conversion_rate(
  p_professional_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_count integer := 0;
  accepted_count integer := 0;
  pending_count integer := 0;
  rejected_count integer := 0;
BEGIN
  IF (SELECT auth.uid()) IS DISTINCT FROM p_professional_id
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE proposal.status = 'accepted'),
    COUNT(*) FILTER (WHERE proposal.status = 'pending'),
    COUNT(*) FILTER (WHERE proposal.status = 'rejected')
  INTO total_count, accepted_count, pending_count, rejected_count
  FROM public.proposals AS proposal
  WHERE proposal.professional_id = p_professional_id;

  RETURN jsonb_build_object(
    'total', total_count,
    'accepted', accepted_count,
    'pending', pending_count,
    'rejected', rejected_count,
    'conversion_rate', CASE
      WHEN total_count > 0
        THEN ROUND((accepted_count::numeric / total_count) * 100, 1)
      ELSE 0
    END
  );
END;
$$;

-- RLS predicates and the most frequent dashboard/verification lookups need
-- indexed foreign-key/filter columns. Existing installations did not index
-- several of these foreign keys.
CREATE INDEX IF NOT EXISTS idx_projects_client_id
  ON public.projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_professional_id
  ON public.projects (assigned_professional_id)
  WHERE assigned_professional_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status_created_at
  ON public.projects (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_project_status
  ON public.proposals (project_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_professional_status
  ON public.proposals (professional_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_audit_contract_created
  ON public.contract_audit_trail (contract_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_client_verification_code
  ON public.contracts ((client_signature_data->>'verification_code'))
  WHERE client_signature_data->>'verification_code' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_professional_verification_code
  ON public.contracts ((professional_signature_data->>'verification_code'))
  WHERE professional_signature_data->>'verification_code' IS NOT NULL;

-- Admin audit rows are written by the actor-checking administrative RPCs and
-- their triggers, never directly by a browser (including an admin browser).
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit_logs FROM anon, authenticated;
REVOKE SELECT ON public.admin_audit_logs FROM anon;
GRANT SELECT ON public.admin_audit_logs TO authenticated;

-- -------------------------------------------------------------------------
-- 6. Storage ownership and bucket restrictions
-- -------------------------------------------------------------------------

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'
    ]
WHERE id = 'projects';

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif'
    ]
WHERE id = 'portfolio-images';

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'application/pdf'
    ]
WHERE id = 'insurance-certificates';

DROP POLICY IF EXISTS "Authenticated users can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Clients can update their project images" ON storage.objects;
DROP POLICY IF EXISTS "Clients can delete their project images" ON storage.objects;
DROP POLICY IF EXISTS "Project owners can upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Project owners can update project files" ON storage.objects;
DROP POLICY IF EXISTS "Project owners can delete project files" ON storage.objects;
CREATE POLICY "Project owners can upload project files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'projects'
    AND EXISTS (
      SELECT 1 FROM public.projects AS project
      WHERE project.id::text = (storage.foldername(name))[1]
        AND project.client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Project owners can update project files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'projects'
    AND EXISTS (
      SELECT 1 FROM public.projects AS project
      WHERE project.id::text = (storage.foldername(name))[1]
        AND project.client_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'projects'
    AND EXISTS (
      SELECT 1 FROM public.projects AS project
      WHERE project.id::text = (storage.foldername(name))[1]
        AND project.client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Project owners can delete project files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'projects'
    AND EXISTS (
      SELECT 1 FROM public.projects AS project
      WHERE project.id::text = (storage.foldername(name))[1]
        AND project.client_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Professionals can upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can update their portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can delete their portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Professionals upload own portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Professionals update own portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Professionals delete own portfolio images" ON storage.objects;

CREATE POLICY "Professionals upload own portfolio images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.user_type = 'professional'::public.user_type
    )
  );

CREATE POLICY "Professionals update own portfolio images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'portfolio-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "Professionals delete own portfolio images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

ALTER POLICY "Users upload their own avatar"
  ON storage.objects TO authenticated;
ALTER POLICY "Users update their own avatar"
  ON storage.objects TO authenticated;
ALTER POLICY "Users delete their own avatar"
  ON storage.objects TO authenticated;

-- -------------------------------------------------------------------------
-- 7. Remove inherited execution from the complete SECURITY DEFINER surface
-- -------------------------------------------------------------------------

DO $$
DECLARE
  function_record record;
BEGIN
  FOR function_record IN
    SELECT procedure.oid::regprocedure AS signature
    FROM pg_proc AS procedure
    JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
    LEFT JOIN pg_depend AS dependency
      ON dependency.classid = 'pg_proc'::regclass
     AND dependency.objid = procedure.oid
     AND dependency.deptype = 'e'
    WHERE namespace.nspname = 'public'
      AND procedure.prosecdef
      AND dependency.objid IS NULL
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',
      function_record.signature
    );
  END LOOP;
END;
$$;

-- Fix mutable search paths without changing resolution semantics. CREATE on
-- public is revoked above, and extensions is maintained by the platform.
DO $$
DECLARE
  function_record record;
BEGIN
  FOR function_record IN
    SELECT procedure.oid::regprocedure AS signature
    FROM pg_proc AS procedure
    JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
    LEFT JOIN pg_depend AS dependency
      ON dependency.classid = 'pg_proc'::regclass
     AND dependency.objid = procedure.oid
     AND dependency.deptype = 'e'
    WHERE namespace.nspname = 'public'
      AND dependency.objid IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(procedure.proconfig, ARRAY[]::text[])) AS setting
        WHERE setting LIKE 'search_path=%'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, extensions',
      function_record.signature
    );
  END LOOP;
END;
$$;

-- Browser-callable RPCs. Every SECURITY DEFINER function below validates the
-- authenticated actor internally; trigger/cron/internal functions stay closed.
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_pending_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_rejected_professionals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mfa_satisfied() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_business_relationship(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_project(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.accept_contract_proposal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_proposal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_allow_resubmission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_rbq(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_rbq(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_milestone(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_custom_template(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_message_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_milestone(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_proposal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_milestone_validation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_invitation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_offline_payment(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_message(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_project_views(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_unread_messages_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notifications_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_deleted_messages_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contract_audit_trail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_contract_audit_event(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_professional_revenue_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_proposal_conversion_rate(uuid) TO authenticated;

-- The signing mutation is backend-only. Public verification returns a narrow,
-- non-PII certificate and is intentionally available to holders of a 144-bit
-- verification code.
GRANT EXECUTE ON FUNCTION public.sign_contract_secure(uuid, uuid, jsonb, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_contract_signature(text)
  TO anon, authenticated, service_role;

COMMIT;
