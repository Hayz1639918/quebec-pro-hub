/**
 * Types partagés pour les appels d'offres (tenders) et les propositions.
 * Les types générés Supabase (src/integrations/supabase/types.ts) sont
 * incomplets par rapport aux migrations récentes ; ces interfaces décrivent
 * les champs réellement consommés par l'UI et les PDF.
 */

export interface TeamMember {
  name?: string;
  role?: string;
  experience?: string;
}

export interface TimelinePhase {
  name?: string;
  phase?: string;
  duration?: string;
  date?: string;
}

export interface ProposalReference {
  project_name?: string;
  client_name?: string;
  contact_phone?: string;
  year?: string | number;
  value?: string | number;
}

export interface ProjectMilestone {
  name?: string;
  title?: string;
  date?: string;
  deliverables?: string;
  description?: string;
}

export type TechnicalSpec = string | { description?: string; name?: string };

export type EquipmentItem = string | { name?: string; description?: string };

export interface InsuranceRequirements {
  liability?: number;
  professional?: number;
  [key: string]: number | undefined;
}

/** Profil minimal (client ou entrepreneur) affiché dans les vues et PDF. */
export interface PartyInfo {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  rbq_number?: string | null;
}

export interface TenderProject {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  project_type?: string | null;
  city?: string | null;
  region?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  created_at?: string;
  tender_number?: string | null;
  submission_deadline?: string | null;
  questions_deadline?: string | null;
  site_visit_date?: string | null;
  project_start_date?: string | null;
  project_end_date?: string | null;
  warranty_period_months?: number | null;
  work_description_detailed?: string | null;
  technical_specifications?: TechnicalSpec[] | null;
  milestones?: ProjectMilestone[] | null;
  evaluation_criteria?: Record<string, number | string> | null;
  licensing_requirements?: Record<string, string> | null;
  insurance_requirements?: InsuranceRequirements | null;
}

export interface ProposalRecord {
  id: string;
  proposal_number?: string | null;
  project_id: string;
  professional_id: string;
  client_id?: string | null;
  message?: string | null;
  detailed_description?: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | string;
  created_at: string;
  estimated_budget?: number | null;
  estimated_duration_days?: number | null;
  budget_breakdown?: Record<string, number> | null;
  team_composition?: TeamMember[] | null;
  timeline_details?: TimelinePhase[] | null;
  references?: ProposalReference[] | null;
  equipment_list?: EquipmentItem[] | null;
  work_methodology?: string | null;
  warranty_offered_months?: number | null;
  valid_until?: string | null;
  rbq_license_number?: string | null;
  insurance_proof_url?: string | null;
}
