import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Route guard for /pro/* paths.
 * - Unauthenticated users → /auth
 * - Authenticated clients (non-professional) → /dashboard
 * - Authenticated professionals → renders children via <Outlet />
 */
export default function ProtectedProRoute() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      const userType = session.user.user_metadata?.user_type;
      if (userType !== "professional") {
        navigate("/dashboard", { replace: true });
        return;
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;

  return <Outlet />;
}
