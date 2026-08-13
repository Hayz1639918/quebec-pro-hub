-- =========================================================================
-- Unify meeting flows around public.meetings
-- -------------------------------------------------------------------------
-- `meetings` is the canonical entity created from conversations.
-- The historical `pro_meetings` table is retained as `pro_meetings_legacy`
-- so no existing data is destroyed. A read-only compatibility view named
-- `pro_meetings` keeps the existing dashboard query working while sourcing
-- its data from `meetings`.
--
-- Reminder processing is also moved to `meetings`, so the dashboard,
-- messaging flow, meeting management page and reminders all refer to the
-- same records.
-- =========================================================================

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMPTZ;

-- Preserve the old table rather than dropping historical rows.
DO $$
BEGIN
  IF to_regclass('public.pro_meetings') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = 'pro_meetings'
         AND c.relkind = 'r'
     )
     AND to_regclass('public.pro_meetings_legacy') IS NULL
  THEN
    ALTER TABLE public.pro_meetings RENAME TO pro_meetings_legacy;
  END IF;
END $$;

DROP VIEW IF EXISTS public.pro_meetings;

CREATE VIEW public.pro_meetings
WITH (security_invoker = true)
AS
SELECT
  m.id,
  CASE
    WHEN organizer.user_type = 'professional' THEN m.organizer_id
    WHEN participant.user_type = 'professional' THEN m.participant_id
    ELSE m.organizer_id
  END AS organizer_id,
  COALESCE(
    CASE
      WHEN organizer.user_type = 'client' THEN organizer.full_name
      WHEN participant.user_type = 'client' THEN participant.full_name
      WHEN organizer.user_type = 'professional' THEN participant.full_name
      ELSE organizer.full_name
    END,
    'Participant'
  ) AS client_name,
  m.title AS project_name,
  m.scheduled_at,
  m.duration_minutes,
  m.meeting_url,
  m.notes,
  NULL::TEXT AS pre_questions,
  TRUE AS has_reminder,
  CASE m.status
    WHEN 'scheduled' THEN 'upcoming'
    WHEN 'completed' THEN 'completed'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE m.status
  END AS status,
  m.created_at,
  m.updated_at,
  m.reminder_24h_sent_at,
  m.reminder_1h_sent_at
FROM public.meetings m
LEFT JOIN public.profiles organizer ON organizer.id = m.organizer_id
LEFT JOIN public.profiles participant ON participant.id = m.participant_id;

REVOKE ALL ON public.pro_meetings FROM PUBLIC;
GRANT SELECT ON public.pro_meetings TO authenticated;

COMMENT ON VIEW public.pro_meetings IS
  'Read-only compatibility projection over meetings. The canonical meeting source is public.meetings; historical rows are retained in pro_meetings_legacy.';

-- Replace the old worker so reminders are emitted from the canonical table.
CREATE OR REPLACE FUNCTION public.send_meeting_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meeting meetings%ROWTYPE;
  v_minutes NUMERIC;
  v_count INTEGER := 0;
  v_when_text TEXT;
  v_recipient UUID;
  v_recipient_name TEXT;
BEGIN
  FOR v_meeting IN
    SELECT *
    FROM meetings
    WHERE status = 'scheduled'
      AND scheduled_at > now()
      AND scheduled_at <= now() + interval '25 hours'
  LOOP
    v_minutes := EXTRACT(EPOCH FROM (v_meeting.scheduled_at - now())) / 60.0;

    IF v_meeting.reminder_24h_sent_at IS NULL
       AND v_minutes BETWEEN (23 * 60) AND (24 * 60)
    THEN
      v_when_text := to_char(
        v_meeting.scheduled_at AT TIME ZONE 'America/Montreal',
        'DD/MM/YYYY HH24:MI'
      );

      FOREACH v_recipient IN ARRAY ARRAY[v_meeting.organizer_id, v_meeting.participant_id]
      LOOP
        SELECT COALESCE(company_name, full_name, 'Participant')
          INTO v_recipient_name
        FROM profiles
        WHERE id = CASE
          WHEN v_recipient = v_meeting.organizer_id THEN v_meeting.participant_id
          ELSE v_meeting.organizer_id
        END;

        INSERT INTO notifications (user_id, type, title, message, action_url)
        VALUES (
          v_recipient,
          'meeting_reminder',
          'Réunion demain',
          'Vous avez une réunion avec ' || COALESCE(v_recipient_name, 'un participant')
            || ' prévue le ' || v_when_text || '.',
          '/messages?conversation=' || v_meeting.conversation_id::text
        );
      END LOOP;

      UPDATE meetings
      SET reminder_24h_sent_at = now()
      WHERE id = v_meeting.id;

      v_count := v_count + 2;
    END IF;

    IF v_meeting.reminder_1h_sent_at IS NULL
       AND v_minutes BETWEEN 30 AND 60
    THEN
      FOREACH v_recipient IN ARRAY ARRAY[v_meeting.organizer_id, v_meeting.participant_id]
      LOOP
        SELECT COALESCE(company_name, full_name, 'Participant')
          INTO v_recipient_name
        FROM profiles
        WHERE id = CASE
          WHEN v_recipient = v_meeting.organizer_id THEN v_meeting.participant_id
          ELSE v_meeting.organizer_id
        END;

        INSERT INTO notifications (user_id, type, title, message, action_url)
        VALUES (
          v_recipient,
          'meeting_reminder',
          'Réunion dans 1 heure',
          'Réunion avec ' || COALESCE(v_recipient_name, 'un participant')
            || ' dans environ ' || ROUND(v_minutes) || ' minutes.',
          '/messages?conversation=' || v_meeting.conversation_id::text
        );
      END LOOP;

      UPDATE meetings
      SET reminder_1h_sent_at = now()
      WHERE id = v_meeting.id;

      v_count := v_count + 2;
    END IF;
  END LOOP;

  -- Do not overwrite cancelled meetings. Automatically complete only meetings
  -- whose scheduled duration has elapsed.
  UPDATE meetings
  SET status = 'completed', updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_at + (duration_minutes || ' minutes')::interval < now();

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.send_meeting_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_meeting_reminders() TO service_role;

-- Keep the existing pg_cron job name but point it at the rewritten worker.
DO $$
DECLARE
  v_cron_available BOOLEAN;
  v_existing BIGINT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO v_cron_available;

  IF NOT v_cron_available THEN
    RAISE NOTICE 'pg_cron not installed; meeting reminder job not scheduled.';
    RETURN;
  END IF;

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

COMMENT ON FUNCTION public.send_meeting_reminders() IS
  'Sends idempotent T-24h and T-1h in-app reminders for the canonical meetings table and marks elapsed scheduled meetings completed.';
