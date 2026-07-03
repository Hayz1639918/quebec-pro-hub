import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CTA = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            {t("cta.eyebrow")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-foreground text-balance">
            {t("cta.heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed text-pretty">
            {t("cta.subheading")}
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {/* Client card — brand blue */}
          <div className="relative overflow-hidden rounded-2xl bg-primary p-8 sm:p-10">
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{ background: "radial-gradient(30rem 20rem at 100% 0%, rgba(255,255,255,0.12), transparent 60%)" }}
            />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground/70">
                {t("cta.client.eyebrow")}
              </span>
              <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-primary-foreground leading-tight">
                {t("cta.client.title")}
              </h3>
              <p className="mt-3 text-base text-primary-foreground/85 leading-relaxed">
                {t("cta.client.description")}
              </p>
              <button
                onClick={() => navigate("/auth?mode=signup")}
                className="group mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary transition-all duration-200 hover:bg-blue-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                {t("cta.client.button")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {[t("cta.client.benefits.commitment"), t("cta.client.benefits.response"), t("cta.client.benefits.free")].map((b) => (
                  <li key={b} className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/80">
                    <Check className="h-3.5 w-3.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro card — light */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-10">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t("cta.contractor.eyebrow")}
            </span>
            <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {t("cta.contractor.title")}
            </h3>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              {t("cta.contractor.description")}
            </p>
            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-[hsl(var(--primary-hover))] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t("cta.contractor.button")}
            </button>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {[t("cta.contractor.benefits.trial"), t("cta.contractor.benefits.payments")].map((b) => (
                <li key={b} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
