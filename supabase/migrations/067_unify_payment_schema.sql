-- Migration 067: Unify payment schema
-- Date: 2026-05-27
-- Decision: keep contractor_payments + invoices (from migration 057) as the canonical schema,
-- extend with FK references, Stripe fields, multi-currency, and bilateral RLS.
-- Drop the duplicate `payments` table created by migration 064 (it was empty).

-- ============================================
-- PART 1: DROP the parallel `payments` table from migration 064
-- ============================================
-- This table was created as a parallel Stripe-oriented schema. We consolidate on
-- contractor_payments instead. Triggers and policies on it are removed cascading.

DROP TRIGGER IF EXISTS trigger_payment_status_change ON payments;
DROP FUNCTION IF EXISTS on_payment_status_change();
DROP TABLE IF EXISTS payments CASCADE;

-- ============================================
-- PART 2: EXTEND contractor_payments with FK + Stripe + bilateral fields
-- ============================================

ALTER TABLE contractor_payments
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES contract_milestones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Allow the canonical Stripe status names in addition to legacy ones
ALTER TABLE contractor_payments DROP CONSTRAINT IF EXISTS contractor_payments_status_check;
ALTER TABLE contractor_payments
  ADD CONSTRAINT contractor_payments_status_check
  CHECK (status IN ('pending', 'in_escrow', 'processing', 'succeeded', 'released', 'failed', 'refunded', 'disputed', 'cancelled'));

-- Indexes for new FK columns
CREATE INDEX IF NOT EXISTS idx_contractor_payments_contract ON contractor_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_milestone ON contractor_payments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_client ON contractor_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_stripe_pi ON contractor_payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================
-- PART 3: EXTEND invoices with FK + bilateral fields
-- ============================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES contract_milestones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_milestone ON invoices(milestone_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);

-- ============================================
-- PART 4: BILATERAL RLS - client can view their own contracts' payments and invoices
-- ============================================

-- contractor_payments: add client visibility
DROP POLICY IF EXISTS "Clients can view payments on their contracts" ON contractor_payments;
CREATE POLICY "Clients can view payments on their contracts"
  ON contractor_payments
  FOR SELECT
  USING (client_id = auth.uid());

-- contractor_payments: admin visibility
DROP POLICY IF EXISTS "Admins can view all payments" ON contractor_payments;
CREATE POLICY "Admins can view all payments"
  ON contractor_payments
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- invoices: add client visibility
DROP POLICY IF EXISTS "Clients can view invoices on their contracts" ON invoices;
CREATE POLICY "Clients can view invoices on their contracts"
  ON invoices
  FOR SELECT
  USING (client_id = auth.uid());

-- invoices: admin visibility
DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
CREATE POLICY "Admins can view all invoices"
  ON invoices
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

-- ============================================
-- PART 5: INVOICE NUMBER GENERATOR (idempotent, format BN-YYYY-NNNNN)
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
-- PART 6: COMMENTS
-- ============================================

COMMENT ON TABLE contractor_payments IS 'Canonical payments table. Extended with FK and Stripe fields in 067.';
COMMENT ON TABLE invoices IS 'Canonical invoices table. Extended with FK and bilateral fields in 067.';
COMMENT ON FUNCTION generate_invoice_number IS 'Generates sequential invoice numbers in BN-YYYY-NNNNN format';
