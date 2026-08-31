-- Keep incomplete professional onboarding records out of the public directory.
-- A profile row is created at signup by handle_new_user_signup(); completing
-- the entrepreneur/trade profile updates that same row and sets
-- profile_completed = true. Only completed profiles should be discoverable.

CREATE OR REPLACE VIEW public.public_professional_profiles
WITH (security_barrier = true)
AS
SELECT
  id,
  full_name,
  email,
  NULLIF(phone, phone) AS phone,
  user_type,
  company_name,
  company_type,
  rbq_number,
  services_offered,
  is_rbq_verified,
  city,
  region,
  bio,
  years_experience,
  average_rating,
  total_reviews,
  total_projects,
  NULLIF(total_projects_external, total_projects_external) AS total_projects_external,
  NULLIF(business_volume_cad, business_volume_cad) AS business_volume_cad,
  profile_picture_url,
  website_url,
  linkedin_url,
  created_at,
  ROUND(latitude, 2)::numeric(10,8) AS latitude,
  ROUND(longitude, 2)::numeric(11,8) AS longitude,
  NULLIF(last_active_at, last_active_at) AS last_active_at,
  NULLIF(total_proposals_sent, total_proposals_sent) AS total_proposals_sent,
  NULLIF(proposals_last_30_days, proposals_last_30_days) AS proposals_last_30_days,
  NULLIF(profile_views_count, profile_views_count) AS profile_views_count,
  NULLIF(profile_views, profile_views) AS profile_views,
  NULLIF(activity_score, activity_score) AS activity_score,
  hourly_rate_min,
  hourly_rate_max,
  daily_rate_min,
  daily_rate_max,
  availability_status,
  available_from,
  response_time_hours,
  accepts_small_projects,
  minimum_project_budget,
  travel_distance_km,
  NULLIF(favorites_count, favorites_count) AS favorites_count,
  service_radius_km,
  rbq_subcat,
  trade_specialty,
  certifications,
  languages,
  service_zones,
  professional_type,
  NULLIF(subscription_tier, subscription_tier) AS subscription_tier,
  (NULLIF(BTRIM(insurance_info), '') IS NOT NULL) AS has_insurance_document,
  (NULLIF(BTRIM(rbq_certification_url), '') IS NOT NULL) AS has_rbq_document
FROM public.profiles p
WHERE user_type = 'professional'::public.user_type
  AND COALESCE(is_admin, false) = false
  AND COALESCE(profile_completed, false) = true;
