import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const projects = [
  {
    title: "Cuisine contemporaine",
    location: "Laval, QC",
    image:
      "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=900&q=80&auto=format&fit=crop",
  },
  {
    title: "Résidence moderne",
    location: "Montréal, QC",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80&auto=format&fit=crop",
  },
  {
    title: "Salon lumineux",
    location: "Québec, QC",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&q=80&auto=format&fit=crop",
  },
];

const FeaturedProjects = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white pb-12 sm:pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
          <h2 className="font-ui text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Projets en vedette
          </h2>
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="font-ui text-sm font-medium text-primary/80 hover:text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            Voir tous les projets
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {projects.map((project) => (
            <button
              key={project.title}
              type="button"
              onClick={() => navigate("/projects")}
              className="group relative aspect-[4/3] overflow-hidden rounded-[1.5rem] cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <img
                src={project.image}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <p className="font-ui text-white font-semibold text-base sm:text-lg">
                  {project.title}
                </p>
                <p className="font-ui text-white/75 text-sm mt-0.5">{project.location}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
