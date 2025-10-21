import { Button } from "@/components/ui/button";
import { Search, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-construction.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    "Entrepreneurs vérifiés et certifiés",
    "Paiements sécurisés par jalons",
    "Contrats intelligents avec e-signature"
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-subtle -z-10" />
      
      <div className="container mx-auto px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                🇨🇦 Plateforme canadienne de confiance
              </span>
            </div>
            
            <h1 className="leading-tight">
              {t('hero.title')}
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>

            {/* Key Features */}
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="gap-2"
                onClick={() => navigate("/auth?mode=signup")}
              >
                <Search className="h-5 w-5" />
                {t('hero.cta_client')}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t('hero.cta_pro')}
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-8 pt-6 border-t border-border">
              <div>
                <div className="text-3xl font-bold text-foreground">2,500+</div>
                <div className="text-sm text-muted-foreground">{t('hero.stats.professionals')}</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">15,000+</div>
                <div className="text-sm text-muted-foreground">{t('hero.stats.projects')}</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">4.8/5</div>
                <div className="text-sm text-muted-foreground">{t('hero.stats.satisfaction')}</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative lg:h-[600px]">
            <div className="absolute inset-0 bg-gradient-hero opacity-10 rounded-3xl blur-3xl" />
            <img
              src={heroImage}
              alt="Professional construction team collaborating on a project"
              className="relative rounded-3xl shadow-large object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
