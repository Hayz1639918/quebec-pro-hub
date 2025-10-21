-- Migration: Add contracts and e-signature system
-- Date: 2025-10-21
-- Description: Adds contracts table, templates, and e-signature functionality

-- ============================================
-- PART 1: CONTRACT TEMPLATES
-- ============================================

-- Create contract templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'construction', 'renovation', 'maintenance', 'consultation'
  template_content TEXT NOT NULL, -- HTML content with placeholders
  variables JSONB DEFAULT '{}', -- Available variables for this template
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Add comments
COMMENT ON TABLE contract_templates IS 'Contract templates for different types of projects';
COMMENT ON COLUMN contract_templates.template_content IS 'HTML template with placeholders like {{client_name}}, {{project_description}}';
COMMENT ON COLUMN contract_templates.variables IS 'JSON object defining available variables and their types';

-- ============================================
-- PART 2: CONTRACTS
-- ============================================

-- Create contract status enum
CREATE TYPE contract_status AS ENUM (
  'draft',
  'pending_client_signature',
  'pending_professional_signature', 
  'pending_both_signatures',
  'signed',
  'cancelled',
  'expired'
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  
  -- Parties
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Contract details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contract_content TEXT NOT NULL, -- Final HTML content with variables filled
  variables JSONB DEFAULT '{}', -- Variables used to generate the contract
  
  -- Financial terms
  total_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  payment_schedule JSONB, -- Array of payment milestones
  deposit_percentage DECIMAL(5,2) DEFAULT 0, -- Deposit required before start
  
  -- Timeline
  start_date DATE,
  end_date DATE,
  estimated_duration_days INTEGER,
  
  -- Status and signatures
  status contract_status DEFAULT 'draft',
  client_signed_at TIMESTAMP WITH TIME ZONE,
  professional_signed_at TIMESTAMP WITH TIME ZONE,
  client_signature_data JSONB, -- Signature image/data
  professional_signature_data JSONB,
  
  -- Legal
  terms_and_conditions TEXT,
  special_conditions TEXT,
  warranty_period_months INTEGER DEFAULT 12,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  
  -- Files
  contract_pdf_url TEXT, -- Generated PDF URL
  attachments JSONB DEFAULT '[]' -- Array of file URLs
);

-- Add comments
COMMENT ON TABLE contracts IS 'Individual contracts between clients and professionals';
COMMENT ON COLUMN contracts.contract_content IS 'Final HTML content with all variables replaced';
COMMENT ON COLUMN contracts.payment_schedule IS 'JSON array of payment milestones with amounts and dates';
COMMENT ON COLUMN contracts.client_signature_data IS 'Signature data (image, coordinates, timestamp)';
COMMENT ON COLUMN contracts.contract_pdf_url IS 'URL to generated PDF version of the contract';

-- ============================================
-- PART 3: CONTRACT AMENDMENTS
-- ============================================

-- Create contract amendments table
CREATE TABLE IF NOT EXISTS contract_amendments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amendment_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  changes JSONB NOT NULL, -- What was changed
  new_content TEXT, -- New contract content if applicable
  approved_by_client BOOLEAN DEFAULT FALSE,
  approved_by_professional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================
-- PART 4: INDEXES
-- ============================================

-- Contract templates indexes
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_by ON contract_templates(created_by);

-- Contracts indexes
CREATE INDEX IF NOT EXISTS idx_contracts_project ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_professional ON contracts(professional_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_template ON contracts(template_id);

-- Contract amendments indexes
CREATE INDEX IF NOT EXISTS idx_amendments_contract ON contract_amendments(contract_id);
CREATE INDEX IF NOT EXISTS idx_amendments_number ON contract_amendments(contract_id, amendment_number);

-- ============================================
-- PART 5: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_amendments ENABLE ROW LEVEL SECURITY;

-- Contract templates policies (read-only for all authenticated users)
CREATE POLICY "Anyone can view active contract templates"
  ON contract_templates FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Professionals can manage contract templates"
  ON contract_templates FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE user_type = 'professional'
  ));

-- Contracts policies
CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = professional_id);

CREATE POLICY "Users can create contracts for their projects"
  ON contracts FOR INSERT
  WITH CHECK (
    auth.uid() = client_id AND 
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Contract parties can update their contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = professional_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = professional_id);

-- Contract amendments policies
CREATE POLICY "Contract parties can view amendments"
  ON contract_amendments FOR SELECT
  USING (contract_id IN (
    SELECT id FROM contracts 
    WHERE client_id = auth.uid() OR professional_id = auth.uid()
  ));

CREATE POLICY "Contract parties can create amendments"
  ON contract_amendments FOR INSERT
  WITH CHECK (contract_id IN (
    SELECT id FROM contracts 
    WHERE client_id = auth.uid() OR professional_id = auth.uid()
  ));

-- ============================================
-- PART 6: FUNCTIONS
-- ============================================

