-- Migration: Add portfolio system for professionals
-- Date: 2025-10-22

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  project_date DATE,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Constraint removed - validation will be done via triggers
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_professional ON portfolio_items(professional_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_items(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_date ON portfolio_items(project_date);

-- Enable RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Trigger to validate that only professionals can have portfolio items
CREATE OR REPLACE FUNCTION validate_portfolio_professional()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is a professional
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.professional_id AND user_type = 'professional'
  ) THEN
    RAISE EXCEPTION 'Only professionals can have portfolio items';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_portfolio_professional_trigger ON portfolio_items;
CREATE TRIGGER validate_portfolio_professional_trigger
  BEFORE INSERT OR UPDATE ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_portfolio_professional();

-- RLS Policies
DROP POLICY IF EXISTS "Professionals can view their portfolio" ON portfolio_items;
CREATE POLICY "Professionals can view their portfolio"
  ON portfolio_items FOR SELECT
  USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Everyone can view professional portfolios" ON portfolio_items;
CREATE POLICY "Everyone can view professional portfolios"
  ON portfolio_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Professionals can manage their portfolio" ON portfolio_items;
CREATE POLICY "Professionals can manage their portfolio"
  ON portfolio_items FOR ALL
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_portfolio_items_updated_at ON portfolio_items;
CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Professionals can upload portfolio images" ON storage.objects;
CREATE POLICY "Professionals can upload portfolio images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-images' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Professionals can update their portfolio images" ON storage.objects;
CREATE POLICY "Professionals can update their portfolio images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Professionals can delete their portfolio images" ON storage.objects;
CREATE POLICY "Professionals can delete their portfolio images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can view portfolio images" ON storage.objects;
CREATE POLICY "Anyone can view portfolio images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

-- Comment
COMMENT ON TABLE portfolio_items IS 'Portfolio items for professionals to showcase their work';
COMMENT ON COLUMN portfolio_items.professional_id IS 'Reference to the professional profile';
COMMENT ON COLUMN portfolio_items.title IS 'Project title';
COMMENT ON COLUMN portfolio_items.description IS 'Project description';
COMMENT ON COLUMN portfolio_items.image_url IS 'URL to project image';
COMMENT ON COLUMN portfolio_items.project_date IS 'Date when the project was completed';
COMMENT ON COLUMN portfolio_items.category IS 'Project category';

