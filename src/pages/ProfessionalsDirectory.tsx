import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  List,
  Map,
  MapPin,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Star,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FavoriteButton from "@/components/FavoriteButton";
import InviteProfessionalDialog from "@/components/invitations/InviteProfessionalDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HOME_REGIONS, HOME_SERVICES, findHomeOption } from "@/data/home-search";

const InteractiveMap = lazy(() => import("@/components/map/InteractiveMap"));

type ProfessionalType = "entrepreneur" | "trade_professional" | null;

type Professional = {
  id: string;
  full_name: string;
  company_name: string | null;
  services_offered: string | null;
  city: string | null;
  region: string | null;
  bio: string | null;
  years_experience: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_projects: number | null;
  profile_picture_url: string | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  availability_status: "available" | "busy" | "unavailable" | null;
  response_time_hours: number | null;
  travel_distance_km: number | null;
  latitude: number | null;
  longitude: number | null;
  professional_type: ProfessionalType;
  created_at: string;
};

const availabilityLabel = (status: Professional["availability_status"]) => {
  if (status === "available") return "Disponible";
  if (status === "busy") return "Occupé";
  if (status === "unavailable") return "Indisponible";
  return "Disponibilité à confirmer";
};

const ProfessionalsDirectory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type") as ProfessionalType;

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [service, setService] = useState(searchParams.get("service") || "all");
  const [region, setRegion] = useState(searchParams.get("region") || "all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("recent");
  const [showMap, setShowMap] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"client" | "professional" | null>(null);
  const [inviteTarget, setInviteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData.user;
        if (active) setUserId(currentUser?.id || null);

        if (currentUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", currentUser.id)
            .maybeSingle();
          if (active && profile?.user_type) {
            setUserType(profile.user_type as "client" | "professional");
          }
        }

        let query = supabase
          .from("public_professional_profiles")
          .select(`
            id,
            full_name,
            company_name,
            services_offered,
            city,
            region,
            bio,
            years_experience,
            average_rating,
            total_reviews,
            total_projects,
            profile_picture_url,
            hourly_rate_min,
            hourly_rate_max,
            availability_status,
            response_time_hours,
            travel_distance_km,
            latitude,
            longitude,
            professional_type,
            created_at
          `)
          .eq("user_type", "professional")
          .order("created_at", { ascending: false });

        if (typeFilter === "trade_professional") query = query.eq("professional_type", "trade_professional");
        if (typeFilter === "entrepreneur") query = query.or("professional_type.eq.entrepreneur,professional_type.is.null");

        const { data, error } = await query;
        if (error) throw error;

        if (active) {
          setProfessionals((data || []).map((item) => ({
            ...item,
            average_rating: Number(item.average_rating || 0),
            total_reviews: Number(item.total_reviews || 0),
            total_projects: Number(item.total_projects || 0),
          })) as Professional[]);
        }
      } catch (error) {
        console.error("Unable to load professional directory", error);
        if (active) {
          setProfessionals([]);
          setLoadError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [typeFilter]);

  useEffect(() => {
    const serviceParam = searchParams.get("service");
    const regionParam = searchParams.get("region");
    setService(serviceParam || "all");
    setRegion(regionParam || "all");
  }, [searchParams]);

  const filtered = useMemo(() => {
    const serviceOption = findHomeOption(HOME_SERVICES, service === "all" ? null : service);
    const regionOption = findHomeOption(HOME_REGIONS, region === "all" ? null : region);
    const needle = search.trim().toLowerCase();

    const result = professionals.filter((pro) => {
      if (needle) {
        const haystack = [pro.full_name, pro.company_name, pro.services_offered, pro.city, pro.region]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      if (serviceOption) {
        const offered = (pro.services_offered || "").toLowerCase();
        if (!serviceOption.keywords.some((keyword) => offered.includes(keyword))) return false;
      }

      if (regionOption) {
        const area = `${pro.city || ""} ${pro.region || ""}`.toLowerCase();
        if (!regionOption.keywords.some((keyword) => area.includes(keyword))) return false;
      }

      if (availability !== "all" && pro.availability_status !== availability) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sort === "rating") return Number(b.average_rating || 0) - Number(a.average_rating || 0);
      if (sort === "experience") return Number(b.years_experience || 0) - Number(a.years_experience || 0);
      if (sort === "name") return (a.company_name || a.full_name).localeCompare(b.company_name || b.full_name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [availability, professionals, region, search, service, sort]);

  const rating = useMemo(() => {
    const reviewed = professionals.filter((pro) => Number(pro.total_reviews || 0) > 0);
    const count = reviewed.reduce((sum, pro) => sum + Number(pro.total_reviews || 0), 0);
    if (!count) return null;
    const weighted = reviewed.reduce((sum, pro) => sum + Number(pro.average_rating || 0) * Number(pro.total_reviews || 0), 0);
    return weighted / count;
  }, [professionals]);

  const startConversation = async (professionalId: string) => {
    if (!userId) {
      navigate("/auth?mode=login");
      return;
    }

    const { data, error } = await supabase.rpc("get_or_create_conversation", {
      user_1_id: userId,
      user_2_id: professionalId,
    });

    if (error) {
      console.error("Unable to start conversation", error);
      return;
    }
    if (data) navigate(`/messages?conversation=${data}`);
  };

  const resetFilters = () => {
    setSearch("");
    setService("all");
    setRegion("all");
    setAvailability("all");
    setSort("recent");
  };

  const pageTitle = typeFilter === "entrepreneur"
    ? "Trouver un entrepreneur"
    : typeFilter === "trade_professional"
      ? "Trouver un professionnel métier"
      : "Trouvez le professionnel qui correspond à votre projet";

  const pageSubtitle = typeFilter === "trade_professional"
    ? "Parcourez les spécialités, les secteurs desservis et les profils disponibles pour votre projet."
    : "Comparez les services, l'expérience, la disponibilité et les avis affichés sur les profils BâtirNet.";

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
      <Navigation />
      <main className="flex-1 pt-20 sm:pt-24">
        <section className="bn-page-hero border-b border-slate-200/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
              <div className="max-w-3xl bn-reveal">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-primary/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary/70 shadow-sm">
                  <BriefcaseBusiness className="h-4 w-4" /> Répertoire BâtirNet
                </div>
                <h1 className="mt-5 font-ui text-3xl sm:text-5xl font-bold tracking-tight text-primary leading-tight">{pageTitle}</h1>
                <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">{pageSubtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-[250px] bn-reveal bn-delay-2">
                <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm">
                  <p className="text-2xl font-bold text-primary">{professionals.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Profils affichés</p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm">
                  <p className="text-2xl font-bold text-primary">{rating === null ? "—" : rating.toFixed(1)}</p>
                  <p className="text-xs text-slate-500 mt-1">Note moyenne</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
          <Card className="rounded-[1.4rem] border-slate-200/80 shadow-[0_18px_50px_-36px_rgba(13,43,69,0.5)] overflow-visible">
            <CardContent className="p-4 sm:p-5">
              <div className="grid md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_.85fr_auto] gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, entreprise, service ou ville" className="h-11 pl-10 rounded-xl bg-white" />
                </div>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services</SelectItem>
                    {HOME_SERVICES.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Région" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {HOME_REGIONS.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Disponibilité" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute disponibilité</SelectItem>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="busy">Occupé</SelectItem>
                    <SelectItem value="unavailable">Indisponible</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={resetFilters} className="h-11 rounded-xl text-primary"><SlidersHorizontal className="h-4 w-4 mr-2" />Réinitialiser</Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-slate-600"><span className="font-semibold text-primary">{filtered.length}</span> résultat{filtered.length > 1 ? "s" : ""}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[190px] h-9 rounded-lg bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="rating">Mieux notés</SelectItem>
                  <SelectItem value="experience">Plus d'expérience</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                <Button size="sm" variant={!showMap ? "default" : "ghost"} onClick={() => setShowMap(false)} className="h-7 px-2.5"><List className="h-3.5 w-3.5 mr-1.5" />Liste</Button>
                <Button size="sm" variant={showMap ? "default" : "ghost"} onClick={() => setShowMap(true)} className="h-7 px-2.5"><Map className="h-3.5 w-3.5 mr-1.5" />Carte</Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
              {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-80 rounded-[1.4rem]" />)}
            </div>
          ) : loadError ? (
            <div className="mt-6 bn-surface text-center py-12">
              <CircleHelpFallback />
              <h2 className="font-semibold text-primary">Impossible de charger le répertoire pour le moment</h2>
              <p className="text-sm text-slate-600 mt-2">Réessayez dans quelques instants.</p>
            </div>
          ) : showMap ? (
            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
              <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
                <InteractiveMap
                  mode="professionals"
                  height="480px"
                  professionals={filtered
                    .filter((pro) => typeof pro.latitude === "number" && typeof pro.longitude === "number")
                    .map((pro) => ({
                      id: pro.id,
                      full_name: pro.full_name,
                      company_name: pro.company_name,
                      city: pro.city,
                      region: pro.region,
                      latitude: pro.latitude as number,
                      longitude: pro.longitude as number,
                      service_radius_km: pro.travel_distance_km || 50,
                      services_offered: pro.services_offered,
                      years_experience: pro.years_experience,
                      is_rbq_verified: false,
                      rbq_number: null,
                      average_rating: Number(pro.average_rating || 0),
                      total_reviews: Number(pro.total_reviews || 0),
                    }))}
                />
              </Suspense>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-6 bn-surface text-center py-12">
              <Search className="h-9 w-9 text-primary/35 mx-auto mb-3" />
              <h2 className="font-semibold text-primary">Aucun profil ne correspond à ces filtres</h2>
              <p className="text-sm text-slate-600 mt-2">Essayez une autre région, un autre service ou réinitialisez les filtres.</p>
              <Button variant="outline" onClick={resetFilters} className="mt-5 rounded-full">Réinitialiser</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
              {filtered.map((pro, index) => {
                const services = (pro.services_offered || "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 3);
                return (
                  <article key={pro.id} className="bn-surface bn-card-lift bn-reveal p-0 overflow-hidden" style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <button type="button" onClick={() => navigate(`/professional/${pro.id}`)} className="h-14 w-14 rounded-2xl bg-primary/8 overflow-hidden flex items-center justify-center shrink-0">
                          {pro.profile_picture_url ? (
                            <img src={pro.profile_picture_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <UserRound className="h-6 w-6 text-primary/55" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <button type="button" onClick={() => navigate(`/professional/${pro.id}`)} className="text-left min-w-0">
                              <h2 className="font-ui font-bold text-lg text-primary truncate">{pro.company_name || pro.full_name}</h2>
                              {pro.company_name && <p className="text-xs text-slate-500 truncate mt-0.5">{pro.full_name}</p>}
                            </button>
                            <FavoriteButton professionalId={pro.id} userId={userId} size="icon" variant="ghost" />
                          </div>
                          {(pro.city || pro.region) && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{[pro.city, pro.region].filter(Boolean).join(", ")}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {services.length ? services.map((item) => <Badge key={item} variant="secondary" className="rounded-full font-medium">{item}</Badge>) : <Badge variant="secondary" className="rounded-full">Services à consulter sur le profil</Badge>}
                      </div>

                      {pro.bio && <p className="mt-4 text-sm text-slate-600 leading-relaxed line-clamp-3">{pro.bio}</p>}

                      <div className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-1.5 text-slate-500"><Star className="h-3.5 w-3.5" />Avis</div>
                          <p className="mt-1 font-semibold text-primary">{Number(pro.total_reviews || 0) > 0 ? `${Number(pro.average_rating || 0).toFixed(1)} / 5 · ${pro.total_reviews}` : "Aucun avis"}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-1.5 text-slate-500"><CalendarClock className="h-3.5 w-3.5" />Disponibilité</div>
                          <p className="mt-1 font-semibold text-primary">{availabilityLabel(pro.availability_status)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-1.5 text-slate-500"><BriefcaseBusiness className="h-3.5 w-3.5" />Expérience</div>
                          <p className="mt-1 font-semibold text-primary">{pro.years_experience ? `${pro.years_experience} an${pro.years_experience > 1 ? "s" : ""}` : "À consulter"}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-1.5 text-slate-500"><Clock3 className="h-3.5 w-3.5" />Réponse</div>
                          <p className="mt-1 font-semibold text-primary">{pro.response_time_hours ? `~ ${pro.response_time_hours} h` : "À confirmer"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 p-4 flex items-center gap-2 bg-slate-50/55">
                      <Button variant="outline" className="flex-1 rounded-full bg-white" onClick={() => navigate(`/professional/${pro.id}`)}>Voir le profil</Button>
                      <Button className="flex-1 rounded-full" onClick={() => void startConversation(pro.id)}><MessageSquare className="h-4 w-4 mr-2" />Message</Button>
                      {userType === "client" && (
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setInviteTarget({ id: pro.id, name: pro.company_name || pro.full_name })} title="Inviter à un projet">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />

      {inviteTarget && (
        <InviteProfessionalDialog
          open={Boolean(inviteTarget)}
          onOpenChange={(open) => { if (!open) setInviteTarget(null); }}
          professionalId={inviteTarget.id}
          professionalName={inviteTarget.name}
        />
      )}
    </div>
  );
};

const CircleHelpFallback = () => (
  <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
    <Search className="h-5 w-5 text-primary" />
  </div>
);

export default ProfessionalsDirectory;
