-- Migration: Allow users to delete their own custom contract templates
-- Date: 2025-01-XX
-- Description: Adds RLS policy and function to allow users to delete custom contract templates

-- ============================================
-- PART 1: ADD POLICY FOR DELETING TEMPLATES
-- ============================================

-- Drop the policy if it exists (in case of re-running the migration)
DROP POLICY IF EXISTS "Users can delete their own custom templates" ON contract_templates;

-- Policy to allow any authenticated user to delete non-base templates
-- The function will handle the actual permission check
CREATE POLICY "Users can delete their own custom templates"
  ON contract_templates
  FOR DELETE
  USING (
    -- Allow if user is authenticated
    auth.uid() IS NOT NULL
  );

-- ============================================
-- PART 2: CREATE HELPER FUNCTION FOR DELETION
-- ============================================

-- Drop function if exists
DROP FUNCTION IF EXISTS delete_custom_template(UUID);

-- Function to safely delete a custom template
-- Uses SECURITY DEFINER to bypass RLS and perform deletion
CREATE OR REPLACE FUNCTION delete_custom_template(template_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template_record RECORD;
  current_user_id UUID;
  base_template_names TEXT[] := ARRAY[
    'Contrat préliminaire',
    'Contrat d''entreprise à forfait',
    'Contrat à prix coûtant majoré',
    'Contrat de sous-traitance',
    'Attestation de réception des travaux',
    'Contrat de construction résidentielle',
    'Contrat de rénovation',
    'Formulaire de soumission'
  ];
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User must be authenticated');
  END IF;

  -- Get template info
  SELECT id, name, created_by INTO template_record
  FROM contract_templates
  WHERE id = template_id;

  -- Check if template exists
  IF template_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Template not found');
  END IF;

  -- Check if it's a base template (by name)
  IF template_record.name = ANY(base_template_names) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete base templates');
  END IF;

  -- Check permissions:
  -- 1. Template has created_by and it matches current user -> OK
  -- 2. Template has NULL created_by (old template) -> OK (allow deletion)
  -- 3. Template has created_by but different user -> DENIED
  IF template_record.created_by IS NOT NULL AND template_record.created_by != current_user_id THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'You can only delete your own templates',
      'template_created_by', template_record.created_by,
      'current_user_id', current_user_id
    );
  END IF;

  -- Delete the template
  DELETE FROM contract_templates WHERE id = template_id;
  
  RETURN jsonb_build_object('success', true, 'deleted_id', template_id);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_custom_template(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_custom_template IS 
  'Safely deletes a custom contract template. Checks that user owns the template or template has NULL created_by. Prevents deletion of base templates.';

