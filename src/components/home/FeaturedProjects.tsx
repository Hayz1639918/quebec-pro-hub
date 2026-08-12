import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import commercialImage from "@/assets/home-project-commercial.webp";
import houseImage from "@/assets/home-project-house.webp";
import renovationImage from "@/assets/home-project-renovation.webp";

const inspirations = [
  {
    title: "Construction résidentielle",
    subtitle: "Planifier une maison ou un agrandissement",
    image: houseImage,
  },
  {
    title: "Rénovation intérieure",
    subtitle: "Transformer une cuisine, une salle de bain ou un espace de vie",
    image: renovationImage,
  },
  {
    title: "Projet commercial",
    subtitle: "Trouver les bons intervenants pour un espace professionnel",
    image: commercialImage,
  },
];

const FeaturedProjects = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white py-14 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7 sm:mb-9 bn-reveal">
          <div>
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary/60 mb-2">Inspiration</p>
            <h2 className="font-ui text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight">
              Des projets concrets, une recherche plus simple
            </h2>
            <p className="font-ui text-sm text-slate-600 mt-2 max-w-2xl">
              Quelques types de travaux que vous pouvez préparer et publier sur BâtirNet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="font-ui text-sm font-semibold text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0 group"
          >
            Voir les projets publiés
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6">
          {inspirations.map((item, index) => (
            <button
              type="button"
              onClick={() => navigate("/dashboard/new-project")}
              key={item.title}
              className={`group relative min-h-[300px] sm:min-h-[360px] overflow-hidden rounded-[1.65rem] text-left bn-card-lift bn-reveal ${index === 0 ? "lg:col-span-5" : index === 1 ? "lg:col-span-4" : "lg:col-span-3"}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <p className="font-ui text-white font-bold text-lg sm:text-xl">{item.title}</p>
                <p className="font-ui text-white/80 text-sm mt-1 leading-relaxed">{item.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/95">
                  Démarrer un projet <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
