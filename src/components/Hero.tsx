import { useState } from "react";
import { ArrowRight, Search, MapPin, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroCrane from "@/assets/home-hero-crane.jpg";
import { HOME_SERVICES, HOME_REGIONS } from "@/data/home-search";

const Hero = () => {
  const navigate = useNavigate();
  const [service, setService] = useState("");
  const [region, setRegion] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (service) params.set("service", service);
    if (region) params.set("region", region);
    const qs = params.toString();
    navigate(qs ? `/professionals?${qs}` : "/professionals");
  };

  const selectedServiceLabel =
    HOME_SERVICES.find((s) => s.slug === service)?.label ?? "";
  const selectedRegionLabel =
    HOME_REGIONS.find((r) => r.slug === region)?.label ?? "";

  return (
    <section className="relative overflow-visible">
      {/* Full-bleed hero photo — dominant visual plane */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroCrane}
          alt="Équipe de construction sur un chantier au Québec"
          width={2400}
          height={1600}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-[58%_42%] sm:object-[55%_40%] lg:object-[52%_38%]"
        />
        {/* Left wash — readable text, photo still visible */}
        <div className="absolute inset-y-0 left-0 w-[75%] sm:w-[60%] lg:w-[54%] bg-gradient-to-r from-white from-10% via-white/75 via-45% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 sm:h-40 bg-gradient-to-t from-white via-white/70 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20">
        <div className="relative min-h-[400px] lg:min-h-[460px]">
          <div className="relative z-10 max-w-xl lg:max-w-[32rem] pt-2 lg:pt-4">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-[3px] w-9 rounded-full bg-[#F2994A]" />
              <span className="font-ui text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-primary">
                La construction en toute confiance
              </span>
            </div>

            <h1 className="font-ui text-[2.35rem] sm:text-[2.75rem] lg:text-[3.25rem] font-bold text-primary leading-[1.12] tracking-tight mb-5">
              Trouvez le bon entrepreneur, en toute confiance
            </h1>

            <p className="font-ui text-base sm:text-lg text-primary/80 leading-relaxed max-w-md mb-8">
              Des professionnels vérifiés pour vos projets partout au Québec.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5">
              <button
                type="button"
                onClick={() => navigate("/dashboard/new-project")}
                className="inline-flex items-center justify-center gap-2 font-ui font-semibold text-sm sm:text-[15px] px-6 py-3.5 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors duration-200 shadow-[0_10px_28px_-10px_hsl(var(--primary)/0.55)] cursor-pointer group"
              >
                Publier un projet
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/professionals")}
                className="inline-flex items-center justify-center gap-2 font-ui font-semibold text-sm sm:text-[15px] px-6 py-3.5 rounded-full bg-white text-primary border border-primary/12 hover:bg-white transition-colors duration-200 shadow-sm cursor-pointer group"
              >
                Trouver un professionnel
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating search — overlaps hero / stats */}
      <div className="relative z-30 px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 -mb-10 sm:-mb-12">
        <form onSubmit={handleSearch} className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl sm:rounded-full shadow-[0_18px_44px_-14px_rgba(13,43,69,0.28)] border border-slate-100/90 p-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <label className="flex-1 flex items-center gap-3 px-3 sm:px-4 py-2.5 cursor-pointer min-w-0 relative">
              <Search className="h-5 w-5 text-slate-400 shrink-0 pointer-events-none" />
              <span className="min-w-0 flex-1">
                <span className="block font-ui text-xs font-semibold text-primary">
                  Que voulez-vous réaliser ?
                </span>
                <span className="relative flex items-center">
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    aria-label="Type de projet"
                    className="w-full appearance-none bg-transparent border-0 p-0 pr-6 font-ui text-sm text-slate-700 focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="">Choisir un type de projet</option>
                    {HOME_SERVICES.map((opt) => (
                      <option key={opt.slug} value={opt.slug}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-300 shrink-0 absolute right-0 pointer-events-none" />
                </span>
                {selectedServiceLabel ? (
                  <span className="sr-only">{selectedServiceLabel}</span>
                ) : null}
              </span>
            </label>

            <div className="hidden sm:block h-10 w-px bg-slate-200 shrink-0" />

            <label className="sm:w-[210px] lg:w-[240px] flex items-center gap-3 px-3 sm:px-4 py-2.5 cursor-pointer min-w-0 border-t sm:border-t-0 border-slate-100 relative">
              <MapPin className="h-5 w-5 text-slate-400 shrink-0 pointer-events-none" />
              <span className="min-w-0 flex-1">
                <span className="block font-ui text-xs font-semibold text-primary">Où ?</span>
                <span className="relative flex items-center">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    aria-label="Ville ou région"
                    className="w-full appearance-none bg-transparent border-0 p-0 pr-6 font-ui text-sm text-slate-700 focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="">Ville ou région</option>
                    {HOME_REGIONS.map((opt) => (
                      <option key={opt.slug} value={opt.slug}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-300 shrink-0 absolute right-0 pointer-events-none" />
                </span>
                {selectedRegionLabel ? (
                  <span className="sr-only">{selectedRegionLabel}</span>
                ) : null}
              </span>
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 font-ui font-semibold text-sm px-5 py-3 rounded-xl sm:rounded-full bg-primary text-white hover:bg-primary-hover transition-colors duration-200 cursor-pointer shrink-0 sm:ml-1"
            >
              Rechercher
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Hero;
