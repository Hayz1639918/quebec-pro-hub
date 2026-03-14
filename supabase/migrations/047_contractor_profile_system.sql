-- ============================================================
-- Epic 30 & 32: Contractor Profile System
-- US-106: Contractor trades (CCQ/RBQ normalized list)
-- US-107: RBQ licenses per work category
-- US-108: Insurance certificates
-- US-109: Professional certifications (CCQ/ASP)
-- US-111: Rate grids by trade
-- US-115: Portfolio items enhanced (before/after, cost, duration)
-- ============================================================

-- -------------------------------------------------------
-- 1. contractor_trades (US-106)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS contractor_trades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trade_code    TEXT NOT NULL,
  trade_name    TEXT NOT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, trade_code)
);

CREATE INDEX idx_contractor_trades_professional ON contractor_trades(professional_id);

ALTER TABLE contractor_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals manage own trades"
  ON contractor_trades
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Public can read trades"
  ON contractor_trades
  FOR SELECT
  USING (true);

-- -------------------------------------------------------
-- 2. rbq_licenses (US-107)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS rbq_licenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  license_number  TEXT NOT NULL,
  category        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending_verification'
                  CHECK (status IN ('pending_verification', 'valid', 'expired', 'revoked')),
  certificate_url TEXT,
  issued_at       DATE,
  expires_at      DATE,
  last_verified_at TIMESTAMPTZ,
  verified_by     UUID REFERENCES profiles(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rbq_licenses_professional ON rbq_licenses(professional_id);
CREATE INDEX idx_rbq_licenses_status ON rbq_licenses(status);

ALTER TABLE rbq_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals manage own rbq licenses"
  ON rbq_licenses
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Public can read rbq licenses"
  ON rbq_licenses
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage all rbq licenses"
  ON rbq_licenses
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- -------------------------------------------------------
-- 3. insurance_certificates (US-108)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insurance_type  TEXT NOT NULL DEFAULT 'liability'
                  CHECK (insurance_type IN ('liability', 'professional', 'other')),
  certificate_url TEXT,
  expires_at      DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'expiring_soon', 'expired')),
  renewal_alert_sent BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_insurance_certificates_professional ON insurance_certificates(professional_id);
CREATE INDEX idx_insurance_certificates_expires ON insurance_certificates(expires_at);

ALTER TABLE insurance_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals manage own insurance"
  ON insurance_certificates
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Public can read insurance certificates"
  ON insurance_certificates
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage all insurance"
  ON insurance_certificates
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- -------------------------------------------------------
-- 4. professional_certifications (US-109)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS professional_certifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cert_type       TEXT NOT NULL DEFAULT 'ccq'
                  CHECK (cert_type IN ('ccq', 'asp', 'other')),
  cert_name       TEXT NOT NULL,
  cert_number     TEXT,
  issued_at       DATE,
  expires_at      DATE,
  certificate_url TEXT,
  issuer          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_professional_certifications_professional ON professional_certifications(professional_id);

ALTER TABLE professional_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals manage own certifications"
  ON professional_certifications
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Public can read certifications"
  ON professional_certifications
  FOR SELECT
  USING (true);

-- -------------------------------------------------------
-- 5. rate_grids (US-111)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_grids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trade_code      TEXT NOT NULL,
  rate_type       TEXT NOT NULL
                  CHECK (rate_type IN ('hourly', 'flat', 'per_sqft')),
  min_rate        NUMERIC(10, 2) NOT NULL CHECK (min_rate >= 0),
  max_rate        NUMERIC(10, 2) CHECK (max_rate IS NULL OR max_rate >= min_rate),
  currency        TEXT NOT NULL DEFAULT 'CAD',
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, trade_code, rate_type)
);

CREATE INDEX idx_rate_grids_professional ON rate_grids(professional_id);

ALTER TABLE rate_grids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals manage own rate grids"
  ON rate_grids
  FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Public can read rate grids"
  ON rate_grids
  FOR SELECT
  USING (true);

-- -------------------------------------------------------
-- 6. Extend portfolio_items (US-115)
-- -------------------------------------------------------
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS after_image_url   TEXT,
  ADD COLUMN IF NOT EXISTS project_cost      NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS duration_days     INTEGER,
  ADD COLUMN IF NOT EXISTS work_category     TEXT,
  ADD COLUMN IF NOT EXISTS location          TEXT,
  ADD COLUMN IF NOT EXISTS is_featured       BOOLEAN NOT NULL DEFAULT false;

-- -------------------------------------------------------
-- 6b. Extend profiles for US-110 (experience & business volume)
-- -------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_projects_external INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS business_volume_cad     NUMERIC(15, 2);

-- -------------------------------------------------------
-- 7. Triggers: auto-update updated_at
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rbq_licenses_updated_at
  BEFORE UPDATE ON rbq_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_insurance_certificates_updated_at
  BEFORE UPDATE ON insurance_certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_professional_certifications_updated_at
  BEFORE UPDATE ON professional_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rate_grids_updated_at
  BEFORE UPDATE ON rate_grids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- 8. Function: auto-update insurance status based on expiry
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_insurance_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at < CURRENT_DATE THEN
    NEW.status := 'expired';
  ELSIF NEW.expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.status := 'expiring_soon';
  ELSE
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insurance_status_update
  BEFORE INSERT OR UPDATE ON insurance_certificates
  FOR EACH ROW EXECUTE FUNCTION update_insurance_status();

-- -------------------------------------------------------
-- 9. Storage bucket for insurance certificates
-- -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('insurance-certificates', 'insurance-certificates', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Professionals upload own insurance certificates"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'insurance-certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Professionals read own insurance certificates"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'insurance-certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read all insurance certificates"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'insurance-certificates'
    AND auth.jwt() ->> 'role' = 'admin'
  );
