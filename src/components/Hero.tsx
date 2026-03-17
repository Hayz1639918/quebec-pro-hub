import { Button } from "@/components/ui/button";
import { Search, ArrowRight, ShieldCheck, Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-construction.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] pt-24 sm:pt-28 pb-10 overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 blueprint-grid opacity-60" />
        <div className="absolute -top-32 right-[-10%] w-[720px] h-[520px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-180px] left-[-120px] w-[520px] h-[520px] rounded-full bg-primary/10 blur-[130px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-end">
          <div className="lg:col-span-7 space-y-6 lg:space-y-8">
            <div className="animate-reveal-up">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-ui text-xs font-semibold uppercase tracking-[0.16em]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t("hero.badge")}
              </span>
            </div>

            <div className="animate-reveal-up animation-delay-100">
              <h1 className="font-display text-foreground leading-[0.98] max-w-4xl">
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground/85">
                  Trouvez les
                </span>
                <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl italic text-primary">
                  meilleurs
                </span>
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
                  entrepreneurs
                </span>
              </h1>
            </div>

            <p className="animate-reveal-up animation-delay-200 font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {t("hero.subtitle")}
            </p>

            <ul className="animate-reveal-up animation-delay-300 grid sm:grid-cols-3 gap-2 sm:gap-3 max-w-3xl">
              {[
                t("hero.features.verified"),
                t("hero.features.payments"),
                t("hero.features.contracts"),
              ].map((feature) => (
                <li key={feature} className="relative overflow-hidden rounded-md border border-border bg-card/60 px-3 py-2 font-ui text-xs sm:text-sm text-foreground/85">
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary/70" />
                  <span className="pl-1">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 pt-1 animate-reveal-up animation-delay-400">
              <Button
                size="lg"
                className="font-ui font-semibold uppercase tracking-wider gap-2.5 group"
                onClick={() => navigate("/auth?mode=signup")}
              >
                <Search className="h-4 w-4" />
                {t("hero.cta_client")}
                <ArrowRight className="h-4 w-4 -translate-x-1 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="font-ui font-medium border-primary/30 hover:border-primary/50 hover:text-primary"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t("hero.cta_pro")}
              </Button>
            </div>

            <div className="animate-reveal-up animation-delay-500 grid grid-cols-3 gap-3 sm:gap-5 pt-2">
              {[
                { value: "2 500+", label: t("hero.stats.professionals"), icon: ShieldCheck },
                { value: "15K+", label: t("hero.stats.projects"), icon: Search },
                { value: "4.8", label: t("hero.stats.satisfaction"), icon: Clock3 },
              ].map(({ value, label, icon: Icon }) => (
                <div key={label} className="rounded-md border border-border bg-card/70 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-display text-2xl sm:text-3xl text-primary leading-none">{value}</span>
                  </div>
                  <div className="font-ui text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 animate-reveal-fade animation-delay-200">
            <div className="relative modern-frame rounded-2xl overflow-hidden shadow-large">
              <img
                src={heroImage}
                alt="Entrepreneur professionnel en construction au Québec"
                className="w-full h-[340px] sm:h-[430px] lg:h-[560px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent" />

              <div className="absolute left-4 right-4 bottom-4 rounded-xl border border-white/30 bg-white/85 backdrop-blur-md p-4">
                <p className="font-ui text-xs uppercase tracking-[0.14em] text-primary mb-2">Réseau actif</p>
                <p className="font-body text-sm text-foreground/80">Entrepreneurs vérifiés disponibles en moins de 24h au Québec.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
