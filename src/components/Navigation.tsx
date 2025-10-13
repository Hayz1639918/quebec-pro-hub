import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Globe, ChevronDown, Check, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-batirnet.jpeg";

const Navigation = () => {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const content = {
    fr: {
      findPro: "Trouver un professionnel",
      discover: "Découvrir nos projets",
      login: "Connexion",
      signup: "S'inscrire",
    },
    en: {
      findPro: "Find a professional",
      discover: "Discover our projects",
      login: "Login",
      signup: "Sign up",
    }
  };

  const t = content[language];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img 
              src={logo} 
              alt="BâtirNet Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex items-center gap-8 mx-auto">
            <button 
              onClick={() => navigate("/professionals")}
              className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap"
            >
              {t.findPro}
            </button>
            <button 
              onClick={() => navigate("/projects")}
              className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap"
            >
              {t.discover}
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">Changer la langue</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card z-50">
                <DropdownMenuItem 
                  onClick={() => setLanguage('fr')}
                  className="cursor-pointer flex items-center justify-between gap-3"
                >
                  <span>🇫🇷 Français</span>
                  {language === 'fr' && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className="cursor-pointer flex items-center justify-between gap-3"
                >
                  <span>🇬🇧 English</span>
                  {language === 'en' && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card z-50">
                  <div className="px-2 py-1.5 text-sm font-semibold">
                    {profile?.full_name || user.email}
                  </div>
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    {profile?.user_type === 'client' ? 'Client' : 'Professionnel'}
                  </div>
                  <DropdownMenuSeparator />
                  {profile?.user_type === 'client' && (
                    <DropdownMenuItem 
                      onClick={() => navigate("/dashboard")}
                      className="cursor-pointer"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/auth?mode=login")}
                >
                  {t.login}
                </Button>
                <Button onClick={() => navigate("/auth?mode=signup")}>
                  {t.signup}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
