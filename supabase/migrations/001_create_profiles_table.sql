-- Create enum for user types
CREATE TYPE user_type AS ENUM ('client', 'professional');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  user_type user_type NOT NULL DEFAULT 'client',
  
  -- Professional-specific fields
  company_name TEXT,
  rbq_number TEXT,
  rbq_certification_url TEXT,
  services_offered TEXT,
  insurance_info TEXT,
  is_rbq_verified BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_professional CHECK (
    user_type != 'professional' OR (
      company_name IS NOT NULL AND 
      rbq_number IS NOT NULL
    )
  )
);

-- Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_rbq_number ON profiles(rbq_number) WHERE rbq_number IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public can read professional profiles (for search/listing)
CREATE POLICY "Public can read professional profiles"
  ON profiles
  FOR SELECT
  USING (user_type = 'professional' AND is_rbq_verified = TRUE);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for RBQ certifications
INSERT INTO storage.buckets (id, name, public)
VALUES ('certifications', 'certifications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for certifications bucket
CREATE POLICY "Users can upload their own certifications"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'certifications' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own certifications"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certifications' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can read all certifications"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certifications' AND
    (auth.jwt() ->> 'role') = 'admin'
  );

