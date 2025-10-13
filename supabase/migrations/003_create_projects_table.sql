-- Create enum for project status
CREATE TYPE project_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  city TEXT,
  region TEXT,
  postal_code TEXT,
  status project_status NOT NULL DEFAULT 'open',
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  proposals_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  CONSTRAINT valid_budget CHECK (budget_max IS NULL OR budget_min IS NULL OR budget_max >= budget_min),
  CONSTRAINT client_is_client CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = client_id AND user_type = 'client'
    )
  )
);

-- Create indexes
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_city ON projects(city);
CREATE INDEX idx_projects_region ON projects(region);
CREATE INDEX idx_projects_created ON projects(created_at DESC);
CREATE INDEX idx_projects_budget ON projects(budget_min, budget_max);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can read open projects
CREATE POLICY "Anyone can read open projects"
  ON projects
  FOR SELECT
  USING (status = 'open' OR auth.uid() = client_id);

-- Clients can create their own projects
CREATE POLICY "Clients can create projects"
  ON projects
  FOR INSERT
  WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'client'
    )
  );

-- Clients can update their own projects
CREATE POLICY "Clients can update own projects"
  ON projects
  FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Clients can delete their own projects
CREATE POLICY "Clients can delete own projects"
  ON projects
  FOR DELETE
  USING (auth.uid() = client_id);

-- Trigger to update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  estimated_budget DECIMAL(12,2),
  estimated_duration_days INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT professional_is_professional CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = professional_id AND user_type = 'professional'
    )
  ),
  CONSTRAINT unique_proposal UNIQUE (project_id, professional_id)
);

-- Create indexes for proposals
CREATE INDEX idx_proposals_project ON proposals(project_id);
CREATE INDEX idx_proposals_professional ON proposals(professional_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- Enable RLS on proposals
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proposals

-- Project owner and proposal creator can read proposals
CREATE POLICY "Users can read relevant proposals"
  ON proposals
  FOR SELECT
  USING (
    auth.uid() = professional_id OR
    auth.uid() IN (
      SELECT client_id FROM projects WHERE id = project_id
    )
  );

-- Professionals can create proposals
CREATE POLICY "Professionals can create proposals"
  ON proposals
  FOR INSERT
  WITH CHECK (
    auth.uid() = professional_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'professional' AND is_rbq_verified = TRUE
    )
  );

-- Professionals can update their own proposals
CREATE POLICY "Professionals can update own proposals"
  ON proposals
  FOR UPDATE
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

-- Professionals can delete their own proposals
CREATE POLICY "Professionals can delete own proposals"
  ON proposals
  FOR DELETE
  USING (auth.uid() = professional_id);

-- Trigger to update proposals count
CREATE OR REPLACE FUNCTION update_project_proposals_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET 
    proposals_count = (
      SELECT COUNT(*)
      FROM proposals
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on proposals insert/delete
DROP TRIGGER IF EXISTS update_proposals_count_on_change ON proposals;
CREATE TRIGGER update_proposals_count_on_change
  AFTER INSERT OR DELETE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_project_proposals_count();

-- Create project images table
CREATE TABLE IF NOT EXISTS project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for project images
CREATE INDEX idx_project_images_project ON project_images(project_id);

-- Enable RLS on project images
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project images

-- Anyone can read project images for open projects
CREATE POLICY "Anyone can read project images"
  ON project_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND (status = 'open' OR client_id = auth.uid())
    )
  );

-- Project owners can manage their project images
CREATE POLICY "Owners can insert project images"
  ON project_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND client_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update project images"
  ON project_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND client_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete project images"
  ON project_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND client_id = auth.uid()
    )
  );

-- Storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for projects bucket
CREATE POLICY "Anyone can view project images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'projects');

CREATE POLICY "Clients can upload project images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'projects' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Clients can update their project images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'projects' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Clients can delete their project images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'projects' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to increment views count
CREATE OR REPLACE FUNCTION increment_project_views(project_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET views_count = views_count + 1
  WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

