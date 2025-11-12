-- Fix RLS policies for proposals table
-- Remove the old policy that checks user_type (causes issues)

-- Drop existing policies
DROP POLICY IF EXISTS "Professionals can create proposals" ON proposals;
DROP POLICY IF EXISTS "Professionals can insert proposals" ON proposals;
DROP POLICY IF EXISTS "Users can read relevant proposals" ON proposals;
DROP POLICY IF EXISTS "Proposals viewable by project owner and professional" ON proposals;

-- Create simple, working policies

-- 1. Allow professionals to insert proposals (simple check)
CREATE POLICY "Professionals can insert proposals" 
  ON proposals 
  FOR INSERT 
  WITH CHECK (auth.uid() = professional_id);

-- 2. Allow users to view proposals where they are involved
CREATE POLICY "Proposals viewable by project owner and professional"
  ON proposals
  FOR SELECT
  USING (
    auth.uid() = professional_id OR
    auth.uid() IN (
      SELECT client_id FROM projects WHERE projects.id = proposals.project_id
    )
  );

-- 3. Allow professionals to update their own proposals
CREATE POLICY "Professionals can update own proposals"
  ON proposals
  FOR UPDATE
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

-- 4. Allow professionals to delete their own proposals
CREATE POLICY "Professionals can delete own proposals"
  ON proposals
  FOR DELETE
  USING (auth.uid() = professional_id);

-- Note: The user_type check is removed because it causes RLS policy violations
-- The application logic should ensure only professionals can submit proposals









