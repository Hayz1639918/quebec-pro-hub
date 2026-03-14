-- ============================================================
-- BâtirNet — Script d'application des migrations manquantes
-- Généré le 2026-03-14
--
-- INSTRUCTIONS:
--   1. Colle ce fichier entier dans Supabase → SQL Editor → New query
--   2. Clique sur RUN
--   3. Vérifie les messages NOTICE à la fin
--
-- Ce script est 100% IDEMPOTENT : il peut être relancé plusieurs fois
-- sans erreur. Les objets déjà créés seront ignorés.
-- ============================================================

-- ============================================================
-- DIAGNOSTIC : Migrations déjà connues dans supabase_migrations
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata
    WHERE schema_name = 'supabase_migrations'
  ) THEN
    RAISE NOTICE '📋 Table supabase_migrations.schema_migrations existe — voir les versions déjà appliquées ci-dessous.';
  ELSE
    RAISE NOTICE '📋 Schema supabase_migrations absent — aucun tracking CLI détecté. Application directe.';
  END IF;
END $$;

-- ============================================================
-- MIGRATION 029 — Amélioration recherche professionnels
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 029 — search improvements...'; END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE profiles ADD COLUMN search_vector TSVECTOR;
  END IF;
END $$;

UPDATE profiles
SET search_vector = to_tsvector('french',
  COALESCE(full_name, '') || ' ' ||
  COALESCE(company_name, '') || ' ' ||
  COALESCE(services_offered, '') || ' ' ||
  COALESCE(bio, '') || ' ' ||
  COALESCE(city, '') || ' ' ||
  COALESCE(region, '')
)
WHERE user_type = 'professional' AND search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_search_vector
  ON profiles USING GIN(search_vector)
  WHERE user_type = 'professional';

CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_type = 'professional' THEN
    NEW.search_vector := to_tsvector('french',
      COALESCE(NEW.full_name, '') || ' ' ||
      COALESCE(NEW.company_name, '') || ' ' ||
      COALESCE(NEW.services_offered, '') || ' ' ||
      COALESCE(NEW.bio, '') || ' ' ||
      COALESCE(NEW.city, '') || ' ' ||
      COALESCE(NEW.region, '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_search_vector ON profiles;
CREATE TRIGGER trigger_update_profile_search_vector
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_search_vector();

CREATE INDEX IF NOT EXISTS idx_profiles_professional_region
  ON profiles(user_type, region, is_rbq_verified)
  WHERE user_type = 'professional';

CREATE INDEX IF NOT EXISTS idx_profiles_professional_city
  ON profiles(user_type, city)
  WHERE user_type = 'professional';

CREATE INDEX IF NOT EXISTS idx_profiles_professional_rating
  ON profiles(user_type, average_rating DESC, total_reviews DESC)
  WHERE user_type = 'professional';

CREATE OR REPLACE FUNCTION get_profile_completeness(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  prof RECORD;
BEGIN
  SELECT * INTO prof FROM profiles WHERE id = profile_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  IF prof.full_name IS NOT NULL THEN score := score + 10; END IF;
  IF prof.phone IS NOT NULL THEN score := score + 5; END IF;
  IF prof.city IS NOT NULL THEN score := score + 5; END IF;
  IF prof.region IS NOT NULL THEN score := score + 5; END IF;
  IF prof.bio IS NOT NULL AND length(prof.bio) > 50 THEN score := score + 10; END IF;
  IF prof.profile_picture_url IS NOT NULL THEN score := score + 5; END IF;
  IF prof.user_type = 'professional' THEN
    IF prof.company_name IS NOT NULL THEN score := score + 10; END IF;
    IF prof.services_offered IS NOT NULL THEN score := score + 10; END IF;
    IF prof.years_experience IS NOT NULL THEN score := score + 5; END IF;
    IF prof.website_url IS NOT NULL THEN score := score + 5; END IF;
    IF prof.insurance_info IS NOT NULL THEN score := score + 10; END IF;
    IF prof.rbq_number IS NOT NULL THEN score := score + 10; END IF;
    IF prof.is_rbq_verified THEN score := score + 10; END IF;
  END IF;
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_profile_completeness(UUID) TO authenticated;

DO $$ BEGIN RAISE NOTICE '✅ Migration 029 — OK'; END $$;

-- ============================================================
-- MIGRATION 030 — Types de messages + demandes de devis (US-030)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 030 — message types...'; END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages
      ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text'
        CHECK (message_type IN ('text', 'quote_request', 'system', 'attachment'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'quote_amount'
  ) THEN
    ALTER TABLE messages ADD COLUMN quote_amount NUMERIC(12, 2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'attachment_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN attachment_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'attachment_name'
  ) THEN
    ALTER TABLE messages ADD COLUMN attachment_name TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_type
  ON messages(conversation_id, message_type, created_at DESC);

DO $$
BEGIN
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quote_request';
  EXCEPTION WHEN undefined_object THEN NULL; WHEN duplicate_object THEN NULL;
  END;
END $$;

CREATE OR REPLACE FUNCTION send_quote_request(
  p_conversation_id UUID,
  p_amount         NUMERIC(12, 2),
  p_description    TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_receiver_id UUID;
  v_sender_name TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_conversation_id
      AND (client_id = auth.uid() OR professional_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not a participant of this conversation';
  END IF;

  SELECT CASE
    WHEN client_id = auth.uid() THEN professional_id
    ELSE client_id
  END INTO v_receiver_id
  FROM conversations WHERE id = p_conversation_id;

  SELECT full_name INTO v_sender_name FROM profiles WHERE id = auth.uid();

  INSERT INTO messages (
    conversation_id, sender_id, receiver_id,
    content, message_type, quote_amount
  ) VALUES (
    p_conversation_id, auth.uid(), v_receiver_id,
    COALESCE(p_description, 'Demande de devis: ' || p_amount || ' $CAD'),
    'quote_request', p_amount
  ) RETURNING id INTO v_message_id;

  INSERT INTO notifications (
    user_id, type, title, message, related_user_id, action_url, metadata
  ) VALUES (
    v_receiver_id, 'quote_request',
    'Nouvelle demande de devis 💰',
    v_sender_name || ' vous a envoyé une demande de devis pour ' || p_amount || ' $CAD',
    auth.uid(), '/messages',
    jsonb_build_object('conversation_id', p_conversation_id, 'amount', p_amount, 'message_id', v_message_id)
  );

  UPDATE conversations SET updated_at = NOW() WHERE id = p_conversation_id;
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_quote_request(UUID, NUMERIC, TEXT) TO authenticated;

DO $$ BEGIN RAISE NOTICE '✅ Migration 030 — OK'; END $$;

-- ============================================================
-- MIGRATION 046 — Meetings + bucket chat-attachments
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 046 — meetings & chat-attachments...'; END $$;

CREATE TABLE IF NOT EXISTS meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Réunion de projet',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  notes TEXT,
  meeting_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own meetings" ON meetings;
CREATE POLICY "Users can view their own meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = organizer_id OR auth.uid() = participant_id);

DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
CREATE POLICY "Users can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizer can update meetings" ON meetings;
CREATE POLICY "Organizer can update meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizer can delete meetings" ON meetings;
CREATE POLICY "Organizer can delete meetings"
  ON meetings FOR DELETE
  USING (auth.uid() = organizer_id);

-- Realtime pour meetings (ignore si déjà ajouté)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 'chat-attachments', true, 10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;
CREATE POLICY "Anyone can view chat attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;
CREATE POLICY "Users can delete their own chat attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

DO $$ BEGIN RAISE NOTICE '✅ Migration 046 — OK'; END $$;

-- ============================================================
-- MIGRATION 047 — Système profil entrepreneur/métier (Epic 30)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 047 — contractor profile system...'; END $$;

CREATE TABLE IF NOT EXISTS contractor_trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trade_code      TEXT NOT NULL,
  trade_name      TEXT NOT NULL,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, trade_code)
);
CREATE INDEX IF NOT EXISTS idx_contractor_trades_professional ON contractor_trades(professional_id);
ALTER TABLE contractor_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own trades" ON contractor_trades;
CREATE POLICY "Professionals manage own trades"
  ON contractor_trades FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read trades" ON contractor_trades;
CREATE POLICY "Public can read trades"
  ON contractor_trades FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS rbq_licenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  license_number   TEXT NOT NULL,
  category         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending_verification'
                   CHECK (status IN ('pending_verification','valid','expired','revoked')),
  certificate_url  TEXT,
  issued_at        DATE,
  expires_at       DATE,
  last_verified_at TIMESTAMPTZ,
  verified_by      UUID REFERENCES profiles(id),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rbq_licenses_professional ON rbq_licenses(professional_id);
CREATE INDEX IF NOT EXISTS idx_rbq_licenses_status ON rbq_licenses(status);
ALTER TABLE rbq_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own rbq licenses" ON rbq_licenses;
CREATE POLICY "Professionals manage own rbq licenses"
  ON rbq_licenses FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read rbq licenses" ON rbq_licenses;
CREATE POLICY "Public can read rbq licenses"
  ON rbq_licenses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage all rbq licenses" ON rbq_licenses;
CREATE POLICY "Admins manage all rbq licenses"
  ON rbq_licenses FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE TABLE IF NOT EXISTS insurance_certificates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insurance_type   TEXT NOT NULL DEFAULT 'liability'
                   CHECK (insurance_type IN ('liability','professional','other')),
  certificate_url  TEXT,
  expires_at       DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','expiring_soon','expired')),
  renewal_alert_sent BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_professional ON insurance_certificates(professional_id);
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_expires ON insurance_certificates(expires_at);
ALTER TABLE insurance_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own insurance" ON insurance_certificates;
CREATE POLICY "Professionals manage own insurance"
  ON insurance_certificates FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read insurance certificates" ON insurance_certificates;
CREATE POLICY "Public can read insurance certificates"
  ON insurance_certificates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage all insurance" ON insurance_certificates;
CREATE POLICY "Admins manage all insurance"
  ON insurance_certificates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE TABLE IF NOT EXISTS professional_certifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cert_type       TEXT NOT NULL DEFAULT 'ccq'
                  CHECK (cert_type IN ('ccq','asp','other')),
  cert_name       TEXT NOT NULL,
  cert_number     TEXT,
  issued_at       DATE,
  expires_at      DATE,
  certificate_url TEXT,
  issuer          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_professional_certifications_professional ON professional_certifications(professional_id);
ALTER TABLE professional_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own certifications" ON professional_certifications;
CREATE POLICY "Professionals manage own certifications"
  ON professional_certifications FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read certifications" ON professional_certifications;
CREATE POLICY "Public can read certifications"
  ON professional_certifications FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS rate_grids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trade_code      TEXT NOT NULL,
  rate_type       TEXT NOT NULL CHECK (rate_type IN ('hourly','flat','per_sqft')),
  min_rate        NUMERIC(10,2) NOT NULL CHECK (min_rate >= 0),
  max_rate        NUMERIC(10,2) CHECK (max_rate IS NULL OR max_rate >= min_rate),
  currency        TEXT NOT NULL DEFAULT 'CAD',
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, trade_code, rate_type)
);
CREATE INDEX IF NOT EXISTS idx_rate_grids_professional ON rate_grids(professional_id);
ALTER TABLE rate_grids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own rate grids" ON rate_grids;
CREATE POLICY "Professionals manage own rate grids"
  ON rate_grids FOR ALL
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public can read rate grids" ON rate_grids;
CREATE POLICY "Public can read rate grids"
  ON rate_grids FOR SELECT USING (true);

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS after_image_url   TEXT,
  ADD COLUMN IF NOT EXISTS project_cost      NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS duration_days     INTEGER,
  ADD COLUMN IF NOT EXISTS work_category     TEXT,
  ADD COLUMN IF NOT EXISTS location          TEXT,
  ADD COLUMN IF NOT EXISTS is_featured       BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_projects_external INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS business_volume_cad     NUMERIC(15,2);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rbq_licenses_updated_at ON rbq_licenses;
CREATE TRIGGER trigger_rbq_licenses_updated_at
  BEFORE UPDATE ON rbq_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_insurance_certificates_updated_at ON insurance_certificates;
CREATE TRIGGER trigger_insurance_certificates_updated_at
  BEFORE UPDATE ON insurance_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_professional_certifications_updated_at ON professional_certifications;
CREATE TRIGGER trigger_professional_certifications_updated_at
  BEFORE UPDATE ON professional_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_rate_grids_updated_at ON rate_grids;
CREATE TRIGGER trigger_rate_grids_updated_at
  BEFORE UPDATE ON rate_grids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS trigger_insurance_status_update ON insurance_certificates;
CREATE TRIGGER trigger_insurance_status_update
  BEFORE INSERT OR UPDATE ON insurance_certificates
  FOR EACH ROW EXECUTE FUNCTION update_insurance_status();

INSERT INTO storage.buckets (id, name, public)
VALUES ('insurance-certificates', 'insurance-certificates', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Professionals upload own insurance certificates" ON storage.objects;
CREATE POLICY "Professionals upload own insurance certificates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'insurance-certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Professionals read own insurance certificates" ON storage.objects;
CREATE POLICY "Professionals read own insurance certificates"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'insurance-certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins read all insurance certificates" ON storage.objects;
CREATE POLICY "Admins read all insurance certificates"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'insurance-certificates'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DO $$ BEGIN RAISE NOTICE '✅ Migration 047 — OK'; END $$;

-- ============================================================
-- MIGRATION 048 — Correction RLS contractor tables
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 048 — fix contractor RLS...'; END $$;

CREATE INDEX IF NOT EXISTS idx_contractor_trades_trade_code ON contractor_trades(trade_code);
CREATE INDEX IF NOT EXISTS idx_rbq_licenses_expires ON rbq_licenses(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_status ON insurance_certificates(status, expires_at);

DO $$ BEGIN RAISE NOTICE '✅ Migration 048 — OK'; END $$;

-- ============================================================
-- MIGRATION 049 — notification_preferences + company_type (CRITIQUE)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 049 — notification_preferences & company_type...'; END $$;

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

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_type TEXT
    CHECK (company_type IN ('sole_proprietor','corporation','partnership','other'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rbq_subcat TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trade_specialty TEXT;

-- Mise à jour du trigger de création de profil pour persister ces champs
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
    id, email, full_name, user_type,
    professional_type, company_type, rbq_subcat, trade_specialty,
    created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, v_full_name, v_user_type::user_type,
    CASE
      WHEN NEW.raw_user_meta_data->>'professional_type' IN ('entrepreneur','trade_professional')
      THEN (NEW.raw_user_meta_data->>'professional_type')
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'company_type',
    NEW.raw_user_meta_data->>'rbq_subcat',
    NEW.raw_user_meta_data->>'trade_specialty',
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    company_type    = EXCLUDED.company_type,
    rbq_subcat      = EXCLUDED.rbq_subcat,
    trade_specialty = EXCLUDED.trade_specialty;

  RETURN NEW;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_notification_prefs
  ON profiles USING GIN(notification_preferences)
  WHERE notification_preferences IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Migration 049 — OK (notification_preferences + company_type ajoutés)'; END $$;

-- ============================================================
-- MIGRATION 050 — Améliorations profil (profile_views, subscription_tier)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 050 — profile enhancements...'; END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free','starter','pro','enterprise'));

UPDATE profiles SET verified_at = rbq_verified_at
WHERE rbq_verified_at IS NOT NULL AND verified_at IS NULL;

CREATE OR REPLACE FUNCTION increment_profile_views(p_profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_profile_views(UUID) TO authenticated, anon;

CREATE OR REPLACE VIEW favorites_with_details AS
SELECT
  f.id AS favorite_id,
  f.client_id AS user_id,
  f.created_at AS favorited_at,
  p.id,
  p.full_name,
  p.company_name,
  p.services_offered,
  p.city,
  p.region,
  p.average_rating,
  p.total_reviews,
  p.profile_picture_url,
  p.is_rbq_verified,
  p.response_time_hours,
  p.availability_status,
  p.years_experience,
  p.bio,
  p.subscription_tier
FROM favorites f
JOIN profiles p ON f.professional_id = p.id
WHERE p.user_type = 'professional';

GRANT SELECT ON favorites_with_details TO authenticated;

DO $$ BEGIN RAISE NOTICE '✅ Migration 050 — OK'; END $$;

-- ============================================================
-- MIGRATION 051 — Abonnements + champs bancaires (US-051)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 051 — subscription improvements...'; END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='stripe_subscription_id') THEN
      ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_start') THEN
      ALTER TABLE subscriptions ADD COLUMN current_period_start TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_end') THEN
      ALTER TABLE subscriptions ADD COLUMN current_period_end TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='trial_end') THEN
      ALTER TABLE subscriptions ADD COLUMN trial_end TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_account_id  TEXT,
  ADD COLUMN IF NOT EXISTS payout_enabled      BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
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

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    DROP TRIGGER IF EXISTS trigger_sync_subscription_tier ON subscriptions;
    CREATE TRIGGER trigger_sync_subscription_tier
      AFTER INSERT OR UPDATE ON subscriptions
      FOR EACH ROW EXECUTE FUNCTION sync_subscription_tier();
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Migration 051 — OK'; END $$;

-- ============================================================
-- MIGRATION 052 — Fonctions KPI tableau de bord (US-052)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 052 — KPI functions...'; END $$;

CREATE OR REPLACE FUNCTION get_professional_revenue_summary(p_professional_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total NUMERIC(12,2) := 0;
  v_pending NUMERIC(12,2) := 0;
  v_invoices INTEGER := 0;
  v_paid INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contractor_payments') THEN
    SELECT
      COALESCE(SUM(CASE WHEN status = 'released' THEN net_amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN status IN ('pending','in_escrow') THEN net_amount ELSE 0 END), 0)
    INTO v_total, v_pending
    FROM contractor_payments WHERE contractor_id = p_professional_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'paid')
    INTO v_invoices, v_paid
    FROM invoices WHERE contractor_id = p_professional_id;
  END IF;
  RETURN jsonb_build_object(
    'total_revenue', v_total, 'pending_revenue', v_pending,
    'invoices_count', v_invoices, 'paid_invoices', v_paid,
    'payment_rate', CASE WHEN v_invoices > 0 THEN ROUND((v_paid::NUMERIC/v_invoices)*100,1) ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_professional_revenue_summary(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_proposal_conversion_rate(p_professional_id UUID)
RETURNS JSONB AS $$
DECLARE v_total INTEGER := 0; v_accepted INTEGER := 0; v_pending INTEGER := 0; v_rejected INTEGER := 0;
BEGIN
  SELECT COUNT(*),
    COUNT(*) FILTER (WHERE status='accepted'),
    COUNT(*) FILTER (WHERE status='pending'),
    COUNT(*) FILTER (WHERE status='rejected')
  INTO v_total, v_accepted, v_pending, v_rejected
  FROM proposals WHERE professional_id = p_professional_id;
  RETURN jsonb_build_object(
    'total', v_total, 'accepted', v_accepted, 'pending', v_pending, 'rejected', v_rejected,
    'conversion_rate', CASE WHEN v_total > 0 THEN ROUND((v_accepted::NUMERIC/v_total)*100,1) ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_proposal_conversion_rate(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_review_statistics(p_professional_id UUID)
RETURNS JSONB AS $$
DECLARE v_total INTEGER := 0; v_avg NUMERIC(3,2) := 0;
BEGIN
  SELECT COUNT(*), ROUND(AVG(rating)::NUMERIC, 2)
  INTO v_total, v_avg
  FROM reviews WHERE professional_id = p_professional_id;
  RETURN jsonb_build_object('total_reviews', v_total, 'average_rating', COALESCE(v_avg, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_review_statistics(UUID) TO authenticated;

DO $$ BEGIN RAISE NOTICE '✅ Migration 052 — OK'; END $$;

-- ============================================================
-- MIGRATION 053 — Workflow complétion de projet (US-038, US-039)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 053 — project completion workflow...'; END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='completion_requested_at') THEN
    ALTER TABLE projects ADD COLUMN completion_requested_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='completion_confirmed_at') THEN
    ALTER TABLE projects ADD COLUMN completion_confirmed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='completion_notes') THEN
    ALTER TABLE projects ADD COLUMN completion_notes TEXT;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'project_completed';
  EXCEPTION WHEN undefined_object THEN NULL; WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'review_requested';
  EXCEPTION WHEN undefined_object THEN NULL; WHEN duplicate_object THEN NULL; END;
END $$;

CREATE OR REPLACE FUNCTION complete_project(p_project_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE v_project RECORD; v_professional_name TEXT;
BEGIN
  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;
  IF v_project.assigned_professional_id != auth.uid() AND v_project.client_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_project.assigned_professional_id = auth.uid() THEN
    UPDATE projects SET completion_requested_at = NOW(), completion_notes = p_notes, updated_at = NOW() WHERE id = p_project_id;
    SELECT full_name INTO v_professional_name FROM profiles WHERE id = auth.uid();
    INSERT INTO notifications (user_id, type, title, message, related_user_id, related_project_id, action_url, metadata)
    VALUES (v_project.client_id, 'project_completed', 'Projet terminé - Confirmation requise ✅',
      v_professional_name || ' a marqué "' || v_project.title || '" comme terminé.',
      auth.uid(), p_project_id, '/dashboard?project=' || p_project_id,
      jsonb_build_object('project_id', p_project_id, 'action', 'confirm_completion'));
  END IF;
  IF v_project.client_id = auth.uid() AND v_project.completion_requested_at IS NOT NULL THEN
    UPDATE projects SET status = 'completed', completion_confirmed_at = NOW(), progress_percentage = 100, updated_at = NOW() WHERE id = p_project_id;
    INSERT INTO notifications (user_id, type, title, message, related_project_id, action_url, metadata)
    VALUES (v_project.assigned_professional_id, 'project_completed', 'Projet confirmé comme terminé 🎉',
      'Le projet "' || v_project.title || '" a été confirmé terminé par le client !',
      p_project_id, '/pro/my-projects', jsonb_build_object('project_id', p_project_id));
    INSERT INTO notifications (user_id, type, title, message, related_project_id, action_url, metadata)
    VALUES (v_project.client_id, 'review_requested', 'Évaluez votre expérience ⭐',
      'Comment s''est passé "' || v_project.title || '" ? Partagez votre avis !',
      p_project_id, '/professionals/' || v_project.assigned_professional_id || '?review=true',
      jsonb_build_object('project_id', p_project_id, 'professional_id', v_project.assigned_professional_id));
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION complete_project(UUID, TEXT) TO authenticated;

DO $$ BEGIN RAISE NOTICE '✅ Migration 053 — OK'; END $$;

-- ============================================================
-- MIGRATION 054 — Vue conversations, nettoyage, is_read
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 054 — search & cleanup...'; END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='is_read') THEN
    ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(receiver_id, is_read, conversation_id)
  WHERE is_read = FALSE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='latitude') THEN
    ALTER TABLE projects ADD COLUMN latitude DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='longitude') THEN
    ALTER TABLE projects ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_pro_listing
  ON profiles(user_type, is_rbq_verified, average_rating DESC)
  WHERE user_type = 'professional';

DO $$
DECLARE types TEXT[] := ARRAY['new_message','new_proposal','meeting_reminder','payment_received','review_reply','subscription_expiring'];
        t TEXT;
BEGIN
  FOREACH t IN ARRAY types LOOP
    BEGIN
      EXECUTE format('ALTER TYPE notification_type ADD VALUE IF NOT EXISTS %L', t);
    EXCEPTION WHEN undefined_object THEN NULL; WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Migration 054 — OK'; END $$;

-- ============================================================
-- MIGRATION 055 — Champs profil entrepreneur (US-048-050)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 055 — entrepreneur profile fields...'; END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS linkedin_url   TEXT,
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS languages      TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_zones  TEXT[] DEFAULT '{}';

DO $$ BEGIN RAISE NOTICE '✅ Migration 055 — OK'; END $$;

-- ============================================================
-- MIGRATION 056 — Table pro_meetings (US-057, US-058)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 056 — pro_meetings table...'; END $$;

CREATE TABLE IF NOT EXISTS pro_meetings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name      TEXT NOT NULL,
  project_name     TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_url      TEXT,
  notes            TEXT,
  pre_questions    TEXT,
  has_reminder     BOOLEAN DEFAULT false,
  status           TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_meetings_organizer_id ON pro_meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_pro_meetings_scheduled_at ON pro_meetings(scheduled_at);
ALTER TABLE pro_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entrepreneurs can manage their own meetings" ON pro_meetings;
CREATE POLICY "Entrepreneurs can manage their own meetings"
  ON pro_meetings FOR ALL
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

CREATE OR REPLACE FUNCTION update_pro_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pro_meetings_updated_at ON pro_meetings;
CREATE TRIGGER trigger_pro_meetings_updated_at
  BEFORE UPDATE ON pro_meetings FOR EACH ROW EXECUTE FUNCTION update_pro_meetings_updated_at();

DO $$ BEGIN RAISE NOTICE '✅ Migration 056 — OK'; END $$;

-- ============================================================
-- MIGRATION 057 — contractor_payments + invoices (US-059-064)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 057 — payments & invoices...'; END $$;

CREATE TABLE IF NOT EXISTS contractor_payments (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id     UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_title  TEXT NOT NULL,
  client_name    TEXT NOT NULL,
  milestone      TEXT NOT NULL,
  amount         DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  fee            DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  net_amount     DECIMAL(10,2) NOT NULL CHECK (net_amount >= 0),
  status         TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_escrow','released','disputed','cancelled')),
  payment_method TEXT DEFAULT 'transfer'
    CHECK (payment_method IN ('transfer','card','crypto')),
  dispute_reason  TEXT,
  dispute_details TEXT,
  released_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id     UUID REFERENCES contractor_payments(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  client_name    TEXT NOT NULL,
  client_address TEXT,
  project_title  TEXT NOT NULL,
  milestone      TEXT NOT NULL,
  amount         DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  tax            DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total          DECIMAL(10,2) NOT NULL CHECK (total > 0),
  status         TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','overdue')),
  payment_method TEXT,
  issued_at      TIMESTAMPTZ DEFAULT NOW(),
  due_at         TIMESTAMPTZ,
  paid_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contractor_payments_contractor_id ON contractor_payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_payments_status ON contractor_payments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_contractor_id ON invoices(contractor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

ALTER TABLE contractor_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contractors can view their own payments" ON contractor_payments;
CREATE POLICY "Contractors can view their own payments"
  ON contractor_payments FOR SELECT USING (contractor_id = auth.uid());

DROP POLICY IF EXISTS "Contractors can update their own payments (dispute)" ON contractor_payments;
CREATE POLICY "Contractors can update their own payments (dispute)"
  ON contractor_payments FOR UPDATE
  USING (contractor_id = auth.uid()) WITH CHECK (contractor_id = auth.uid());

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contractors can view their own invoices" ON invoices;
CREATE POLICY "Contractors can view their own invoices"
  ON invoices FOR SELECT USING (contractor_id = auth.uid());

CREATE OR REPLACE FUNCTION update_contractor_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contractor_payments_updated_at ON contractor_payments;
CREATE TRIGGER trigger_contractor_payments_updated_at
  BEFORE UPDATE ON contractor_payments FOR EACH ROW EXECUTE FUNCTION update_contractor_payments_updated_at();

DO $$ BEGIN RAISE NOTICE '✅ Migration 057 — OK'; END $$;

-- ============================================================
-- MIGRATION 058 — review_replies (US-066)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 058 — review_replies...'; END $$;

CREATE TABLE IF NOT EXISTS review_replies (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors can manage their own replies" ON review_replies;
CREATE POLICY "Authors can manage their own replies"
  ON review_replies FOR ALL
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can read review replies" ON review_replies;
CREATE POLICY "Anyone can read review replies"
  ON review_replies FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION update_review_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_review_replies_updated_at ON review_replies;
CREATE TRIGGER trigger_review_replies_updated_at
  BEFORE UPDATE ON review_replies FOR EACH ROW EXECUTE FUNCTION update_review_replies_updated_at();

DO $$ BEGIN RAISE NOTICE '✅ Migration 058 — OK'; END $$;

-- ============================================================
-- MIGRATION 059 — Bucket project-media + projects.media_urls (US-061)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 059 — project media bucket...'; END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='media_urls') THEN
    ALTER TABLE projects ADD COLUMN media_urls JSONB DEFAULT '[]';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-media', 'project-media', true, 52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/mpeg']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload project media" ON storage.objects;
CREATE POLICY "Users can upload project media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can view project media" ON storage.objects;
CREATE POLICY "Anyone can view project media"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-media');

DROP POLICY IF EXISTS "Users can delete their own project media" ON storage.objects;
CREATE POLICY "Users can delete their own project media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DO $$ BEGIN RAISE NOTICE '✅ Migration 059 — OK'; END $$;

-- ============================================================
-- MIGRATION 060 — professional_type dans profiles
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 060 — professional_type...'; END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='professional_type') THEN
    ALTER TABLE profiles ADD COLUMN professional_type TEXT
      CHECK (professional_type IN ('entrepreneur','trade_professional')) DEFAULT NULL;
  END IF;
END $$;

UPDATE profiles
SET professional_type = 'entrepreneur'
WHERE user_type = 'professional' AND professional_type IS NULL;

DO $$ BEGIN RAISE NOTICE '✅ Migration 060 — OK'; END $$;

-- ============================================================
-- MIGRATION 061 — Ensure professional_type (idempotent)
-- ============================================================
DO $$ BEGIN RAISE NOTICE '▶️  Migration 061 — ensure professional_type...'; END $$;

UPDATE public.profiles
SET professional_type = 'entrepreneur'
WHERE user_type = 'professional' AND professional_type IS NULL;

DO $$ BEGIN RAISE NOTICE '✅ Migration 061 — OK'; END $$;

-- ============================================================
-- RÉSUMÉ FINAL
-- ============================================================
DO $$
DECLARE
  col_count INTEGER;
  tbl_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN ('notification_preferences','company_type','search_vector',
                        'verified_at','profile_views','subscription_tier',
                        'linkedin_url','certifications','languages','service_zones',
                        'professional_type','rbq_subcat','trade_specialty',
                        'stripe_customer_id','payout_enabled');

  SELECT COUNT(*) INTO tbl_count
  FROM information_schema.tables
  WHERE table_name IN ('meetings','pro_meetings','contractor_payments','invoices',
                       'review_replies','contractor_trades','rbq_licenses',
                       'insurance_certificates','professional_certifications','rate_grids');

  RAISE NOTICE '';
  RAISE NOTICE '🎉 ====== MIGRATIONS APPLIQUÉES AVEC SUCCÈS ======';
  RAISE NOTICE '📊 Colonnes profiles vérifiées : % / 15', col_count;
  RAISE NOTICE '📊 Tables nouvelles vérifiées  : % / 10', tbl_count;
  RAISE NOTICE '✅ Migrations 029, 030, 046–061 toutes idempotentes';
  RAISE NOTICE '================================================';
END $$;
