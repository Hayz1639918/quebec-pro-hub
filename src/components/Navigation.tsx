import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo-batirnet.jpeg";

const Navigation = () => {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'en' : 'fr');
  };

  const content = {
    fr: {
      findPro: "Trouver un pro",
      forPros: "Pour les pros",
      login: "Connexion",
      signup: "S'inscrire",
    },
    en: {
      findPro: "Find a pro",
      forPros: "For pros",
      login: "Login",
      signup: "Sign up",
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

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors font-medium">
              {t.findPro}
            </a>
            <a href="#for-contractors" className="text-foreground hover:text-primary transition-colors font-medium">
              {t.forPros}
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="rounded-full"
            >
              <Globe className="h-5 w-5" />
              <span className="sr-only">Toggle language</span>
            </Button>
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
