import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/services/profile-service";
import RouteLoader from "@/components/RouteLoader";

/**
 * Route guard for /pro/* paths.
 * - Unauthenticated users → /auth
 * - Authenticated clients (non-professional) → /dashboard
 * - Authenticated professionals → renders children via <Outlet />
 *
 * NOTE: We check the profiles table (source of truth) rather than
 * session.user.user_metadata, which can be stale or missing for
 * accounts created before user_type was stored in JWT metadata.
 */
export default function ProtectedProRoute() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Safety net: never strand the user on a blank screen if the auth calls
    // hang for any reason — fall back to the auth page.
    const timeout = setTimeout(() => {
      if (!cancelled) navigate("/auth", { replace: true });
    }, 10000);

    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (!session) {
          navigate("/auth", { replace: true });
          return;
        }

        const profile = await getMyProfile();
        if (cancelled) return;

        if (!profile || profile.id !== session.user.id || profile.user_type !== "professional") {
          navigate("/dashboard", { replace: true });
          return;
        }

        setChecking(false);
      } catch {
        if (!cancelled) navigate("/auth", { replace: true });
      } finally {
        clearTimeout(timeout);
      }
    };

    void checkAccess();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (checking) return <RouteLoader />;

  return <Outlet />;
}
