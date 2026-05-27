-- =========================================================================
-- Migration 072: Add notification types required by Sprint 1 triggers
-- -------------------------------------------------------------------------
-- Migrations 068 (milestone -> invoice + payment) and 070 (dispute fan-out)
-- INSERT notifications with types that were missing from the enum:
--   - payment_pending  (068, sent to the professional)
--   - invoice_issued   (068, sent to the client)
--   - dispute_opened   (070, sent to admins)
-- Without these values, the `approve_milestone` RPC fails with
-- `invalid input value for enum notification_type`.
-- Each ALTER TYPE is run as its own statement and uses IF NOT EXISTS
-- so the migration is idempotent.
-- =========================================================================

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invoice_issued';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'dispute_opened';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'dispute_resolved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'milestone_requested';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'milestone_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'milestone_rejected';
