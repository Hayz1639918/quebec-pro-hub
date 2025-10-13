import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const navigate = useNavigate();

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
              <h3 className="mb-4">Vous avez un projet ?</h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Trouvez l'entrepreneur parfait pour votre projet de construction ou rénovation. 
                Gratuit pour les clients, simple et sécurisé.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={() => navigate("/auth?mode=signup")}
              >
                Créer un projet gratuitement
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>✓ Sans engagement</span>
                <span>•</span>
                <span>✓ Réponses sous 24h</span>
                <span>•</span>
                <span>✓ 100% gratuit</span>
              </div>
            </div>
          </div>

          {/* Contractor CTA */}
          <div className="bg-card border-2 border-accent/20 rounded-3xl p-10 shadow-large hover:shadow-xl transition-all duration-300">
            <div className="mb-6">
              <div className="inline-flex p-4 rounded-xl bg-accent/10 mb-6">
                <Briefcase className="h-8 w-8 text-accent" />
              </div>
              <h3 className="mb-4">Vous êtes entrepreneur ?</h3>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Rejoignez BâtirNet et accédez à des milliers de projets qualifiés. 
                Développez votre activité avec des outils professionnels.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                variant="accent" 
                size="lg" 
                className="w-full"
                onClick={() => navigate("/auth?mode=signup")}
              >
                Devenir partenaire
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>✓ Essai gratuit 30 jours</span>
                <span>•</span>
                <span>✓ Paiements sécurisés</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
