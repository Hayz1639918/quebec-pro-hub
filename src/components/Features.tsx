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

  const panels = [
    { src: contractorImage, alt: "Entrepreneur révisant des plans de construction", title: t("features.for_contractors.title"), desc: t("features.for_contractors.description") },
    { src: clientImage, alt: "Cliente satisfaite avec son entrepreneur après un projet réussi", title: t("features.for_clients.title"), desc: t("features.for_clients.description") },
  ];

  return (
    <section id="resources" className="bg-secondary/40 py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-16 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            {t("features.eyebrow")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-foreground text-balance">
            {t("features.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed text-pretty">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-[var(--shadow-medium)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {panels.map(({ src, alt, title, desc }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-border"
              style={{ aspectRatio: "16/10" }}
            >
              <img
                src={src}
                alt={alt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(214,75%,9%)]/85 via-[hsl(214,75%,9%)]/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-semibold text-white leading-tight">{title}</h3>
                <p className="mt-2 text-sm text-white/85 leading-relaxed line-clamp-2">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
