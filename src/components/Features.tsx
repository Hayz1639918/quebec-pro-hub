import { Shield, Award, Clock, MessageSquare, FileCheck, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import contractorImage from "@/assets/contractor-profile.jpg";
import clientImage from "@/assets/client-success.jpg";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t('features.list.security.title'),
      description: t('features.list.security.description'),
    },
    {
      icon: Award,
      title: t('features.list.quality.title'),
      description: t('features.list.quality.description'),
    },
    {
      icon: Clock,
      title: t('features.list.time.title'),
      description: t('features.list.time.description'),
    },
    {
      icon: MessageSquare,
      title: t('features.list.communication.title'),
      description: t('features.list.communication.description'),
    },
    {
      icon: FileCheck,
      title: t('features.list.contracts.title'),
      description: t('features.list.contracts.description'),
    },
    {
      icon: Globe2,
      title: t('features.list.multilingual.title'),
      description: t('features.list.multilingual.description'),
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <h2 className="mb-4 sm:mb-6">{t('features.title')}</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <div className="mb-4 sm:mb-6">
                <div className="inline-flex p-3 sm:p-4 rounded-lg sm:rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 sm:mb-4 text-lg sm:text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Image Showcase */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-large group aspect-[4/3] sm:aspect-[3/2]">
            <img
              src={contractorImage}
              alt="Professional contractor reviewing construction plans"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent flex items-end p-4 sm:p-6 lg:p-8">
              <div className="text-background">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 text-primary-foreground">
                  {t('features.for_contractors.title')}
                </h3>
                <p className="text-sm sm:text-base text-primary-foreground/90 line-clamp-2">
                  {t('features.for_contractors.description')}
                </p>
              </div>
            </div>
          </div>

          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-large group aspect-[4/3] sm:aspect-[3/2]">
            <img
              src={clientImage}
              alt="Satisfied client with contractor after successful project"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent flex items-end p-4 sm:p-6 lg:p-8">
              <div className="text-background">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 text-primary-foreground">
                  {t('features.for_clients.title')}
                </h3>
                <p className="text-sm sm:text-base text-primary-foreground/90 line-clamp-2">
                  {t('features.for_clients.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
