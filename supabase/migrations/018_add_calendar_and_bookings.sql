-- Migration: Add calendar and booking system
-- Date: 2025-10-22

-- Create professional_availability table
CREATE TABLE IF NOT EXISTS professional_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
  -- User type constraint removed - validation will be done via triggers
);

-- Create bookings table  
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_booking_time CHECK (end_time > start_time)
  -- User type constraints removed - validation will be done via triggers
);

-- Indexes for professional_availability
CREATE INDEX IF NOT EXISTS idx_avail_professional ON professional_availability(professional_id);
CREATE INDEX IF NOT EXISTS idx_avail_date ON professional_availability(date);
CREATE INDEX IF NOT EXISTS idx_avail_professional_date ON professional_availability(professional_id, date);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_professional ON bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_project ON bookings(project_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Enable RLS
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Trigger to validate that only professionals can have availability
CREATE OR REPLACE FUNCTION validate_availability_professional()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is a professional
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.professional_id AND user_type = 'professional'
  ) THEN
    RAISE EXCEPTION 'Only professionals can set availability';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_availability_professional_trigger ON professional_availability;
CREATE TRIGGER validate_availability_professional_trigger
  BEFORE INSERT OR UPDATE ON professional_availability
  FOR EACH ROW
  EXECUTE FUNCTION validate_availability_professional();

-- Trigger to validate booking user types
CREATE OR REPLACE FUNCTION validate_booking_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if professional_id is actually a professional
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.professional_id AND user_type = 'professional'
  ) THEN
    RAISE EXCEPTION 'professional_id must reference a user with user_type = ''professional''';
  END IF;
  
  -- Check if client_id is actually a client
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.client_id AND user_type = 'client'
  ) THEN
    RAISE EXCEPTION 'client_id must reference a user with user_type = ''client''';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_booking_users_trigger ON bookings;
CREATE TRIGGER validate_booking_users_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_users();

-- RLS Policies for professional_availability
DROP POLICY IF EXISTS "Professionals can manage their availability" ON professional_availability;
CREATE POLICY "Professionals can manage their availability"
  ON professional_availability FOR ALL
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Everyone can view professional availability" ON professional_availability;
CREATE POLICY "Everyone can view professional availability"
  ON professional_availability FOR SELECT
  USING (is_available = true);

-- RLS Policies for bookings
DROP POLICY IF EXISTS "Professionals can view their bookings" ON bookings;
CREATE POLICY "Professionals can view their bookings"
  ON bookings FOR SELECT
  USING (professional_id = auth.uid() OR client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;
CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Professionals can update their bookings" ON bookings;
CREATE POLICY "Professionals can update their bookings"
  ON bookings FOR UPDATE
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update their bookings" ON bookings;
CREATE POLICY "Clients can update their bookings"
  ON bookings FOR UPDATE
  USING (client_id = auth.uid() AND status = 'pending')
  WITH CHECK (client_id = auth.uid());

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_professional_availability_updated_at ON professional_availability;
CREATE TRIGGER update_professional_availability_updated_at
  BEFORE UPDATE ON professional_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check availability overlap
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_professional_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if there's an available time slot
  RETURN EXISTS (
    SELECT 1 FROM professional_availability
    WHERE professional_id = p_professional_id
      AND date = p_date
      AND is_available = true
      AND start_time <= p_start_time
      AND end_time >= p_end_time
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get professional's upcoming bookings
CREATE OR REPLACE FUNCTION get_upcoming_bookings(p_professional_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  client_name VARCHAR,
  project_id UUID,
  project_title VARCHAR,
  date DATE,
  start_time TIME,
  end_time TIME,
  status VARCHAR,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.client_id,
    p.full_name as client_name,
    b.project_id,
    pr.title as project_title,
    b.date,
    b.start_time,
    b.end_time,
    b.status,
    b.notes
  FROM bookings b
  LEFT JOIN profiles p ON b.client_id = p.id
  LEFT JOIN projects pr ON b.project_id = pr.id
  WHERE b.professional_id = p_professional_id
    AND b.date >= CURRENT_DATE
    AND b.date <= CURRENT_DATE + p_days
    AND b.status IN ('pending', 'confirmed')
  ORDER BY b.date ASC, b.start_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE professional_availability IS 'Professional availability schedule';
COMMENT ON TABLE bookings IS 'Client bookings with professionals';
COMMENT ON COLUMN professional_availability.is_available IS 'Whether the professional is available during this time slot';
COMMENT ON COLUMN bookings.status IS 'Booking status: pending, confirmed, completed, cancelled';

