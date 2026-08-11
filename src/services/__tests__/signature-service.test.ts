import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: mocks.invoke },
    rpc: mocks.rpc,
  },
}));

import { signatureService } from '@/services/signature-service';

describe('signatureService', () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
    mocks.rpc.mockReset();
  });

  it('ne fabrique aucune preuve de signature dans le navigateur', async () => {
    const submission = await signatureService.createSignatureSubmission(
      'data:image/png;base64,AAAA',
      { x: 12, y: 34 },
      'draw',
    );

    expect(submission).toMatchObject({
      signature_image: 'data:image/png;base64,AAAA',
      coordinates: { x: 12, y: 34 },
      signature_method: 'draw',
    });
    expect(submission).not.toHaveProperty('verification_code');
    expect(submission).not.toHaveProperty('signed_at');
    expect(submission).not.toHaveProperty('ip_address');
    expect(submission).not.toHaveProperty('document_hash');
  });

  it('envoie uniquement le contrat et la soumission au service sécurisé', async () => {
    const signatureData = {
      signature_image: 'data:image/png;base64,AAAA',
      coordinates: { x: 0, y: 0 },
      signature_method: 'type' as const,
      signed_at: '2026-08-11T12:00:00.000Z',
      ip_address: '203.0.113.1',
      user_agent: 'test',
      document_hash: 'a'.repeat(64),
      signature_hash: 'b'.repeat(64),
      verification_code: `BTN-${'C'.repeat(36)}`,
    };
    const contract = { id: 'contract-id' };
    mocks.invoke.mockResolvedValue({
      data: {
        success: true,
        contract,
        signatureData,
        signerRole: 'client',
        emailSent: true,
      },
      error: null,
    });

    const submission = {
      signature_image: signatureData.signature_image,
      coordinates: signatureData.coordinates,
      signature_method: signatureData.signature_method,
    };
    const result = await signatureService.signContract('contract-id', submission);

    expect(mocks.invoke).toHaveBeenCalledWith('send-signature-confirmation', {
      body: { contractId: 'contract-id', signatureData: submission },
    });
    expect(result.signatureData.verification_code).toBe(signatureData.verification_code);
  });

  it('utilise le RPC contrôlé pour la piste d’audit', async () => {
    mocks.rpc.mockResolvedValue({ data: 'event-id', error: null });

    await signatureService.recordAuditEvent('contract-id', 'downloaded', { download_type: 'pdf' });

    expect(mocks.rpc).toHaveBeenCalledWith('add_contract_audit_event', expect.objectContaining({
      p_contract_id: 'contract-id',
      p_event_type: 'downloaded',
      p_details: { download_type: 'pdf' },
    }));
  });
});
