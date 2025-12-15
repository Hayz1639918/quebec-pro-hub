-- =====================================================
-- ADMIN SYSTEM MIGRATION
-- Follows security best practices:
-- - Principle of least privilege
-- - Row Level Security (RLS)
-- - Audit logging
-- - Input validation
-- =====================================================

-- =====================================================
-- 1. ADD ADMIN ROLE TO PROFILES
-- =====================================================

-- Add is_admin column to profiles (default false for security)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add RBQ verification fields for better tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rbq_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rbq_verified_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS rbq_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rbq_verification_notes TEXT;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_pending_verification 
  ON profiles(is_rbq_verified, user_type) 
  WHERE user_type = 'professional' AND is_rbq_verified = FALSE;

-- =====================================================
-- 2. ADMIN AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'profile', 'project', 'contract', etc.
  target_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" 
  ON admin_audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- System can insert audit logs (via functions)
CREATE POLICY "System can insert audit logs" 
  ON admin_audit_logs FOR INSERT 
  WITH CHECK (TRUE);

-- =====================================================
-- 3. ADMIN RLS POLICIES FOR PROFILES
-- =====================================================

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" 
  ON profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = TRUE
    )
  );

-- Admins can update RBQ verification status
CREATE POLICY "Admins can update verification status" 
  ON profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = TRUE
    )
  );

-- =====================================================
-- 4. ADMIN HELPER FUNCTIONS
-- =====================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  );
END;
$$;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    target_type,
    target_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    p_old_values,
    p_new_values
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =====================================================
-- 5. RBQ VERIFICATION FUNCTIONS
-- =====================================================

-- Function to verify a professional's RBQ license
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
    'rbq_verified_at', v_professional.rbq_verified_at,
    'rbq_verified_by', v_professional.rbq_verified_by
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
      'rbq_verified_at', NOW(),
      'rbq_verified_by', auth.uid(),
      'notes', p_notes
    )
  );

  -- Create notification for the professional
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id
  ) VALUES (
    p_professional_id,
    'rbq_verified',
    'Licence RBQ vérifiée ✓',
    'Félicitations ! Votre licence RBQ a été vérifiée. Vous pouvez maintenant recevoir des demandes de projets.',
    p_professional_id
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'RBQ license verified successfully',
    'professional_id', p_professional_id
  );
END;
$$;

-- Function to reject a professional's RBQ license
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

  -- Create notification for the professional
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id
  ) VALUES (
    p_professional_id,
    'rbq_rejected',
    'Vérification RBQ refusée',
    'Votre demande de vérification RBQ a été refusée. Raison: ' || p_reason,
    p_professional_id
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'RBQ license rejected',
    'professional_id', p_professional_id,
    'reason', p_reason
  );
END;
$$;

-- =====================================================
-- 6. ADMIN DASHBOARD VIEWS
-- =====================================================

-- View for pending RBQ verifications
CREATE OR REPLACE VIEW admin_pending_verifications AS
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
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.user_type = 'professional'
  AND p.is_rbq_verified = FALSE
  AND p.rbq_number IS NOT NULL
  AND p.rbq_certification_url IS NOT NULL
ORDER BY p.created_at ASC;

-- View for verified professionals
CREATE OR REPLACE VIEW admin_verified_professionals AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.company_name,
  p.rbq_number,
  p.city,
  p.region,
  p.is_rbq_verified,
  p.rbq_verified_at,
  verifier.full_name as verified_by_name,
  p.created_at
FROM profiles p
LEFT JOIN profiles verifier ON p.rbq_verified_by = verifier.id
WHERE p.user_type = 'professional'
  AND p.is_rbq_verified = TRUE
ORDER BY p.rbq_verified_at DESC;

-- View for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE user_type = 'client') as total_clients,
  (SELECT COUNT(*) FROM profiles WHERE user_type = 'professional') as total_professionals,
  (SELECT COUNT(*) FROM profiles WHERE user_type = 'professional' AND is_rbq_verified = TRUE) as verified_professionals,
  (SELECT COUNT(*) FROM profiles WHERE user_type = 'professional' AND is_rbq_verified = FALSE AND rbq_number IS NOT NULL) as pending_verifications,
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM projects WHERE status = 'open') as open_projects,
  (SELECT COUNT(*) FROM contracts) as total_contracts,
  (SELECT COUNT(*) FROM contracts WHERE status = 'active') as active_contracts;

-- =====================================================
-- 7. ADD NOTIFICATION TYPE FOR RBQ
-- =====================================================

-- Add new notification types if not exists
DO $$
BEGIN
  -- Check if the type already exists, if not alter the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'rbq_verified' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'rbq_verified';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'rbq_rejected' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'rbq_rejected';
  END IF;
EXCEPTION
  WHEN others THEN
    -- Enum values might already exist
    NULL;
END $$;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant execute on admin functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_verify_rbq(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_rbq(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, TEXT, UUID, JSONB, JSONB) TO authenticated;

-- =====================================================
-- IMPORTANT: Run this separately to set your admin user
-- Replace YOUR_USER_ID with your actual user ID
-- =====================================================
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'YOUR_USER_ID';

