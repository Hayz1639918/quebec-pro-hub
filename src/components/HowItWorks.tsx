import { Search, FileText, CreditCard, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: Search,       title: t("how_it_works.steps.find.title"),   description: t("how_it_works.steps.find.description") },
    { icon: FileText,     title: t("how_it_works.steps.sign.title"),   description: t("how_it_works.steps.sign.description") },
    { icon: CreditCard,   title: t("how_it_works.steps.pay.title"),    description: t("how_it_works.steps.pay.description") },
    { icon: CheckCircle2, title: t("how_it_works.steps.review.title"), description: t("how_it_works.steps.review.description") },
  ];

  return (
    <section id="how-it-works" className="relative py-20 sm:py-24 lg:py-32 overflow-hidden bg-background">

      {/* Blueprint grid */}
      <div className="absolute inset-0 blueprint-grid opacity-50 pointer-events-none" />

      {/* Side technical annotation */}
      <div className="absolute top-12 left-4 sm:left-8 font-mono text-[9px] text-primary/30 uppercase tracking-[0.2em] pointer-events-none hidden md:block">
        <div>SEC. 002</div>
        <div className="mt-1 opacity-60">HOW_IT_WORKS</div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Section header */}
        <div className="max-w-2xl mb-14 sm:mb-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-primary animate-draw-x" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Comment ça marche
            </span>
          </div>
          <h2 className="font-display font-bold text-foreground leading-tight mb-4">
            {t("how_it_works.title")}
          </h2>
          <p className="font-body text-muted-foreground text-base sm:text-lg leading-relaxed">
            {t("how_it_works.subtitle")}
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connecting rail — desktop horizontal */}
          <div className="absolute top-[3.75rem] left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 pointer-events-none hidden xl:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-border/50">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative bg-card p-6 sm:p-7 lg:p-8 group hover:bg-primary/[0.03] transition-colors duration-300"
                >
                  {/* Corner marks */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary/0 group-hover:border-primary/40 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary/0 group-hover:border-primary/40 transition-colors" />

                  {/* Step number */}
                  <div className="flex items-start justify-between mb-6">
                    <span className="font-mono text-[10px] text-primary/50 uppercase tracking-[0.2em]">
                      ÉTAPE {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-5xl sm:text-6xl font-bold text-primary/10 leading-none select-none group-hover:text-primary/20 transition-colors">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="mb-5">
                    <div className="inline-flex p-3 border border-primary/20 bg-primary/8 group-hover:bg-primary/15 group-hover:border-primary/35 transition-all">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-ui font-semibold text-base sm:text-lg text-foreground mb-2.5">
                    {step.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Bottom dimension line */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/30 transition-all duration-500" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom annotation */}
        <div className="mt-6 flex items-center gap-3">
          <span className="font-mono text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em]">
            PROCESSUS CERTIFIÉ — SÉCURISÉ — TRANSPARENT
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
