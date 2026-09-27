import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/services/profile-service";
import RouteLoader from "@/components/RouteLoader";
import LoadError from "@/components/LoadError";

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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    setFailed(false);

    // An unavailable profile service is not an expired login. Fail closed,
    // keep the session and let the user retry without exposing protected pages.
    const timeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        setFailed(true);
        setChecking(false);
      }
    }, 10000);

    const checkAccess = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) throw error;

        if (!session) {
          navigate("/auth", { replace: true });
          return;
        }

        const profile = await getMyProfile();
        if (cancelled) return;

        if (!profile || profile.id !== session.user.id) {
          throw new Error("Professional profile unavailable");
        }
        if (profile.user_type !== "professional") {
          navigate("/dashboard", { replace: true });
          return;
        }

        setChecking(false);
      } catch {
        if (!cancelled) {
          setFailed(true);
          setChecking(false);
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    void checkAccess();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [navigate, attempt]);

  if (failed) return (
    <main className="container mx-auto max-w-xl px-4 py-16">
      <LoadError message="Impossible de vérifier l’accès à votre espace professionnel. Réessayez dans quelques instants."
        onRetry={async () => { setAttempt(value => value + 1); }} />
    </main>
  );
  if (checking) return <RouteLoader />;

  return <Outlet />;
}
