import { supabase } from '@/integrations/supabase/client';
import { getMyProfile } from '@/services/profile-service';

const STRIPE_NOT_CONFIGURED = 'Stripe is not configured. Please provide API keys.';

function assertStripeConfigured(): never {
  throw new Error(STRIPE_NOT_CONFIGURED);
}

export interface CreateCheckoutParams {
  milestoneId: string;
  contractId: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface ConnectAccountParams {
  professionalId: string;
  email: string;
  businessName?: string;
}

export interface TransferParams {
  paymentId: string;
  destinationAccountId: string;
  amount: number;
  currency?: string;
}

export async function createCheckoutSession(_params: CreateCheckoutParams): Promise<{ url: string }> {
  assertStripeConfigured();
}

export async function createConnectAccount(_params: ConnectAccountParams): Promise<{ accountId: string; onboardingUrl: string }> {
  assertStripeConfigured();
}

export async function getPaymentStatus(_paymentIntentId: string): Promise<{ status: string; amount: number }> {
  assertStripeConfigured();
}

export async function createTransfer(_params: TransferParams): Promise<{ transferId: string }> {
  assertStripeConfigured();
}

export async function generateInvoicePDF(_invoiceId: string): Promise<{ pdfUrl: string }> {
  assertStripeConfigured();
}

export async function getConnectOnboardingStatus(professionalId: string): Promise<{
  hasAccount: boolean;
  isOnboarded: boolean;
  accountId: string | null;
}> {
  const data = await getMyProfile();
  if (!data || data.id !== professionalId) {
    throw new Error('Not authorized to read this payout profile.');
  }

  return {
    hasAccount: !!data?.stripe_account_id,
    isOnboarded: data?.payout_enabled ?? false,
    accountId: data?.stripe_account_id ?? null,
  };
}

export async function getPaymentsByContract(contractId: string) {
  const { data, error } = await supabase
    .from('contractor_payments')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getInvoicesByContract(contractId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('contract_id', contractId)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function isStripeConfigured(): boolean {
  return false;
}
