-- Migration: Add atomic view counter increment function
-- Date: 2025-12-09
-- Description: Creates a function for atomically incrementing project view counts

-- ============================================
-- Function: Increment project views atomically
-- ============================================

CREATE OR REPLACE FUNCTION increment_project_views(project_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET views_count = views_count + 1
  WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_project_views(UUID) TO authenticated;

-- Also allow anonymous users to increment views (for non-logged in visitors)
GRANT EXECUTE ON FUNCTION increment_project_views(UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION increment_project_views IS 'Atomically increments the view count for a project';

