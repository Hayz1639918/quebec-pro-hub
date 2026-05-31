// Types for contracts and e-signature system

export type ContractStatus =
  | 'draft'
  | 'pending_client_signature'
  | 'pending_professional_signature'
  | 'pending_both_signatures'
  | 'signed'
  | 'cancelled'
  | 'expired';

export type ContractCategory = 'construction' | 'renovation' | 'maintenance' | 'consultation';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  category: ContractCategory;
  template_content: string;
  variables: Record<string, string>; // variable_name -> type
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface PaymentMilestone {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_at?: string;
}

export interface SignatureData {
  signature_image: string; // Base64 or URL
  signed_at: string;
  ip_address?: string;
  user_agent?: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface Contract {
  id: string;
  project_id: string;
  template_id: string | null;
  
  // Parties
  client_id: string;
  professional_id: string;
  
  // Contract details
  title: string;
  description: string | null;
  contract_content: string;
  variables: Record<string, unknown>;
  
  // Financial terms
  total_amount: number;
  currency: string;
  payment_schedule: PaymentMilestone[];
  deposit_percentage: number;
  payment_handling?: 'platform' | 'offline';
  
  // Timeline
  start_date: string | null;
  end_date: string | null;
  estimated_duration_days: number | null;
  
  // Status and signatures
  status: ContractStatus;
  client_signed_at: string | null;
  professional_signed_at: string | null;
  client_signature_data: SignatureData | null;
  professional_signature_data: SignatureData | null;
  
  // Legal
  terms_and_conditions: string | null;
  special_conditions: string | null;
  warranty_period_months: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  signed_at: string | null;
  
  // Versioning
  version: number;
  parent_contract_id: string | null;
  
  // Files
  contract_pdf_url: string | null;
  attachments: string[]; // Array of file URLs
  
  // Computed fields (from joins)
  client_name?: string;
  professional_name?: string;
  company_name?: string;
  project_title?: string;
  template_name?: string;
}

export interface ContractAmendment {
  id: string;
  contract_id: string;
  amendment_number: number;
  title: string;
  description: string | null;
  changes: Record<string, unknown>;
  new_content: string | null;
  approved_by_client: boolean;
  approved_by_professional: boolean;
  created_at: string;
  created_by: string | null;
}

export interface ContractInput {
  project_id: string;
  template_id?: string;
  client_id: string;
  professional_id: string;
  title: string;
  description?: string;
  variables: Record<string, unknown>;
  total_amount: number;
  currency?: string;
  payment_schedule?: PaymentMilestone[];
  deposit_percentage?: number;
  start_date?: string;
  end_date?: string;
  estimated_duration_days?: number;
  terms_and_conditions?: string;
  special_conditions?: string;
  warranty_period_months?: number;
  expires_at?: string;
}

export interface ContractSignatureInput {
  contract_id: string;
  signature_data: SignatureData;
}

export interface ContractFilters {
  status?: ContractStatus[];
  category?: ContractCategory[];
  client_id?: string;
  professional_id?: string;
  project_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
}

export interface ContractStats {
  total_contracts: number;
  signed_contracts: number;
  pending_signatures: number;
  draft_contracts: number;
  expired_contracts: number;
  total_value: number;
  average_contract_value: number;
  contracts_this_month: number;
  contracts_last_month: number;
}
