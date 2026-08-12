import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FavoriteButton from "@/components/FavoriteButton";
import InviteProfessionalDialog from "@/components/invitations/InviteProfessionalDialog";
import { getUserLocation, sortByProximity, formatDistance, type Coordinates } from "@/lib/geolocation";
import { HOME_SERVICES, HOME_REGIONS, findHomeOption } from "@/data/home-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  Star,
  Search,
  SlidersHorizontal,
  Award,
  CheckCircle2,
  Mail,
  DollarSign,
  Calendar,
  Clock,
  Navigation as NavigationIcon,
  MessageSquare,
  Map,
  List,
} from "lucide-react";

const InteractiveMap = lazy(() => import("@/components/map/InteractiveMap"));

interface Professional {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  rbq_number: string | null;
  services_offered: string | null;
  has_insurance_document: boolean;
  is_rbq_verified: boolean;
  city: string | null;
  region: string | null;
  bio: string | null;
  years_experience: number | null;
  average_rating: number;
  total_reviews: number;
  total_projects: number;
  profile_picture_url: string | null;
  created_at: string;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  daily_rate_min: number | null;
  daily_rate_max: number | null;
  availability_status: "available" | "busy" | "unavailable" | null;
  available_from: string | null;
  response_time_hours: number | null;
  accepts_small_projects: boolean | null;
  minimum_project_budget: number | null;
  travel_distance_km: number | null;
  latitude: number | null;
  longitude: number | null;
  distance?: number;
  professional_type?: string | null;
}

