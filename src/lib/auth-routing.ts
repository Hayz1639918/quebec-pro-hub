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
    if (profile.is_rbq_verified) {
      return "/pro/dashboard";
    }

    if (!profile.profile_completed) {
      return profile.professional_type === "trade_professional"
        ? "/complete-profile"
        : "/complete-profile-entrepreneur";
    }

    return "/pending-verification";
  }

  return "/";
}
