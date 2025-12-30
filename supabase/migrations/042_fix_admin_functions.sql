-- Migration: Fix admin functions to use correct notification columns
-- Date: 2025-12-30
-- Description: The admin_verify_rbq and admin_reject_rbq functions were using 'related_id' 
--              which doesn't exist in the notifications table. Changed to 'related_user_id'.

-- =====================================================
-- FIX: admin_verify_rbq function
-- =====================================================
CREATE OR REPLACE FUNCTION admin_verify_rbq(
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
  v_professional profiles%ROWTYPE;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get current professional data
  SELECT * INTO v_professional 
  FROM profiles 
  WHERE id = p_professional_id 
  AND user_type = 'professional';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Professional not found';
  END IF;

  -- Store old values for audit
  v_old_values := jsonb_build_object(
    'is_rbq_verified', v_professional.is_rbq_verified,
    'rbq_verified_at', v_professional.rbq_verified_at
  );

  -- Update verification status
  UPDATE profiles SET
    is_rbq_verified = TRUE,
    rbq_verified_at = NOW(),
    rbq_verified_by = auth.uid(),
    rbq_verification_notes = p_notes,
    rbq_rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_professional_id;

  -- Log the action
  PERFORM log_admin_action(
    'VERIFY_RBQ',
    'profile',
    p_professional_id,
    v_old_values,
    jsonb_build_object(
      'is_rbq_verified', TRUE,
      'notes', p_notes
    )
  );

  -- Create notification for the professional (FIXED: use related_user_id instead of related_id)
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_user_id,
    action_url
  ) VALUES (
    p_professional_id,
    'rbq_verified',
    'Licence RBQ vérifiée ✓',
    'Félicitations ! Votre licence RBQ a été vérifiée. Vous pouvez maintenant recevoir des demandes de projets.',
    p_professional_id,
    '/pro/dashboard'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Professional verified successfully'
  );
END;
$$;

-- =====================================================
-- FIX: admin_reject_rbq function
-- =====================================================
CREATE OR REPLACE FUNCTION admin_reject_rbq(
  p_professional_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_values JSONB;
  v_professional profiles%ROWTYPE;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Validate reason is provided
  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Rejection reason must be at least 10 characters';
  END IF;

  -- Get current professional data
  SELECT * INTO v_professional 
  FROM profiles 
  WHERE id = p_professional_id 
  AND user_type = 'professional';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Professional not found';
  END IF;

  -- Store old values for audit
  v_old_values := jsonb_build_object(
    'is_rbq_verified', v_professional.is_rbq_verified,
    'rbq_rejection_reason', v_professional.rbq_rejection_reason
  );

  -- Update rejection status
  UPDATE profiles SET
    is_rbq_verified = FALSE,
    rbq_rejection_reason = p_reason,
    rbq_verified_at = NULL,
    rbq_verified_by = NULL,
    updated_at = NOW()
  WHERE id = p_professional_id;

  -- Log the action
  PERFORM log_admin_action(
    'REJECT_RBQ',
    'profile',
    p_professional_id,
    v_old_values,
    jsonb_build_object(
      'is_rbq_verified', FALSE,
      'rbq_rejection_reason', p_reason
    )
  );

  -- Create notification for the professional (FIXED: use related_user_id instead of related_id)
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_user_id,
    action_url
  ) VALUES (
    p_professional_id,
    'rbq_rejected',
    'Vérification RBQ refusée',
    'Votre demande de vérification RBQ a été refusée. Raison: ' || p_reason,
    p_professional_id,
    '/pro/profile'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Professional rejected successfully'
  );
END;
$$;

-- Ensure the notification types exist
DO $$
BEGIN
  -- Add rbq_verified type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rbq_verified' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'rbq_verified';
  END IF;
  
  -- Add rbq_rejected type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rbq_rejected' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'rbq_rejected';
  END IF;
EXCEPTION
  WHEN others THEN
    -- Types might already exist, that's OK
    NULL;
END $$;

-- =====================================================
-- FIX: admin_pending_verifications view
-- Exclude rejected professionals (those with rbq_rejection_reason)
-- =====================================================
DROP VIEW IF EXISTS admin_pending_verifications;

