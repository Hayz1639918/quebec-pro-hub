import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Briefcase, MessageSquare, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Role = "client" | "professional" | null;

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async (uid: string | undefined) => {
      if (!uid) {
        if (active) { setAuthed(false); setRole(null); }
        return;
      }
      if (active) setAuthed(true);
      const { data } = await supabase.from("profiles").select("user_type").eq("id", uid).single();
      if (active) setRole((data?.user_type as Role) ?? null);
    };

    supabase.auth.getSession().then(({ data }) => load(data.session?.user.id));
    // Defer Supabase calls out of the auth callback: running them synchronously
    // here can deadlock the Supabase auth lock and hang the whole app.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user.id;
      setTimeout(() => load(uid), 0);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!authed) return null;

  const isPro = role === "professional";
  const items = [
    { label: "Accueil", icon: Home, path: isPro ? "/pro/dashboard" : "/dashboard" },
    { label: "Projets", icon: Briefcase, path: isPro ? "/projects" : "/dashboard?tab=projects" },
    { label: "Messages", icon: MessageSquare, path: "/messages" },
    { label: "Profil", icon: User, path: isPro ? "/pro/profile" : "/dashboard/profile" },
  ];

  const isActive = (path: string) => {
    const [base, query] = path.split("?");
    if (location.pathname !== base) return false;
    // Deux entrées peuvent partager le même chemin (ex. client : Accueil =
    // /dashboard, Projets = /dashboard?tab=projects). On distingue par l'onglet
    // pour qu'une seule soit active à la fois.
    const targetTab = new URLSearchParams(query).get("tab");
    const currentTab = new URLSearchParams(location.search).get("tab");
    return targetTab ? currentTab === targetTab : !currentTab;
  };

  return (
    <>
    {/* Spacer so fixed nav doesn't hide page content on mobile */}
    <div className="h-14 md:hidden" aria-hidden="true" />
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={`h-5 w-5 ${active ? "fill-primary/10" : ""}`} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
};

export default BottomNav;
