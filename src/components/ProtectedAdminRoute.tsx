import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import RouteLoader from "@/components/RouteLoader";

type AccessState = "checking" | "allowed" | "unauthenticated" | "forbidden";

export default function ProtectedAdminRoute() {
  const [accessState, setAccessState] = useState<AccessState>("checking");

  useEffect(() => {
    let cancelled = false;

    // Safety net: never strand the user on a blank screen if getSession() or
    // the is_admin RPC hangs for any reason — fall back to a redirect.
    const timeout = setTimeout(() => {
      if (!cancelled) setAccessState("forbidden");
    }, 10000);

    const checkAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;

        if (!session) {
          setAccessState("unauthenticated");
          return;
        }

        const { data, error } = await supabase.rpc("is_admin");
        if (cancelled) return;

        if (error || !data) {
          setAccessState("forbidden");
          return;
        }

        setAccessState("allowed");
      } catch {
        if (!cancelled) setAccessState("forbidden");
      } finally {
        clearTimeout(timeout);
      }
    };

    void checkAccess();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (accessState === "checking") {
    return <RouteLoader />;
  }

  if (accessState === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  if (accessState === "forbidden") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
