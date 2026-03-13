// Types for Epic 30 & 32: Contractor Profile System

// -------------------------------------------------------
// US-106: Contractor Trades
// -------------------------------------------------------
export interface ContractorTrade {
  id: string;
  professional_id: string;
  trade_code: string;
  trade_name: string;
  is_primary: boolean;
  created_at: string;
}

// -------------------------------------------------------
// US-107: RBQ Licenses
// -------------------------------------------------------
export type RBQLicenseStatus = 'pending_verification' | 'valid' | 'expired' | 'revoked';

export interface RBQLicense {
  id: string;
  professional_id: string;
  license_number: string;
  category: string;
  status: RBQLicenseStatus;
  certificate_url: string | null;
  issued_at: string | null;
  expires_at: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RBQLicenseFormData {
  license_number: string;
  category: string;
  issued_at?: string;
  expires_at?: string;
  certificate_url?: string;
}

// -------------------------------------------------------
// US-108: Insurance Certificates
// -------------------------------------------------------
export type InsuranceType = 'liability' | 'professional' | 'other';
export type InsuranceStatus = 'active' | 'expiring_soon' | 'expired';

export interface InsuranceCertificate {
  id: string;
  professional_id: string;
  insurance_type: InsuranceType;
  certificate_url: string | null;
  expires_at: string;
  status: InsuranceStatus;
  renewal_alert_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsuranceCertificateFormData {
  insurance_type: InsuranceType;
  expires_at: string;
  certificate_url?: string;
}

// -------------------------------------------------------
// US-109: Professional Certifications
// -------------------------------------------------------
export type CertType = 'ccq' | 'asp' | 'other';

export interface ProfessionalCertification {
  id: string;
  professional_id: string;
  cert_type: CertType;
  cert_name: string;
  cert_number: string | null;
  issued_at: string | null;
  expires_at: string | null;
  certificate_url: string | null;
  issuer: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificationFormData {
  cert_type: CertType;
  cert_name: string;
  cert_number?: string;
  issued_at?: string;
  expires_at?: string;
  issuer?: string;
}

// -------------------------------------------------------
// US-111: Rate Grids
// -------------------------------------------------------
export type RateType = 'hourly' | 'flat' | 'per_sqft';

export interface RateGrid {
  id: string;
  professional_id: string;
  trade_code: string;
  rate_type: RateType;
  min_rate: number;
  max_rate: number | null;
  currency: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RateGridFormData {
  trade_code: string;
  rate_type: RateType;
  min_rate: number;
  max_rate?: number;
  description?: string;
}

// -------------------------------------------------------
// US-115: Portfolio Item (extended)
// -------------------------------------------------------
export interface PortfolioItemExtended {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  project_date: string | null;
  category: string | null;
  work_category: string | null;
  project_cost: number | null;
  duration_days: number | null;
  location: string | null;
  is_featured: boolean;
  created_at: string;
}
