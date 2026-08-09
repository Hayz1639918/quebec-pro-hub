import { Search, FileText, CreditCard, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: Search,       num: "01", title: t("how_it_works.steps.find.title"),   description: t("how_it_works.steps.find.description") },
    { icon: FileText,     num: "02", title: t("how_it_works.steps.sign.title"),   description: t("how_it_works.steps.sign.description") },
    { icon: CreditCard,   num: "03", title: t("how_it_works.steps.pay.title"),    description: t("how_it_works.steps.pay.description") },
    { icon: CheckCircle2, num: "04", title: t("how_it_works.steps.review.title"), description: t("how_it_works.steps.review.description") },
  ];

  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-24 overflow-hidden bg-background">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header — editorial style */}
        <div className="mb-10 sm:mb-14 max-w-3xl">
          <span className="font-mono text-[11px] text-foreground/30 uppercase tracking-[0.15em] block mb-4">
            Comment ça marche
          </span>
          <h2 className="font-display text-foreground leading-[1.02] mb-4">
            {t("how_it_works.title")}
          </h2>
          <div className="h-px w-16 bg-foreground/12 mb-4" />
          <p className="font-body text-lg text-foreground/40 leading-relaxed max-w-xl">
            {t("how_it_works.subtitle")}
          </p>
        </div>

        {/* Steps — clean numbered list */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative py-8 xl:py-10 xl:px-8 border-t border-foreground/8 group hover:bg-foreground/[0.02] transition-colors duration-500"
              >
                {/* Number + icon row */}
                <div className="flex items-start justify-between mb-8">
                  <span className="font-mono text-[11px] text-foreground/20 tracking-[0.1em]">
                    {step.num}
                  </span>
                  <div className="p-2.5 border border-foreground/8 bg-foreground/[0.02] group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-500">
                    <Icon className="h-5 w-5 text-foreground/25 group-hover:text-primary transition-colors duration-500" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-ui font-medium text-lg text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-foreground/35 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
