ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS required_documents jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.projects.required_documents IS
  'Array of tender submission documents required from bidders';
