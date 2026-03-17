import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-construction.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-background">

      {/* ── Subtle grain overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Main content ── */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-24 min-h-[100dvh] flex flex-col justify-center">

        {/* ── Top mono label ── */}
        <div className="animate-reveal-up mb-8 sm:mb-12">
          <span className="font-mono text-[11px] sm:text-xs text-foreground/35 uppercase tracking-[0.15em]">
            Plateforme canadienne pour entrepreneurs du bâtiment
          </span>
        </div>

        {/* ── Headline ── */}
        <div className="animate-reveal-up animation-delay-100 mb-8 sm:mb-10 max-w-5xl">
          <h1 className="font-display text-foreground leading-[0.95] tracking-[-0.03em]">
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem]">
              Trouvez les
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem] italic text-primary">
              meilleurs
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem]">
              entrepreneurs.
            </span>
          </h1>
        </div>

        {/* ── Thin divider ── */}
        <div className="animate-draw-x animation-delay-200 mb-8 sm:mb-10">
          <div className="h-px w-24 bg-foreground/15" />
        </div>

        {/* ── Subtitle ── */}
        <p className="animate-reveal-up animation-delay-200 font-body text-lg sm:text-xl lg:text-2xl text-foreground/45 leading-relaxed max-w-2xl mb-10 sm:mb-14">
          {t("hero.subtitle")}
        </p>

        {/* ── CTA buttons ── */}
        <div className="flex flex-col sm:flex-row gap-4 animate-reveal-up animation-delay-300 mb-16 sm:mb-20">
          <button
            className="inline-flex items-center justify-center gap-3 font-ui font-medium text-sm sm:text-base px-8 py-3.5 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 rounded-full group"
            onClick={() => navigate("/auth?mode=signup")}
          >
            {t("hero.cta_client")}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            className="inline-flex items-center justify-center font-ui font-medium text-sm sm:text-base px-8 py-3.5 border border-foreground/15 text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-all duration-300 rounded-full"
            onClick={() => navigate("/auth?mode=signup")}
          >
            {t("hero.cta_pro")}
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="animate-reveal-up animation-delay-400 flex flex-wrap gap-x-10 gap-y-6 sm:gap-x-16">
          {[
            { value: "2 500+", label: t("hero.stats.professionals") },
            { value: "15K+", label: t("hero.stats.projects") },
            { value: "4.8/5", label: t("hero.stats.satisfaction") },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="font-display text-3xl sm:text-4xl lg:text-5xl text-foreground leading-none mb-1">{value}</div>
              <div className="font-mono text-[11px] text-foreground/30 uppercase tracking-[0.1em]">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Hero image — editorial asymmetric ── */}
        <div className="absolute top-0 right-0 w-[45%] h-full hidden lg:block animate-reveal-fade animation-delay-300">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={heroImage}
              alt="Entrepreneur professionnel en construction au Québec"
              className="w-full h-full object-cover"
            />
            {/* Gradient fade into background */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
          </div>
        </div>

        {/* ── Bottom scroll hint ── */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-25">
          <div className="h-px w-8 bg-foreground" />
          <span className="font-mono text-[10px] text-foreground uppercase tracking-[0.15em]">Défiler</span>
          <div className="h-px w-8 bg-foreground" />
        </div>

      </div>
    </section>
  );
};

export default Hero;
