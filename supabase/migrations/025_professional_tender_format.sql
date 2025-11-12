-- Migration: Professional Quebec Tender/RFP Format
-- Date: 2024-11-12
-- Description: Adds professional fields for Quebec-style tenders (appels d'offres)
-- - Detailed project specifications
-- - Work schedule and milestones
-- - Technical requirements
-- - Insurance and licensing requirements
-- - Evaluation criteria

-- ============================================
-- PART 1: ENHANCE PROJECTS TABLE
-- ============================================

-- Add professional tender fields to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS tender_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS project_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS work_description_detailed TEXT,
  ADD COLUMN IF NOT EXISTS technical_specifications JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS work_schedule JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS insurance_requirements JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS licensing_requirements JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS evaluation_criteria JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS site_visit_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS questions_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS project_start_date DATE,
  ADD COLUMN IF NOT EXISTS project_end_date DATE,
  ADD COLUMN IF NOT EXISTS warranty_period_months INTEGER,
  ADD COLUMN IF NOT EXISTS payment_terms JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS documents_urls JSONB DEFAULT '[]';

COMMENT ON COLUMN projects.tender_number IS 'Unique tender reference number (e.g. AO-2024-001)';
COMMENT ON COLUMN projects.project_type IS 'Type of work: Construction, Renovation, Repair, etc.';
COMMENT ON COLUMN projects.work_description_detailed IS 'Detailed description of work scope';
COMMENT ON COLUMN projects.technical_specifications IS 'Array of technical specs: materials, standards, codes';
COMMENT ON COLUMN projects.work_schedule IS 'Detailed work schedule with phases';
COMMENT ON COLUMN projects.milestones IS 'Array of project milestones with dates';
COMMENT ON COLUMN projects.insurance_requirements IS 'Required insurance types and amounts';
COMMENT ON COLUMN projects.licensing_requirements IS 'RBQ license types required';
COMMENT ON COLUMN projects.evaluation_criteria IS 'Criteria for proposal evaluation';
COMMENT ON COLUMN projects.submission_deadline IS 'Deadline for proposal submission';
COMMENT ON COLUMN projects.site_visit_date IS 'Optional site visit date';
COMMENT ON COLUMN projects.questions_deadline IS 'Deadline for questions';
COMMENT ON COLUMN projects.warranty_period_months IS 'Warranty period in months';
COMMENT ON COLUMN projects.payment_terms IS 'Payment schedule and terms';
COMMENT ON COLUMN projects.documents_urls IS 'Array of supporting document URLs (plans, specs, etc.)';

-- ============================================
-- PART 2: ENHANCE PROPOSALS TABLE  
-- ============================================

-- Add professional proposal fields
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS proposal_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS detailed_description TEXT,
  ADD COLUMN IF NOT EXISTS work_methodology TEXT,
  ADD COLUMN IF NOT EXISTS team_composition JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS equipment_list JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS budget_breakdown JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS timeline_details JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS insurance_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS rbq_license_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "references" JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS warranty_offered_months INTEGER,
  ADD COLUMN IF NOT EXISTS payment_terms_accepted BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS additional_documents JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS valid_until DATE;

COMMENT ON COLUMN proposals.proposal_number IS 'Unique proposal reference (e.g. PROP-2024-001)';
COMMENT ON COLUMN proposals.detailed_description IS 'Detailed description of proposed work';
COMMENT ON COLUMN proposals.work_methodology IS 'Methodology and approach to the work';
COMMENT ON COLUMN proposals.team_composition IS 'Team members with roles and experience';
COMMENT ON COLUMN proposals.equipment_list IS 'Equipment and tools to be used';
COMMENT ON COLUMN proposals.budget_breakdown IS 'Detailed cost breakdown by category';
COMMENT ON COLUMN proposals.timeline_details IS 'Detailed timeline with milestones';
COMMENT ON COLUMN proposals.insurance_proof_url IS 'URL to insurance certificate';
COMMENT ON COLUMN proposals.rbq_license_number IS 'RBQ license number';
COMMENT ON COLUMN proposals."references" IS 'Client references with contact info';
COMMENT ON COLUMN proposals.warranty_offered_months IS 'Warranty period offered';
COMMENT ON COLUMN proposals.valid_until IS 'Proposal validity end date';

-- ============================================
-- PART 3: FUNCTIONS FOR TENDER MANAGEMENT
-- ============================================

-- Function to generate tender number
CREATE OR REPLACE FUNCTION generate_tender_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  sequence_num := LPAD(
    (SELECT COUNT(*) + 1 
     FROM projects 
     WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()))::TEXT,
    4, '0'
  );
  RETURN 'AO-' || year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_tender_number IS 
  'Generates unique tender number: AO-YYYY-#### (Appel d''Offres)';

