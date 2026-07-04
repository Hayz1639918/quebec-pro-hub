import { ArrowRight, ShieldCheck, CreditCard, FileSignature, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-construction.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    { icon: ShieldCheck, label: t("hero.features.verified") },
    { icon: CreditCard, label: t("hero.features.payments") },
    { icon: FileSignature, label: t("hero.features.contracts") },
  ];

  const stats = [
    { value: "2 500+", label: t("hero.stats.professionals") },
    { value: "15K+", label: t("hero.stats.projects") },
    { value: "4.8/5", label: t("hero.stats.satisfaction") },
  ];

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Ambient soft light spots for depth (no flat empty background) */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60rem 40rem at 85% -10%, hsl(210 100% 40% / 0.06), transparent 60%), radial-gradient(50rem 40rem at -10% 20%, hsl(210 100% 40% / 0.04), transparent 55%)",
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Left column — copy ── */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light/60 px-3.5 py-1.5 text-xs font-medium text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {t("hero.badge")}
            </span>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.05] text-foreground text-balance">
              {t("hero.title")}
            </h1>

            <p className="mt-5 text-lg text-muted-foreground leading-relaxed text-pretty">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/auth?mode=signup")}
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-[hsl(var(--primary-hover))] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {t("hero.cta_client")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate("/auth?mode=signup")}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-secondary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {t("hero.cta_pro")}
              </button>
            </div>

            {/* Feature bullets */}
            <ul className="mt-8 flex flex-col gap-2.5">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right column — image card ── */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-large)]">
              <img
                src={heroImage}
                alt="Entrepreneurs professionnels sur un chantier de construction au Québec"
                className="aspect-[4/3] w-full object-cover"
                width={800}
                height={600}
              />
              {/* Floating trust card */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl border border-border bg-background/95 px-4 py-3 backdrop-blur-sm shadow-[var(--shadow-medium)]">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-success-light text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {t("hero.features.verified")}
                  </p>
                  <p className="text-xs text-muted-foreground">Licence RBQ · Assurance vérifiée</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="mt-16 grid grid-cols-3 gap-4 border-t border-border pt-10 sm:mt-20 sm:max-w-2xl">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
