-- Migration: Subcontractors and tasks
-- Date: 2025-10-22

-- Create types only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subcontractor_status') THEN
        CREATE TYPE subcontractor_status AS ENUM ('invited','active','removed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('todo','in_progress','done');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  status subcontractor_status NOT NULL DEFAULT 'invited'
);

CREATE TABLE IF NOT EXISTS subcontractor_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status task_status NOT NULL DEFAULT 'todo',
  visible_to_subcontractor BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcontractors_owner ON subcontractors(owner_professional_id);
CREATE INDEX IF NOT EXISTS idx_tasks_subcontractor ON subcontractor_tasks(subcontractor_id);

ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_tasks ENABLE ROW LEVEL SECURITY;

-- Owner can manage their subcontractors
DROP POLICY IF EXISTS "Owner can view subcontractors" ON subcontractors;
CREATE POLICY "Owner can view subcontractors"
  ON subcontractors FOR SELECT
  USING (owner_professional_id = auth.uid());

DROP POLICY IF EXISTS "Owner can manage subcontractors" ON subcontractors;
CREATE POLICY "Owner can manage subcontractors"
  ON subcontractors FOR ALL
  USING (owner_professional_id = auth.uid())
  WITH CHECK (owner_professional_id = auth.uid());

-- Tasks
DROP POLICY IF EXISTS "Owner and subcontractor can view tasks" ON subcontractor_tasks;
CREATE POLICY "Owner and subcontractor can view tasks"
  ON subcontractor_tasks FOR SELECT
  USING (
    subcontractor_id IN (SELECT id FROM subcontractors WHERE owner_professional_id = auth.uid())
    OR (
      visible_to_subcontractor = TRUE AND
      subcontractor_id IN (
        SELECT s.id FROM subcontractors s WHERE s.id = subcontractor_id
      )
    )
  );

DROP POLICY IF EXISTS "Owner can manage tasks" ON subcontractor_tasks;
CREATE POLICY "Owner can manage tasks"
  ON subcontractor_tasks FOR ALL
  USING (
    subcontractor_id IN (SELECT id FROM subcontractors WHERE owner_professional_id = auth.uid())
  )
  WITH CHECK (
    subcontractor_id IN (SELECT id FROM subcontractors WHERE owner_professional_id = auth.uid())
  );

