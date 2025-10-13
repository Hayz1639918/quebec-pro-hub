import { Shield, Award, Clock, MessageSquare, FileCheck, Globe2 } from "lucide-react";
import contractorImage from "@/assets/contractor-profile.jpg";
import clientImage from "@/assets/client-success.jpg";

const features = [
  {
    icon: Shield,
    title: "Sécurité maximale",
    description: "Vérifications RBQ, assurances, permis. Paiements protégés avec système de jalons.",
  },
  {
    icon: Award,
    title: "Qualité garantie",
    description: "Évaluations détaillées sur ponctualité, qualité, respect des délais et communication.",
  },
  {
    icon: Clock,
    title: "Gain de temps",
    description: "Trouvez rapidement les meilleurs pros grâce à nos filtres intelligents et recommandations.",
  },
  {
    icon: MessageSquare,
    title: "Communication fluide",
    description: "Messagerie intégrée, notifications en temps réel et suivi de projet centralisé.",
  },
  {
    icon: FileCheck,
    title: "Contrats intelligents",
    description: "Bibliothèque de modèles par type de travaux, e-signature et versioning automatique.",
  },
  {
    icon: Globe2,
    title: "Multilingue",
    description: "Interface disponible en français et anglais, avec support pour d'autres langues.",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="mb-6">Une plateforme complète et sécurisée</h2>
          <p className="text-xl text-muted-foreground">
            BâtirNet combine technologie de pointe et simplicité pour offrir la meilleure expérience aux clients et entrepreneurs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <div className="mb-6">
                <div className="inline-flex p-4 rounded-xl bg-primary/10">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="mb-4 text-xl">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Image Showcase */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative rounded-2xl overflow-hidden shadow-large group">
            <img
              src={contractorImage}
              alt="Professional contractor reviewing construction plans"
              className="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent flex items-end p-8">
              <div className="text-background">
                <h3 className="text-2xl font-bold mb-2 text-primary-foreground">Pour les entrepreneurs</h3>
                <p className="text-primary-foreground/90">
                  Développez votre activité avec des clients qualifiés et des outils professionnels.
                </p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-large group">
            <img
              src={clientImage}
              alt="Satisfied client with contractor after successful project"
              className="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent flex items-end p-8">
              <div className="text-background">
                <h3 className="text-2xl font-bold mb-2 text-primary-foreground">Pour les clients</h3>
                <p className="text-primary-foreground/90">
                  Réalisez vos projets en toute confiance avec les meilleurs professionnels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
