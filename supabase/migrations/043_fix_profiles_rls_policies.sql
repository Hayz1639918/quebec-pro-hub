-- Migration: Fix profiles RLS policies to prevent infinite recursion
-- Date: 2025-12-30
-- Description: Corrects the RLS policies on profiles table that were causing 
--              "infinite recursion detected in policy" errors.
--              The old policies were doing sub-queries on profiles to check admin status,
--              which triggered the same policies again, creating an infinite loop.

-- =====================================================
-- STEP 1: Drop all existing problematic policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update verification status" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view professional profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- =====================================================
-- STEP 2: Create new policies without recursion
-- =====================================================

-- Policy 1: Anyone can view all profiles (public read access)
-- This is safe because we control what data is exposed via SELECT queries in the frontend
CREATE POLICY "Public profiles are viewable"
  ON profiles 
  FOR SELECT
  USING (true);

-- Policy 2: Users can create their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON profiles 
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles 
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy 4: Admins can update any profile (uses is_admin() function which is SECURITY DEFINER)
-- The is_admin() function bypasses RLS, so no recursion occurs
CREATE POLICY "Admins can update any profile"
  ON profiles 
  FOR UPDATE
  USING (is_admin());

-- =====================================================
-- NOTES:
-- =====================================================
-- 
-- The key fix here is that we no longer do sub-queries on the profiles table
-- inside the policy definitions. Instead:
-- 
-- 1. For SELECT: We allow public read access (true)
--    - The frontend controls what fields are exposed
--    - Sensitive fields like rbq_certification_url are not requested
-- 
-- 2. For admin checks: We use the is_admin() function
--    - This function is SECURITY DEFINER, meaning it runs with elevated privileges
--    - It bypasses RLS, preventing the recursion issue
--
-- If you need more granular control over what users can see,
-- consider creating a VIEW that exposes only public fields.



