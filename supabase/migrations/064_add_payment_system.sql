-- Migration: Add payment system (Stripe scaffold)
-- Date: 2026-05-27
-- Prepares DB for Stripe Connect marketplace payments

-- ============================================
-- PART 1: PAYMENT STATUS ENUM
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'pending',
      'processing',
      'succeeded',
      'failed',
      'refunded',
      'cancelled'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM (
      'draft',
      'issued',
      'paid',
      'void',
      'overdue'
    );
  END IF;
END $$;

-- ============================================
-- PART 2: STRIPE FIELDS ON PROFILES
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON profiles(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ============================================
-- PART 3: PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES contract_milestones(id) ON DELETE SET NULL,
  payer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  platform_fee DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  status payment_status NOT NULL DEFAULT 'pending',

  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  stripe_charge_id TEXT,

  description TEXT,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  failure_reason TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_milestone ON payments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================
-- PART 4: INVOICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES contract_milestones(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  invoice_number TEXT NOT NULL,
  issuer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  amount_ht DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 14.975,
  tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (ROUND(amount_ht * tax_rate / 100, 2)) STORED,
  amount_ttc DECIMAL(12,2) GENERATED ALWAYS AS (ROUND(amount_ht * (1 + tax_rate / 100), 2)) STORED,
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',

  status invoice_status NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  due_date DATE,
  pdf_url TEXT,

  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_milestone ON invoices(milestone_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issuer ON invoices(issuer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_recipient ON invoices(recipient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- ============================================
-- PART 5: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = payer_id OR auth.uid() = payee_id);

CREATE POLICY "System can insert payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = issuer_id OR auth.uid() = recipient_id);

CREATE POLICY "Professionals can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = issuer_id);

CREATE POLICY "Issuers can update their invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = issuer_id)
  WITH CHECK (auth.uid() = issuer_id);

-- Admins can view all
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
  );

CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
  );

-- ============================================
-- PART 6: INVOICE NUMBER GENERATION
-- ============================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'BN-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM invoices
  WHERE invoice_number LIKE 'BN-' || year_prefix || '-%';

  RETURN 'BN-' || year_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 7: PAYMENT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION on_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();

  IF NEW.status = 'succeeded' AND OLD.status <> 'succeeded' THEN
    NEW.paid_at := NOW();

    IF NEW.milestone_id IS NOT NULL THEN
      UPDATE contract_milestones
      SET status = 'paid', updated_at = NOW()
      WHERE id = NEW.milestone_id;
    END IF;

    IF NEW.milestone_id IS NOT NULL THEN
      UPDATE invoices
      SET status = 'paid', paid_at = NOW(), updated_at = NOW()
      WHERE milestone_id = NEW.milestone_id AND status <> 'paid';
    END IF;
  END IF;

  IF NEW.status = 'failed' AND OLD.status <> 'failed' THEN
    NEW.failed_at := NOW();
  END IF;

  IF NEW.status = 'refunded' AND OLD.status <> 'refunded' THEN
    NEW.refunded_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_status_change
  BEFORE UPDATE ON payments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION on_payment_status_change();

COMMENT ON TABLE payments IS 'Tracks all payment transactions through Stripe';
COMMENT ON TABLE invoices IS 'Invoices generated for milestone payments';
COMMENT ON FUNCTION generate_invoice_number IS 'Generates sequential invoice numbers in BN-YYYY-NNNNN format';
