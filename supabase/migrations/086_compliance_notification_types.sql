-- =========================================================================
-- Migration 086: Notification types for legal compliance (US-112, US-113)
-- -------------------------------------------------------------------------
-- Adds the notification_type values used by the license / insurance
-- compliance triggers introduced in migration 087.
--
-- IMPORTANT: `ALTER TYPE ... ADD VALUE` cannot be used in the same
-- transaction that later uses the value. This migration MUST be applied
-- (committed) on its own, before migration 087. Run it as a separate
-- statement in the Supabase SQL editor.
--
-- These types fall through to the 'push_system' preference key in
-- notification_pref_key() (migration 084), so they respect the user's
-- "system notifications" preference.
-- Idempotent.
-- =========================================================================

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'license_status_changed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'insurance_status_changed';
