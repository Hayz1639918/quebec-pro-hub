import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-batirnet.jpeg";

const Navigation = () => {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const navigate = useNavigate();

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
            <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">
              {t.findPro}
            </a>
            <a href="#for-contractors" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">
              {t.discover}
            </a>
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
            <Button 
              variant="ghost" 
              className="hidden sm:inline-flex"
              onClick={() => navigate("/auth")}
            >
              {t.login}
            </Button>
            <Button onClick={() => navigate("/auth")}>
              {t.signup}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
