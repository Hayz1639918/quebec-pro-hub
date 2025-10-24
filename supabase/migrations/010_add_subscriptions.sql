-- Migration: Add subscriptions for professionals
-- Date: 2025-10-22

-- Plan enum
CREATE TYPE subscription_plan AS ENUM ('free', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled');

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Professionals can view their subscription
CREATE POLICY "Pros can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Professionals can create/upgrade their own subscription
CREATE POLICY "Pros can manage own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pros can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to validate that only professionals can have subscriptions
CREATE OR REPLACE FUNCTION validate_professional_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is a professional
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.user_id AND user_type = 'professional'
  ) THEN
    RAISE EXCEPTION 'Only professionals can have subscriptions';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_professional_subscription_trigger ON subscriptions;
CREATE TRIGGER validate_professional_subscription_trigger
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_professional_subscription();

