-- Migration: Allow professionals to create contracts
-- Date: 2025-01-XX
-- Description: Fix RLS policy to allow professionals to create contracts for projects they are assigned to

-- ============================================
-- FIX SELECT POLICY (view contracts)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own contracts" ON contracts;

CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = professional_id);

-- ============================================
-- FIX INSERT POLICY (create contracts)
-- ============================================
-- Drop the existing insert policies
DROP POLICY IF EXISTS "Users can create contracts for their projects" ON contracts;
DROP POLICY IF EXISTS "Users can create contracts" ON contracts;

-- Create new policy that allows:
-- 1. Clients to create contracts for their own projects
-- 2. Professionals to create contracts for projects where they are assigned
CREATE POLICY "Users can create contracts"
  ON contracts FOR INSERT
  WITH CHECK (
    -- Client creating contract for their project
    (
      auth.uid() = client_id AND 
      project_id IN (
        SELECT id FROM projects WHERE client_id = auth.uid()
      )
    )
    OR
    -- Professional creating contract for a project they are assigned to
    (
      auth.uid() = professional_id AND
      project_id IN (
        SELECT id FROM projects 
        WHERE assigned_professional_id = auth.uid()
      )
    )
  );

-- Also add a policy for professionals to create contracts without a project
-- (for standalone contracts or when project is null)
DROP POLICY IF EXISTS "Professionals can create standalone contracts" ON contracts;
CREATE POLICY "Professionals can create standalone contracts"
  ON contracts FOR INSERT
  WITH CHECK (
    auth.uid() = professional_id AND
    project_id IS NULL AND
    auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'professional')
  );

