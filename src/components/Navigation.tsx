import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, ChevronDown } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo-batirnet.jpeg";

const Navigation = () => {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const content = {
    fr: {
      findPro: "Trouver un professionnel",
      discover: "Découvrir nos projets",
      login: "Connexion",
      signup: "S'inscrire",
      currentLang: "Français",
    },
    en: {
      findPro: "Find a professional",
      discover: "Discover our projects",
      login: "Login",
      signup: "Sign up",
      currentLang: "English",
    }
  };

  const t = content[language];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="BâtirNet Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors font-medium">
              {t.findPro}
            </a>
            <a href="#for-contractors" className="text-foreground hover:text-primary transition-colors font-medium">
              {t.discover}
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Globe className="h-5 w-5" />
                  <span className="hidden sm:inline">{t.currentLang}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                <DropdownMenuItem 
                  onClick={() => setLanguage('fr')}
                  className="cursor-pointer"
                >
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className="cursor-pointer"
                >
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" className="hidden sm:inline-flex">
              {t.login}
            </Button>
            <Button variant="default">
              {t.signup}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
