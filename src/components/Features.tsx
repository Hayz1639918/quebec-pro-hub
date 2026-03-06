import { Shield, Award, Clock, MessageSquare, FileCheck, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import contractorImage from "@/assets/contractor-profile.jpg";
import clientImage from "@/assets/client-success.jpg";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Shield,       title: t('features.list.security.title'),      description: t('features.list.security.description') },
    { icon: Award,        title: t('features.list.quality.title'),       description: t('features.list.quality.description') },
    { icon: Clock,        title: t('features.list.time.title'),          description: t('features.list.time.description') },
    { icon: MessageSquare,title: t('features.list.communication.title'), description: t('features.list.communication.description') },
    { icon: FileCheck,    title: t('features.list.contracts.title'),     description: t('features.list.contracts.description') },
    { icon: Globe2,       title: t('features.list.multilingual.title'),  description: t('features.list.multilingual.description') },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <span className="inline-block font-ui text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-4">
            Fonctionnalités
          </span>
          <h2 className="font-display font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <p className="font-body text-muted-foreground text-base sm:text-lg leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        {/* ── Feature grid — asymmetric with amber accent left-border ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-14 sm:mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card-lift bg-card border border-border rounded-lg p-5 sm:p-6 group relative overflow-hidden"
              >
                {/* Amber accent left-border */}
                <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-primary/25 group-hover:bg-primary/70 transition-colors" />

                <div className="pl-3">
                  {/* Icon */}
                  <div className="mb-4 inline-flex p-2.5 rounded-sm bg-primary/10 border border-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <h3 className="font-ui font-semibold text-base text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Dual image showcase ── */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {[
            {
              src: contractorImage,
              alt: "Entrepreneur révisiant des plans de construction",
              title: t('features.for_contractors.title'),
              desc:  t('features.for_contractors.description'),
            },
            {
              src: clientImage,
              alt: "Client satisfait avec son entrepreneur après un projet réussi",
              title: t('features.for_clients.title'),
              desc:  t('features.for_clients.description'),
            },
          ].map(({ src, alt, title, desc }) => (
            <div
              key={title}
              className="relative rounded-lg overflow-hidden shadow-large group aspect-[4/3] sm:aspect-[3/2]"
            >
              <img
                src={src}
                alt={alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 lg:p-8">
                {/* Amber separator line */}
                <div className="w-8 h-0.5 bg-primary mb-3" />
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground mb-1.5">
                  {title}
                </h3>
                <p className="font-body text-sm text-foreground/70 line-clamp-2">
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
