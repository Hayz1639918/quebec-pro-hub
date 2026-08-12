import { describe, expect, it } from 'vitest';
import {
  PAYMENT_HANDLING_SELECT_OPTIONS,
  getPaymentHandlingHint,
} from '@/components/payments/PaymentHandlingDisplay';

describe('getPaymentHandlingHint', () => {
  it('explains to the entrepreneur that BâtirNet only tracks direct payments', () => {
    const hint = getPaymentHandlingHint('offline', 'pro');
    expect(hint).toMatch(/directement/i);
    expect(hint).toMatch(/envoy[eé]/i);
    expect(hint).toMatch(/r[eé]ception/i);
  });

  it('does not revive escrow language for historical platform records', () => {
    const hint = getPaymentHandlingHint('platform', 'pro');
    expect(hint).toMatch(/directement/i);
    expect(hint).not.toMatch(/escrow|fonds prot[eé]g[eé]s|paiement en ligne/i);
  });

  it('tells the client that funds are settled directly with the entrepreneur', () => {
    const hint = getPaymentHandlingHint('offline', 'client');
    expect(hint).toMatch(/directement/i);
    expect(hint).toMatch(/marquer le paiement comme envoy[eé]/i);
  });

  it('keeps the same truthful behavior for historical platform records', () => {
    const hint = getPaymentHandlingHint('platform', 'client');
    expect(hint).toMatch(/directement/i);
    expect(hint).not.toMatch(/escrow|fonds prot[eé]g[eé]s|paiement en ligne/i);
  });

  it('uses a neutral sent/received tracking description for both modes', () => {
    expect(getPaymentHandlingHint('offline', 'neutral')).toMatch(/envoy[eé].*re[cç]u/i);
    expect(getPaymentHandlingHint('platform', 'neutral')).toMatch(/envoy[eé].*re[cç]u/i);
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
  it('keeps both database values readable during the migration period', () => {
    expect(Object.keys(PAYMENT_HANDLING_SELECT_OPTIONS).sort()).toEqual([
      'offline',
      'platform',
    ]);
  });

  it('labels the supported option with direct payment channels', () => {
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.offline).toMatch(/direct/i);
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.offline).toMatch(/virement/i);
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.offline).toMatch(/ch[eè]que/i);
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.offline).toMatch(/comptant/i);
  });

  it('marks the historical platform value without claiming online payment', () => {
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.platform).toMatch(/direct/i);
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.platform).toMatch(/ancien/i);
    expect(PAYMENT_HANDLING_SELECT_OPTIONS.platform).not.toMatch(/en ligne|s[eé]curis|escrow/i);
  });
});