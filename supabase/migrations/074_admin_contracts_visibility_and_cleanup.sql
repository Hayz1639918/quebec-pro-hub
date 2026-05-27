-- =========================================================================
-- Migration 074: Post-E2E test cleanup + admin contracts visibility
-- -------------------------------------------------------------------------
-- Discovered during the full E2E run:
--   1. Admins could not enrich a dispute with the contract title or the
--      parties' names because `contracts` had no admin-visible RLS policy.
--      The admin "Gestion des litiges" tab therefore showed "Sans titre" and
--      empty Parties columns.
--   2. The dispute notification (migration 070) deep-linked to
--      `/admin/dashboard`, but the actual admin route is `/admin?tab=disputes`.
--   3. Legacy notifications still carry the `📝`, `🎉` and `✓` emojis we
--      removed from the UI. Normalize the existing rows so the bell stays
--      consistent with the new icon system.
-- Idempotent.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Admin SELECT policy on contracts
-- -------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all contracts" ON contracts;
CREATE POLICY "Admins can view all contracts"
  ON contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.is_admin = TRUE
    )
  );

-- -------------------------------------------------------------------------
-- 2. Fix the dispute deep-link in the admin notification trigger (070)
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION on_dispute_created()
RETURNS TRIGGER AS $fn$
DECLARE
  v_admin RECORD;
  v_opener_name TEXT;
  v_contract_title TEXT;
BEGIN
  SELECT COALESCE(company_name, full_name, 'Utilisateur') INTO v_opener_name
  FROM profiles WHERE id = NEW.opened_by;

  SELECT title INTO v_contract_title
  FROM contracts WHERE id = NEW.contract_id;

  FOR v_admin IN
    SELECT id FROM profiles WHERE is_admin = TRUE
  LOOP
    INSERT INTO notifications (
      user_id, type, title, message,
      related_user_id, action_url, metadata
    ) VALUES (
      v_admin.id,
      'dispute_opened',
      'Nouveau litige à examiner',
      COALESCE(v_opener_name, 'Un utilisateur') || ' a ouvert un litige sur le contrat "' || COALESCE(v_contract_title, '—') || '".',
      NEW.opened_by,
      '/admin?tab=disputes',
      jsonb_build_object(
        'dispute_id', NEW.id,
        'contract_id', NEW.contract_id,
        'category', NEW.category,
        'opened_by', NEW.opened_by
      )
    );
  END LOOP;

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger declaration is preserved from migration 070; just refresh it to be safe.
DROP TRIGGER IF EXISTS trigger_dispute_created ON disputes;
CREATE TRIGGER trigger_dispute_created
  AFTER INSERT ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION on_dispute_created();

-- Backfill: rewrite the existing notifications that still point at the old route.
UPDATE notifications
SET action_url = '/admin?tab=disputes'
WHERE type = 'dispute_opened'
  AND action_url = '/admin/dashboard';

-- -------------------------------------------------------------------------
-- 3. Strip leftover emojis from legacy notification titles/messages
-- -------------------------------------------------------------------------

UPDATE notifications
SET title = regexp_replace(title, '\s*[📝🎉🚀💳❤️🇨🇦🌍👋✓]+\s*$', ''),
    message = regexp_replace(message, '\s*[📝🎉🚀💳❤️🇨🇦🌍👋]+', '', 'g')
WHERE title ~ '[📝🎉🚀💳❤️🇨🇦🌍👋✓]'
   OR message ~ '[📝🎉🚀💳❤️🇨🇦🌍👋]';
