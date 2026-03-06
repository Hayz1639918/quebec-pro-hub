import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-construction.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] flex items-center pt-20 sm:pt-24 pb-8 overflow-hidden">

      {/* ── Arrière-plan : lueurs ambre + lignes diagonales ── */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-background" />
        {/* Lueur ambre coin inférieur droit */}
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/6 blur-[140px]" />
        {/* Lueur ambre secondaire haut gauche */}
        <div className="absolute top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[100px]" />
        {/* Ligne verticale décorative droite */}
        <div className="absolute top-0 right-[40%] w-px h-full bg-gradient-to-b from-transparent via-primary/12 to-transparent" />
        {/* Grille très subtile */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-center">

          {/* ── Colonne gauche : contenu ── */}
          <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">

            {/* Badge */}
            <div className="animate-reveal-up">
              <span className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-sm border border-primary/30 bg-primary/8 text-primary font-ui text-xs font-semibold uppercase tracking-[0.12em]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t('hero.badge')}
              </span>
            </div>

            {/* Titre — Fraunces grande taille */}
            <div className="animate-reveal-up animation-delay-100">
              <h1 className="font-display font-light leading-[1.04] text-foreground">
                {/* Ligne 1 : normal */}
                <span className="block text-foreground/70 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-1">
                  Trouvez les
                </span>
                {/* Ligne 2 : mot clé en ambre italique — effet Fraunces optique */}
                <span className="block font-bold italic text-primary text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-none">
                  meilleurs
                </span>
                {/* Ligne 3 */}
                <span className="block text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mt-1">
                  entrepreneurs
                </span>
              </h1>
            </div>

            {/* Sous-titre */}
            <p className="animate-reveal-up animation-delay-200 font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
              {t('hero.subtitle')}
            </p>

            {/* Features — tirets ambre */}
            <ul className="space-y-3 animate-reveal-up animation-delay-300">
              {[
                t('hero.features.verified'),
                t('hero.features.payments'),
                t('hero.features.contracts'),
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 group">
                  <span className="flex-shrink-0 w-5 h-px bg-primary group-hover:w-8 transition-all duration-300" />
                  <span className="font-ui text-sm font-medium text-foreground/80 tracking-wide">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 animate-reveal-up animation-delay-400">
              <Button
                size="lg"
                className="font-ui font-semibold uppercase tracking-wider gap-2.5 group"
                onClick={() => navigate("/auth?mode=signup")}
              >
                <Search className="h-4 w-4" />
                {t('hero.cta_client')}
                <ArrowRight className="h-4 w-4 -translate-x-1 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="font-ui font-medium border-border hover:border-primary/50 hover:text-primary transition-colors"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t('hero.cta_pro')}
              </Button>
            </div>

            {/* Stats — typographie Fraunces chiffres + Syne labels */}
            <div className="animate-reveal-up animation-delay-500 pt-5 border-t border-border">
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                {[
                  { value: '2 500+', label: t('hero.stats.professionals') },
                  { value: '15K+',   label: t('hero.stats.projects') },
                  { value: '4.8',    label: t('hero.stats.satisfaction') },
                ].map(({ value, label }) => (
                  <div key={label} className="group">
                    <div className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-primary leading-none">
                      {value}
                    </div>
                    <div className="font-ui text-[10px] sm:text-xs text-muted-foreground mt-1.5 uppercase tracking-wider leading-tight">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Colonne droite : image avec cadre décoratif ── */}
          <div className="relative order-1 lg:order-2 animate-reveal-fade animation-delay-150">
            {/* Cadre ambre décalé (derrière) */}
            <div className="absolute -top-3 -right-3 w-full h-full rounded-xl border border-primary/20 pointer-events-none" />
            <div className="absolute -top-1.5 -right-1.5 w-full h-full rounded-xl border border-primary/10 pointer-events-none" />

            {/* Image */}
            <div className="relative rounded-xl overflow-hidden shadow-large animate-float">
              <img
                src={heroImage}
                alt="Entrepreneur professionnel en construction au Québec"
                className="w-full h-[300px] sm:h-[380px] md:h-[440px] lg:h-[520px] object-cover"
              />
              {/* Vignette basse */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              {/* Badge flottant en bas gauche */}
              <div className="absolute bottom-5 left-5 right-5">
                <div className="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-card/90 backdrop-blur-sm border border-border">
                  <div className="w-2 h-2 rounded-full bg-success flex-shrink-0 animate-pulse" />
                  <span className="font-ui text-xs sm:text-sm font-semibold text-foreground">
                    Entrepreneurs disponibles dès maintenant
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
