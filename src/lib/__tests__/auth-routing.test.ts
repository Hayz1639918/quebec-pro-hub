import { describe, expect, it } from 'vitest';
import { getPostAuthRoute } from '@/lib/auth-routing';

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

  it('redirects pending entrepreneurs to the verification waiting screen', () => {
    expect(
      getPostAuthRoute({
        user_type: 'professional',
        profile_completed: true,
        is_rbq_verified: false,
        professional_type: 'entrepreneur',
      }),
    ).toBe('/pending-verification');
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
