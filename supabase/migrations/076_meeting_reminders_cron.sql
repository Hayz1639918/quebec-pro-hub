-- =========================================================================
-- Migration 076: Automated meeting reminders (US-057)
-- -------------------------------------------------------------------------
-- Adds a SECURITY DEFINER function that scans `pro_meetings` and emits
-- a single `meeting_reminder` notification per meeting at the 24h and 1h
-- thresholds. It is safe to call repeatedly (idempotent) because it uses
-- two BOOLEAN columns on `pro_meetings` to remember which reminders were
-- already sent.
--
-- We also wire it up with pg_cron when the extension is available so the
-- platform sends reminders automatically every 5 minutes. If pg_cron is
-- not enabled, the function can be invoked manually (or from an external
-- scheduler / Supabase Edge Function) without any further changes.
-- =========================================================================

-- 1. Track which reminders already went out so we never spam the user
ALTER TABLE pro_meetings
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent_at  TIMESTAMPTZ;

-- 2. Main worker
CREATE OR REPLACE FUNCTION send_meeting_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meeting        pro_meetings%ROWTYPE;
  v_minutes        NUMERIC;
  v_action_url     TEXT;
  v_count          INTEGER := 0;
  v_when_text      TEXT;
BEGIN
  -- We only care about meetings that:
  --   * are still "upcoming"
  --   * have reminders enabled
  --   * are scheduled in the near future (next 25h)
  FOR v_meeting IN
    SELECT *
    FROM pro_meetings
    WHERE status = 'upcoming'
      AND has_reminder = true
      AND scheduled_at > now()
      AND scheduled_at <= now() + interval '25 hours'
  LOOP
    v_minutes := EXTRACT(EPOCH FROM (v_meeting.scheduled_at - now())) / 60.0;
    v_action_url := '/pro/meetings';

    -- ---------------------------------------------------------------
    -- 24h reminder window: send if T-24h <= now < T-23h
    -- ---------------------------------------------------------------
    IF v_meeting.reminder_24h_sent_at IS NULL
       AND v_minutes BETWEEN (23 * 60) AND (24 * 60)
    THEN
      v_when_text := to_char(v_meeting.scheduled_at AT TIME ZONE 'America/Toronto',
                             'DD/MM/YYYY HH24:MI');

      INSERT INTO notifications (
        user_id, type, title, message, action_url
      ) VALUES (
        v_meeting.organizer_id,
        'meeting_reminder',
        'Réunion demain',
        'Vous avez une réunion avec ' || COALESCE(v_meeting.client_name, 'un client')
          || ' prévue le ' || v_when_text
          || COALESCE(' — projet ' || v_meeting.project_name, '') || '.',
        v_action_url
      );

      UPDATE pro_meetings
      SET reminder_24h_sent_at = now()
      WHERE id = v_meeting.id;

      v_count := v_count + 1;
    END IF;

    -- ---------------------------------------------------------------
    -- 1h reminder window: send if T-60min <= now < T-30min
    -- ---------------------------------------------------------------
    IF v_meeting.reminder_1h_sent_at IS NULL
       AND v_minutes BETWEEN 30 AND 60
    THEN
      INSERT INTO notifications (
        user_id, type, title, message, action_url
      ) VALUES (
        v_meeting.organizer_id,
        'meeting_reminder',
        'Réunion dans 1 heure',
        'Réunion avec ' || COALESCE(v_meeting.client_name, 'un client')
          || ' dans ' || ROUND(v_minutes) || ' minutes'
          || CASE
               WHEN v_meeting.meeting_url IS NOT NULL
                 THEN ' — lien: ' || v_meeting.meeting_url
               ELSE ''
             END,
        v_action_url
      );

      UPDATE pro_meetings
      SET reminder_1h_sent_at = now()
      WHERE id = v_meeting.id;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  -- ---------------------------------------------------------------
  -- House-keeping: mark meetings that have ended as 'completed'.
  -- We only flip status from 'upcoming' so we never overwrite a
  -- meeting that was cancelled manually.
  -- ---------------------------------------------------------------
  UPDATE pro_meetings
  SET status = 'completed'
  WHERE status = 'upcoming'
    AND scheduled_at + (duration_minutes || ' minutes')::interval < now();

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION send_meeting_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION send_meeting_reminders() TO service_role;

-- 3. Auto-schedule with pg_cron if available (best-effort, non-fatal)
DO $$
DECLARE
  v_cron_available BOOLEAN;
  v_existing       BIGINT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO v_cron_available;

  IF NOT v_cron_available THEN
    RAISE NOTICE 'pg_cron not installed; meeting reminder job not scheduled. Call send_meeting_reminders() from an external scheduler instead.';
    RETURN;
  END IF;

  -- Remove any previous version of the job so the schedule is up to date
  SELECT jobid INTO v_existing
  FROM cron.job
  WHERE jobname = 'send_meeting_reminders_every_5_min';

  IF v_existing IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing);
  END IF;

  PERFORM cron.schedule(
    'send_meeting_reminders_every_5_min',
    '*/5 * * * *',
    $cmd$SELECT public.send_meeting_reminders();$cmd$
  );
END $$;

COMMENT ON FUNCTION send_meeting_reminders() IS
  'Sends T-24h and T-1h meeting reminders to entrepreneurs (US-057). Idempotent: marks reminder_24h_sent_at / reminder_1h_sent_at on pro_meetings to avoid duplicates. Scheduled every 5 minutes via pg_cron when available.';
