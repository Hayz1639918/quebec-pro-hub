-- Migration: Fix signup flow for production
-- Date: 2026-01-04
-- Description: Creates automatic profile creation via trigger to bypass RLS issues
--              when email confirmation is required in production.
--
-- PROBLEM: In production, after signUp(), the user has no active session yet
--          (they need to confirm email first). This means auth.uid() = null,
--          and the RLS policy "Users can insert own profile" fails.
--
-- SOLUTION: Use a database trigger that automatically creates the profile
--           when a new user is created in auth.users. The trigger runs with
--           elevated privileges (SECURITY DEFINER) bypassing RLS.

-- =====================================================
-- STEP 1: Create function to handle new user signup
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract user metadata from the new auth.users row
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'client');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur');

  -- Insert the base profile
  -- Professional-specific fields will be completed later via profile update
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type::user_type,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicates if trigger fires multiple times

  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 2: Create trigger on auth.users
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- =====================================================
-- STEP 3: Update profiles RLS to allow updates after email confirm
-- =====================================================

-- Users should be able to update their own profile with professional details
-- after they confirm their email and get a session

-- Drop and recreate the update policy to be more explicit
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles 
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 4: Update storage policies for certifications
-- =====================================================

-- Drop existing storage policies for certifications
DROP POLICY IF EXISTS "Users can upload their own certifications" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own certifications" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload certifications" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view certifications" ON storage.objects;
DROP POLICY IF EXISTS "Public certifications access" ON storage.objects;

-- Create new storage policies that work with authenticated users
-- Upload: Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload certifications"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certifications' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Read: Anyone can read certifications (they're public for verification)
CREATE POLICY "Public certifications access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'certifications');

-- Update: Users can update their own files
CREATE POLICY "Users can update own certifications"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certifications' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete: Users can delete their own files
CREATE POLICY "Users can delete own certifications"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certifications' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- STEP 5: Add flag for profile completion
-- =====================================================

-- Add column to track if professional profile is complete
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Update existing professional profiles to mark as completed
UPDATE profiles 
SET profile_completed = TRUE 
WHERE user_type = 'professional' 
  AND company_name IS NOT NULL 
  AND rbq_number IS NOT NULL;

-- Update existing client profiles (they don't need additional info)
UPDATE profiles 
SET profile_completed = TRUE 
WHERE user_type = 'client';

-- =====================================================
-- NOTES:
-- =====================================================
-- 
-- NEW SIGNUP FLOW:
-- 1. User fills signup form (client or professional)
-- 2. supabase.auth.signUp() creates user in auth.users
-- 3. Trigger automatically creates basic profile with user_type
-- 4. User receives confirmation email
-- 5. After email confirmation, user gets a session
-- 6. For professionals: redirect to profile completion page
--    where they upload RBQ cert and fill professional details
-- 7. Profile is updated (not inserted) with professional data
--
-- This flow works because:
-- - The trigger bypasses RLS (SECURITY DEFINER)
-- - Profile INSERT happens automatically
-- - Professional data is added via UPDATE (requires session)
-- - Storage upload happens after email confirmation (has session)

