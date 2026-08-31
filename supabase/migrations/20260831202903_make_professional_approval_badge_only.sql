-- Professional approval is a trust signal, not an access-control decision.
-- Keep the existing admin workflow and audit event while making the user-facing
-- notification explicit: completed profiles were already active before review.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '2min';

CREATE OR REPLACE FUNCTION public.admin_verify_rbq(
  p_professional_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_values JSONB;
  v_professional public.profiles%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT * INTO v_professional
  FROM public.profiles
  WHERE id = p_professional_id
    AND user_type = 'professional';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Professional not found';
  END IF;

  v_old_values := jsonb_build_object(
    'is_rbq_verified', v_professional.is_rbq_verified,
    'rbq_verified_at', v_professional.rbq_verified_at
  );

  UPDATE public.profiles
  SET
    is_rbq_verified = TRUE,
    rbq_verified_at = NOW(),
    rbq_verified_by = auth.uid(),
    rbq_verification_notes = p_notes,
    rbq_rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_professional_id;

  PERFORM public.log_admin_action(
    'VERIFY_RBQ',
    'profile',
    p_professional_id,
    v_old_values,
    jsonb_build_object(
      'is_rbq_verified', TRUE,
      'notes', p_notes
    )
  );

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_user_id,
    action_url
  ) VALUES (
    p_professional_id,
    'rbq_verified',
    'Profil approuvé ✓',
    'Votre vérification est terminée. Le badge « Profil approuvé » est maintenant visible sur votre profil public. Votre accès à BâtirNet était déjà actif.',
    p_professional_id,
    '/pro/dashboard'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Professional approval badge granted successfully'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_verify_rbq(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_rbq(UUID, TEXT) TO authenticated;

COMMIT;
