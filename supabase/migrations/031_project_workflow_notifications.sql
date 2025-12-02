-- Migration: Project Workflow and Notifications
-- Date: 2025-01-XX
-- Description: Complete workflow for proposals, contracts, and project progress

-- ============================================
-- PART 1: ADD PROJECT STATUS AND ASSIGNED PROFESSIONAL
-- ============================================

-- Add assigned_professional_id to projects if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'assigned_professional_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN assigned_professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add contract_id to projects if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add progress tracking fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE projects ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'current_phase'
  ) THEN
    ALTER TABLE projects ADD COLUMN current_phase VARCHAR(100);
  END IF;
END $$;

-- Create project progress status type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_progress_status') THEN
    CREATE TYPE project_progress_status AS ENUM (
      'not_started',
      'in_progress', 
      'paused',
      'completed',
      'cancelled'
    );
  END IF;
END $$;

-- Add progress_status column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'progress_status'
  ) THEN
    ALTER TABLE projects ADD COLUMN progress_status project_progress_status DEFAULT 'not_started';
  END IF;
END $$;

-- ============================================
-- PART 2: CREATE PROJECT REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS project_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  report_type VARCHAR(50) DEFAULT 'progress', -- progress, issue, completion, photo
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  photos JSONB DEFAULT '[]', -- Array of photo URLs
  attachments JSONB DEFAULT '[]', -- Array of attachment URLs
  is_read_by_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_reports_project ON project_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reports_professional ON project_reports(professional_id);
CREATE INDEX IF NOT EXISTS idx_project_reports_created ON project_reports(created_at DESC);

ALTER TABLE project_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_reports
DROP POLICY IF EXISTS "Professionals can manage their reports" ON project_reports;
CREATE POLICY "Professionals can manage their reports"
  ON project_reports
  FOR ALL
  USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view reports for their projects" ON project_reports;
CREATE POLICY "Clients can view reports for their projects"
  ON project_reports
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can update read status" ON project_reports;
CREATE POLICY "Clients can update read status"
  ON project_reports
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  );

-- ============================================
-- PART 3: NOTIFICATION FUNCTIONS
-- ============================================

-- Function to create notification when proposal is accepted
CREATE OR REPLACE FUNCTION notify_proposal_accepted()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
  client_name TEXT;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- Get project title and client name
    SELECT p.title, pr.full_name 
    INTO project_title, client_name
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
      NEW.project_id::UUID,
      NEW.project_id,
      '/pro/dashboard',
      jsonb_build_object(
        'project_id', NEW.project_id,
        'proposal_id', NEW.id,
        'project_title', project_title,
        'client_name', client_name
      )
    );

    -- Update project with assigned professional
    UPDATE projects 
    SET 
      assigned_professional_id = NEW.professional_id,
      status = 'in_progress'
    WHERE id = NEW.project_id;
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for proposals table
DROP TRIGGER IF EXISTS trigger_notify_proposal_accepted ON proposals;
CREATE TRIGGER trigger_notify_proposal_accepted
  AFTER UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION notify_proposal_accepted();

-- Same for contract_proposals
DROP TRIGGER IF EXISTS trigger_notify_contract_proposal_accepted ON contract_proposals;
CREATE TRIGGER trigger_notify_contract_proposal_accepted
  AFTER UPDATE ON contract_proposals
  FOR EACH ROW
  EXECUTE FUNCTION notify_proposal_accepted();

-- ============================================
-- PART 4: CONTRACT NOTIFICATIONS
-- ============================================

-- Function to notify when contract is created and ready for signature
CREATE OR REPLACE FUNCTION notify_contract_created()
RETURNS TRIGGER AS $$
DECLARE
  professional_name TEXT;
  project_title TEXT;
