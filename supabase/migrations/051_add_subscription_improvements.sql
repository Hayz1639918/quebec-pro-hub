-- Migration 051: Subscription improvements and bank account placeholder
-- Date: 2025-02-XX
-- Description: Improves the subscription system and adds bank account
--   placeholder fields for future Stripe Connect integration (US-051).

-- ============================================================
-- PART 1: Enhanced subscriptions table
-- ============================================================

-- Add Stripe fields to subscriptions table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    -- Add Stripe subscription ID
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'stripe_subscription_id'
    ) THEN
      ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    -- Add current period dates
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'current_period_start'
    ) THEN
      ALTER TABLE subscriptions ADD COLUMN current_period_start TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'current_period_end'
    ) THEN
      ALTER TABLE subscriptions ADD COLUMN current_period_end TIMESTAMPTZ;
    END IF;

    -- Add trial end date
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'trial_end'
    ) THEN
      ALTER TABLE subscriptions ADD COLUMN trial_end TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

-- ============================================================
-- PART 2: Bank account profile fields (US-051 placeholder)
-- ============================================================
-- Full Stripe Connect integration is pending.
-- These fields will hold references once integrated.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS payout_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.stripe_customer_id IS
  'Stripe customer ID for payment processing (US-051, future integration)';
COMMENT ON COLUMN profiles.stripe_account_id IS
  'Stripe Connect account ID for payouts to professionals (US-051, future integration)';
COMMENT ON COLUMN profiles.payout_enabled IS
  'Whether the professional can receive automated payouts (US-051)';

-- ============================================================
-- PART 3: Function to sync subscription tier to profiles
-- ============================================================

CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile's subscription_tier when a subscription is created/updated
  UPDATE profiles
  SET subscription_tier = CASE
    WHEN NEW.plan_id ILIKE '%enterprise%' THEN 'enterprise'
    WHEN NEW.plan_id ILIKE '%pro%' THEN 'pro'
    WHEN NEW.plan_id ILIKE '%starter%' THEN 'starter'
    ELSE 'free'
  END
  WHERE id = NEW.professional_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only attach trigger if subscriptions table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    DROP TRIGGER IF EXISTS trigger_sync_subscription_tier ON subscriptions;
    CREATE TRIGGER trigger_sync_subscription_tier
      AFTER INSERT OR UPDATE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION sync_subscription_tier();
  END IF;
END $$;
