-- =========================================================================
-- Migration 071: Enable Supabase Realtime publication for key user tables
-- -------------------------------------------------------------------------
-- Sprint 1 wiring: NotificationBell, ChatWindow and dashboard widgets rely
-- on `supabase_realtime` publishing INSERT/UPDATE/DELETE events. Without an
-- explicit ALTER PUBLICATION, the client subscription stays open but never
-- receives payloads. This migration is idempotent so it can be re-run.
-- =========================================================================

DO $realtime$
DECLARE
  publication_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) INTO publication_exists;

  IF NOT publication_exists THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$realtime$;

-- Helper that adds a table to supabase_realtime only when missing.
CREATE OR REPLACE FUNCTION public._add_to_realtime_publication(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  already_in boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = split_part(p_table::text, '.', 1)
      AND tablename  = split_part(p_table::text, '.', 2)
  ) INTO already_in;

  IF NOT already_in THEN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', p_table::text);
  END IF;
END
$fn$;

-- Notifications bell, dashboards, etc.
SELECT public._add_to_realtime_publication('public.notifications');

-- Chat windows + messaging lists.
DO $maybe_messages$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    PERFORM public._add_to_realtime_publication('public.messages');
  END IF;
END
$maybe_messages$;

-- Disputes feed for admin dashboard widgets.
DO $maybe_disputes$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'disputes') THEN
    PERFORM public._add_to_realtime_publication('public.disputes');
  END IF;
END
$maybe_disputes$;

-- Contractor payments / invoice updates surfaced in payment trackers.
DO $maybe_payments$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contractor_payments') THEN
    PERFORM public._add_to_realtime_publication('public.contractor_payments');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    PERFORM public._add_to_realtime_publication('public.invoices');
  END IF;
END
$maybe_payments$;

-- Milestone progress for ProjectProgress + client views.
DO $maybe_milestones$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contract_milestones') THEN
    PERFORM public._add_to_realtime_publication('public.contract_milestones');
  END IF;
END
$maybe_milestones$;

DROP FUNCTION IF EXISTS public._add_to_realtime_publication(regclass);
