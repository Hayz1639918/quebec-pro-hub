import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AccessState = "checking" | "allowed" | "unauthenticated" | "forbidden";

export default function ProtectedAdminRoute() {
  const [accessState, setAccessState] = useState<AccessState>("checking");

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAccessState("unauthenticated");
        return;
      }

      const { data, error } = await supabase.rpc("is_admin");

      if (error || !data) {
        setAccessState("forbidden");
        return;
      }

      setAccessState("allowed");
    };

    void checkAccess();
  }, []);

  if (accessState === "checking") {
    return null;
  }

  if (accessState === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  if (accessState === "forbidden") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
