// Service de signature électronique maison - Alternative gratuite à DocuSign
import { supabase } from '@/integrations/supabase/client';

export interface SignatureData {
  signature_image: string;
  signed_at: string;
  ip_address: string;
  user_agent: string;
  coordinates: { x: number; y: number };
  // Nouveaux champs pour sécurité
  document_hash: string;      // Hash SHA-256 du document
  signature_hash: string;      // Hash de la signature
  verification_code: string;   // Code de vérification unique
  geolocation?: {             // Position GPS (optionnel)
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface AuditTrail {
  event_type: 'created' | 'viewed' | 'signed' | 'verified' | 'downloaded';
  user_id: string;
  user_name: string;
  created_at: string;
  ip_address: string;
  user_agent: string;
  details?: Record<string, unknown>;
}

class SignatureService {
  // Générer un hash SHA-256 d'un document
  async generateDocumentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Générer un code de vérification unique
  generateVerificationCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `BTN-${timestamp}-${random}`.toUpperCase();
  }

  // Obtenir l'adresse IP du client via API locale (proxy Vite vers serveur dev)
  async getClientIP(): Promise<string> {
    try {
      const response = await fetch('/api/v1/client-ip');
      if (!response.ok) throw new Error('Failed to fetch client IP');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'unknown';
    }
  }

  // Obtenir la géolocalisation (avec permission)
  async getGeolocation(): Promise<SignatureData['geolocation'] | undefined> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        () => resolve(undefined),
        { timeout: 5000 }
      );
    });
  }

  // Créer une signature complète avec toutes les données
  async createSignature(
    signatureImage: string,
    contractContent: string,
    coordinates: { x: number; y: number }
  ): Promise<SignatureData> {
    const [ipAddress, geolocation, documentHash] = await Promise.all([
      this.getClientIP(),
      this.getGeolocation(),
      this.generateDocumentHash(contractContent),
    ]);

    const signatureHash = await this.generateDocumentHash(signatureImage);
    const verificationCode = this.generateVerificationCode();

    return {
      signature_image: signatureImage,
      signed_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
      coordinates,
      document_hash: documentHash,
      signature_hash: signatureHash,
      verification_code: verificationCode,
      geolocation,
    };
  }

  // Envoyer un email de confirmation de signature
  async sendSignatureConfirmationEmail(
    contractId: string,
    recipientEmail: string,
    recipientName: string,
    verificationCode: string
  ): Promise<boolean> {
    try {
      const verificationUrl = `${window.location.origin}/contracts/verify/${verificationCode}`;
      const { data, error } = await supabase.functions.invoke('send-signature-confirmation', {
        body: {
          contractId,
          recipientEmail,
          recipientName,
          verificationCode,
          verificationUrl,
        },
      });

      if (error) {
        throw error;
      }

      return Boolean(data?.success);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }
  }

  // Vérifier l'intégrité d'une signature
  async verifySignature(
    signatureData: SignatureData,
    currentDocumentContent: string
  ): Promise<{ valid: boolean; reason?: string }> {
    // Vérifier le hash du document
    const currentHash = await this.generateDocumentHash(currentDocumentContent);
    
    if (currentHash !== signatureData.document_hash) {
      return {
        valid: false,
        reason: 'Le document a été modifié après la signature',
      };
    }

    // Vérifier le hash de la signature
    const currentSigHash = await this.generateDocumentHash(signatureData.signature_image);
    
    if (currentSigHash !== signatureData.signature_hash) {
      return {
        valid: false,
        reason: 'La signature a été altérée',
      };
    }

    return { valid: true };
  }

  // Ajouter une entrée à la piste d'audit
  async addAuditTrailEntry(
    contractId: string,
    entry: Omit<AuditTrail, 'ip_address' | 'user_agent'>
  ): Promise<void> {
    const ipAddress = await this.getClientIP();
    
    const auditEntry: AuditTrail = {
      ...entry,
      created_at: entry.created_at,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
    };

    // Stocker dans Supabase
    const { error } = await supabase
      .from('contract_audit_trail')
      .insert({
        contract_id: contractId,
        event_type: auditEntry.event_type,
        user_id: entry.user_id,
        user_name: entry.user_name,
        created_at: entry.created_at,
        ip_address: auditEntry.ip_address,
        user_agent: auditEntry.user_agent,
        details: entry.details || {},
      });

    if (error) {
      console.error('Error adding audit trail entry:', error);
    }
  }

  // Obtenir l'audit trail d'un contrat
  async getContractAuditTrail(contractId: string): Promise<AuditTrail[]> {
    const { data, error } = await supabase
      .from('contract_audit_trail')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting audit trail:', error);
      return [];
    }

    return data || [];
  }
}

export const signatureService = new SignatureService();

