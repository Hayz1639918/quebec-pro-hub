-- Truthful marketplace + direct payment tracking
--
-- Product decision:
--   * BâtirNet does not process, hold, escrow or release user funds.
--   * Clients and professionals settle directly between themselves.
--   * BâtirNet only records payment progress (sent / received) and related metadata.
--   * Professional business email remains public by product choice.
--   * Administrator accounts are never listed in the public professional directory.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '2min';

-- -------------------------------------------------------------------------
-- 1. Public professional projection
-- -------------------------------------------------------------------------
-- Keep the existing view shape so current frontend consumers do not break, but
-- stop exposing private/internal values. Exact coordinates are reduced to an
-- approximate area (~1 km at Quebec latitudes). The professional email remains
-- public intentionally as a business contact channel.
--
-- Explicit casts preserve the existing view column typmods. PostgreSQL does not
-- allow CREATE OR REPLACE VIEW to silently change numeric(10,8)/numeric(11,8)
-- columns into unconstrained numeric values.
CREATE OR REPLACE VIEW public.public_professional_profiles
WITH (security_barrier = true)
AS
SELECT
  p.id,
  p.full_name,
  p.email,
  NULLIF(p.phone, p.phone) AS phone,
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
  NULLIF(p.total_projects_external, p.total_projects_external)::integer AS total_projects_external,
  NULLIF(p.business_volume_cad, p.business_volume_cad)::numeric(15,2) AS business_volume_cad,
  p.profile_picture_url,
  p.website_url,
  p.linkedin_url,
  p.created_at,
  ROUND(p.latitude, 2)::numeric(10,8) AS latitude,
  ROUND(p.longitude, 2)::numeric(11,8) AS longitude,
  NULLIF(p.last_active_at, p.last_active_at)::timestamptz AS last_active_at,
  NULLIF(p.total_proposals_sent, p.total_proposals_sent)::integer AS total_proposals_sent,
  NULLIF(p.proposals_last_30_days, p.proposals_last_30_days)::integer AS proposals_last_30_days,
  NULLIF(p.profile_views_count, p.profile_views_count)::integer AS profile_views_count,
  NULLIF(p.profile_views, p.profile_views)::integer AS profile_views,
  NULLIF(p.activity_score, p.activity_score)::numeric(5,2) AS activity_score,
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
  NULLIF(p.favorites_count, p.favorites_count)::integer AS favorites_count,
  p.service_radius_km,
  p.rbq_subcat,
  p.trade_specialty,
  p.certifications,
  p.languages,
  p.service_zones,
  p.professional_type,
  NULLIF(p.subscription_tier, p.subscription_tier)::text AS subscription_tier,
  (NULLIF(BTRIM(p.insurance_info), '') IS NOT NULL) AS has_insurance_document,
  (NULLIF(BTRIM(p.rbq_certification_url), '') IS NOT NULL) AS has_rbq_document
FROM public.profiles AS p
WHERE p.user_type = 'professional'::public.user_type
  AND COALESCE(p.is_admin, false) = false;

REVOKE ALL ON public.public_professional_profiles FROM PUBLIC;
GRANT SELECT ON public.public_professional_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_professional_profiles IS
  'Public professional directory. Excludes admins, keeps business email public, hides phone/internal metrics, and exposes only approximate coordinates.';

-- -------------------------------------------------------------------------
-- 2. Direct settlement becomes the only supported payment handling mode
-- -------------------------------------------------------------------------
UPDATE public.projects
SET payment_handling_preference = 'offline'
WHERE payment_handling_preference IS DISTINCT FROM 'offline';

UPDATE public.contract_proposals
SET payment_handling = 'offline'
WHERE payment_handling IS DISTINCT FROM 'offline';

UPDATE public.contracts
SET payment_handling = 'offline'
WHERE payment_handling IS DISTINCT FROM 'offline';

-- Stripe was never active in production. A historical in_escrow value must not
-- imply that BâtirNet actually holds funds, so normalize it back to pending.
UPDATE public.contractor_payments
SET
  status = 'pending',
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'legacy_status_normalized', true,
    'legacy_status', 'in_escrow',
    'normalized_at', NOW()
  ),
  updated_at = NOW()
WHERE status = 'in_escrow';

ALTER TABLE public.projects
  ALTER COLUMN payment_handling_preference SET DEFAULT 'offline';
ALTER TABLE public.contracts
  ALTER COLUMN payment_handling SET DEFAULT 'offline';
ALTER TABLE public.contract_proposals
  ALTER COLUMN payment_handling SET DEFAULT 'offline';

