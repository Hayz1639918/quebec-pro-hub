import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CTA = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      <div className="container mx-auto px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Client CTA */}
          <div className="bg-card border-2 border-primary/20 rounded-3xl p-10 shadow-large hover:shadow-xl transition-all duration-300">
            <div className="mb-6">
              <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-6">
                <ArrowRight className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-4">{t('cta.client.title')}</h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {t('cta.client.description')}
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t('cta.client.button')}
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>✓ {t('cta.client.benefits.commitment')}</span>
                <span>•</span>
                <span>✓ {t('cta.client.benefits.response')}</span>
                <span>•</span>
                <span>✓ {t('cta.client.benefits.free')}</span>
              </div>
            </div>
          </div>

          {/* Contractor CTA */}
          <div className="bg-card border-2 border-accent/20 rounded-3xl p-10 shadow-large hover:shadow-xl transition-all duration-300">
            <div className="mb-6">
              <div className="inline-flex p-4 rounded-xl bg-accent/10 mb-6">
                <Briefcase className="h-8 w-8 text-accent" />
              </div>
              <h3 className="mb-4">{t('cta.contractor.title')}</h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {t('cta.contractor.description')}
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                variant="accent" 
                size="lg" 
                className="w-full"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t('cta.contractor.button')}
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>✓ {t('cta.contractor.benefits.trial')}</span>
                <span>•</span>
                <span>✓ {t('cta.contractor.benefits.payments')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
