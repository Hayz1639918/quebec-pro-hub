-- Migration: Fix notify_proposal_accepted function
-- Date: 2025-12-05
-- Description: Corrects bug where project_id was used instead of client_id for related_user_id

-- Corriger la fonction notify_proposal_accepted
CREATE OR REPLACE FUNCTION notify_proposal_accepted()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
  client_name TEXT;
  project_client_id UUID;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- Get project title, client name and client_id
    SELECT p.title, pr.full_name, p.client_id 
    INTO project_title, client_name, project_client_id
    FROM projects p
    JOIN profiles pr ON pr.id = p.client_id
    WHERE p.id = NEW.project_id;

    -- Create notification for professional
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_user_id,
      related_project_id,
      action_url,
      metadata
    ) VALUES (
      NEW.professional_id,
      'proposal_accepted',
      'Proposition acceptée ! 🎉',
      client_name || ' a accepté votre proposition pour le projet "' || project_title || '"',
      project_client_id,  -- CORRIGÉ: utilise client_id au lieu de project_id
      NEW.project_id,
      '/pro/dashboard',
      jsonb_build_object(
        'project_id', NEW.project_id,
        'proposal_id', NEW.id,
        'project_title', project_title,
        'client_name', client_name
      )
    );

    -- Note: L'assignation au projet est maintenant gérée par la fonction accept_proposal()
  END IF;

  -- Notify when proposal is rejected
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status <> 'rejected') THEN
    SELECT p.title INTO project_title
    FROM projects p WHERE p.id = NEW.project_id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_project_id,
      action_url,
      metadata
    ) VALUES (
      NEW.professional_id,
      'proposal_rejected',
      'Proposition non retenue',
      'Votre proposition pour le projet "' || project_title || '" n''a pas été retenue',
      NEW.project_id,
      '/projects',
      jsonb_build_object(
        'project_id', NEW.project_id,
        'proposal_id', NEW.id,
        'project_title', project_title
      )
    );
  END IF;

  -- Note: 'withdrawn' status removed - rejection notifications are handled by accept_proposal function

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
