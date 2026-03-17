import { Shield, Award, Clock, MessageSquare, FileCheck, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import contractorImage from "@/assets/contractor-profile.jpg";
import clientImage from "@/assets/client-success.jpg";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Shield,       title: t("features.list.security.title"),      description: t("features.list.security.description") },
    { icon: Award,        title: t("features.list.quality.title"),       description: t("features.list.quality.description") },
    { icon: Clock,        title: t("features.list.time.title"),          description: t("features.list.time.description") },
    { icon: MessageSquare,title: t("features.list.communication.title"), description: t("features.list.communication.description") },
    { icon: FileCheck,    title: t("features.list.contracts.title"),     description: t("features.list.contracts.description") },
    { icon: Globe2,       title: t("features.list.multilingual.title"),  description: t("features.list.multilingual.description") },
  ];

  return (
    <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden bg-[hsl(214,75%,7%)]">

      {/* Blueprint grid dark */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsl(210,100%,65%,0.16) 1px, transparent 1px),
            linear-gradient(90deg, hsl(210,100%,65%,0.16) 1px, transparent 1px),
            linear-gradient(hsl(210,100%,65%,0.07) 1px, transparent 1px),
            linear-gradient(90deg, hsl(210,100%,65%,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px, 80px 80px, 16px 16px, 16px 16px',
        }}
      />

      {/* Radial accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-primary/12 blur-[120px] pointer-events-none rounded-full" />

      {/* Side annotation */}
      <div className="absolute top-12 right-4 sm:right-8 font-mono text-[9px] text-blue-400/20 uppercase tracking-[0.2em] text-right pointer-events-none hidden md:block">
        <div>SEC. 003</div>
        <div className="mt-1 opacity-60">FONCTIONNALITÉS</div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Section header */}
        <div className="max-w-2xl mb-14 sm:mb-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-blue-400 animate-draw-x" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">
              Fonctionnalités
            </span>
          </div>
          <h2 className="font-display font-bold text-white leading-tight mb-4">
            {t("features.title")}
          </h2>
          <p className="font-body text-white/50 text-base sm:text-lg leading-relaxed">
            {t("features.subtitle")}
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/8 mb-14 sm:mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="relative bg-[hsl(214,75%,7%)] p-6 sm:p-7 group hover:bg-white/[0.04] transition-colors duration-300"
              >
                {/* Top-left corner bracket */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-blue-400/0 group-hover:border-blue-400/50 transition-colors" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-blue-400/0 group-hover:border-blue-400/50 transition-colors" />

                {/* Step ref */}
                <div className="flex items-start justify-between mb-5">
                  <div className="inline-flex p-2.5 border border-blue-400/20 bg-blue-400/10 group-hover:bg-blue-400/18 group-hover:border-blue-400/35 transition-all">
                    <Icon className="h-4.5 w-4.5 text-blue-400" />
                  </div>
                  <span className="font-mono text-[9px] text-blue-400/25 uppercase tracking-[0.15em] group-hover:text-blue-400/40 transition-colors">
                    F{String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-ui font-semibold text-base text-white mb-2.5">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-white/45 leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom border reveal */}
                <div className="absolute bottom-0 left-6 right-6 h-px bg-blue-400/0 group-hover:bg-blue-400/25 transition-colors" />
              </div>
            );
          })}
        </div>

        {/* Dual image panels */}
        <div className="grid sm:grid-cols-2 gap-px bg-white/8">
          {[
            {
              src: contractorImage,
              alt: "Entrepreneur révisant des plans de construction",
              title: t("features.for_contractors.title"),
              desc: t("features.for_contractors.description"),
              ref: "FIG.002",
            },
            {
              src: clientImage,
              alt: "Client satisfait avec son entrepreneur après un projet réussi",
              title: t("features.for_clients.title"),
              desc: t("features.for_clients.description"),
              ref: "FIG.003",
            },
          ].map(({ src, alt, title, desc, ref }) => (
            <div key={title} className="relative overflow-hidden group" style={{ aspectRatio: '4/3' }}>
              <img
                src={src}
                alt={alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(214,75%,7%)]/80 via-[hsl(214,75%,7%)]/20 to-transparent" />
              <div className="absolute inset-0 bg-[hsl(210,100%,40%)]/10 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Corner marks */}
              <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-white/40" />
              <div className="absolute top-4 right-4 font-mono text-[9px] text-white/30 uppercase tracking-[0.15em]">{ref}</div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <div className="h-px w-8 bg-blue-400 mb-3" />
                <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-1.5 leading-tight">
                  {title}
                </h3>
                <p className="font-body text-sm text-white/65 line-clamp-2">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Features;
