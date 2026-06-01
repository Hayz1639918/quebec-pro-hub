export type AppProfile = {
  user_type: string;
  profile_completed: boolean;
  is_rbq_verified: boolean;
  professional_type?: string | null;
};

export function getPostAuthRoute(profile: AppProfile | null | undefined): string {
  if (!profile) {
    return "/";
  }

  if (profile.user_type === "client") {
    return "/dashboard";
  }

  if (profile.user_type === "professional") {
    const isTrade = profile.professional_type === "trade_professional";

    // Entrepreneurs already verified go straight to the dashboard (legacy behavior).
    if (!isTrade && profile.is_rbq_verified) {
      return "/pro/dashboard";
    }

    if (!profile.profile_completed) {
      return isTrade
        ? "/complete-profile-trade"
        : "/complete-profile-entrepreneur";
    }

    // Trade professionals: RBQ/CCQ verification is optional, so they get full
    // access to the dashboard as soon as their profile is completed.
    if (isTrade) {
      return "/pro/dashboard";
    }

    // Entrepreneurs still require RBQ verification before accessing the platform.
    return "/pending-verification";
  }

  return "/";
}