CREATE VIEW admin_pending_verifications AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.company_name,
  p.rbq_number,
  p.rbq_certification_url,
  p.services_offered,
  p.insurance_info,
  p.city,
  p.region,
  p.postal_code,
  p.created_at,
  p.updated_at,
  -- Add a flag to indicate if certification is missing
  CASE WHEN p.rbq_certification_url IS NULL THEN TRUE ELSE FALSE END as missing_certification
FROM profiles p
WHERE p.user_type = 'professional'
  AND p.is_rbq_verified = FALSE
  AND p.rbq_number IS NOT NULL
  -- IMPORTANT: Exclude rejected professionals
  AND (p.rbq_rejection_reason IS NULL OR p.rbq_rejection_reason = '')
ORDER BY p.created_at ASC;

-- Grant select on the view to authenticated users
GRANT SELECT ON admin_pending_verifications TO authenticated;

-- =====================================================
-- NEW: View for rejected professionals (for admin to manage)
-- =====================================================
DROP VIEW IF EXISTS admin_rejected_professionals;

CREATE VIEW admin_rejected_professionals AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.company_name,
  p.rbq_number,
  p.rbq_certification_url,
  p.city,
  p.region,
  p.rbq_rejection_reason,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.user_type = 'professional'
  AND p.is_rbq_verified = FALSE
  AND p.rbq_rejection_reason IS NOT NULL
  AND p.rbq_rejection_reason != ''
ORDER BY p.updated_at DESC;

GRANT SELECT ON admin_rejected_professionals TO authenticated;

-- =====================================================
-- NEW: Function to delete a rejected professional account
-- This allows the user to re-register with the same email
-- =====================================================
CREATE OR REPLACE FUNCTION admin_delete_rejected_account(
  p_professional_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professional profiles%ROWTYPE;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get professional data
  SELECT * INTO v_professional 
  FROM profiles 
  WHERE id = p_professional_id 
  AND user_type = 'professional';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Professional not found';
  END IF;

  -- Verify the account was rejected (safety check)
  IF v_professional.rbq_rejection_reason IS NULL OR v_professional.rbq_rejection_reason = '' THEN
    RAISE EXCEPTION 'Can only delete rejected accounts. This account was not rejected.';
  END IF;

  -- Log the action before deletion
  PERFORM log_admin_action(
    'DELETE_REJECTED_ACCOUNT',
    'profile',
    p_professional_id,
    jsonb_build_object(
      'email', v_professional.email,
      'company_name', v_professional.company_name,
      'rbq_number', v_professional.rbq_number,
      'rejection_reason', v_professional.rbq_rejection_reason
    ),
    NULL
  );

  -- Delete the profile (this will cascade to auth.users due to FK)
  DELETE FROM profiles WHERE id = p_professional_id;
  
  -- Also delete from auth.users to fully remove the account
  DELETE FROM auth.users WHERE id = p_professional_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Account deleted successfully. User can now re-register with the same email.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_rejected_account(UUID) TO authenticated;

-- =====================================================
-- NEW: Function to reset a rejected professional for re-submission
-- Alternative to deletion - keeps the account but clears rejection
-- =====================================================
CREATE OR REPLACE FUNCTION admin_allow_resubmission(
  p_professional_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professional profiles%ROWTYPE;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get professional data
  SELECT * INTO v_professional 
  FROM profiles 
  WHERE id = p_professional_id 
  AND user_type = 'professional';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Professional not found';
  END IF;

  -- Clear rejection and put back in pending
  UPDATE profiles SET
    rbq_rejection_reason = NULL,
    is_rbq_verified = FALSE,
    updated_at = NOW()
  WHERE id = p_professional_id;

  -- Log the action
  PERFORM log_admin_action(
    'ALLOW_RESUBMISSION',
    'profile',
    p_professional_id,
    jsonb_build_object('rbq_rejection_reason', v_professional.rbq_rejection_reason),
    jsonb_build_object('rbq_rejection_reason', NULL)
  );

  -- Notify the professional
  INSERT INTO notifications (user_id, type, title, message, related_user_id, action_url)
  VALUES (
    p_professional_id, 
    'system',
    'Nouvelle chance de vérification',
    'L''administrateur vous permet de resoumettre votre demande de vérification RBQ. Veuillez mettre à jour votre profil.',
    p_professional_id, 
    '/pro/profile'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Professional can now resubmit their RBQ verification'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_allow_resubmission(UUID) TO authenticated;

