import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/services/profile-service";
import RouteLoader from "@/components/RouteLoader";

/**
 * Route guard for client-only paths.
 * - Unauthenticated users -> /auth
 * - Authenticated professionals -> /pro/dashboard
 * - Authenticated clients -> renders children via <Outlet />
 */
export default function ProtectedClientRoute() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(() => {
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

        if (!profile || profile.id !== session.user.id) {
          navigate("/auth", { replace: true });
          return;
        }

        if (profile.user_type !== "client") {
          navigate("/pro/dashboard", { replace: true });
          return;
        }

        setChecking(false);
      } catch {
        if (!cancelled) navigate("/auth", { replace: true });
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void checkAccess();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  if (checking) return <RouteLoader />;

  return <Outlet />;
}
