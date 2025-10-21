-- Migration: Add favorites (shortlist) system
-- Date: 2025-10-21
-- Description: Allows clients to add professionals to their favorites/shortlist for comparison

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  priority INTEGER DEFAULT 0, -- 0 = normal, 1 = high priority
  UNIQUE(client_id, professional_id) -- Prevent duplicates
);

-- Add comments
COMMENT ON TABLE favorites IS 'Stores client favorites/shortlist of professionals';
COMMENT ON COLUMN favorites.client_id IS 'The client who added the favorite';
COMMENT ON COLUMN favorites.professional_id IS 'The professional added to favorites';
COMMENT ON COLUMN favorites.notes IS 'Optional notes from the client about this professional';
COMMENT ON COLUMN favorites.priority IS 'Priority level: 0 = normal, 1 = high';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_client 
  ON favorites(client_id);

CREATE INDEX IF NOT EXISTS idx_favorites_professional 
  ON favorites(professional_id);

CREATE INDEX IF NOT EXISTS idx_favorites_created 
  ON favorites(created_at DESC);

-- Add RLS (Row Level Security)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own favorites
CREATE POLICY "Clients can view their own favorites"
  ON favorites
  FOR SELECT
  USING (auth.uid() = client_id);

-- Policy: Clients can add favorites
CREATE POLICY "Clients can add favorites"
  ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Policy: Clients can update their own favorites (notes, priority)
CREATE POLICY "Clients can update their own favorites"
  ON favorites
  FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Policy: Clients can delete their own favorites
CREATE POLICY "Clients can delete their own favorites"
  ON favorites
  FOR DELETE
  USING (auth.uid() = client_id);

-- Policy: Professionals can see who favorited them (optional - comment out if you want this private)
CREATE POLICY "Professionals can see their favorites count"
  ON favorites
  FOR SELECT
  USING (auth.uid() = professional_id);

-- Create a view for easy querying with professional details
CREATE OR REPLACE VIEW favorites_with_details AS
SELECT 
  f.id,
  f.client_id,
  f.professional_id,
  f.created_at,
  f.notes,
  f.priority,
  p.full_name,
  p.email,
  p.phone,
  p.company_name,
  p.rbq_number,
  p.services_offered,
  p.city,
  p.region,
  p.bio,
  p.years_experience,
  p.average_rating,
  p.total_reviews,
  p.total_projects,
  p.profile_picture_url,
  p.hourly_rate_min,
  p.hourly_rate_max,
  p.availability_status,
  p.available_from,
  p.response_time_hours,
  p.activity_score,
  p.latitude,
  p.longitude
FROM favorites f
JOIN profiles p ON f.professional_id = p.id
WHERE p.user_type = 'professional';

-- Grant permissions
-- GRANT SELECT ON favorites_with_details TO authenticated;

-- Function to check if a professional is in client's favorites
CREATE OR REPLACE FUNCTION is_favorite(
  p_client_id UUID,
  p_professional_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM favorites 
    WHERE client_id = p_client_id 
      AND professional_id = p_professional_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get favorites count for a professional
CREATE OR REPLACE FUNCTION get_favorites_count(p_professional_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM favorites 
    WHERE professional_id = p_professional_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client's favorites count
CREATE OR REPLACE FUNCTION get_client_favorites_count(p_client_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM favorites 
    WHERE client_id = p_client_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment profile_views_count when added to favorites
CREATE OR REPLACE FUNCTION increment_professional_favorites()
RETURNS TRIGGER AS $$
BEGIN
  -- Optionally track this as a metric
  -- UPDATE profiles 
  -- SET profile_views_count = profile_views_count + 1
  -- WHERE id = NEW.professional_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_favorites
  AFTER INSERT ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION increment_professional_favorites();

-- Optional: Add a favorites_count column to profiles for caching
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;

COMMENT ON COLUMN profiles.favorites_count IS 'Cached count of how many clients favorited this professional';

-- Function to update favorites count cache
CREATE OR REPLACE FUNCTION update_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.professional_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET favorites_count = GREATEST(favorites_count - 1, 0)
    WHERE id = OLD.professional_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_favorites_count
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorites_count();

-- Grant function execution permissions
-- GRANT EXECUTE ON FUNCTION is_favorite TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_favorites_count TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_client_favorites_count TO authenticated;

COMMENT ON FUNCTION is_favorite IS 'Check if a professional is in a client''s favorites';
COMMENT ON FUNCTION get_favorites_count IS 'Get the number of times a professional has been favorited';
COMMENT ON FUNCTION get_client_favorites_count IS 'Get the number of favorites a client has';

