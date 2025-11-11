import { Search, FileText, CreditCard, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Search,
      title: t('how_it_works.steps.find.title'),
      description: t('how_it_works.steps.find.description'),
    },
    {
      icon: FileText,
      title: t('how_it_works.steps.sign.title'),
      description: t('how_it_works.steps.sign.description'),
    },
    {
      icon: CreditCard,
      title: t('how_it_works.steps.pay.title'),
      description: t('how_it_works.steps.pay.description'),
    },
    {
      icon: CheckCircle2,
      title: t('how_it_works.steps.review.title'),
      description: t('how_it_works.steps.review.description'),
    },
  ];
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="mb-6">{t('how_it_works.title')}</h2>
          <p className="text-xl text-muted-foreground">
            {t('how_it_works.subtitle')}
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
