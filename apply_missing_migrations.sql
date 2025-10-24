-- Script d'application des migrations manquantes
-- Exécuter ce script dans Supabase SQL Editor
-- Date: 2025-10-22

-- ========================================
-- MIGRATION 009: Signature audit trail (CORRIGÉE)
-- ========================================

-- Create audit trail table
CREATE TABLE IF NOT EXISTS contract_audit_trail (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_contract ON contract_audit_trail(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON contract_audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_event_type ON contract_audit_trail(event_type);

-- Enable RLS
ALTER TABLE contract_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view audit trail for their contracts" ON contract_audit_trail;
CREATE POLICY "Users can view audit trail for their contracts"
  ON contract_audit_trail FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts 
      WHERE client_id = auth.uid() OR professional_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert audit trail" ON contract_audit_trail;
CREATE POLICY "System can insert audit trail"
  ON contract_audit_trail FOR INSERT
  WITH CHECK (true);

-- Functions
CREATE OR REPLACE FUNCTION get_contract_audit_trail(contract_uuid UUID)
RETURNS TABLE (
  id UUID,
  event_type VARCHAR,
  user_name VARCHAR,
  created_at TIMESTAMPTZ,
  ip_address VARCHAR,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cat.id,
    cat.event_type::VARCHAR,
    cat.user_name::VARCHAR,
    cat.created_at,
    cat.ip_address::VARCHAR,
    cat.details
  FROM contract_audit_trail cat
  WHERE cat.contract_id = contract_uuid
  ORDER BY cat.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_audit_trail_entry(
  contract_uuid UUID,
  event_type_param VARCHAR,
  user_id_param UUID,
  user_name_param VARCHAR,
  created_at_param TIMESTAMPTZ,
  ip_address_param VARCHAR DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  details_param JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO contract_audit_trail (
    contract_id, event_type, user_id, user_name, created_at,
    ip_address, user_agent, details
  ) VALUES (
    contract_uuid, event_type_param, user_id_param, user_name_param, created_at_param,
    ip_address_param, user_agent_param, details_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- MIGRATION 010: Subscriptions (CORRIGÉE)
-- ========================================

-- Create types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM ('free','basic','premium','enterprise');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active','cancelled','expired','suspended');
    END IF;
END $$;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their subscriptions" ON subscriptions;
CREATE POLICY "Users can view their subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their subscriptions" ON subscriptions;
CREATE POLICY "Users can manage their subscriptions"
  ON subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger to validate that only professionals can have subscriptions
CREATE OR REPLACE FUNCTION validate_professional_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.user_id AND user_type = 'professional'
  ) THEN
    RAISE EXCEPTION 'Only professionals can have subscriptions';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_professional_subscription_trigger ON subscriptions;
CREATE TRIGGER validate_professional_subscription_trigger
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_professional_subscription();

-- ========================================
-- MIGRATION 012: Compliance expiry (CORRIGÉE)
-- ========================================

-- Add compliance fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rbq_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS insurance_expires_at TIMESTAMPTZ;

-- Function to notify about compliance expiry
CREATE OR REPLACE FUNCTION notify_compliance_expiry()
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT p.id, 'system_announcement', 'RBQ proche de l''expiration', 'Votre licence RBQ expire bientôt', jsonb_build_object('rbq_expires_at', p.rbq_expires_at)
  FROM profiles p
  WHERE p.rbq_expires_at IS NOT NULL 
    AND p.rbq_expires_at <= NOW() + INTERVAL '30 days'
    AND p.rbq_expires_at > NOW() + INTERVAL '29 days';

  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT p.id, 'system_announcement', 'Assurance proche de l''expiration', 'Votre assurance expire bientôt', jsonb_build_object('insurance_expires_at', p.insurance_expires_at)
  FROM profiles p
  WHERE p.insurance_expires_at IS NOT NULL 
    AND p.insurance_expires_at <= NOW() + INTERVAL '30 days'
    AND p.insurance_expires_at > NOW() + INTERVAL '29 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- MIGRATION 013: Subcontractors (CORRIGÉE)
-- ========================================

-- Create types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subcontractor_status') THEN
        CREATE TYPE subcontractor_status AS ENUM ('invited','active','removed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('todo','in_progress','done');
    END IF;
END $$;

-- Create subcontractors table
CREATE TABLE IF NOT EXISTS subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  specialties TEXT[],
  status subcontractor_status NOT NULL DEFAULT 'invited',
  hourly_rate DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subcontractor_tasks table
CREATE TABLE IF NOT EXISTS subcontractor_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority INTEGER DEFAULT 1,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  visible_to_subcontractor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subcontractors_owner ON subcontractors(owner_professional_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_status ON subcontractors(status);
CREATE INDEX IF NOT EXISTS idx_tasks_subcontractor ON subcontractor_tasks(subcontractor_id);

-- Enable RLS
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Owner can view subcontractors" ON subcontractors;
CREATE POLICY "Owner can view subcontractors"
  ON subcontractors FOR SELECT
  USING (owner_professional_id = auth.uid());

DROP POLICY IF EXISTS "Owner can manage subcontractors" ON subcontractors;
CREATE POLICY "Owner can manage subcontractors"
  ON subcontractors FOR ALL
  USING (owner_professional_id = auth.uid())
  WITH CHECK (owner_professional_id = auth.uid());

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

-- ========================================
-- MIGRATION 014: Mediation (CORRIGÉE)
-- ========================================

-- Create types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mediation_status') THEN
        CREATE TYPE mediation_status AS ENUM ('open','in_review','resolved','rejected');
    END IF;
END $$;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_project ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_professional ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews(client_id);

-- Enable RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
DROP POLICY IF EXISTS "Clients can view their reviews" ON reviews;
CREATE POLICY "Clients can view their reviews"
  ON reviews FOR SELECT
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Professionals can view their reviews" ON reviews;
CREATE POLICY "Professionals can view their reviews"
  ON reviews FOR SELECT
  USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;
CREATE POLICY "Clients can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update their reviews" ON reviews;
CREATE POLICY "Clients can update their reviews"
  ON reviews FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Create mediations table
CREATE TABLE IF NOT EXISTS mediations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status mediation_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mediations_professional ON mediations(professional_id);
CREATE INDEX IF NOT EXISTS idx_mediations_status ON mediations(status);

ALTER TABLE mediations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mediations
DROP POLICY IF EXISTS "Pros can view their mediations" ON mediations;
CREATE POLICY "Pros can view their mediations"
  ON mediations FOR SELECT
  USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Pros can create mediations" ON mediations;
CREATE POLICY "Pros can create mediations"
  ON mediations FOR INSERT
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Pros can update their mediations" ON mediations;
CREATE POLICY "Pros can update their mediations"
  ON mediations FOR UPDATE
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- ========================================
-- MIGRATION 015: Contract proposals (CORRIGÉE)
-- ========================================

-- Create types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_proposal_status') THEN
        CREATE TYPE contract_proposal_status AS ENUM ('pending','accepted','rejected','withdrawn');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS contract_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '{}',
  contract_content_draft TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  deposit_percentage DECIMAL(5,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status contract_proposal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cp_project ON contract_proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_cp_client ON contract_proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_cp_professional ON contract_proposals(professional_id);
CREATE INDEX IF NOT EXISTS idx_cp_status ON contract_proposals(status);

ALTER TABLE contract_proposals ENABLE ROW LEVEL SECURITY;

-- Trigger to validate user types
CREATE OR REPLACE FUNCTION validate_contract_proposal_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.client_id AND user_type = 'client'
  ) THEN
    RAISE EXCEPTION 'client_id must reference a user with user_type = ''client''';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.professional_id AND user_type = 'professional'
  ) THEN
    RAISE EXCEPTION 'professional_id must reference a user with user_type = ''professional''';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_contract_proposal_users_trigger ON contract_proposals;
CREATE TRIGGER validate_contract_proposal_users_trigger
  BEFORE INSERT OR UPDATE ON contract_proposals
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_proposal_users();

-- RLS Policies
DROP POLICY IF EXISTS "Pro can view own proposals" ON contract_proposals;
CREATE POLICY "Pro can view own proposals" ON contract_proposals FOR SELECT USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "Pro can create proposals" ON contract_proposals;
CREATE POLICY "Pro can create proposals" ON contract_proposals FOR INSERT WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Pro can update own proposals" ON contract_proposals;
CREATE POLICY "Pro can update own proposals" ON contract_proposals FOR UPDATE USING (professional_id = auth.uid()) WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Client can view proposals" ON contract_proposals;
CREATE POLICY "Client can view proposals" ON contract_proposals FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Client can update status" ON contract_proposals;
CREATE POLICY "Client can update status" ON contract_proposals FOR UPDATE USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

-- Accept proposal function
CREATE OR REPLACE FUNCTION accept_contract_proposal(proposal_uuid UUID)
RETURNS UUID AS $$
DECLARE
  p RECORD;
  new_contract_id UUID;
BEGIN
  SELECT * INTO p FROM contract_proposals WHERE id = proposal_uuid;
  IF p IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
  IF auth.uid() <> p.client_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'Proposal not pending'; END IF;

  INSERT INTO contracts (
    project_id, template_id, client_id, professional_id,
    title, description, contract_content, variables,
    total_amount, currency, deposit_percentage,
    start_date, end_date, status
  ) VALUES (
    p.project_id, p.template_id, p.client_id, p.professional_id,
    p.title, p.description, p.contract_content_draft, p.variables,
    p.total_amount, COALESCE(p.currency,'CAD'), COALESCE(p.deposit_percentage,0),
    p.start_date, p.end_date, 'draft'
  ) RETURNING id INTO new_contract_id;

  UPDATE contract_proposals SET status = 'accepted', updated_at = NOW() WHERE id = proposal_uuid;

  RETURN new_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- MIGRATION 016: Update milestones functions
-- ========================================

CREATE OR REPLACE FUNCTION approve_milestone(p_milestone UUID)
RETURNS VOID AS $$
DECLARE
  c_client UUID;
BEGIN
  SELECT client_id INTO c_client
  FROM contracts WHERE id = (SELECT contract_id FROM contract_milestones WHERE id = p_milestone);

  IF c_client IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF auth.uid() <> c_client THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE contract_milestones
  SET status = 'approved', validated_at = NOW(), updated_at = NOW()
  WHERE id = p_milestone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FINALISATION
-- ========================================

SELECT 'TOUTES LES MIGRATIONS ONT ÉTÉ APPLIQUÉES AVEC SUCCÈS!' as status;
