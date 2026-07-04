import { Search, FileText, CreditCard, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: Search, num: "01", title: t("how_it_works.steps.find.title"), description: t("how_it_works.steps.find.description") },
    { icon: FileText, num: "02", title: t("how_it_works.steps.sign.title"), description: t("how_it_works.steps.sign.description") },
    { icon: CreditCard, num: "03", title: t("how_it_works.steps.pay.title"), description: t("how_it_works.steps.pay.description") },
    { icon: CheckCircle2, num: "04", title: t("how_it_works.steps.review.title"), description: t("how_it_works.steps.review.description") },
  ];

  return (
    <section id="how-it-works" className="bg-background py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            {t("how_it_works.eyebrow")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-foreground text-balance">
            {t("how_it_works.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed text-pretty">
            {t("how_it_works.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {steps.map(({ icon: Icon, num, title, description }) => (
            <div
              key={num}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-[var(--shadow-medium)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">{num}</span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
