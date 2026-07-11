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

    if (!profile.profile_completed) {
      return isTrade
        ? "/complete-profile-trade"
        : "/complete-profile-entrepreneur";
    }

    // RBQ/CCQ verification is OPTIONAL for everyone : entrepreneurs and trade
    // professionals get full access to the dashboard as soon as their profile
    // is completed. Uploading a licence only adds a "Vérifié" badge later.
    return "/pro/dashboard";
  }

  return "/";
}
