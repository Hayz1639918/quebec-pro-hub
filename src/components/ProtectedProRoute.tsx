import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }

      // Fast path: trust user_metadata when present
      const userTypeFromMeta = session.user.user_metadata?.user_type;
      if (userTypeFromMeta === "professional") {
        setChecking(false);
        return;
      }

      // Fallback: verify against profiles table (handles stale/missing metadata)
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.user_type !== "professional") {
        navigate("/dashboard", { replace: true });
        return;
      }

      setChecking(false);
    };

    checkAccess();
  }, [navigate]);

  if (checking) return null;

  return <Outlet />;
}