BEGIN
  -- Get professional name and project title
  SELECT pr.full_name, p.title
  INTO professional_name, project_title
  FROM profiles pr
  LEFT JOIN projects p ON p.id = NEW.project_id
  WHERE pr.id = NEW.professional_id;

  -- Notify client about new contract to sign
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
    NEW.client_id,
    'contract_created',
    'Nouveau contrat à signer 📝',
    COALESCE(professional_name, 'Un professionnel') || ' vous a envoyé un contrat pour "' || COALESCE(project_title, NEW.title) || '"',
    NEW.professional_id,
    NEW.project_id,
    '/contracts?contract=' || NEW.id,
    jsonb_build_object(
      'contract_id', NEW.id,
      'project_id', NEW.project_id,
      'professional_name', professional_name,
      'contract_title', NEW.title,
      'total_amount', NEW.total_amount
    )
  );

  -- Update project with contract reference
  IF NEW.project_id IS NOT NULL THEN
    UPDATE projects SET contract_id = NEW.id WHERE id = NEW.project_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_contract_created ON contracts;
CREATE TRIGGER trigger_notify_contract_created
  AFTER INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION notify_contract_created();

-- Function to notify when contract is fully signed
CREATE OR REPLACE FUNCTION notify_contract_signed()
RETURNS TRIGGER AS $$
DECLARE
  other_party_id UUID;
  signer_name TEXT;
  project_title TEXT;
BEGIN
  -- Check if someone just signed
  IF (NEW.client_signed_at IS NOT NULL AND OLD.client_signed_at IS NULL) OR 
     (NEW.professional_signed_at IS NOT NULL AND OLD.professional_signed_at IS NULL) THEN
    
    -- Get project title
    SELECT title INTO project_title FROM projects WHERE id = NEW.project_id;

    -- Determine who signed and who to notify
    IF NEW.client_signed_at IS NOT NULL AND OLD.client_signed_at IS NULL THEN
      -- Client just signed, notify professional
      SELECT full_name INTO signer_name FROM profiles WHERE id = NEW.client_id;
      
      INSERT INTO notifications (
        user_id, type, title, message,
        related_user_id, related_project_id, action_url, metadata
      ) VALUES (
        NEW.professional_id,
        'contract_signed',
        'Contrat signé par le client ✍️',
        signer_name || ' a signé le contrat pour "' || COALESCE(project_title, NEW.title) || '"',
        NEW.client_id, NEW.project_id,
        '/contracts?contract=' || NEW.id,
        jsonb_build_object('contract_id', NEW.id, 'signed_by', 'client')
      );
    END IF;

    IF NEW.professional_signed_at IS NOT NULL AND OLD.professional_signed_at IS NULL THEN
      -- Professional just signed, notify client
      SELECT full_name INTO signer_name FROM profiles WHERE id = NEW.professional_id;
      
      INSERT INTO notifications (
        user_id, type, title, message,
        related_user_id, related_project_id, action_url, metadata
      ) VALUES (
        NEW.client_id,
        'contract_signed',
        'Contrat signé par le professionnel ✍️',
        signer_name || ' a signé le contrat pour "' || COALESCE(project_title, NEW.title) || '"',
        NEW.professional_id, NEW.project_id,
        '/contracts?contract=' || NEW.id,
        jsonb_build_object('contract_id', NEW.id, 'signed_by', 'professional')
      );
    END IF;
  END IF;

  -- If both parties have signed, notify both and update project
  IF NEW.client_signed_at IS NOT NULL AND NEW.professional_signed_at IS NOT NULL AND
     (OLD.client_signed_at IS NULL OR OLD.professional_signed_at IS NULL) THEN
    
    -- Update contract status
    IF NEW.status <> 'signed' THEN
      -- This will be handled by another trigger, but we set it here too
      NEW.status := 'signed';
      NEW.signed_at := NOW();
    END IF;

    -- Update project status to in_progress if contract start_date is today or past
    IF NEW.project_id IS NOT NULL AND (NEW.start_date IS NULL OR NEW.start_date <= CURRENT_DATE) THEN
      UPDATE projects 
      SET progress_status = 'in_progress'
      WHERE id = NEW.project_id;
    END IF;

    -- Notify both parties that contract is fully signed
    SELECT title INTO project_title FROM projects WHERE id = NEW.project_id;

    INSERT INTO notifications (
      user_id, type, title, message,
      related_project_id, action_url, metadata
    ) VALUES 
    (
      NEW.client_id,
      'contract_fully_signed',
      'Contrat finalisé ! 🎉',
      'Le contrat pour "' || COALESCE(project_title, NEW.title) || '" est maintenant signé par les deux parties. Le projet peut commencer !',
      NEW.project_id,
      '/contracts?contract=' || NEW.id,
      jsonb_build_object('contract_id', NEW.id, 'start_date', NEW.start_date)
    ),
    (
      NEW.professional_id,
      'contract_fully_signed',
      'Contrat finalisé ! 🎉',
      'Le contrat pour "' || COALESCE(project_title, NEW.title) || '" est maintenant signé. Vous pouvez commencer le projet !',
      NEW.project_id,
      '/pro/contracts',
      jsonb_build_object('contract_id', NEW.id, 'start_date', NEW.start_date)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_contract_signed ON contracts;
CREATE TRIGGER trigger_notify_contract_signed
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION notify_contract_signed();

-- ============================================
-- PART 5: PROJECT REPORT NOTIFICATIONS
-- ============================================

-- Function to notify client when professional sends a report
CREATE OR REPLACE FUNCTION notify_project_report()
RETURNS TRIGGER AS $$
DECLARE
  professional_name TEXT;
  project_title TEXT;
  client_id UUID;
BEGIN
  -- Get professional name, project title and client id
  SELECT pr.full_name, p.title, p.client_id
  INTO professional_name, project_title, client_id
  FROM profiles pr
  JOIN projects p ON p.id = NEW.project_id
  WHERE pr.id = NEW.professional_id;

  -- Notify client
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
    client_id,
    'project_report',
    'Nouveau rapport de projet 📊',
    professional_name || ' a envoyé un rapport pour "' || project_title || '" - ' || NEW.title,
    NEW.professional_id,
    NEW.project_id,
    '/dashboard?project=' || NEW.project_id,
    jsonb_build_object(
      'report_id', NEW.id,
      'project_id', NEW.project_id,
      'report_type', NEW.report_type,
      'progress_percentage', NEW.progress_percentage
    )
  );

  -- Update project progress if specified
  IF NEW.progress_percentage IS NOT NULL THEN
    UPDATE projects 
    SET progress_percentage = NEW.progress_percentage
    WHERE id = NEW.project_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_project_report ON project_reports;
