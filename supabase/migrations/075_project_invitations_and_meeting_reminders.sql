-- =========================================================================
-- Migration 075: Project invitations + meeting reminder plumbing
-- -------------------------------------------------------------------------
-- Covers the remaining functional Entrepreneur user stories that are
-- launch-blockers (US-053, US-057, US-069 follow-up):
--
--   1. New `project_invitations` table (client invites a specific pro
--      to submit a proposal on one of their projects).
--   2. RLS + indexes + updated_at trigger.
--   3. New notification_type values:
--        - invitation_received     -> sent to the professional
--        - invitation_accepted     -> sent to the inviting client
--        - invitation_declined     -> sent to the inviting client
--        - meeting_reminder        -> generic reminder (US-057)
--        - review_reply            -> client notified when pro replies (US-066)
--   4. Triggers that fan out invitation notifications.
--   5. RPC `respond_to_invitation` so the pro can accept/decline atomically
--      and we can emit the right notification + audit trail.
--   6. Publish the new table on supabase_realtime so the pro dashboard can
--      surface invitations instantly.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Extend notification_type enum
-- -------------------------------------------------------------------------
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invitation_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invitation_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invitation_declined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'meeting_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'review_reply';

-- -------------------------------------------------------------------------
-- 2. project_invitations table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_project_invitations_professional
  ON project_invitations(professional_id, status);
CREATE INDEX IF NOT EXISTS idx_project_invitations_client
  ON project_invitations(client_id, status);
CREATE INDEX IF NOT EXISTS idx_project_invitations_project
  ON project_invitations(project_id);

ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients manage their own invitations" ON project_invitations;
CREATE POLICY "Clients manage their own invitations"
  ON project_invitations
  FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Professionals can read their invitations" ON project_invitations;
CREATE POLICY "Professionals can read their invitations"
  ON project_invitations
  FOR SELECT
  USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Professionals can respond to invitations" ON project_invitations;
CREATE POLICY "Professionals can respond to invitations"
  ON project_invitations
  FOR UPDATE
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all invitations" ON project_invitations;
CREATE POLICY "Admins can view all invitations"
  ON project_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- updated_at trigger (reuses existing helper)
DROP TRIGGER IF EXISTS update_project_invitations_updated_at ON project_invitations;
CREATE TRIGGER update_project_invitations_updated_at
  BEFORE UPDATE ON project_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------------------------
-- 3. Notifications on invitation lifecycle
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_project_invitation_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_title TEXT;
  v_client_name   TEXT;
BEGIN
  SELECT title INTO v_project_title FROM projects WHERE id = NEW.project_id;
  SELECT full_name INTO v_client_name FROM profiles WHERE id = NEW.client_id;

  INSERT INTO notifications (
    user_id, type, title, message,
    related_user_id, related_project_id, action_url
  ) VALUES (
    NEW.professional_id,
    'invitation_received',
    'Nouvelle invitation à soumissionner',
    COALESCE(v_client_name, 'Un client')
      || ' vous invite à soumissionner sur le projet "'
      || COALESCE(v_project_title, 'sans titre') || '".',
    NEW.client_id,
    NEW.project_id,
    '/pro/dashboard?tab=invitations'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_project_invitation_created ON project_invitations;
CREATE TRIGGER trg_on_project_invitation_created
  AFTER INSERT ON project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION on_project_invitation_created();

CREATE OR REPLACE FUNCTION on_project_invitation_responded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_title TEXT;
  v_pro_name      TEXT;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('accepted', 'declined') THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_project_title FROM projects WHERE id = NEW.project_id;
  SELECT COALESCE(company_name, full_name) INTO v_pro_name
    FROM profiles WHERE id = NEW.professional_id;

  IF NEW.status = 'accepted' THEN
    INSERT INTO notifications (
      user_id, type, title, message,
      related_user_id, related_project_id, action_url
    ) VALUES (
      NEW.client_id,
      'invitation_accepted',
      'Invitation acceptée',
      COALESCE(v_pro_name, 'Un entrepreneur')
        || ' a accepté votre invitation sur le projet "'
        || COALESCE(v_project_title, 'sans titre')
        || '" et préparera une proposition.',
      NEW.professional_id,
      NEW.project_id,
      '/project/' || NEW.project_id::text
    );
  ELSE
    INSERT INTO notifications (
      user_id, type, title, message,
      related_user_id, related_project_id, action_url
    ) VALUES (
      NEW.client_id,
      'invitation_declined',
      'Invitation déclinée',
      COALESCE(v_pro_name, 'Un entrepreneur')
        || ' a décliné votre invitation sur le projet "'
        || COALESCE(v_project_title, 'sans titre') || '".',
      NEW.professional_id,
      NEW.project_id,
      '/project/' || NEW.project_id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_project_invitation_responded ON project_invitations;
CREATE TRIGGER trg_on_project_invitation_responded
  AFTER UPDATE OF status ON project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION on_project_invitation_responded();

-- -------------------------------------------------------------------------
-- 4. RPC: respond_to_invitation
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION respond_to_invitation(
  p_invitation_id UUID,
  p_response      TEXT
) RETURNS project_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation project_invitations%ROWTYPE;
BEGIN
  IF p_response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid response: %', p_response;
  END IF;

  SELECT * INTO v_invitation
  FROM project_invitations
  WHERE id = p_invitation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invitation.professional_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to respond to this invitation';
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation already %', v_invitation.status;
  END IF;

  UPDATE project_invitations
  SET status       = p_response,
      responded_at = now()
  WHERE id = p_invitation_id
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$;

GRANT EXECUTE ON FUNCTION respond_to_invitation(UUID, TEXT) TO authenticated;

-- -------------------------------------------------------------------------
-- 5. Review replies -> notify the original client (US-066)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_review_reply_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_review reviews%ROWTYPE;
  v_pro_name TEXT;
BEGIN
  SELECT * INTO v_review FROM reviews WHERE id = NEW.review_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT COALESCE(company_name, full_name) INTO v_pro_name
    FROM profiles WHERE id = NEW.author_id;

  INSERT INTO notifications (
    user_id, type, title, message,
    related_user_id, related_project_id, action_url
  ) VALUES (
    v_review.client_id,
    'review_reply',
    'Réponse à votre avis',
    COALESCE(v_pro_name, 'L''entrepreneur')
      || ' a répondu à votre avis.',
    NEW.author_id,
    v_review.project_id,
    '/professional/' || NEW.author_id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_review_reply_inserted ON review_replies;
CREATE TRIGGER trg_on_review_reply_inserted
  AFTER INSERT ON review_replies
  FOR EACH ROW
  EXECUTE FUNCTION on_review_reply_inserted();

-- -------------------------------------------------------------------------
-- 6. Publish invitations on supabase_realtime
-- -------------------------------------------------------------------------
DO $$
DECLARE
  already_published boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'project_invitations'
  ) INTO already_published;

  IF NOT already_published THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.project_invitations';
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 7. Sanity comments
-- -------------------------------------------------------------------------
COMMENT ON TABLE project_invitations IS
  'Direct invitations from a client to a specific professional, asking them to submit a proposal on a project (US-053).';
COMMENT ON FUNCTION respond_to_invitation(UUID, TEXT) IS
  'Allows a professional to accept or decline a project invitation. Status transitions are audited via responded_at.';
