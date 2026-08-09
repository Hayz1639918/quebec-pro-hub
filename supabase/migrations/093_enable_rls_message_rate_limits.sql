-- =========================================================================
-- Migration 093: Enable RLS on message_rate_limits
-- -------------------------------------------------------------------------
-- Broken access control fix (LOW/MEDIUM).
--
-- message_rate_limits (migration 023) never had Row Level Security enabled
-- and grants SELECT to `authenticated`. Because every table in the `public`
-- schema is exposed through PostgREST, any logged-in user could read the
-- whole table via /rest/v1/message_rate_limits and see every user's message
-- activity (message_count, window_start) — a cross-user metadata leak.
--
-- The table is only written by the SECURITY DEFINER trigger
-- check_message_rate_limit() (which bypasses RLS), and the front-end never
-- queries it directly. We enable RLS and restrict reads to the row owner.
-- Idempotent.
-- =========================================================================

ALTER TABLE message_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rate limit" ON message_rate_limits;
CREATE POLICY "Users can view their own rate limit"
  ON message_rate_limits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies: all writes go through the SECURITY DEFINER
-- trigger, so authenticated users get no direct write path (and none was
-- granted). This keeps the rate-limit counters tamper-proof from the API.
