import { supabase } from '@/integrations/supabase/client';

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
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', professionalId)
    .single();

  if (error) throw error;

  return {
    hasAccount: !!data?.stripe_account_id,
    isOnboarded: data?.stripe_onboarding_complete ?? false,
    accountId: data?.stripe_account_id ?? null,
  };
}

export async function getPaymentsByContract(contractId: string) {
  const { data, error } = await supabase
    .from('payments')
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
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function isStripeConfigured(): boolean {
  return false;
}
