-- Add fields for marketplace functionality
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_projects INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Create index for location-based searches
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region);

-- Create index for rating-based sorting
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(average_rating DESC);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID, -- Future reference to projects table
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_users CHECK (professional_id != client_id)
);

-- Create indexes for reviews
CREATE INDEX idx_reviews_professional ON reviews(professional_id);
CREATE INDEX idx_reviews_client ON reviews(client_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
  ON reviews
  FOR SELECT
  USING (true);

-- Clients can insert reviews for professionals
CREATE POLICY "Clients can insert reviews"
  ON reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'client'
    )
  );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews
  FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON reviews
  FOR DELETE
  USING (auth.uid() = client_id);

-- Function to update professional's average rating
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE professional_id = COALESCE(NEW.professional_id, OLD.professional_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE professional_id = COALESCE(NEW.professional_id, OLD.professional_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.professional_id, OLD.professional_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings on review insert/update/delete
DROP TRIGGER IF EXISTS update_rating_on_review_change ON reviews;
CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating();

-- Create portfolio items table (for professionals to showcase their work)
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  project_date DATE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for portfolio
CREATE INDEX idx_portfolio_professional ON portfolio_items(professional_id);

-- Enable RLS on portfolio
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Portfolio policies
-- Anyone can read portfolio items
CREATE POLICY "Anyone can read portfolio"
  ON portfolio_items
  FOR SELECT
  USING (true);

-- Professionals can manage their own portfolio
CREATE POLICY "Professionals can insert own portfolio"
  ON portfolio_items
  FOR INSERT
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can update own portfolio"
  ON portfolio_items
  FOR UPDATE
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can delete own portfolio"
  ON portfolio_items
  FOR DELETE
  USING (auth.uid() = professional_id);

-- Storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio bucket
CREATE POLICY "Anyone can view portfolio images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'portfolio');

CREATE POLICY "Professionals can upload portfolio images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Professionals can update their portfolio images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'portfolio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Professionals can delete their portfolio images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'portfolio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

