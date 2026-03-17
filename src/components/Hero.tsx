import { Button } from "@/components/ui/button";
import { Search, ArrowRight, ShieldCheck, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-construction.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-[hsl(214,75%,7%)]">

      {/* ── Blueprint grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsl(210,100%,65%,0.18) 1px, transparent 1px),
            linear-gradient(90deg, hsl(210,100%,65%,0.18) 1px, transparent 1px),
            linear-gradient(hsl(210,100%,65%,0.08) 1px, transparent 1px),
            linear-gradient(90deg, hsl(210,100%,65%,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px, 80px 80px, 16px 16px, 16px 16px',
        }}
      />

      {/* ── Radial glow spots ── */}
      <div className="absolute top-[-15%] right-[5%] w-[600px] h-[500px] rounded-full bg-blue-600/12 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      {/* ── Diagonal split accent ── */}
      <div
        className="absolute inset-0 pointer-events-none hidden lg:block"
        style={{
          background: 'linear-gradient(108deg, transparent 52%, hsl(210,100%,40%,0.06) 52.5%, transparent 80%)',
        }}
      />

      {/* ── Corner coordinates ── */}
      <div className="absolute top-[5rem] left-4 sm:left-8 font-mono text-[9px] text-blue-400/30 uppercase tracking-[0.2em] pointer-events-none hidden sm:block">
        <div>X: 45.5088° N</div>
        <div>Y: 73.5540° O</div>
        <div className="mt-1 text-blue-400/20">PROJ-001 / REV-A</div>
      </div>

      <div className="absolute top-[5rem] right-4 sm:right-8 font-mono text-[9px] text-blue-400/30 uppercase tracking-[0.2em] text-right pointer-events-none hidden sm:block">
        <div>BâtirNet v2.1</div>
        <div>QC — CA</div>
        <div className="mt-1 text-blue-400/20">SCALE 1:1</div>
      </div>

      {/* ── Crosshair center marker ── */}
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden xl:block opacity-10">
        <div className="relative w-32 h-32">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-blue-400 rotate-45" />
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 lg:pb-20 min-h-[100dvh] flex flex-col justify-center">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">

          {/* ── Left: text content ── */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-6 sm:space-y-8">

            {/* Badge */}
            <div className="animate-reveal-up">
              <div className="tech-badge tech-badge-dark inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
                {t("hero.badge")}
              </div>
            </div>

            {/* Headline */}
            <div className="animate-reveal-up animation-delay-100 space-y-0">
              <h1 className="leading-[1.02] tracking-tight">
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] xl:text-[5.5rem] text-white/55 font-light">
                  Trouvez les
                </span>
                <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] text-white font-bold">
                  meilleurs
                </span>
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] xl:text-[5.5rem] text-blue-400 font-bold italic">
                  entrepreneurs
                </span>
              </h1>
            </div>

            {/* Blueprint dimension line under headline */}
            <div className="animate-draw-x animation-delay-300 flex items-center gap-3">
              <div className="h-px w-12 bg-blue-400/70" />
              <div className="h-px flex-1 max-w-[160px] bg-white/15" />
              <span className="font-mono text-[9px] text-blue-400/50 uppercase tracking-[0.2em] whitespace-nowrap">
                SECTION 001
              </span>
            </div>

            {/* Subtitle */}
            <p className="animate-reveal-up animation-delay-200 font-body text-base sm:text-lg text-white/55 leading-relaxed max-w-xl">
              {t("hero.subtitle")}
            </p>

            {/* Feature chips */}
            <ul className="animate-reveal-up animation-delay-300 flex flex-wrap gap-2 sm:gap-2.5">
              {[
                t("hero.features.verified"),
                t("hero.features.payments"),
                t("hero.features.contracts"),
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 px-3 py-1.5 border border-blue-400/25 bg-blue-400/8 font-ui text-xs text-blue-100/80"
                >
                  <span className="w-1 h-1 bg-blue-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1 animate-reveal-up animation-delay-400">
              <Button
                size="lg"
                className="font-ui font-bold uppercase tracking-[0.1em] gap-2.5 group bg-primary hover:bg-[hsl(210,100%,33%)] text-white rounded-none border-0 h-12 px-7 text-sm transition-all duration-300 shadow-[0_0_32px_-4px_hsl(210,100%,40%,0.5)] hover:shadow-[0_0_48px_-4px_hsl(210,100%,40%,0.7)]"
                onClick={() => navigate("/auth?mode=signup")}
              >
                <Search className="h-4 w-4" />
                {t("hero.cta_client")}
                <ArrowRight className="h-4 w-4 -translate-x-1 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="font-ui font-semibold text-sm rounded-none border border-white/20 bg-transparent hover:bg-white/8 text-white/75 hover:text-white h-12 px-7 transition-all duration-300"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t("hero.cta_pro")}
              </Button>
            </div>

            {/* Stats */}
            <div className="animate-reveal-up animation-delay-500 grid grid-cols-3 gap-3 sm:gap-4 pt-2">
              {[
                { value: "2 500+", label: t("hero.stats.professionals"), icon: ShieldCheck },
                { value: "15K+", label: t("hero.stats.projects"), icon: Users },
                { value: "4.8★", label: t("hero.stats.satisfaction"), icon: Star },
              ].map(({ value, label, icon: Icon }, i) => (
                <div
                  key={label}
                  className={`relative border border-white/10 bg-white/5 p-3 sm:p-4 backdrop-blur-sm animation-delay-${(i + 5) * 100} animate-reveal-up corner-mark corner-mark-dark`}
                >
                  <Icon className="h-3.5 w-3.5 text-blue-400/70 mb-2" />
                  <div className="font-display text-2xl sm:text-3xl text-white font-bold leading-none mb-1">{value}</div>
                  <div className="font-mono text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: image panel ── */}
          <div className="lg:col-span-6 xl:col-span-5 animate-reveal-right animation-delay-200">
            <div className="relative">

              {/* Technical frame decoration */}
              <div className="absolute -inset-3 sm:-inset-4 border border-blue-400/15 pointer-events-none" />
              <div className="absolute -inset-1.5 sm:-inset-2 border border-blue-400/8 pointer-events-none" />

              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400/80 pointer-events-none" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400/80 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400/80 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400/80 pointer-events-none" />

              {/* Dimension labels */}
              <div className="absolute -top-7 left-0 font-mono text-[9px] text-blue-400/40 uppercase tracking-[0.2em] hidden sm:block">
                FIG. 001 — VUE PRINCIPALE
              </div>

              <div className="relative overflow-hidden">
                <img
                  src={heroImage}
                  alt="Entrepreneur professionnel en construction au Québec"
                  className="w-full h-[300px] sm:h-[400px] lg:h-[520px] xl:h-[580px] object-cover"
                />

                {/* Image overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(214,75%,7%)]/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(214,75%,7%)]/30 via-transparent to-transparent lg:hidden" />

                {/* Scan line animation */}
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden opacity-30"
                  style={{
                    background: 'linear-gradient(0deg, transparent 49%, hsl(210,100%,65%,0.15) 50%, transparent 51%)',
                    backgroundSize: '100% 8px',
                  }}
                />

                {/* Info card overlay */}
                <div className="absolute left-4 right-4 bottom-4 sm:left-5 sm:right-5 sm:bottom-5 border border-white/20 bg-[hsl(214,75%,7%)]/85 backdrop-blur-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 animate-pulse-dot" />
                    <span className="font-mono text-[9px] text-blue-400/80 uppercase tracking-[0.2em]">Réseau actif — Temps réel</span>
                  </div>
                  <p className="font-body text-sm text-white/80">
                    Entrepreneurs vérifiés disponibles en moins de 24h au Québec.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Bottom dimension line ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-30">
          <div className="h-px w-8 bg-blue-400" />
          <div className="w-1 h-1 border border-blue-400 rotate-45" />
          <span className="font-mono text-[8px] text-blue-300 uppercase tracking-[0.25em]">FAITES DÉFILER</span>
          <div className="w-1 h-1 border border-blue-400 rotate-45" />
          <div className="h-px w-8 bg-blue-400" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
