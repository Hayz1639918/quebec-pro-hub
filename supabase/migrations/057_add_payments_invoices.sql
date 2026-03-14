-- Migration 057: Add contractor_payments and invoices tables
-- Required by ProPayments.tsx (US-059, US-060, US-064) and ProInvoices.tsx (US-063)

CREATE TABLE IF NOT EXISTS contractor_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  milestone TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  net_amount DECIMAL(10,2) NOT NULL CHECK (net_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_escrow', 'released', 'disputed', 'cancelled')),
  payment_method TEXT DEFAULT 'transfer'
    CHECK (payment_method IN ('transfer', 'card', 'crypto')),
  dispute_reason TEXT,
  dispute_details TEXT,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES contractor_payments(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_address TEXT,
  project_title TEXT NOT NULL,
  milestone TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  tax DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_method TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contractor_payments_contractor_id ON contractor_payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_status ON contractor_payments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_contractor_id ON invoices(contractor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- RLS on contractor_payments
ALTER TABLE contractor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view their own payments"
  ON contractor_payments
  FOR SELECT
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can update their own payments (dispute)"
  ON contractor_payments
  FOR UPDATE
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- RLS on invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view their own invoices"
  ON invoices
  FOR SELECT
  USING (contractor_id = auth.uid());

-- updated_at trigger for contractor_payments
CREATE OR REPLACE FUNCTION update_contractor_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contractor_payments_updated_at
  BEFORE UPDATE ON contractor_payments
  FOR EACH ROW EXECUTE FUNCTION update_contractor_payments_updated_at();
