-- =====================================================
-- FIX: Admin pending verifications view
-- Show all professionals with RBQ number, even without certification
-- =====================================================

-- Drop and recreate the view to include professionals without certification URL
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
  p.postal_code,
  p.created_at,
  p.updated_at,
  -- Add a flag to indicate if certification is missing
  CASE WHEN p.rbq_certification_url IS NULL THEN TRUE ELSE FALSE END as missing_certification
FROM profiles p
WHERE p.user_type = 'professional'
  AND p.is_rbq_verified = FALSE
  AND p.rbq_number IS NOT NULL
ORDER BY p.created_at ASC;

-- Grant select on the view to authenticated users (admins will be filtered by RLS)
GRANT SELECT ON admin_pending_verifications TO authenticated;

