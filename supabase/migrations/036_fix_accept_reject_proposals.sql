-- Migration: Fix accept/reject proposal functions with proper permissions
-- Date: 2025-12-09
-- Description: Corrects the accept_proposal and reject_proposal functions
--              Removes problematic triggers that use 'withdrawn' status

-- =============================================
-- STEP 1: Remove problematic triggers and functions
-- These used 'withdrawn' which doesn't exist in proposal_status enum
-- =============================================

DROP TRIGGER IF EXISTS trigger_withdraw_other_proposals ON proposals;
DROP TRIGGER IF EXISTS trigger_notify_proposal_accepted ON proposals;
DROP TRIGGER IF EXISTS trigger_proposal_status_change ON proposals;
DROP TRIGGER IF EXISTS on_proposal_status_change ON proposals;
DROP TRIGGER IF EXISTS trigger_notify_contract_proposal_accepted ON contract_proposals;

DROP FUNCTION IF EXISTS withdraw_other_proposals() CASCADE;
DROP FUNCTION IF EXISTS notify_proposal_accepted() CASCADE;

-- =============================================
-- STEP 2: Drop and recreate accept_proposal function
-- =============================================

DROP FUNCTION IF EXISTS accept_proposal(UUID) CASCADE;

CREATE OR REPLACE FUNCTION accept_proposal(proposal_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_proposal RECORD;
  v_project RECORD;
  v_other_proposal RECORD;
BEGIN
  -- Get the proposal
  SELECT * INTO v_proposal FROM proposals WHERE id = proposal_uuid;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Proposition non trouvée'; 
  END IF;
  IF v_proposal.status != 'pending' THEN 
    RAISE EXCEPTION 'Proposition déjà traitée'; 
  END IF;
  
  -- Get the project and verify ownership
  SELECT * INTO v_project FROM projects WHERE id = v_proposal.project_id;
  IF v_project.client_id != auth.uid() THEN 
    RAISE EXCEPTION 'Non autorisé'; 
  END IF;
  
  -- Accept this proposal
  UPDATE proposals 
  SET status = 'accepted', updated_at = NOW() 
  WHERE id = proposal_uuid;
  
  -- Reject all other pending proposals for the same project
  FOR v_other_proposal IN 
    SELECT id, professional_id FROM proposals 
    WHERE project_id = v_proposal.project_id 
      AND id != proposal_uuid 
      AND status = 'pending'
  LOOP
    -- Update status to 'rejected' (exists in enum)
    UPDATE proposals 
    SET status = 'rejected', updated_at = NOW() 
    WHERE id = v_other_proposal.id;
    
    -- Notify the professional
    INSERT INTO notifications (user_id, type, title, message, related_project_id, action_url)
    VALUES (
      v_other_proposal.professional_id, 
      'proposal_rejected', 
      'Projet attribué à un autre professionnel', 
      'Le projet "' || v_project.title || '" a été attribué à un autre professionnel.',
      v_proposal.project_id, 
      '/projects'
    );
  END LOOP;
  
  -- Assign professional to project and update status
  UPDATE projects 
  SET 
    assigned_professional_id = v_proposal.professional_id, 
    status = 'in_progress', 
    updated_at = NOW()
  WHERE id = v_proposal.project_id;
  
  -- Notify the accepted professional
  INSERT INTO notifications (user_id, type, title, message, related_project_id, action_url)
  VALUES (
    v_proposal.professional_id, 
    'proposal_accepted', 
    'Proposition acceptée ! 🎉',
    'Votre proposition pour "' || v_project.title || '" a été acceptée !',
    v_proposal.project_id, 
    '/pro/my-projects'
  );
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN 
  RAISE EXCEPTION 'Erreur: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 3: Drop and recreate reject_proposal function
-- =============================================

DROP FUNCTION IF EXISTS reject_proposal(UUID) CASCADE;

CREATE OR REPLACE FUNCTION reject_proposal(proposal_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE 
  v_proposal RECORD; 
  v_project RECORD;
BEGIN
  -- Get the proposal
  SELECT * INTO v_proposal FROM proposals WHERE id = proposal_uuid;
  IF NOT FOUND OR v_proposal.status != 'pending' THEN 
    RAISE EXCEPTION 'Proposition invalide'; 
  END IF;
  
  -- Get the project and verify ownership
  SELECT * INTO v_project FROM projects WHERE id = v_proposal.project_id;
  IF v_project.client_id != auth.uid() THEN 
    RAISE EXCEPTION 'Non autorisé'; 
  END IF;
  
  -- Notify the professional
  INSERT INTO notifications (user_id, type, title, message, related_project_id, action_url)
  VALUES (
    v_proposal.professional_id, 
    'proposal_rejected', 
    'Proposition non retenue',
    'Votre proposition pour "' || v_project.title || '" n''a pas été retenue.',
    v_proposal.project_id, 
    '/projects'
  );
  
  -- Delete the proposal
  DELETE FROM proposals WHERE id = proposal_uuid;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN 
  RAISE EXCEPTION 'Erreur: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 4: Grant permissions
-- =============================================

GRANT EXECUTE ON FUNCTION accept_proposal(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_proposal(UUID) TO authenticated;

-- =============================================
-- STEP 5: Add documentation
-- =============================================

COMMENT ON FUNCTION accept_proposal IS 'Accepts a proposal: updates status, assigns professional to project, rejects other proposals, sends notifications';
COMMENT ON FUNCTION reject_proposal IS 'Rejects a proposal: deletes it and sends notification to professional';
