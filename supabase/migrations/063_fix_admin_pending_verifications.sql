-- Migration: Fix admin_pending_verifications to include trade_professional
-- Date: 2026-03-19
-- Problem: View used "AND p.rbq_number IS NOT NULL" which excluded trade_professional
--          users (who have a CCQ card, not an RBQ number).
-- Solution: Switch to "AND p.profile_completed = TRUE" so all professionals who
--           have completed their profile appear for admin review.
--           Also expose professional_type and trade_specialty for the UI.

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
  p.professional_type,
  p.trade_specialty,
  p.created_at,
  p.updated_at,
  -- missing_certification: entrepreneur without RBQ cert, or trade_pro without CCQ card
  CASE
    WHEN p.professional_type = 'trade_professional' AND p.rbq_certification_url IS NULL THEN TRUE
    WHEN p.professional_type != 'trade_professional' AND p.rbq_certification_url IS NULL THEN TRUE
    ELSE FALSE
  END AS missing_certification
FROM profiles p
WHERE p.user_type = 'professional'
  AND p.is_rbq_verified = FALSE
  AND p.profile_completed = TRUE
  AND (p.rbq_rejection_reason IS NULL OR p.rbq_rejection_reason = '')
ORDER BY p.created_at ASC;

GRANT SELECT ON admin_pending_verifications TO authenticated;
