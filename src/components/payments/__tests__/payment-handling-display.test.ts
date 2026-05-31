import { describe, expect, it } from 'vitest';
import {
  PAYMENT_HANDLING_SELECT_OPTIONS,
  getPaymentHandlingHint,
} from '@/components/payments/PaymentHandlingDisplay';

describe('getPaymentHandlingHint', () => {
  it('tells the entrepreneur they confirm offline payments themselves', () => {
    const hint = getPaymentHandlingHint('offline', 'pro');
    expect(hint).toMatch(/marquerez/i);
    expect(hint).toMatch(/Paiements/);
  });

  it('tells the entrepreneur platform funds are released on milestone validation', () => {
    const hint = getPaymentHandlingHint('platform', 'pro');
    expect(hint).toMatch(/escrow/i);
    expect(hint).toMatch(/jalons/i);
  });

  it('tells the client they pay the entrepreneur directly when offline', () => {
    const hint = getPaymentHandlingHint('offline', 'client');
    expect(hint).toMatch(/directement/i);
    expect(hint).toMatch(/virement|ch[eè]que|comptant/i);
  });

  it('tells the client funds are protected when paying via the platform', () => {
    const hint = getPaymentHandlingHint('platform', 'client');
    expect(hint).toMatch(/en ligne/i);
    expect(hint).toMatch(/prot[eé]g/i);
  });

  it('falls back to a neutral description for both modes', () => {
    expect(getPaymentHandlingHint('offline', 'neutral')).toMatch(/client r[eè]gle/i);
    expect(getPaymentHandlingHint('platform', 'neutral')).toMatch(/plateforme/i);
  });

  it('never returns an empty hint for any mode/audience combination', () => {
    const modes = ['platform', 'offline'] as const;
    const audiences = ['client', 'pro', 'neutral'] as const;
    for (const mode of modes) {
      for (const audience of audiences) {
        expect(getPaymentHandlingHint(mode, audience).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('PAYMENT_HANDLING_SELECT_OPTIONS', () => {
  it('exposes exactly the two contractual modes', () => {
    expect(Object.keys(PAYMENT_HANDLING_SELECT_OPTIONS).sort()).toEqual([
      'offline',
      'platform',
    ]);
  });

  it('labels the offline option with the accepted payment channels', () => {
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.offline).toMatch(/virement/i);
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.offline).toMatch(/ch[eè]que/i);
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.offline).toMatch(/comptant/i);
  });

  it('labels the platform option as secure online payment', () => {
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.platform).toMatch(/en ligne|s[eé]curis/i);
  });
});
