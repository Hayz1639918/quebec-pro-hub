import type { Database, Json } from '@/integrations/supabase/types';
import type {
  EquipmentItem,
  InsuranceRequirements,
  ProjectMilestone,
  ProposalRecord,
  ProposalReference,
  TeamMember,
  TechnicalSpec,
  TenderProject,
  TimelinePhase,
} from '@/types/tender';

type ProposalViewRow = Database['public']['Views']['proposals_complete']['Row'];
type TenderViewRow = Database['public']['Views']['tenders_complete']['Row'];
type ProjectRow = Database['public']['Tables']['projects']['Row'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const jsonArray = <T>(value: Json | null): T[] | null =>
  Array.isArray(value) ? value as unknown as T[] : null;

const jsonRecord = <T extends Record<string, unknown>>(value: Json | null): T | null =>
  isRecord(value) ? value as T : null;

export const normalizeProposalRecord = (row: ProposalViewRow): ProposalRecord => ({
  id: row.id ?? '',
  proposal_number: row.proposal_number,
  project_id: row.project_id ?? '',
  professional_id: row.professional_id ?? '',
  message: row.message,
  detailed_description: row.detailed_description,
  status: row.status ?? 'pending',
  created_at: row.created_at ?? new Date(0).toISOString(),
  estimated_budget: row.estimated_budget,
  estimated_duration_days: row.estimated_duration_days,
  budget_breakdown: jsonRecord<Record<string, number>>(row.budget_breakdown),
  team_composition: jsonArray<TeamMember>(row.team_composition),
  timeline_details: jsonArray<TimelinePhase>(row.timeline_details),
  references: jsonArray<ProposalReference>(row.references),
  equipment_list: jsonArray<EquipmentItem>(row.equipment_list),
  work_methodology: row.work_methodology,
  warranty_offered_months: row.warranty_offered_months,
  valid_until: row.valid_until,
  rbq_license_number: row.rbq_license_number,
  insurance_proof_url: row.insurance_proof_url,
});

export const normalizeTenderProject = (row: TenderViewRow | ProjectRow): TenderProject => ({
  id: row.id ?? '',
  title: row.title ?? 'Projet',
  description: row.description,
  category: row.category,
  project_type: row.project_type,
  city: row.city,
  region: row.region,
  budget_min: row.budget_min,
  budget_max: row.budget_max,
  created_at: row.created_at ?? undefined,
  tender_number: row.tender_number,
  submission_deadline: row.submission_deadline,
  questions_deadline: row.questions_deadline,
  site_visit_date: row.site_visit_date,
  project_start_date: row.project_start_date,
  project_end_date: row.project_end_date,
  warranty_period_months: row.warranty_period_months,
  work_description_detailed: row.work_description_detailed,
  technical_specifications: jsonArray<TechnicalSpec>(row.technical_specifications),
  milestones: jsonArray<ProjectMilestone>(row.milestones),
  evaluation_criteria: jsonRecord<Record<string, number | string>>(row.evaluation_criteria),
  licensing_requirements: jsonRecord<Record<string, string>>(row.licensing_requirements),
  insurance_requirements: jsonRecord<InsuranceRequirements>(row.insurance_requirements),
});
