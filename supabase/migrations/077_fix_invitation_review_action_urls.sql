-- =========================================================================
-- Migration 077: Fix action_url routes for invitation + review-reply notifs
-- -------------------------------------------------------------------------
-- Migration 075 generated client-facing notification links using PLURAL
-- routes that do not exist in the SPA router:
--   * '/projects/<id>'      -> the real route is '/project/:id'
--   * '/professionals/<id>' -> the real route is '/professional/:id'
-- Both produced a 404 when the client clicked the notification.
--
-- This migration:
--   1. Recreates on_project_invitation_responded() with '/project/<id>'.
--   2. Recreates on_review_reply_inserted() with '/professional/<id>'.
--   3. Backfills the action_url of notifications already created by 075.
-- =========================================================================

-- 1. invitation accepted / declined -> notify the client
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

-- 2. review reply -> notify the original client
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

-- 3. Backfill notifications already created with the wrong (plural) routes.
UPDATE notifications
SET action_url = '/project/' || substring(action_url from '/projects/(.*)$')
WHERE action_url LIKE '/projects/%';

UPDATE notifications
SET action_url = '/professional/' || substring(action_url from '/professionals/(.*)$')
WHERE action_url LIKE '/professionals/%'
  AND type = 'review_reply';
