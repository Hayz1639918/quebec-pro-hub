import type { Database, Json } from '@/integrations/supabase/types';
import type { Contract, PaymentMilestone, SignatureData } from '@/types/contracts';

type ContractRow = Database['public']['Tables']['contracts']['Row'];

function isJsonObject(value: Json | null): value is { [key: string]: Json } {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringArray(value: Json | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function normalizeContract(row: ContractRow): Contract {
  return {
    id: row.id,
    project_id: row.project_id,
    template_id: row.template_id,
    client_id: row.client_id,
    professional_id: row.professional_id,
    title: row.title,
    description: row.description,
    contract_content: row.contract_content,
    variables: isJsonObject(row.variables) ? row.variables : {},
    total_amount: row.total_amount,
    currency: row.currency || 'CAD',
    payment_schedule: Array.isArray(row.payment_schedule)
      ? row.payment_schedule as unknown as PaymentMilestone[]
      : [],
    deposit_percentage: row.deposit_percentage ?? 0,
    payment_handling: row.payment_handling === 'offline' ? 'offline' : 'platform',
    start_date: row.start_date,
    end_date: row.end_date,
    estimated_duration_days: row.estimated_duration_days,
    status: row.status || 'draft',
    client_signed_at: row.client_signed_at,
    professional_signed_at: row.professional_signed_at,
    client_signature_data: isJsonObject(row.client_signature_data)
      ? row.client_signature_data as unknown as SignatureData
      : null,
    professional_signature_data: isJsonObject(row.professional_signature_data)
      ? row.professional_signature_data as unknown as SignatureData
      : null,
    terms_and_conditions: row.terms_and_conditions,
    special_conditions: row.special_conditions,
    warranty_period_months: row.warranty_period_months ?? 0,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    expires_at: row.expires_at,
    signed_at: row.signed_at,
    version: row.version ?? 1,
    parent_contract_id: row.parent_contract_id,
    contract_pdf_url: row.contract_pdf_url,
    attachments: stringArray(row.attachments),
  };
}
