import { ShieldCheck, HardHat, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Bande immersive « confiance » sur photo de chantier.
 * L'image de fond (Unsplash) est purement décorative : la couleur de repli
 * marine + l'overlay sombre garantissent le contraste du texte même si l'image
 * ne se charge pas (aucun bloc cassé). Section additive, n'affecte rien d'autre.
 */
const TrustBand = () => {
  const { t } = useTranslation();

  const points = [
    { icon: ShieldCheck, label: t("trust_band.rbq") },
    { icon: HardHat, label: t("trust_band.pros") },
    { icon: Lock, label: t("trust_band.payments") },
  ];

  return (
    <section
      className="relative overflow-hidden bg-[hsl(var(--navy-deep))]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(214 75% 7% / 0.82), hsl(214 75% 7% / 0.88)), url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=60')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-white text-balance">
            {t("trust_band.title")}
          </h2>
          <p className="mt-3 text-base text-white/70 leading-relaxed text-pretty">
            {t("trust_band.subtitle")}
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {points.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-sm"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-white/90">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBand;
