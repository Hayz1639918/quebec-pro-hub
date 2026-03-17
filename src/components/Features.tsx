import { Shield, Award, Clock, MessageSquare, FileCheck, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import contractorImage from "@/assets/contractor-profile.jpg";
import clientImage from "@/assets/client-success.jpg";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Shield, title: t("features.list.security.title"), description: t("features.list.security.description") },
    { icon: Award, title: t("features.list.quality.title"), description: t("features.list.quality.description") },
    { icon: Clock, title: t("features.list.time.title"), description: t("features.list.time.description") },
    { icon: MessageSquare, title: t("features.list.communication.title"), description: t("features.list.communication.description") },
    { icon: FileCheck, title: t("features.list.contracts.title"), description: t("features.list.contracts.description") },
    { icon: Globe2, title: t("features.list.multilingual.title"), description: t("features.list.multilingual.description") },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-gradient-subtle relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none blueprint-grid opacity-40" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="inline-block font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-4">Fonctionnalités</span>
          <h2 className="font-display font-bold text-foreground mb-4">{t("features.title")}</h2>
          <p className="font-body text-muted-foreground text-base sm:text-lg leading-relaxed">{t("features.subtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-14 sm:mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="relative overflow-hidden rounded-xl border border-border bg-white/75 p-5 sm:p-6 card-lift">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/80 to-primary/20" />
                <div className="pl-3">
                  <div className="mb-4 inline-flex p-2.5 rounded-md bg-primary/10 border border-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-ui font-semibold text-base text-foreground mb-2">{feature.title}</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {[
            {
              src: contractorImage,
              alt: "Entrepreneur révisiant des plans de construction",
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
            <div key={title} className="relative rounded-xl overflow-hidden shadow-large group aspect-[4/3] sm:aspect-[3/2] modern-frame">
              <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-foreground/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 lg:p-8">
                <div className="w-9 h-[3px] bg-primary mb-3" />
                <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-1.5">{title}</h3>
                <p className="font-body text-sm text-white/85 line-clamp-2">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
