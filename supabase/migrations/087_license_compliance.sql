-- =========================================================================
-- Migration 087: License & insurance compliance automation (US-112, US-113)
-- -------------------------------------------------------------------------
-- US-112 (admin): RBQ license validity is tracked with a manual status set
--   by the admin (valid / expired / revoked). A daily pg_cron job auto-flips
--   licenses to 'expired' once their expiry date has passed and recomputes
--   insurance statuses. No external RBQ API is used (manual verification).
-- US-113 (client): when the license OR insurance of a professional assigned
--   to an active project changes status, the client is notified in-app.
--
-- Requires migration 086 (notification types) to be applied FIRST.
-- Idempotent.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 0. Fix admin RLS so admins can actually set license/insurance statuses.
--    Migration 047 used `auth.jwt() ->> 'role' = 'admin'`, which never
--    matches in this project (admins are flagged via profiles.is_admin /
--    the is_admin() function from migration 039). Replace those policies.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage all rbq licenses" ON rbq_licenses;
CREATE POLICY "Admins manage all rbq licenses"
  ON rbq_licenses
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins manage all insurance" ON insurance_certificates;
CREATE POLICY "Admins manage all insurance"
  ON insurance_certificates
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- -------------------------------------------------------------------------
-- Helper: notify every client whose ACTIVE project is assigned to this pro.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_clients_of_pro_compliance(
  p_professional_id UUID,
  p_title           TEXT,
  p_message_prefix  TEXT,
  p_type            TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pro_name TEXT;
  v_project  RECORD;
BEGIN
  SELECT COALESCE(company_name, full_name, 'Votre professionnel')
    INTO v_pro_name
  FROM profiles
  WHERE id = p_professional_id;

  FOR v_project IN
    SELECT id, client_id, title
    FROM projects
    WHERE assigned_professional_id = p_professional_id
      AND status NOT IN ('completed', 'cancelled', 'open')
      AND client_id IS NOT NULL
  LOOP
    INSERT INTO notifications (
      user_id, type, title, message, related_user_id, related_project_id, action_url
    ) VALUES (
      v_project.client_id,
      p_type::notification_type,
      p_title,
      v_pro_name || ' ' || p_message_prefix
        || ' pour votre projet « ' || COALESCE(v_project.title, 'sans titre') || ' ». '
        || 'Nous vous recommandons de vérifier la situation avant de poursuivre.',
      p_professional_id,
      v_project.id,
      '/project/' || v_project.id
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION notify_clients_of_pro_compliance(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;

-- -------------------------------------------------------------------------
-- Trigger: RBQ license status change (US-112 alert + US-113 client alert)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_rbq_license_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status_label TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_status_label := CASE NEW.status
    WHEN 'valid'   THEN 'validée'
    WHEN 'expired' THEN 'expirée'
    WHEN 'revoked' THEN 'révoquée'
    ELSE 'en attente de vérification'
  END;

  -- Notify the professional about their own license status change.
  INSERT INTO notifications (
    user_id, type, title, message, action_url
  ) VALUES (
    NEW.professional_id,
    'license_status_changed',
    'Statut de licence RBQ mis à jour',
    'Votre licence RBQ ' || COALESCE(NEW.license_number, '')
      || ' (' || COALESCE(NEW.category, 'travaux') || ') est maintenant '
      || v_status_label || '.',
    '/pro/profile?tab=licences'
  );

  -- US-113: warn clients of active projects when the license is no longer valid.
  IF NEW.status IN ('expired', 'revoked') THEN
    PERFORM notify_clients_of_pro_compliance(
      NEW.professional_id,
      'Licence RBQ non valide',
      'a une licence RBQ désormais ' || v_status_label,
      'license_status_changed'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_rbq_license_status_change ON rbq_licenses;
CREATE TRIGGER trigger_rbq_license_status_change
  AFTER UPDATE OF status ON rbq_licenses
  FOR EACH ROW
  EXECUTE FUNCTION on_rbq_license_status_change();

-- -------------------------------------------------------------------------
-- Trigger: insurance status change (US-108 renewal alert + US-113 client)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_insurance_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Notify the professional (renewal alert) when their cover degrades.
  IF NEW.status IN ('expiring_soon', 'expired') THEN
    INSERT INTO notifications (
      user_id, type, title, message, action_url
    ) VALUES (
      NEW.professional_id,
      'insurance_status_changed',
      CASE WHEN NEW.status = 'expired'
           THEN 'Assurance expirée'
           ELSE 'Assurance bientôt expirée' END,
      CASE WHEN NEW.status = 'expired'
           THEN 'Votre certificat d''assurance a expiré le '
                || to_char(NEW.expires_at, 'DD/MM/YYYY') || '. Pensez à le renouveler.'
           ELSE 'Votre certificat d''assurance expire le '
                || to_char(NEW.expires_at, 'DD/MM/YYYY') || '. Pensez à le renouveler.' END,
      '/pro/profile?tab=licences'
    );
  END IF;

  -- US-113: warn clients of active projects when the cover has expired.
  IF NEW.status = 'expired' THEN
    PERFORM notify_clients_of_pro_compliance(
      NEW.professional_id,
      'Assurance non valide',
      'a un certificat d''assurance expiré',
      'insurance_status_changed'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_insurance_status_change ON insurance_certificates;
CREATE TRIGGER trigger_insurance_status_change
  AFTER UPDATE OF status ON insurance_certificates
  FOR EACH ROW
  EXECUTE FUNCTION on_insurance_status_change();

-- -------------------------------------------------------------------------
-- Daily worker: auto-expire licenses + recompute insurance statuses.
-- The UPDATEs fire the status-change triggers above, which emit the alerts.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION run_compliance_checks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_licenses  INTEGER := 0;
  v_insurance INTEGER := 0;
BEGIN
  -- 1. Auto-expire RBQ licenses past their expiry date.
  UPDATE rbq_licenses
  SET status = 'expired', last_verified_at = now()
  WHERE status IN ('valid', 'pending_verification')
    AND expires_at IS NOT NULL
    AND expires_at < CURRENT_DATE;
  GET DIAGNOSTICS v_licenses = ROW_COUNT;

  -- 2. Recompute insurance statuses. The BEFORE UPDATE trigger
  --    update_insurance_status() sets the correct value from expires_at;
  --    we only touch rows whose status would actually change.
  UPDATE insurance_certificates
  SET updated_at = now()
  WHERE expires_at IS NOT NULL
    AND (
      (expires_at < CURRENT_DATE AND status <> 'expired')
      OR (expires_at >= CURRENT_DATE
          AND expires_at <= CURRENT_DATE + INTERVAL '30 days'
          AND status <> 'expiring_soon')
      OR (expires_at > CURRENT_DATE + INTERVAL '30 days' AND status <> 'active')
    );
  GET DIAGNOSTICS v_insurance = ROW_COUNT;

  RETURN v_licenses + v_insurance;
END;
$$;

REVOKE ALL ON FUNCTION run_compliance_checks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION run_compliance_checks() TO service_role;

-- -------------------------------------------------------------------------
-- Schedule the daily check at 06:00 with pg_cron when available.
-- -------------------------------------------------------------------------
DO $$
DECLARE
  v_cron_available BOOLEAN;
  v_existing       BIGINT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO v_cron_available;

  IF NOT v_cron_available THEN
    RAISE NOTICE 'pg_cron not installed; compliance job not scheduled. Call run_compliance_checks() from an external scheduler instead.';
    RETURN;
  END IF;

  SELECT jobid INTO v_existing
  FROM cron.job
  WHERE jobname = 'run_compliance_checks_daily';

  IF v_existing IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing);
  END IF;

  PERFORM cron.schedule(
    'run_compliance_checks_daily',
    '0 6 * * *',
    $cmd$SELECT public.run_compliance_checks();$cmd$
  );
END $$;

COMMENT ON FUNCTION run_compliance_checks() IS
  'Daily compliance worker (US-112): auto-expires RBQ licenses past expiry and recomputes insurance statuses. Status-change triggers then alert the professional and any client on an active project (US-113). Scheduled at 06:00 via pg_cron when available.';
