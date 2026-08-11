import { supabase } from '@/integrations/supabase/client';
import type { Contract } from '@/types/contracts';
import type { Database, Json } from '@/integrations/supabase/types';
import { normalizeContract } from '@/lib/contract-mapper';

export interface SignatureSubmission {
  signature_image: string;
  coordinates: { x: number; y: number };
  signature_method: 'draw' | 'type';
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface SignatureData extends SignatureSubmission {
  signed_at: string;
  ip_address: string;
  user_agent: string;
  document_hash: string;
  signature_hash: string;
  verification_code: string;
}

export interface AuditTrail {
  id: string;
  event_type: string;
  user_name: string;
  created_at: string;
  ip_address: string | null;
  details: Record<string, unknown>;
}

interface SigningResponse {
  success?: boolean;
  message?: string;
  contract?: Database['public']['Tables']['contracts']['Row'];
  signatureData?: SignatureData;
  signerRole?: 'client' | 'professional';
  emailSent?: boolean;
}

class SignatureService {
  async getGeolocation(): Promise<SignatureSubmission['geolocation'] | undefined> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
        () => resolve(undefined),
        { timeout: 5000 },
      );
    });
  }

  async createSignatureSubmission(
    signatureImage: string,
    coordinates: { x: number; y: number },
    signatureMethod: SignatureSubmission['signature_method'],
  ): Promise<SignatureSubmission> {
    return {
      signature_image: signatureImage,
      coordinates,
      signature_method: signatureMethod,
      geolocation: await this.getGeolocation(),
    };
  }

  async signContract(
    contractId: string,
    signatureData: SignatureSubmission,
  ): Promise<{
    contract: Contract;
    signatureData: SignatureData;
    signerRole: 'client' | 'professional';
    emailSent: boolean;
  }> {
    const { data, error } = await supabase.functions.invoke<SigningResponse>(
      'send-signature-confirmation',
      { body: { contractId, signatureData } },
    );

    if (error) throw error;
    if (!data?.success || !data.contract || !data.signatureData || !data.signerRole) {
      throw new Error(data?.message || 'La signature n’a pas pu être enregistrée.');
    }

    return {
      contract: normalizeContract(data.contract),
      signatureData: data.signatureData,
      signerRole: data.signerRole,
      emailSent: Boolean(data.emailSent),
    };
  }

  async recordAuditEvent(
    contractId: string,
    eventType: 'viewed' | 'downloaded',
    details: Record<string, unknown> = {},
  ): Promise<void> {
    const { error } = await supabase.rpc('add_contract_audit_event', {
      p_contract_id: contractId,
      p_event_type: eventType,
      p_user_agent: navigator.userAgent,
      p_details: details as Json,
    });

    if (error) {
      console.error('Unable to record contract audit event:', error);
    }
  }

  async getContractAuditTrail(contractId: string): Promise<AuditTrail[]> {
    const { data, error } = await supabase.rpc('get_contract_audit_trail', {
      contract_uuid: contractId,
    });

    if (error) {
      console.error('Unable to read contract audit trail:', error);
      return [];
    }

    return (data || []) as AuditTrail[];
  }
}

export const signatureService = new SignatureService();
