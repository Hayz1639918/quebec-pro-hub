-- Harden admin audit log insertion rights.
-- Removes the overly permissive INSERT policy so authenticated non-admin users
-- cannot forge audit log entries through the public API.

DROP POLICY IF EXISTS "System can insert audit logs" ON admin_audit_logs;

CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND admin_id = auth.uid()
    AND is_admin()
  );
