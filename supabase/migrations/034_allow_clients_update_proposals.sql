-- Migration: Allow clients to accept/reject proposals on their own projects
-- Date: 2025-12-05
-- Description: Creates secure functions for clients to manage proposals
-- UPDATED: Adds automatic withdrawal of other proposals when one is accepted

-- ============================================
-- FONCTION: Accepter une proposition
-- ============================================
CREATE OR REPLACE FUNCTION accept_proposal(proposal_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_proposal RECORD;
  v_project_client_id UUID;
BEGIN
  -- Récupérer la proposition
  SELECT * INTO v_proposal FROM proposals WHERE id = proposal_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposition non trouvée';
  END IF;
  
  -- Vérifier que l'utilisateur est le client du projet
  SELECT client_id INTO v_project_client_id FROM projects WHERE id = v_proposal.project_id;
  
  IF v_project_client_id != auth.uid() THEN
    RAISE EXCEPTION 'Vous n''êtes pas autorisé à accepter cette proposition';
  END IF;
  
  -- 1. Mettre à jour le statut de la proposition acceptée
  UPDATE proposals 
  SET status = 'accepted', updated_at = NOW() 
  WHERE id = proposal_uuid;
  
  -- 2. CRITIQUE: Rejeter toutes les autres propositions du même projet
  UPDATE proposals 
  SET status = 'rejected', updated_at = NOW() 
  WHERE project_id = v_proposal.project_id 
    AND id != proposal_uuid 
    AND status = 'pending';
  
  -- 3. Assigner le professionnel au projet et fermer les candidatures
  UPDATE projects 
  SET assigned_professional_id = v_proposal.professional_id,
      status = 'in_progress',
      updated_at = NOW()
  WHERE id = v_proposal.project_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTION: Refuser une proposition
-- ============================================
CREATE OR REPLACE FUNCTION reject_proposal(proposal_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_proposal RECORD;
  v_project_client_id UUID;
  v_proposals_count INTEGER;
BEGIN
  -- Récupérer la proposition
  SELECT * INTO v_proposal FROM proposals WHERE id = proposal_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposition non trouvée';
  END IF;
  
  -- Vérifier que l'utilisateur est le client du projet
  SELECT client_id INTO v_project_client_id FROM projects WHERE id = v_proposal.project_id;
  
  IF v_project_client_id != auth.uid() THEN
    RAISE EXCEPTION 'Vous n''êtes pas autorisé à refuser cette proposition';
  END IF;
  
  -- Supprimer la proposition
  DELETE FROM proposals WHERE id = proposal_uuid;
  
  -- Décrémenter le compteur de propositions
  SELECT proposals_count INTO v_proposals_count FROM projects WHERE id = v_proposal.project_id;
  IF v_proposals_count > 0 THEN
    UPDATE projects 
    SET proposals_count = proposals_count - 1,
        updated_at = NOW()
    WHERE id = v_proposal.project_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLITIQUES RLS (au cas où)
-- ============================================
-- Allow clients to update proposals on their own projects
DROP POLICY IF EXISTS "Clients can update proposals on own projects" ON proposals;
CREATE POLICY "Clients can update proposals on own projects"
  ON proposals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = proposals.project_id 
      AND projects.client_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = proposals.project_id 
      AND projects.client_id = auth.uid()
    )
  );

-- Allow clients to delete proposals on their own projects (for reject action)
DROP POLICY IF EXISTS "Clients can delete proposals on own projects" ON proposals;
CREATE POLICY "Clients can delete proposals on own projects"
  ON proposals
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = proposals.project_id 
      AND projects.client_id = auth.uid()
    )
  );
