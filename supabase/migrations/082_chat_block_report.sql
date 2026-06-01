-- =========================================================================
-- Migration 082: Block & report users from the chat (US-029)
-- -------------------------------------------------------------------------
-- Adds two tables:
--   * user_blocks   — a user blocks another user; blocked user can no longer
--                     send them messages.
--   * user_reports  — a user reports another user for moderation review.
-- A BEFORE INSERT trigger on `messages` enforces the block in both directions.
-- Idempotent.
-- =========================================================================

-- ---------------------------------------------------------------------------
-- 1. user_blocks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_blocks_not_self CHECK (blocker_id <> blocked_id),
  CONSTRAINT user_blocks_unique UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own blocks" ON user_blocks;
CREATE POLICY "Users read their own blocks"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Users create their own blocks" ON user_blocks;
CREATE POLICY "Users create their own blocks"
  ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users remove their own blocks" ON user_blocks;
CREATE POLICY "Users remove their own blocks"
  ON user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- ---------------------------------------------------------------------------
-- 2. user_reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id   UUID,
  reason            TEXT NOT NULL,
  detail            TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_reports_not_self CHECK (reporter_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status   ON user_reports(status);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reporters read their own reports" ON user_reports;
CREATE POLICY "Reporters read their own reports"
  ON user_reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create their own reports" ON user_reports;
CREATE POLICY "Users create their own reports"
  ON user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins manage reports" ON user_reports;
CREATE POLICY "Admins manage reports"
  ON user_reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Enforce blocks on message insert (both directions)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_message_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.receiver_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = NEW.receiver_id AND blocked_id = NEW.sender_id)
       OR (blocker_id = NEW.sender_id AND blocked_id = NEW.receiver_id)
  ) THEN
    RAISE EXCEPTION 'Vous ne pouvez pas envoyer de message : cette conversation est bloquée.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_message_block ON messages;
CREATE TRIGGER trigger_enforce_message_block
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION enforce_message_block();
