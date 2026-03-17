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
    <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden bg-[hsl(214,75%,7%)]">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-16 sm:mb-24 max-w-3xl">
          <span className="font-mono text-[11px] text-white/25 uppercase tracking-[0.15em] block mb-6">
            Fonctionnalités
          </span>
          <h2 className="font-display text-white/90 leading-[1.02] mb-6">
            {t("features.title")}
          </h2>
          <div className="h-px w-16 bg-white/10 mb-6" />
          <p className="font-body text-lg text-white/30 leading-relaxed max-w-xl">
            {t("features.subtitle")}
          </p>
        </div>

        {/* Feature cards — editorial grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] mb-16 sm:mb-24">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="relative bg-[hsl(214,75%,7%)] p-8 sm:p-10 group hover:bg-white/[0.03] transition-colors duration-500"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="p-2.5 border border-blue-400/15 bg-white/[0.03] group-hover:border-blue-400/30 transition-all duration-500">
                    <Icon className="h-5 w-5 text-white/25 group-hover:text-white/50 transition-colors duration-500" />
                  </div>
                  <span className="font-mono text-[10px] text-white/10 tracking-[0.1em] group-hover:text-white/20 transition-colors">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="font-ui font-medium text-base text-white/80 mb-3">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-white/25 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Dual image panels — editorial */}
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              src: contractorImage,
              alt: "Entrepreneur révisant des plans de construction",
              title: t("features.for_contractors.title"),
              desc: t("features.for_contractors.description"),
            },
            {
              src: clientImage,
              alt: "Client satisfait avec son entrepreneur après un projet réussi",
              title: t("features.for_clients.title"),
              desc: t("features.for_clients.description"),
            },
          ].map(({ src, alt, title, desc }) => (
            <div key={title} className="relative overflow-hidden group" style={{ aspectRatio: '4/3' }}>
              <img
                src={src}
                alt={alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(214,75%,7%)] via-[hsl(214,75%,7%)]/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="h-px w-10 bg-white/20 mb-4" />
                <h3 className="font-display text-xl sm:text-2xl text-white/90 mb-2 leading-tight">
                  {title}
                </h3>
                <p className="font-body text-sm text-white/35 leading-relaxed line-clamp-2">
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
