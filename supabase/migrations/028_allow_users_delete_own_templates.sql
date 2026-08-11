-- Migration: Allow professionals to delete only their own custom templates.

-- The original contract migration used a FOR ALL policy that let every
-- professional modify every template. Replace it with owner-scoped policies.
DROP POLICY IF EXISTS "Professionals can manage contract templates"
  ON public.contract_templates;
DROP POLICY IF EXISTS "Users can delete their own custom templates"
  ON public.contract_templates;
DROP POLICY IF EXISTS "Professionals can create own contract templates"
  ON public.contract_templates;
DROP POLICY IF EXISTS "Professionals can update own contract templates"
  ON public.contract_templates;

CREATE POLICY "Professionals can create own contract templates"
  ON public.contract_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.user_type = 'professional'::public.user_type
    )
  );

CREATE POLICY "Professionals can update own contract templates"
  ON public.contract_templates
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own custom templates"
  ON public.contract_templates
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP FUNCTION IF EXISTS public.delete_custom_template(uuid);

CREATE FUNCTION public.delete_custom_template(template_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := (SELECT auth.uid());
  deleted_template_id uuid;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = current_user_id
      AND profile.user_type = 'professional'::public.user_type
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only professionals can delete custom templates'
    );
  END IF;

  DELETE FROM public.contract_templates
  WHERE id = template_id
    AND created_by = current_user_id
  RETURNING id INTO deleted_template_id;

  IF deleted_template_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Template not found or not owned by the current user'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', deleted_template_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_custom_template(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_custom_template(uuid)
  TO authenticated;

COMMENT ON FUNCTION public.delete_custom_template(uuid) IS
  'Deletes only a custom contract template owned by the authenticated professional.';
