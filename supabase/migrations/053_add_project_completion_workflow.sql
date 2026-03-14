-- Migration 053: Project completion workflow
-- Date: 2025-02-XX
-- Description: Adds the project completion workflow with review prompts (US-038, US-039).
--   - completion_requested_at timestamp for projects
--   - completion_confirmed_at for client confirmation
--   - Function to complete a project and trigger review notification

-- ============================================================
-- PART 1: Project completion fields
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'completion_requested_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN completion_requested_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'completion_confirmed_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN completion_confirmed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'completion_notes'
  ) THEN
    ALTER TABLE projects ADD COLUMN completion_notes TEXT;
  END IF;
END $$;

COMMENT ON COLUMN projects.completion_requested_at IS
  'Timestamp when professional requested project completion (US-038)';
COMMENT ON COLUMN projects.completion_confirmed_at IS
  'Timestamp when client confirmed project completion (US-038)';
COMMENT ON COLUMN projects.completion_notes IS
  'Notes from professional about project completion';

-- ============================================================
-- PART 2: Project completion notification type
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'project_completed'
      AND enumtypid = 'notification_type'::regtype
  ) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'project_completed';
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'review_requested'
      AND enumtypid = 'notification_type'::regtype
  ) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'review_requested';
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PART 3: Function to mark project as complete (US-038)
-- ============================================================

CREATE OR REPLACE FUNCTION complete_project(
  p_project_id  UUID,
  p_notes       TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_project RECORD;
  v_professional_name TEXT;
BEGIN
  -- Get project details
  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;

  -- Verify caller is the assigned professional or client
  IF v_project.assigned_professional_id != auth.uid()
    AND v_project.client_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Professional requests completion
  IF v_project.assigned_professional_id = auth.uid() THEN
    UPDATE projects
    SET
      completion_requested_at = NOW(),
      completion_notes = p_notes,
      updated_at = NOW()
    WHERE id = p_project_id;

    -- Get professional name for notification
    SELECT full_name INTO v_professional_name
    FROM profiles WHERE id = auth.uid();

    -- Notify client to confirm
    INSERT INTO notifications (
      user_id, type, title, message,
      related_user_id, related_project_id, action_url, metadata
    ) VALUES (
      v_project.client_id,
      'project_completed',
      'Projet terminé - Confirmation requise ✅',
      v_professional_name || ' a marqué le projet "' || v_project.title || '" comme terminé. Veuillez confirmer.',
      auth.uid(),
      p_project_id,
      '/dashboard?project=' || p_project_id,
      jsonb_build_object('project_id', p_project_id, 'action', 'confirm_completion')
    );
  END IF;

  -- Client confirms completion
  IF v_project.client_id = auth.uid()
    AND v_project.completion_requested_at IS NOT NULL THEN
    UPDATE projects
    SET
      status = 'completed',
      completion_confirmed_at = NOW(),
      progress_percentage = 100,
      updated_at = NOW()
    WHERE id = p_project_id;

    -- Notify professional
    INSERT INTO notifications (
      user_id, type, title, message,
      related_project_id, action_url, metadata
    ) VALUES (
      v_project.assigned_professional_id,
      'project_completed',
      'Projet confirmé comme terminé 🎉',
      'Le projet "' || v_project.title || '" a été confirmé comme terminé par le client !',
      p_project_id,
      '/pro/my-projects',
      jsonb_build_object('project_id', p_project_id)
    );

    -- Send review request to client (US-039)
    INSERT INTO notifications (
      user_id, type, title, message,
      related_project_id, action_url, metadata
    ) VALUES (
      v_project.client_id,
      'review_requested',
      'Évaluez votre expérience ⭐',
      'Comment s''est passé le projet "' || v_project.title || '" ? Partagez votre avis !',
      p_project_id,
      '/professionals/' || v_project.assigned_professional_id || '?review=true',
      jsonb_build_object(
        'project_id', p_project_id,
        'professional_id', v_project.assigned_professional_id
      )
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION complete_project(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION complete_project IS
  'Handles project completion workflow: professional marks complete, client confirms (US-038, US-039)';