-- Normalize any legacy frontend value at the database boundary. This keeps old
-- clients safe during a staggered deployment and guarantees that no new record
-- can re-enable the unsupported platform-payment path.
CREATE OR REPLACE FUNCTION public.force_direct_project_payment_preference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.payment_handling_preference := 'offline';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_force_direct_project_payment_preference ON public.projects;
CREATE TRIGGER trigger_force_direct_project_payment_preference
  BEFORE INSERT OR UPDATE OF payment_handling_preference ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.force_direct_project_payment_preference();

CREATE OR REPLACE FUNCTION public.force_direct_contract_payment_handling()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.payment_handling := 'offline';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_force_direct_contract_payment_handling ON public.contracts;
CREATE TRIGGER trigger_force_direct_contract_payment_handling
  BEFORE INSERT OR UPDATE OF payment_handling ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.force_direct_contract_payment_handling();

DROP TRIGGER IF EXISTS trigger_force_direct_proposal_payment_handling ON public.contract_proposals;
CREATE TRIGGER trigger_force_direct_proposal_payment_handling
  BEFORE INSERT OR UPDATE OF payment_handling ON public.contract_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.force_direct_contract_payment_handling();

-- Keep proposal acceptance consistent even if an old proposal contains the
-- former platform value.
CREATE OR REPLACE FUNCTION public.accept_contract_proposal(proposal_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
  new_contract_id UUID;
BEGIN
  SELECT * INTO p FROM public.contract_proposals WHERE id = proposal_uuid;
  IF p IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
  IF auth.uid() <> p.client_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'Proposal not pending'; END IF;

  INSERT INTO public.contracts (
    project_id, template_id, client_id, professional_id,
    title, description, contract_content, variables,
    total_amount, currency, deposit_percentage,
    start_date, end_date, status, payment_handling
  ) VALUES (
    p.project_id, p.template_id, p.client_id, p.professional_id,
    p.title, p.description, p.contract_content_draft, p.variables,
    p.total_amount, COALESCE(p.currency, 'CAD'), COALESCE(p.deposit_percentage, 0),
    p.start_date, p.end_date, 'draft', 'offline'
  ) RETURNING id INTO new_contract_id;

  UPDATE public.contract_proposals
  SET status = 'accepted', updated_at = NOW()
  WHERE id = proposal_uuid;

  RETURN new_contract_id;
END;
$$;

-- -------------------------------------------------------------------------
-- 3. Client-side "payment sent" tracking
-- -------------------------------------------------------------------------
-- This records only a statement from the client. It does not move money and it
-- does not mark the payment as received. The professional remains responsible
-- for confirming receipt through settle_offline_payment().
CREATE OR REPLACE FUNCTION public.mark_offline_payment_sent(
  payment_id UUID,
  method TEXT DEFAULT 'transfer',
  note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.contractor_payments%ROWTYPE;
  v_contract public.contracts%ROWTYPE;
  v_method TEXT;
  v_note TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_method := COALESCE(NULLIF(TRIM(method), ''), 'transfer');
  IF v_method NOT IN ('transfer', 'cheque', 'cash') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  v_note := NULLIF(TRIM(note), '');
  IF v_note IS NOT NULL AND length(v_note) > 500 THEN
    RAISE EXCEPTION 'Note too long (max 500 characters)';
  END IF;

  SELECT * INTO v_payment
  FROM public.contractor_payments
  WHERE id = payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF auth.uid() <> v_payment.client_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment is not pending';
  END IF;

  IF v_payment.contract_id IS NULL THEN
    RAISE EXCEPTION 'Payment has no linked contract';
  END IF;

  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = v_payment.contract_id;

  IF NOT FOUND OR COALESCE(v_contract.payment_handling, 'offline') <> 'offline' THEN
    RAISE EXCEPTION 'Direct settlement tracking is not available for this payment';
  END IF;

  UPDATE public.contractor_payments
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'payment_sent_by_client', true,
        'payment_sent_at', NOW(),
        'payment_sent_method', v_method,
        'payment_sent_note', v_note
      ),
      updated_at = NOW()
  WHERE id = payment_id;

  RETURN payment_id;
END;
$$;

COMMENT ON FUNCTION public.mark_offline_payment_sent(UUID, TEXT, TEXT) IS
  'Records that the client reports sending a direct payment. Does not move funds or confirm receipt.';

REVOKE ALL ON FUNCTION public.mark_offline_payment_sent(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_offline_payment_sent(UUID, TEXT, TEXT) TO authenticated;

COMMIT;
