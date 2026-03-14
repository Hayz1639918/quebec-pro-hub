-- Migration 060: Add professional_type to differentiate entrepreneurs from trade professionals
-- Entrepreneurs (Epic 10-18): general contractors, company owners who bid on projects
-- Trade professionals (Epic 30): specialized tradespeople (electrician, plumber, mason, etc.)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS professional_type TEXT
    CHECK (professional_type IN ('entrepreneur', 'trade_professional'))
    DEFAULT NULL;

COMMENT ON COLUMN profiles.professional_type IS
  'Sub-type for professional accounts: entrepreneur (general contractor) or trade_professional (electrician, plumber, etc.)';

-- Backfill: existing professionals without a type default to entrepreneur
-- (matches current behavior where "professional" = contractor)
UPDATE profiles
SET professional_type = 'entrepreneur'
WHERE user_type = 'professional'
  AND professional_type IS NULL;
