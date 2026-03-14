-- Migration 048: Fix RLS policies for contractor profile tables
-- Date: 2025-02-XX
-- Description: Ensures correct Row Level Security policies for tables created in 047.
--   Drops and re-creates policies that may conflict due to the duplicate 046 numbering issue.
--   All operations are idempotent.

-- ============================================================
-- contractor_trades RLS
-- ============================================================

ALTER TABLE IF EXISTS contractor_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own trades" ON contractor_trades;
CREATE POLICY "Professionals manage own trades"
  ON contractor_trades
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read trades" ON contractor_trades;
CREATE POLICY "Public can read trades"
  ON contractor_trades
  FOR SELECT
  USING (true);

-- ============================================================
-- rbq_licenses RLS
-- ============================================================

ALTER TABLE IF EXISTS rbq_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own rbq licenses" ON rbq_licenses;
CREATE POLICY "Professionals manage own rbq licenses"
  ON rbq_licenses
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read rbq licenses" ON rbq_licenses;
CREATE POLICY "Public can read rbq licenses"
  ON rbq_licenses
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage all rbq licenses" ON rbq_licenses;
CREATE POLICY "Admins manage all rbq licenses"
  ON rbq_licenses
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- insurance_certificates RLS
-- ============================================================

ALTER TABLE IF EXISTS insurance_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own insurance" ON insurance_certificates;
CREATE POLICY "Professionals manage own insurance"
  ON insurance_certificates
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read insurance certificates" ON insurance_certificates;
CREATE POLICY "Public can read insurance certificates"
  ON insurance_certificates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage all insurance" ON insurance_certificates;
CREATE POLICY "Admins manage all insurance"
  ON insurance_certificates
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- professional_certifications RLS
-- ============================================================

ALTER TABLE IF EXISTS professional_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own certifications" ON professional_certifications;
CREATE POLICY "Professionals manage own certifications"
  ON professional_certifications
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read certifications" ON professional_certifications;
CREATE POLICY "Public can read certifications"
  ON professional_certifications
  FOR SELECT
  USING (true);

-- ============================================================
-- rate_grids RLS
-- ============================================================

ALTER TABLE IF EXISTS rate_grids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own rate grids" ON rate_grids;
CREATE POLICY "Professionals manage own rate grids"
  ON rate_grids
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read rate grids" ON rate_grids;
CREATE POLICY "Public can read rate grids"
  ON rate_grids
  FOR SELECT
  USING (true);

-- ============================================================
-- Additional indexes for contractor tables
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_contractor_trades_trade_code
  ON contractor_trades(trade_code);

CREATE INDEX IF NOT EXISTS idx_rbq_licenses_expires
  ON rbq_licenses(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_certificates_status
  ON insurance_certificates(status, expires_at);
