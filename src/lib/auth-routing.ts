export type AppProfile = {
  user_type: string;
  profile_completed: boolean;
  /** Display-only approval flag. It must never be used to authorize features. */
  is_rbq_verified?: boolean;
  professional_type?: string | null;
};

export type ProfessionalAccessProfile = {
  user_type?: string | null;
  profile_completed?: boolean | null;
  professional_type?: string | null;
  /** Accepted for callers that already fetched it; intentionally ignored. */
  is_rbq_verified?: boolean | null;
};

export function getProfessionalCompletionRoute(
  professionalType?: string | null,
): string {
  return professionalType === "trade_professional"
    ? "/complete-profile-trade"
    : "/complete-profile-entrepreneur";
}

/**
 * A completed professional profile is the only business requirement for using
 * professional features. RBQ/CCQ/certification approval only controls the
 * public approval badge and is deliberately absent from this policy.
 */
export function canUseProfessionalPlatform(
  profile: ProfessionalAccessProfile | null | undefined,
): boolean {
  return profile?.user_type === "professional" && profile.profile_completed === true;
}

export function getPostAuthRoute(profile: AppProfile | null | undefined): string {
  if (!profile) {
    return "/";
  }

  if (profile.user_type === "client") {
    return "/dashboard";
  }

  if (profile.user_type === "professional") {
    if (!canUseProfessionalPlatform(profile)) {
      return getProfessionalCompletionRoute(profile.professional_type);
    }

    return "/pro/dashboard";
  }

  return "/";
}
