-- Migration 049: Add notification preferences to profiles
-- Date: 2025-02-XX
-- Description: Adds notification_preferences JSONB column to profiles table (US-042).
--   Required by Notifications.tsx which stores per-user notification settings.
--
-- Notification preferences schema:
-- {
--   "email_messages": true,
--   "email_proposals": true,
--   "email_contracts": true,
--   "email_payments": true,
--   "email_reviews": true,
--   "push_messages": true,
--   "push_proposals": true,
--   "push_contracts": true,
--   "push_milestones": true,
--   "push_system": true,
--   "push_new_projects": true,
--   "push_payment_released": true,
--   "push_subscription_reminder": true
-- }

-- ============================================================
-- PART 1: Add notification_preferences column
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "email_messages": true,
    "email_proposals": true,
    "email_contracts": true,
    "email_payments": true,
    "email_reviews": true,
    "push_messages": true,
    "push_proposals": true,
    "push_contracts": true,
    "push_milestones": true,
    "push_system": true,
    "push_new_projects": true,
    "push_payment_released": true,
    "push_subscription_reminder": true
  }'::jsonb;

COMMENT ON COLUMN profiles.notification_preferences IS
  'User notification preferences (US-042): JSON object controlling email and push notifications';

-- ============================================================
-- PART 2: Add company_type column (US-047)
-- ============================================================
-- company_type is set during signup via auth metadata (Auth.tsx, US-047)
-- and should be persisted to the profiles table.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_type TEXT
    CHECK (company_type IN ('sole_proprietor', 'corporation', 'partnership', 'other'));

COMMENT ON COLUMN profiles.company_type IS
  'Company legal type for professionals (US-047): sole_proprietor, corporation, partnership, other';

-- ============================================================
-- PART 3: Add rbq_subcat and trade_specialty columns
-- ============================================================
-- These fields are collected during signup for professionals

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rbq_subcat TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trade_specialty TEXT;

COMMENT ON COLUMN profiles.rbq_subcat IS
  'RBQ subcategory for entrepreneur professionals';
COMMENT ON COLUMN profiles.trade_specialty IS
  'Trade specialty for trade_professional type (electrician, plumber, etc.)';

-- ============================================================
-- PART 4: Update signup trigger to persist new fields
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
BEGIN
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'client');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur');

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    professional_type,
    company_type,
    rbq_subcat,
    trade_specialty,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type::user_type,
    CASE
      WHEN NEW.raw_user_meta_data->>'professional_type' IN ('entrepreneur', 'trade_professional')
      THEN (NEW.raw_user_meta_data->>'professional_type')
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'company_type',
    NEW.raw_user_meta_data->>'rbq_subcat',
    NEW.raw_user_meta_data->>'trade_specialty',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_type   = EXCLUDED.company_type,
    rbq_subcat     = EXCLUDED.rbq_subcat,
    trade_specialty = EXCLUDED.trade_specialty;

  RETURN NEW;
END;
$$;

-- ============================================================
-- PART 5: Index for notification preferences queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_notification_prefs
  ON profiles USING GIN(notification_preferences)
  WHERE notification_preferences IS NOT NULL;