-- Function to generate contract content from template
CREATE OR REPLACE FUNCTION generate_contract_content(
  template_id UUID,
  variables JSONB
)
RETURNS TEXT AS $$
DECLARE
  template_content TEXT;
  result_content TEXT;
  variable_key TEXT;
  variable_value TEXT;
BEGIN
  -- Get template content
  SELECT template_content INTO template_content
  FROM contract_templates
  WHERE id = template_id AND is_active = TRUE;
  
  IF template_content IS NULL THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;
  
  result_content := template_content;
  
  -- Replace variables
  FOR variable_key, variable_value IN 
    SELECT key, value::TEXT FROM jsonb_each_text(variables)
  LOOP
    result_content := replace(result_content, '{{' || variable_key || '}}', variable_value);
  END LOOP;
  
  RETURN result_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if contract is fully signed
CREATE OR REPLACE FUNCTION is_contract_signed(contract_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  client_signed BOOLEAN;
  professional_signed BOOLEAN;
BEGIN
  SELECT 
    client_signed_at IS NOT NULL,
    professional_signed_at IS NOT NULL
  INTO client_signed, professional_signed
  FROM contracts
  WHERE id = contract_uuid;
  
  RETURN client_signed AND professional_signed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get contract status
CREATE OR REPLACE FUNCTION get_contract_status(contract_uuid UUID)
RETURNS contract_status AS $$
DECLARE
  contract_record RECORD;
BEGIN
  SELECT 
    status,
    client_signed_at,
    professional_signed_at,
    expires_at
  INTO contract_record
  FROM contracts
  WHERE id = contract_uuid;
  
  -- Check if expired
  IF contract_record.expires_at IS NOT NULL AND contract_record.expires_at < NOW() THEN
    RETURN 'expired';
  END IF;
  
  -- Check signature status
  IF contract_record.client_signed_at IS NOT NULL AND contract_record.professional_signed_at IS NOT NULL THEN
    RETURN 'signed';
  ELSIF contract_record.client_signed_at IS NOT NULL AND contract_record.professional_signed_at IS NULL THEN
    RETURN 'pending_professional_signature';
  ELSIF contract_record.client_signed_at IS NULL AND contract_record.professional_signed_at IS NOT NULL THEN
    RETURN 'pending_client_signature';
  ELSE
    RETURN 'pending_both_signatures';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 7: TRIGGERS
-- ============================================

-- Function to update contract status
CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on signatures
  NEW.status := get_contract_status(NEW.id);
  
  -- Set signed_at when both parties have signed
  IF NEW.client_signed_at IS NOT NULL AND NEW.professional_signed_at IS NOT NULL THEN
    NEW.signed_at := GREATEST(NEW.client_signed_at, NEW.professional_signed_at);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_status
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_status();

-- Function to create notification when contract status changes
CREATE OR REPLACE FUNCTION notify_contract_status_change()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
  professional_name TEXT;
  project_title TEXT;
BEGIN
  -- Get names
  SELECT full_name INTO client_name FROM profiles WHERE id = NEW.client_id;
  SELECT full_name INTO professional_name FROM profiles WHERE id = NEW.professional_id;
  SELECT title INTO project_title FROM projects WHERE id = NEW.project_id;
  
  -- Notify client
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_user_id,
    related_project_id,
    action_url,
    metadata
  ) VALUES (
    NEW.client_id,
    'contract_signed',
    'Contrat mis à jour',
    'Le statut de votre contrat avec ' || professional_name || ' a été mis à jour',
    NEW.professional_id,
    NEW.project_id,
    '/dashboard/contracts/' || NEW.id,
    jsonb_build_object(
      'contract_id', NEW.id,
      'status', NEW.status,
      'project_title', project_title
    )
  );
  
  -- Notify professional
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_user_id,
    related_project_id,
    action_url,
    metadata
  ) VALUES (
    NEW.professional_id,
    'contract_signed',
    'Contrat mis à jour',
    'Le statut de votre contrat avec ' || client_name || ' a été mis à jour',
    NEW.client_id,
    NEW.project_id,
    '/dashboard/contracts/' || NEW.id,
    jsonb_build_object(
      'contract_id', NEW.id,
      'status', NEW.status,
      'project_title', project_title
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_contract_status_change
  AFTER UPDATE ON contracts
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_contract_status_change();

-- ============================================
-- PART 8: SEED DATA - CONTRACT TEMPLATES
-- ============================================

-- Insert default contract templates
INSERT INTO contract_templates (name, description, category, template_content, variables) VALUES
(
  'Contrat de construction résidentielle',
  'Contrat standard pour projets de construction résidentielle',
  'construction',
  '<!DOCTYPE html>
<html>
<head>
  <title>Contrat de Construction - {{project_title}}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin: 20px 0; }
    .signature-section { margin-top: 50px; }
    .signature-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; margin: 0 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRAT DE CONSTRUCTION</h1>
    <h2>{{project_title}}</h2>
  </div>
  
  <div class="section">
    <h3>1. PARTIES</h3>
    <p><strong>Client :</strong> {{client_name}}<br>
    <strong>Adresse :</strong> {{client_address}}<br>
    <strong>Téléphone :</strong> {{client_phone}}<br>
    <strong>Email :</strong> {{client_email}}</p>
    
    <p><strong>Entrepreneur :</strong> {{professional_name}}<br>
    <strong>Entreprise :</strong> {{company_name}}<br>
    <strong>RBQ :</strong> {{rbq_number}}<br>
    <strong>Adresse :</strong> {{professional_address}}<br>
    <strong>Téléphone :</strong> {{professional_phone}}<br>
    <strong>Email :</strong> {{professional_email}}</p>
  </div>
  
  <div class="section">
    <h3>2. DESCRIPTION DU PROJET</h3>
    <p>{{project_description}}</p>
    <p><strong>Lieu des travaux :</strong> {{project_address}}</p>
    <p><strong>Date de début prévue :</strong> {{start_date}}</p>
    <p><strong>Date de fin prévue :</strong> {{end_date}}</p>
  </div>
  
  <div class="section">
    <h3>3. CONDITIONS FINANCIÈRES</h3>
    <p><strong>Montant total :</strong> {{total_amount}} $ CAD</p>
    <p><strong>Acompte requis :</strong> {{deposit_percentage}}% ({{deposit_amount}} $ CAD)</p>
    <p><strong>Modalités de paiement :</strong> {{payment_terms}}</p>
  </div>
  
  <div class="section">
    <h3>4. GARANTIE</h3>
    <p>L''entrepreneur garantit les travaux contre les défauts de matériaux et de main-d''œuvre pour une période de {{warranty_period}} mois à compter de la réception des travaux.</p>
  </div>
  
  <div class="section">
    <h3>5. CONDITIONS SPÉCIALES</h3>
    <p>{{special_conditions}}</p>
  </div>
  
  <div class="signature-section">
    <p><strong>En foi de quoi, les parties ont signé le présent contrat :</strong></p>
    <br><br>
    <p>Le {{signature_date}} à {{signature_location}}</p>
    <br><br>
    <p>Client : <span class="signature-line"></span></p>
    <p>Entrepreneur : <span class="signature-line"></span></p>
  </div>
</body>
</html>',
  '{
    "client_name": "string",
    "client_address": "string", 
    "client_phone": "string",
    "client_email": "string",
    "professional_name": "string",
    "company_name": "string",
    "rbq_number": "string",
    "professional_address": "string",
    "professional_phone": "string", 
    "professional_email": "string",
    "project_title": "string",
    "project_description": "string",
    "project_address": "string",
    "start_date": "date",
    "end_date": "date",
    "total_amount": "number",
    "deposit_percentage": "number",
    "deposit_amount": "number",
    "payment_terms": "string",
    "warranty_period": "number",
    "special_conditions": "string",
    "signature_date": "date",
    "signature_location": "string"
  }'::jsonb
),
(
  'Contrat de rénovation',
  'Contrat pour projets de rénovation résidentielle',
  'renovation',
  '<!DOCTYPE html>
<html>
<head>
  <title>Contrat de Rénovation - {{project_title}}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin: 20px 0; }
    .signature-section { margin-top: 50px; }
    .signature-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; margin: 0 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRAT DE RÉNOVATION</h1>
    <h2>{{project_title}}</h2>
  </div>
  
  <div class="section">
    <h3>1. PARTIES</h3>
    <p><strong>Client :</strong> {{client_name}}<br>
    <strong>Entrepreneur :</strong> {{professional_name}} ({{company_name}})<br>
    <strong>RBQ :</strong> {{rbq_number}}</p>
  </div>
  
  <div class="section">
    <h3>2. TRAVAUX À RÉALISER</h3>
    <p>{{project_description}}</p>
    <p><strong>Lieu :</strong> {{project_address}}</p>
    <p><strong>Durée estimée :</strong> {{estimated_duration}} jours</p>
  </div>
  
  <div class="section">
    <h3>3. TARIFICATION</h3>
    <p><strong>Montant total :</strong> {{total_amount}} $ CAD</p>
    <p><strong>Dépôt :</strong> {{deposit_amount}} $ CAD</p>
  </div>
  
  <div class="signature-section">
    <p><strong>Signatures :</strong></p>
    <br><br>
    <p>Client : <span class="signature-line"></span></p>
    <p>Entrepreneur : <span class="signature-line"></span></p>
  </div>
</body>
</html>',
  '{
    "client_name": "string",
    "professional_name": "string",
    "company_name": "string", 
    "rbq_number": "string",
    "project_title": "string",
    "project_description": "string",
    "project_address": "string",
    "estimated_duration": "number",
    "total_amount": "number",
    "deposit_amount": "number"
  }'::jsonb
);

-- Add function comments
COMMENT ON FUNCTION generate_contract_content IS 'Generate contract content by replacing template variables';
COMMENT ON FUNCTION is_contract_signed IS 'Check if a contract is fully signed by both parties';
COMMENT ON FUNCTION get_contract_status IS 'Get current status of a contract based on signatures and expiration';
