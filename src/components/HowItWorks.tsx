import { Search, FileText, CreditCard, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: Search,        title: t('how_it_works.steps.find.title'),   description: t('how_it_works.steps.find.description') },
    { icon: FileText,      title: t('how_it_works.steps.sign.title'),   description: t('how_it_works.steps.sign.description') },
    { icon: CreditCard,    title: t('how_it_works.steps.pay.title'),    description: t('how_it_works.steps.pay.description') },
    { icon: CheckCircle2,  title: t('how_it_works.steps.review.title'), description: t('how_it_works.steps.review.description') },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-28 relative overflow-hidden">
      {/* Bande de fond secondaire subtile */}
      <div className="absolute inset-0 bg-secondary/40 -skew-y-1 origin-top-left pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* ── Section header ── */}
        <div className="max-w-2xl mb-14 sm:mb-20">
          <span className="inline-block font-ui text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-4">
            Comment ça marche
          </span>
          <h2 className="font-display font-bold text-foreground leading-tight">
            {t('how_it_works.title')}
          </h2>
          <p className="font-body text-muted-foreground mt-4 text-base sm:text-lg leading-relaxed">
            {t('how_it_works.subtitle')}
          </p>
        </div>

        {/* ── Steps ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            return (
              <div key={index} className="relative group">
                {/* Connector line between steps (desktop) */}
                {!isLast && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-px bg-border z-0">
                    <div className="h-full bg-gradient-to-r from-primary/30 to-transparent w-0 group-hover:w-full transition-all duration-700" />
                  </div>
                )}

                <div className="relative z-10 p-6 lg:p-8 card-lift rounded-lg border border-border bg-card hover:bg-card/80 mx-2 lg:mx-3">
                  {/* Step number — large Fraunces italic */}
                  <div className="font-display font-bold italic text-5xl sm:text-6xl text-primary/15 leading-none mb-4 select-none">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  {/* Icon */}
                  <div className="mb-5 inline-flex p-3 rounded-sm bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  {/* Title */}
                  <h3 className="font-ui font-semibold text-base sm:text-lg text-foreground mb-2 leading-snug">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
