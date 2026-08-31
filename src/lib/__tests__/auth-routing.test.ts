import { describe, expect, it } from 'vitest';
import { canUseProfessionalPlatform, getPostAuthRoute } from '@/lib/auth-routing';

describe('getPostAuthRoute', () => {
  it('redirects unauthenticated or missing profiles to home', () => {
    expect(getPostAuthRoute(null)).toBe('/');
  });

  it('redirects clients to the client dashboard', () => {
    expect(
      getPostAuthRoute({
        user_type: 'client',
        profile_completed: true,
        is_rbq_verified: false,
      }),
    ).toBe('/dashboard');
  });

  it('redirects verified professionals to the pro dashboard', () => {
    expect(
      getPostAuthRoute({
        user_type: 'professional',
        profile_completed: true,
        is_rbq_verified: true,
        professional_type: 'entrepreneur',
      }),
    ).toBe('/pro/dashboard');
  });

  it('redirects incomplete trade professionals to the correct completion flow', () => {
    expect(
      getPostAuthRoute({
        user_type: 'professional',
        profile_completed: false,
        is_rbq_verified: false,
        professional_type: 'trade_professional',
      }),
    ).toBe('/complete-profile-trade');
  });

  it('redirects incomplete entrepreneurs to the entrepreneur completion flow', () => {
    expect(
      getPostAuthRoute({
        user_type: 'professional',
        profile_completed: false,
        is_rbq_verified: false,
        professional_type: 'entrepreneur',
      }),
    ).toBe('/complete-profile-entrepreneur');
  });

  it('gives completed entrepreneurs full access without RBQ verification', () => {
    expect(
      getPostAuthRoute({
        user_type: 'professional',
        profile_completed: true,
        is_rbq_verified: false,
        professional_type: 'entrepreneur',
      }),
    ).toBe('/pro/dashboard');
  });

  it('gives completed trade professionals full access without RBQ verification', () => {
    expect(
      getPostAuthRoute({
        user_type: 'professional',
        profile_completed: true,
        is_rbq_verified: false,
        professional_type: 'trade_professional',
      }),
    ).toBe('/pro/dashboard');
  });
});

describe('canUseProfessionalPlatform', () => {
  it.each([true, false])(
    'does not use certification approval (%s) as an access requirement',
    (isRbqVerified) => {
      expect(
        canUseProfessionalPlatform({
          user_type: 'professional',
          profile_completed: true,
          professional_type: 'entrepreneur',
          is_rbq_verified: isRbqVerified,
        }),
      ).toBe(true);
    },
  );

  it('still requires the professional onboarding profile to be completed', () => {
    expect(
      canUseProfessionalPlatform({
        user_type: 'professional',
        profile_completed: false,
        professional_type: 'entrepreneur',
      }),
    ).toBe(false);
  });

  it('does not grant professional features to a client account', () => {
    expect(
      canUseProfessionalPlatform({
        user_type: 'client',
        profile_completed: true,
      }),
    ).toBe(false);
  });
});