const Professionals = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type");

  const SERVICES = [
    t("professionals.filters.services.all"),
    t("professionals.filters.services.residential_renovation"),
    t("professionals.filters.services.new_construction"),
    t("professionals.filters.services.roofing"),
    t("professionals.filters.services.plumbing"),
    t("professionals.filters.services.electricity"),
    t("professionals.filters.services.carpentry"),
    t("professionals.filters.services.masonry"),
    t("professionals.filters.services.painting"),
    t("professionals.filters.services.insulation"),
    t("professionals.filters.services.landscaping"),
    t("projects.filters.kitchen_bathroom"),
    t("projects.filters.extension"),
    "Autre",
  ];

  const REGIONS = [
    t("professionals.filters.regions.all"),
    t("professionals.filters.regions.montreal"),
    t("professionals.filters.regions.quebec"),
    t("professionals.filters.regions.laval"),
    t("professionals.filters.regions.gatineau"),
    t("professionals.filters.regions.longueuil"),
    t("professionals.filters.regions.sherbrooke"),
    t("professionals.filters.regions.saguenay"),
    t("professionals.filters.regions.trois_rivieres"),
    t("professionals.filters.regions.terrebonne"),
    t("professionals.filters.regions.saint_jean"),
    "Autre",
  ];

  const KNOWN_SERVICES_LOWER = [
    "rénovation résidentielle", "renovation", "construction neuve", "construction",
    "toiture", "plomberie", "électricité", "electricite", "menuiserie", "carpentry",
    "maçonnerie", "maconnerie", "peinture", "isolation", "aménagement paysager",
    "amenagement paysager", "cuisine", "salle de bain", "extension", "agrandissement",
  ];

  const KNOWN_REGIONS_LOWER = [
    "montréal", "montreal", "québec", "quebec", "laval", "gatineau", "longueuil",
    "sherbrooke", "saguenay", "trois-rivières", "trois-rivieres", "terrebonne",
    "saint-jean-sur-richelieu", "saint-jean",
  ];

  const BUDGET_RANGES = [
    t("professionals.filters.all_budgets"),
    t("professionals.filters.budget_ranges.under_50"),
    t("professionals.filters.budget_ranges.50_75"),
    t("professionals.filters.budget_ranges.75_100"),
    t("professionals.filters.budget_ranges.100_150"),
    t("professionals.filters.budget_ranges.over_150"),
  ];

  const AVAILABILITY_OPTIONS = [
    t("professionals.filters.all_availability"),
    t("professionals.filters.availability_options.available_now"),
    t("professionals.filters.availability_options.within_2_weeks"),
    t("professionals.filters.availability_options.within_1_month"),
    t("professionals.filters.availability_options.busy"),
  ];

  const RESPONSE_TIME_OPTIONS = [
    t("professionals.filters.all_response_times"),
    t("professionals.filters.response_time_options.under_6h"),
    t("professionals.filters.response_time_options.under_24h"),
    t("professionals.filters.response_time_options.under_48h"),
  ];

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [selectedBudget, setSelectedBudget] = useState(BUDGET_RANGES[0]);
  const [selectedAvailability, setSelectedAvailability] = useState(AVAILABILITY_OPTIONS[0]);
  const [selectedResponseTime, setSelectedResponseTime] = useState(RESPONSE_TIME_OPTIONS[0]);
  const [sortBy, setSortBy] = useState("recent");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"client" | "professional" | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapRadius, setMapRadius] = useState(50);
  const [inviteTarget, setInviteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    void fetchProfessionals();
    void checkUser();
    // Geolocation is deliberately NOT requested here. It is only requested
    // after the user chooses proximity sorting and clicks the opt-in button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  useEffect(() => {
    const serviceParam = searchParams.get("service");
    const regionParam = searchParams.get("region");
    const serviceOpt = findHomeOption(HOME_SERVICES, serviceParam);
    const regionOpt = findHomeOption(HOME_REGIONS, regionParam);

    if (serviceOpt) {
      const match = SERVICES.find((service) => service.toLowerCase() === serviceOpt.label.toLowerCase());
      setSelectedService(match || serviceOpt.label);
    }
    if (regionOpt) {
      const match = REGIONS.find(
        (region) =>
          region.toLowerCase() === regionOpt.label.toLowerCase() ||
          regionOpt.keywords.some((keyword) => region.toLowerCase().includes(keyword)),
      );
      setSelectedRegion(match || regionOpt.label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, t]);

  useEffect(() => {
    const serviceParam = searchParams.get("service");
    const regionParam = searchParams.get("region");
    if (!serviceParam) setSelectedService(SERVICES[0]);
    if (!regionParam) setSelectedRegion(REGIONS[0]);
    setSelectedBudget(BUDGET_RANGES[0]);
    setSelectedAvailability(AVAILABILITY_OPTIONS[0]);
    setSelectedResponseTime(RESPONSE_TIME_OPTIONS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    filterAndSortProfessionals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    professionals,
    searchTerm,
    selectedService,
    selectedRegion,
    selectedBudget,
    selectedAvailability,
    selectedResponseTime,
    sortBy,
    userLocation,
  ]);

  const ratingSummary = useMemo(() => {
    const reviewed = professionals.filter((pro) => Number(pro.total_reviews) > 0);
    const reviewCount = reviewed.reduce((sum, pro) => sum + Number(pro.total_reviews || 0), 0);
    if (reviewCount === 0) return { average: null as number | null, reviewCount: 0 };

    const weightedTotal = reviewed.reduce(
      (sum, pro) => sum + Number(pro.average_rating || 0) * Number(pro.total_reviews || 0),
      0,
    );
    return { average: weightedTotal / reviewCount, reviewCount };
  }, [professionals]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    if (!user) return;

    const { data } = await supabase.from("profiles").select("user_type").eq("id", user.id).single();
    if (data?.user_type) setUserType(data.user_type as "client" | "professional");
  };

  const handleStartConversation = async (professionalId: string) => {
    if (!userId) {
      navigate("/auth?mode=login");
      return;
    }

    try {
      const { data: conversationId, error } = await supabase.rpc("get_or_create_conversation", {
        user_1_id: userId,
        user_2_id: professionalId,
      });
      if (error) throw error;
      if (conversationId) navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const requestUserLocation = async () => {
    const location = await getUserLocation();
    if (location) setUserLocation(location);
  };

  const fetchProfessionals = async () => {
    try {
      let query = supabase
        .from("public_professional_profiles")
        .select(`
          id,
          full_name,
          email,
          company_name,
          rbq_number,
          services_offered,
          has_insurance_document,
          is_rbq_verified,
          city,
          region,
          bio,
          years_experience,
          average_rating,
          total_reviews,
          total_projects,
          profile_picture_url,
          created_at,
          hourly_rate_min,
          hourly_rate_max,
          daily_rate_min,
          daily_rate_max,
          availability_status,
          available_from,
          response_time_hours,
          accepts_small_projects,
          minimum_project_budget,
          travel_distance_km,
          latitude,
          longitude,
          professional_type
        `)
        .eq("user_type", "professional");

      if (typeFilter === "trade_professional") {
        query = query.eq("professional_type", "trade_professional");
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      const normalized = (data || []).map((pro) => ({
        ...pro,
        average_rating: Number(pro.average_rating || 0),
        total_reviews: Number(pro.total_reviews || 0),
        total_projects: Number(pro.total_projects || 0),
      })) as Professional[];
      setProfessionals(normalized);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProfessionals = () => {
    let filtered = [...professionals];

    if (typeFilter === "entrepreneur") {
      filtered = filtered.filter(
        (pro) => !pro.professional_type || pro.professional_type === "entrepreneur",
      );
    }

    if (searchTerm) {
      const needle = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pro) =>
          pro.full_name.toLowerCase().includes(needle) ||
          (pro.company_name || "").toLowerCase().includes(needle) ||
          pro.services_offered?.toLowerCase().includes(needle),
      );
    }

    if (selectedService !== SERVICES[0]) {
      if (selectedService === "Autre") {
        filtered = filtered.filter((pro) => {
          const offered = pro.services_offered?.toLowerCase() || "";
          return Boolean(offered) && !KNOWN_SERVICES_LOWER.some((service) => offered.includes(service));
        });
      } else {
        const serviceOpt = findHomeOption(HOME_SERVICES, selectedService);
        const keywords = serviceOpt?.keywords ?? [selectedService.toLowerCase()];
        filtered = filtered.filter((pro) => {
          const offered = pro.services_offered?.toLowerCase() || "";
          return keywords.some((keyword) => offered.includes(keyword));
        });
      }
    }

    if (selectedRegion !== REGIONS[0]) {
      if (selectedRegion === "Autre") {
        filtered = filtered.filter((pro) => {
          const region = pro.region?.toLowerCase() || "";
          const city = pro.city?.toLowerCase() || "";
          return !KNOWN_REGIONS_LOWER.some((known) => region.includes(known) || city.includes(known));
        });
      } else {
        const regionOpt = findHomeOption(HOME_REGIONS, selectedRegion);
        const keywords = regionOpt?.keywords ?? [selectedRegion.toLowerCase()];
        filtered = filtered.filter((pro) => {
          const region = pro.region?.toLowerCase() || "";
          const city = pro.city?.toLowerCase() || "";
          return keywords.some((keyword) => region.includes(keyword) || city.includes(keyword));
        });
      }
    }

    if (selectedBudget !== BUDGET_RANGES[0]) {
      filtered = filtered.filter((pro) => {
        if (!pro.hourly_rate_min && !pro.hourly_rate_max) return false;
        const minRate = pro.hourly_rate_min || 0;
        const maxRate = pro.hourly_rate_max || 9999;
        switch (BUDGET_RANGES.indexOf(selectedBudget)) {
          case 1: return minRate < 50;
          case 2: return (minRate >= 50 && minRate <= 75) || (maxRate >= 50 && maxRate <= 75);
          case 3: return (minRate >= 75 && minRate <= 100) || (maxRate >= 75 && maxRate <= 100);
          case 4: return (minRate >= 100 && minRate <= 150) || (maxRate >= 100 && maxRate <= 150);
          case 5: return maxRate >= 150;
          default: return true;
        }
      });
    }

    if (selectedAvailability !== AVAILABILITY_OPTIONS[0]) {
      filtered = filtered.filter((pro) => {
        const today = new Date();
        const availableFrom = pro.available_from ? new Date(pro.available_from) : null;
        switch (AVAILABILITY_OPTIONS.indexOf(selectedAvailability)) {
          case 1:
            return pro.availability_status === "available" && (!availableFrom || availableFrom <= today);
          case 2: {
            const deadline = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
            return pro.availability_status !== "unavailable" && (!availableFrom || availableFrom <= deadline);
          }
          case 3: {
            const deadline = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            return pro.availability_status !== "unavailable" && (!availableFrom || availableFrom <= deadline);
          }
          case 4:
            return pro.availability_status === "busy";
          default:
            return true;
        }
      });
    }

    if (selectedResponseTime !== RESPONSE_TIME_OPTIONS[0]) {
      filtered = filtered.filter((pro) => {
        const responseTime = pro.response_time_hours || 999;
        switch (RESPONSE_TIME_OPTIONS.indexOf(selectedResponseTime)) {
          case 1: return responseTime <= 6;
          case 2: return responseTime <= 24;
          case 3: return responseTime <= 48;
          default: return true;
        }
      });
    }

    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => (a.company_name || a.full_name).localeCompare(b.company_name || b.full_name));
        break;
      case "rating":
        filtered.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case "proximity":
        filtered = userLocation
          ? sortByProximity(filtered, userLocation)
          : filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "recent":
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredProfessionals(filtered);
  };

  const translateService = (service: string): string => {
    const serviceMap = t("professionals.filters.service_map", { returnObjects: true }) as Record<string, string>;
    return serviceMap[service.toLowerCase().trim()] || service;
  };

  const getServiceBadges = (services: string | null) => {
    if (!services) return [];
    return services.split(",").map((service) => translateService(service.trim())).filter(Boolean).slice(0, 3);
  };

  const resetFilters = () => {
    setSelectedService(SERVICES[0]);
    setSelectedRegion(REGIONS[0]);
    setSelectedBudget(BUDGET_RANGES[0]);
    setSelectedAvailability(AVAILABILITY_OPTIONS[0]);
    setSelectedResponseTime(RESPONSE_TIME_OPTIONS[0]);
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main>
        <section className="pt-24 sm:pt-32 pb-8 sm:pb-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold">
                {typeFilter === "entrepreneur"
                  ? "Trouver un entrepreneur général"
                  : typeFilter === "trade_professional"
                    ? "Trouver un professionnel métier"
                    : t("professionals.hero_title")}
              </h1>
              <p className="text-xl text-muted-foreground">
                {typeFilter === "entrepreneur"
                  ? "Entrepreneurs généraux en construction, rénovation et gestion de projets"
                  : typeFilter === "trade_professional"
                    ? "Professionnels métier — électriciens, plombiers, maçons, menuisiers et autres spécialités"
                    : t("professionals.hero_subtitle")}
              </p>

              <div className="flex items-center justify-center gap-4 sm:gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{professionals.length}</div>
                  <div className="text-sm text-muted-foreground">{t("professionals.stats.total")}</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {professionals.filter((pro) => pro.is_rbq_verified).length}
                  </div>
                  <div className="text-sm text-muted-foreground">{t("professionals.stats.verified_count")}</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {ratingSummary.average === null ? "—" : `${ratingSummary.average.toFixed(1)}/5`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ratingSummary.reviewCount === 0
                      ? "Aucun avis pour le moment"
                      : `${t("professionals.stats.avg_rating")} · ${ratingSummary.reviewCount} avis`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                {t("professionals.map.title", "Professionnels près de vous")}
              </h2>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant={showMap ? "default" : "outline"} size="sm" onClick={() => setShowMap(true)}>
                  <Map className="h-4 w-4 mr-2" />
                  {t("professionals.map.view_map", "Carte")}
                </Button>
                <Button variant={!showMap ? "default" : "outline"} size="sm" onClick={() => setShowMap(false)}>
                  <List className="h-4 w-4 mr-2" />
                  {t("professionals.map.view_list", "Liste")}
                </Button>
              </div>
            </div>

            {showMap && (
              <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                <InteractiveMap
                  mode="professionals"
                  professionals={filteredProfessionals
                    .filter((pro) => pro.latitude && pro.longitude)
                    .map((pro) => ({
                      id: pro.id,
                      full_name: pro.full_name,
                      company_name: pro.company_name,
                      city: pro.city,
                      region: pro.region,
                      latitude: pro.latitude!,
                      longitude: pro.longitude!,
                      service_radius_km: pro.travel_distance_km || 50,
                      services_offered: pro.services_offered,
                      years_experience: pro.years_experience,
                      is_rbq_verified: pro.is_rbq_verified,
                      rbq_number: pro.rbq_number,
                      average_rating: pro.average_rating,
                      total_reviews: pro.total_reviews,
                    }))}
                  onRadiusChange={setMapRadius}
                  onLocationChange={(latitude, longitude) => setUserLocation({ latitude, longitude })}
                  defaultRadius={mapRadius}
                  height="400px"
                />
              </Suspense>
            )}
          </div>
        </section>

        <section className="flex-1 py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
              <aside className="lg:w-72 xl:w-80 flex-shrink-0">
                <Card className="lg:sticky lg:top-24 max-h-[80vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5" />
                        {t("professionals.filters_title")}
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={resetFilters}>
                        {t("professionals.filters.reset")}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>{t("professionals.filters.all_services")}</Label>
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger aria-label={t("professionals.filters.all_services")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SERVICES.map((service) => <SelectItem key={service} value={service}>{service}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("professionals.filters.all_regions")}</Label>
                      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger aria-label={t("professionals.filters.all_regions")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><DollarSign className="h-4 w-4" />{t("professionals.filters.budget_label")}</Label>
                      <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                        <SelectTrigger aria-label={t("professionals.filters.budget_label")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BUDGET_RANGES.map((budget) => <SelectItem key={budget} value={budget}>{budget}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" />{t("professionals.filters.availability_label")}</Label>
                      <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                        <SelectTrigger aria-label={t("professionals.filters.availability_label")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((availability) => <SelectItem key={availability} value={availability}>{availability}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Clock className="h-4 w-4" />{t("professionals.filters.response_time_label")}</Label>
                      <Select value={selectedResponseTime} onValueChange={setSelectedResponseTime}>
                        <SelectTrigger aria-label={t("professionals.filters.response_time_label")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {RESPONSE_TIME_OPTIONS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>{t("professionals.sort.sort_by")}</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger aria-label={t("professionals.sort.sort_by")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">{t("professionals.sort.recent")}</SelectItem>
                          <SelectItem value="name">{t("professionals.sort.name")}</SelectItem>
                          <SelectItem value="rating">{t("professionals.sort.rating")}</SelectItem>
                          <SelectItem value="proximity">
                            <div className="flex items-center gap-2">
                              <NavigationIcon className="h-4 w-4" />
                              {t("professionals.sort.proximity")}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {sortBy === "proximity" && !userLocation && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                        <div className="flex items-start gap-2">
                          <NavigationIcon className="h-4 w-4 text-orange-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-orange-900">{t("professionals.geolocation.disabled")}</p>
                            <p className="text-orange-700 text-xs mt-1">{t("professionals.geolocation.enable_message")}</p>
                            <Button size="sm" variant="outline" className="mt-2" onClick={requestUserLocation}>
                              {t("professionals.geolocation.enable")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </aside>

              <div className="flex-1">
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("professionals.search_placeholder")}
                    className="pl-12 pr-4 h-12 text-base"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {filteredProfessionals.length === 1
                      ? t("professionals.stats.results_count", { count: filteredProfessionals.length })
                      : t("professionals.stats.results_count_plural", { count: filteredProfessionals.length })}
                  </p>
                </div>

                {loading ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((item) => (
                      <Card key={item} className="animate-pulse">
                        <CardHeader><div className="h-6 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-1/2" /></CardHeader>
                        <CardContent><div className="space-y-3"><div className="h-4 bg-muted rounded" /><div className="h-4 bg-muted rounded w-5/6" /></div></CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredProfessionals.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">BâtirNet est en phase de lancement</h3>
                      <p className="text-muted-foreground mb-6">
                        Aucun professionnel ne correspond actuellement à ces critères. De nouveaux profils seront ajoutés progressivement.
                      </p>
                      <Button variant="outline" onClick={resetFilters}>{t("professionals.no_results.reset_button")}</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredProfessionals.map((pro) => (
                      <Card key={pro.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="flex items-center gap-2 flex-wrap">
                                <Building2 className="h-5 w-5 text-primary" />
                                {pro.company_name || pro.full_name}
                                {pro.is_rbq_verified && (
                                  <Badge variant="default" className="ml-2 bg-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {t("professionals.card.verified")}
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="mt-1">{pro.full_name}</CardDescription>
                            </div>
                            <FavoriteButton professionalId={pro.id} userId={userId} size="icon" variant="ghost" />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {pro.rbq_number && (
                            <div className="flex items-center gap-2 text-sm">
                              <Award className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">RBQ:</span>
                              <span className="font-mono font-semibold">{pro.rbq_number}</span>
                            </div>
                          )}

                          {(pro.city || pro.region || pro.distance !== undefined) && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div className="flex items-center gap-2">
                                <span>{[pro.city, pro.region].filter(Boolean).join(", ")}</span>
                                {pro.distance !== undefined && (
                                  <Badge variant="outline" className="text-xs">
                                    <NavigationIcon className="h-3 w-3 mr-1" />{formatDistance(pro.distance)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {pro.years_experience && (
                            <div className="text-sm">
                              <span className="font-medium">{pro.years_experience}</span>
                              <span className="text-muted-foreground"> {t("professionals.card.years_exp")}</span>
                            </div>
                          )}

                          <Separator />

                          {(pro.hourly_rate_min || pro.hourly_rate_max) && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                {pro.hourly_rate_min && pro.hourly_rate_max
                                  ? `${pro.hourly_rate_min} - ${pro.hourly_rate_max} ${t("professionals.card.hourly_rate")}`
                                  : pro.hourly_rate_min
                                    ? `${t("projects.card.from")} ${pro.hourly_rate_min} ${t("professionals.card.hourly_rate")}`
                                    : `${t("projects.card.up_to")} ${pro.hourly_rate_max} ${t("professionals.card.hourly_rate")}`}
                              </span>
                            </div>
                          )}

                          {pro.availability_status && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className={
                                pro.availability_status === "available"
                                  ? "text-green-600 font-medium"
                                  : pro.availability_status === "busy"
                                    ? "text-orange-600"
                                    : "text-red-600"
                              }>
                                {pro.availability_status === "available"
                                  ? t("professionals.card.available")
                                  : pro.availability_status === "busy"
                                    ? t("professionals.card.busy")
                                    : t("professionals.card.unavailable")}
                              </span>
                              {pro.available_from && new Date(pro.available_from) > new Date() && (
                                <span className="text-muted-foreground text-xs">
                                  ({t("professionals.card.available_from")} {new Date(pro.available_from).toLocaleDateString(i18n.language === "fr" ? "fr-CA" : "en-CA")})
                                </span>
                              )}
                            </div>
                          )}

                          {pro.response_time_hours && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{t("professionals.card.response_time", { hours: pro.response_time_hours })}</span>
                            </div>
                          )}

                          <Separator />

                          {pro.services_offered && (
                            <div>
                              <p className="text-sm font-medium mb-2">{t("professionals.card.services_offered")}</p>
                              <div className="flex flex-wrap gap-2">
                                {getServiceBadges(pro.services_offered).map((service, index) => <Badge key={index} variant="secondary">{service}</Badge>)}
                                {pro.services_offered.split(",").length > 3 && (
                                  <Badge variant="outline">+{pro.services_offered.split(",").length - 3} {t("professionals.card.others")}</Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.round(pro.average_rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="text-sm text-muted-foreground ml-1">
                              {pro.total_reviews > 0
                                ? `(${pro.average_rating.toFixed(1)} • ${pro.total_reviews} ${t("professionals.card.reviews")})`
                                : "(Aucun avis)"}
                            </span>
                          </div>

                          {pro.total_projects > 0 && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">{pro.total_projects}</span>{" "}
                              {pro.total_projects === 1 ? t("professionals.card.project") : t("professionals.card.projects")}
                            </div>
                          )}

                          <Separator />

                          <div className="flex gap-2 flex-wrap">
                            <Button className="flex-1 min-w-[140px]" onClick={() => navigate(`/professional/${pro.id}`)}>
                              {t("professionals.card.view_profile")}
                            </Button>
                            {userType === "client" && (
                              <Button
                                variant="secondary"
                                onClick={() => setInviteTarget({ id: pro.id, name: pro.company_name || pro.full_name })}
                                title={t("professionals.card.invite", { defaultValue: "Inviter à soumissionner" })}
                              >
                                <Award className="h-4 w-4 mr-1.5" />
                                {t("professionals.card.invite", { defaultValue: "Inviter" })}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleStartConversation(pro.id)}
                              title={t("professionals.card.contact")}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            {pro.email && (
                              <Button variant="outline" size="icon" asChild title={`Écrire à ${pro.email}`}>
                                <a href={`mailto:${pro.email}`} aria-label={`Envoyer un courriel à ${pro.company_name || pro.full_name}`}>
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {inviteTarget && (
        <InviteProfessionalDialog
          open={Boolean(inviteTarget)}
          onOpenChange={(open) => !open && setInviteTarget(null)}
          professionalId={inviteTarget.id}
          professionalName={inviteTarget.name}
        />
      )}
    </div>
  );
};

export default Professionals;
