import { Search, FileText, CreditCard, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Trouvez le bon pro",
    description: "Recherchez et comparez les entrepreneurs qualifiés selon votre projet, budget et localisation.",
  },
  {
    icon: FileText,
    title: "Signez en ligne",
    description: "Créez un contrat intelligent avec jalons de paiement et e-signature sécurisée.",
  },
  {
    icon: CreditCard,
    title: "Paiements sécurisés",
    description: "Payez par étapes selon l'avancement du projet. Vos fonds sont protégés jusqu'à validation.",
  },
  {
    icon: CheckCircle2,
    title: "Évaluez la qualité",
    description: "Notez votre expérience pour aider la communauté et garantir la qualité du service.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="mb-6">Comment ça fonctionne</h2>
          <p className="text-xl text-muted-foreground">
            En quatre étapes simples, trouvez l'entrepreneur parfait et gérez votre projet en toute sérénité.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              <div className="bg-card border border-border rounded-2xl p-8 h-full shadow-soft hover:shadow-medium transition-all duration-300">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 bg-gradient-hero text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-medium">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="mb-6 mt-4">
                  <div className="inline-flex p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="mb-4 text-xl">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
