import { Search, FileText, CreditCard, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: Search, title: t("how_it_works.steps.find.title"), description: t("how_it_works.steps.find.description") },
    { icon: FileText, title: t("how_it_works.steps.sign.title"), description: t("how_it_works.steps.sign.description") },
    { icon: CreditCard, title: t("how_it_works.steps.pay.title"), description: t("how_it_works.steps.pay.description") },
    { icon: CheckCircle2, title: t("how_it_works.steps.review.title"), description: t("how_it_works.steps.review.description") },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="inline-block font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-4">
            Comment ça marche
          </span>
          <h2 className="font-display font-bold text-foreground leading-tight">{t("how_it_works.title")}</h2>
          <p className="font-body text-muted-foreground mt-4 text-base sm:text-lg leading-relaxed">{t("how_it_works.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="group rounded-xl border border-border bg-card/85 p-6 lg:p-7 card-lift relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
                <div className="font-display text-5xl text-primary/25 leading-none mb-4">{String(index + 1).padStart(2, "0")}</div>
                <div className="mb-4 inline-flex p-3 rounded-md bg-primary/10 border border-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-ui font-semibold text-lg text-foreground mb-2">{step.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