-- Function to generate proposal number  
CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  sequence_num := LPAD(
    (SELECT COUNT(*) + 1 
     FROM proposals 
     WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()))::TEXT,
    4, '0'
  );
  RETURN 'SOUM-' || year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_proposal_number IS 
  'Generates unique proposal number: SOUM-YYYY-#### (Soumission)';

-- Trigger to auto-generate tender number
CREATE OR REPLACE FUNCTION set_tender_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tender_number IS NULL THEN
    NEW.tender_number := generate_tender_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_tender_number
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_tender_number();

-- Trigger to auto-generate proposal number
CREATE OR REPLACE FUNCTION set_proposal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proposal_number IS NULL THEN
    NEW.proposal_number := generate_proposal_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_proposal_number
  BEFORE INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION set_proposal_number();

-- ============================================
-- PART 4: VIEWS FOR PDF GENERATION
-- ============================================

-- View for complete tender with all details
CREATE OR REPLACE VIEW tenders_complete AS
SELECT 
  p.*,
  pr.full_name as client_name,
  pr.company_name as client_company,
  pr.email as client_email,
  pr.phone as client_phone
FROM projects p
LEFT JOIN profiles pr ON p.client_id = pr.id;

COMMENT ON VIEW tenders_complete IS 
  'Complete tender information for PDF generation';

-- View for proposals with professional details
CREATE OR REPLACE VIEW proposals_complete AS
SELECT 
  prop.*,
  proj.title as project_title,
  proj.tender_number,
  proj.category as project_category,
  proj.city as project_city,
  proj.region as project_region,
  client.full_name as client_name,
  client.company_name as client_company,
  client.email as client_email,
  pro.full_name as professional_name,
  pro.company_name as professional_company,
  pro.email as professional_email,
  pro.phone as professional_phone,
  pro.rbq_number as professional_rbq
FROM proposals prop
LEFT JOIN projects proj ON prop.project_id = proj.id
LEFT JOIN profiles client ON proj.client_id = client.id
LEFT JOIN profiles pro ON prop.professional_id = pro.id;

COMMENT ON VIEW proposals_complete IS 
  'Complete proposal with project and parties details for PDF generation';

-- ============================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_tender_number ON projects(tender_number);
CREATE INDEX IF NOT EXISTS idx_projects_submission_deadline ON projects(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_proposals_proposal_number ON proposals(proposal_number);
CREATE INDEX IF NOT EXISTS idx_proposals_valid_until ON proposals(valid_until);

-- ============================================
-- PART 6: GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON tenders_complete TO authenticated;
GRANT SELECT ON proposals_complete TO authenticated;

-- ============================================
-- PART 7: VERIFICATION
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'tender_number'
  ) THEN
    RAISE NOTICE '✅ Professional tender fields added to projects';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'proposal_number'
  ) THEN
    RAISE NOTICE '✅ Professional fields added to proposals';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_tender_number'
  ) THEN
    RAISE NOTICE '✅ Tender/Proposal number generation functions created';
  END IF;
END $$;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 025 completed: Professional Quebec tender format';
  RAISE NOTICE '📄 Tender numbers: AO-YYYY-#### (Appel d''Offres)';
  RAISE NOTICE '📋 Proposal numbers: SOUM-YYYY-#### (Soumission)';
  RAISE NOTICE '🏗️ Enhanced fields for technical specs, milestones, insurance';
  RAISE NOTICE '📊 Views created for PDF generation';
END $$;

