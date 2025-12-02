import { Button } from "@/components/ui/button";
import { Search, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-construction.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center pt-16 sm:pt-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-subtle -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 animate-fade-in order-2 lg:order-1">
            <div className="inline-block">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold">
                {t('hero.badge')}
              </span>
            </div>
            
            <h1 className="leading-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
              {t('hero.title')}
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>

            {/* Key Features */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="text-foreground font-medium text-sm sm:text-base">{t('hero.features.verified')}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="text-foreground font-medium text-sm sm:text-base">{t('hero.features.payments')}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="text-foreground font-medium text-sm sm:text-base">{t('hero.features.contracts')}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="gap-2 w-full sm:w-auto"
                onClick={() => navigate("/auth?mode=signup")}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('hero.cta_client')}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t('hero.cta_pro')}
              </Button>
            </div>

            {/* Social Proof - Responsive */}
            <div className="grid grid-cols-3 gap-4 sm:flex sm:items-center sm:gap-6 lg:gap-8 pt-4 sm:pt-6 border-t border-border">
              <div className="text-center sm:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">2,500+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{t('hero.stats.professionals')}</div>
              </div>
              <div className="hidden sm:block h-12 w-px bg-border" />
              <div className="text-center sm:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">15,000+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{t('hero.stats.projects')}</div>
              </div>
              <div className="hidden sm:block h-12 w-px bg-border" />
              <div className="text-center sm:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">4.8/5</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{t('hero.stats.satisfaction')}</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-[250px] sm:h-[350px] lg:h-[500px] xl:h-[600px] order-1 lg:order-2">
            <div className="absolute inset-0 bg-gradient-hero opacity-10 rounded-2xl sm:rounded-3xl blur-3xl" />
            <img
              src={heroImage}
              alt="Professional construction team collaborating on a project"
              className="relative rounded-2xl sm:rounded-3xl shadow-large object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