CREATE TRIGGER trigger_notify_project_report
  AFTER INSERT ON project_reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_report();

-- ============================================
-- PART 6: ADD NOTIFICATION TYPES
-- ============================================

-- Add new notification types if not exist
DO $$
BEGIN
  -- Check and add new types
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'proposal_rejected' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'proposal_rejected';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'contract_created' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contract_created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'contract_fully_signed' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contract_fully_signed';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'project_report' AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'project_report';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PART 7: FUNCTION TO UPDATE PROJECT PROGRESS
-- ============================================

CREATE OR REPLACE FUNCTION update_project_progress(
  p_project_id UUID,
  p_progress_percentage INTEGER,
  p_current_phase VARCHAR DEFAULT NULL,
  p_progress_status project_progress_status DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  project_professional_id UUID;
BEGIN
  -- Verify caller is the assigned professional
  SELECT assigned_professional_id INTO project_professional_id
  FROM projects WHERE id = p_project_id;

  IF project_professional_id IS NULL OR project_professional_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the assigned professional can update project progress';
  END IF;

  -- Update project
  UPDATE projects
  SET 
    progress_percentage = COALESCE(p_progress_percentage, progress_percentage),
    current_phase = COALESCE(p_current_phase, current_phase),
    progress_status = COALESCE(p_progress_status, progress_status),
    updated_at = NOW()
  WHERE id = p_project_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_project_progress TO authenticated;

-- ============================================
-- PART 8: COMMENTS
-- ============================================

COMMENT ON TABLE project_reports IS 'Reports sent by professionals to clients about project progress';
COMMENT ON COLUMN projects.assigned_professional_id IS 'The professional assigned to this project after proposal acceptance';
COMMENT ON COLUMN projects.contract_id IS 'The associated contract for this project';
COMMENT ON COLUMN projects.progress_percentage IS 'Current progress percentage (0-100)';
COMMENT ON COLUMN projects.current_phase IS 'Current phase of the project';
COMMENT ON COLUMN projects.progress_status IS 'Current status of project progress';


