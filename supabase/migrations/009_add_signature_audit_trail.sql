-- Migration: Add signature audit trail system
-- Date: 2025-10-22
-- Description: Adds contract audit trail for signature tracking and verification

-- ============================================
-- PART 1: AUDIT TRAIL TABLE
-- ============================================

-- Table pour la piste d'audit des signatures
CREATE TABLE IF NOT EXISTS contract_audit_trail (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'created', 'viewed', 'signed', 'verified', 'downloaded'
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB DEFAULT '{}'
);

-- Add comments
COMMENT ON TABLE contract_audit_trail IS 'Audit trail for contract signature events and verification';
COMMENT ON COLUMN contract_audit_trail.event_type IS 'Type of event: created, viewed, signed, verified, downloaded';
COMMENT ON COLUMN contract_audit_trail.created_at IS 'When the event occurred';
COMMENT ON COLUMN contract_audit_trail.details IS 'Additional event-specific data';

-- ============================================
-- PART 2: INDEXES
-- ============================================

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_audit_trail_contract ON contract_audit_trail(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON contract_audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_event_type ON contract_audit_trail(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON contract_audit_trail(user_id);

-- ============================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE contract_audit_trail ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit trail for their contracts
CREATE POLICY "Users can view audit trail for their contracts"
  ON contract_audit_trail FOR SELECT
  USING (contract_id IN (
    SELECT id FROM contracts 
    WHERE client_id = auth.uid() OR professional_id = auth.uid()
  ));

-- Policy: System can insert audit trail entries
CREATE POLICY "System can insert audit trail entries"
  ON contract_audit_trail FOR INSERT
  WITH CHECK (true); -- Allow all inserts for system logging

-- ============================================
-- PART 4: FUNCTIONS
-- ============================================

-- Fonction pour récupérer l'audit trail complet d'un contrat
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

-- Fonction pour ajouter une entrée d'audit
CREATE OR REPLACE FUNCTION add_audit_trail_entry(
  p_contract_id UUID,
  p_event_type VARCHAR,
  p_user_id UUID,
  p_user_name VARCHAR,
  p_ip_address VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  new_entry_id UUID;
BEGIN
  INSERT INTO contract_audit_trail (
    contract_id,
    event_type,
    user_id,
    user_name,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_contract_id,
    p_event_type,
    p_user_id,
    p_user_name,
    COALESCE(p_ip_address, 'unknown'),
    COALESCE(p_user_agent, 'unknown'),
    p_details
  ) RETURNING id INTO new_entry_id;
  
  RETURN new_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: TRIGGERS
-- ============================================

-- Trigger pour ajouter automatiquement une entrée d'audit quand un contrat est créé
CREATE OR REPLACE FUNCTION trigger_audit_contract_created()
RETURNS TRIGGER AS $$
DECLARE
  creator_name TEXT;
BEGIN
  -- Get creator name
  SELECT full_name INTO creator_name FROM profiles WHERE id = NEW.client_id;
  
  -- Add audit entry
  PERFORM add_audit_trail_entry(
    NEW.id,
    'created',
    NEW.client_id,
    COALESCE(creator_name, 'Unknown'),
    'system',
    'system',
    jsonb_build_object(
      'contract_title', NEW.title,
      'professional_id', NEW.professional_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_contract_created
  AFTER INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_contract_created();

-- Trigger pour ajouter une entrée d'audit quand une signature est ajoutée
CREATE OR REPLACE FUNCTION trigger_audit_signature_added()
RETURNS TRIGGER AS $$
DECLARE
  signer_name TEXT;
  signer_id UUID;
  event_type VARCHAR;
BEGIN
  -- Determine if it's client or professional signature
  IF OLD.client_signature_data IS NULL AND NEW.client_signature_data IS NOT NULL THEN
    signer_id := NEW.client_id;
    event_type := 'client_signed';
  ELSIF OLD.professional_signature_data IS NULL AND NEW.professional_signature_data IS NOT NULL THEN
    signer_id := NEW.professional_id;
    event_type := 'professional_signed';
  ELSE
    RETURN NEW;
  END IF;
  
  -- Get signer name
  SELECT full_name INTO signer_name FROM profiles WHERE id = signer_id;
  
  -- Add audit entry
  PERFORM add_audit_trail_entry(
    NEW.id,
    event_type,
    signer_id,
    COALESCE(signer_name, 'Unknown'),
    'system',
    'system',
    jsonb_build_object(
      'verification_code', 
      CASE 
        WHEN event_type = 'client_signed' THEN NEW.client_signature_data->>'verification_code'
        ELSE NEW.professional_signature_data->>'verification_code'
      END
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_signature_added
  AFTER UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_signature_added();

-- ============================================
-- PART 6: SAMPLE DATA
-- ============================================

-- Insert sample audit entries for existing contracts (if any)
-- This is optional and can be removed if not needed
DO $$
DECLARE
  contract_record RECORD;
BEGIN
  -- Add audit entries for existing contracts
  FOR contract_record IN 
    SELECT id, client_id, title, created_at 
    FROM contracts 
    WHERE created_at < NOW()
  LOOP
    -- Add creation audit entry
    INSERT INTO contract_audit_trail (
      contract_id,
      event_type,
      user_id,
      user_name,
      ip_address,
      user_agent,
      details
    ) VALUES (
      contract_record.id,
      'created',
      contract_record.client_id,
      'System Migration',
      'system',
      'migration',
      jsonb_build_object(
        'migrated', true,
        'original_created_at', contract_record.created_at
      )
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
