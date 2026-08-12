import { ArrowRight, BriefcaseBusiness, Home, MessageSquareText, FileCheck2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clientImage from "@/assets/client-success.jpg";
import professionalImage from "@/assets/contractor-profile.jpg";

const HomeValueShowcase = () => {
  const navigate = useNavigate();

  const paths = [
    {
      eyebrow: "Pour les propriétaires",
      title: "Du besoin au bon professionnel, sans perdre le fil",
      description: "Publiez votre projet, comparez les profils et centralisez les échanges, documents et étapes importantes au même endroit.",
      image: clientImage,
      alt: "Projet résidentiel en construction",
      icon: Home,
      action: "Publier un projet",
      onClick: () => navigate("/dashboard/new-project"),
      points: ["Projet clair et structuré", "Échanges centralisés", "Suivi des contrats"],
    },
    {
      eyebrow: "Pour les professionnels",
      title: "Une vitrine claire pour développer vos projets",
      description: "Présentez votre entreprise, découvrez des projets pertinents et gérez vos échanges avec les clients depuis un espace professionnel.",
      image: professionalImage,
      alt: "Professionnel de la construction sur un chantier",
      icon: BriefcaseBusiness,
      action: "Découvrir l'espace pro",
      onClick: () => navigate("/auth?mode=signup&type=professional"),
      points: ["Profil professionnel", "Projets à proximité", "Gestion des propositions"],
    },
  ];

  return (
    <section className="bg-[#f7f9fc] py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10 sm:mb-12 bn-reveal">
          <span className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary/65">Deux parcours, un même espace</span>
          <h2 className="font-ui text-3xl sm:text-4xl font-bold tracking-tight text-primary mt-3">
            BâtirNet accompagne les deux côtés du projet
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {paths.map((path, index) => {
            const Icon = path.icon;
            return (
              <article
                key={path.eyebrow}
                className="group overflow-hidden rounded-[1.75rem] bg-white border border-slate-200/80 shadow-[0_22px_60px_-38px_rgba(13,43,69,0.45)] bn-card-lift bn-reveal"
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <div className="relative h-56 sm:h-64 overflow-hidden">
                  <img src={path.image} alt={path.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/65 via-primary/10 to-transparent" />
                  <div className="absolute left-5 bottom-5 flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-primary shadow-lg backdrop-blur">
                    <Icon className="h-4 w-4" />
                    {path.eyebrow}
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <h3 className="font-ui text-2xl font-bold text-primary tracking-tight">{path.title}</h3>
                  <p className="font-ui text-sm sm:text-base text-slate-600 leading-relaxed mt-3">{path.description}</p>

                  <div className="grid sm:grid-cols-3 gap-2.5 mt-6">
                    {path.points.map((point, pointIndex) => (
                      <div key={point} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700">
                        {pointIndex === 1 ? <MessageSquareText className="h-3.5 w-3.5 text-primary" /> : <FileCheck2 className="h-3.5 w-3.5 text-primary" />}
                        {point}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={path.onClick}
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg"
                  >
                    {path.action}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeValueShowcase;
