import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FavoriteButton from "@/components/FavoriteButton";
import { getUserLocation, sortByProximity, formatDistance, type Coordinates } from "@/lib/geolocation";
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
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Clock,
  Navigation as NavigationIcon,
  TrendingUp,
  MessageSquare,
  Map,
  List,
} from "lucide-react";

import InviteProfessionalDialog from "@/components/invitations/InviteProfessionalDialog";

// Lazy load the map component
const InteractiveMap = lazy(() => import("@/components/map/InteractiveMap"));

interface Professional {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string;
  rbq_number: string;
  services_offered: string | null;
  insurance_info: string | null;
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
  // New filter fields
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  daily_rate_min: number | null;
  daily_rate_max: number | null;
  availability_status: 'available' | 'busy' | 'unavailable' | null;
  available_from: string | null;
  response_time_hours: number | null;
  accepts_small_projects: boolean | null;
  minimum_project_budget: number | null;
  travel_distance_km: number | null;
  // Geolocation and activity fields
  latitude: number | null;
  longitude: number | null;
  last_active_at: string | null;
  activity_score: number | null;
  total_proposals_sent: number | null;
  proposals_last_30_days: number | null;
  // Calculated fields
  distance?: number;
  professional_type?: string | null;
}

const Professionals = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // ?type=entrepreneur → show entrepreneurs (incl. old accounts without professional_type)
  // ?type=trade_professional → show trade professionals only
  const typeFilter = searchParams.get('type'); // 'entrepreneur' | 'trade_professional' | null
  
  const SERVICES = [
    t('professionals.filters.services.all'),
    t('professionals.filters.services.residential_renovation'),
    t('professionals.filters.services.new_construction'),
    t('professionals.filters.services.roofing'),
    t('professionals.filters.services.plumbing'),
    t('professionals.filters.services.electricity'),
    t('professionals.filters.services.carpentry'),
    t('professionals.filters.services.masonry'),
    t('professionals.filters.services.painting'),
    t('professionals.filters.services.insulation'),
    t('professionals.filters.services.landscaping'),
    t('projects.filters.kitchen_bathroom'),
    t('projects.filters.extension'),
    "Autre",
  ];

  const REGIONS = [
    t('professionals.filters.regions.all'),
    t('professionals.filters.regions.montreal'),
    t('professionals.filters.regions.quebec'),
    t('professionals.filters.regions.laval'),
    t('professionals.filters.regions.gatineau'),
    t('professionals.filters.regions.longueuil'),
    t('professionals.filters.regions.sherbrooke'),
    t('professionals.filters.regions.saguenay'),
    t('professionals.filters.regions.trois_rivieres'),
    t('professionals.filters.regions.terrebonne'),
    t('professionals.filters.regions.saint_jean'),
    "Autre",
  ];

  // Known service names for "Autre" filter (non-listed services)
  const KNOWN_SERVICES_LOWER = [
    'rénovation résidentielle', 'renovation', 'construction neuve', 'construction',
    'toiture', 'plomberie', 'électricité', 'electricite', 'menuiserie', 'carpentry',
    'maçonnerie', 'maconnerie', 'peinture', 'isolation', 'aménagement paysager',
    'amenagement paysager', 'cuisine', 'salle de bain', 'extension', 'agrandissement',
  ];

  // Known region names for "Autre" filter (non-listed regions)
  const KNOWN_REGIONS_LOWER = [
    'montréal', 'montreal', 'québec', 'quebec', 'laval', 'gatineau',
    'longueuil', 'sherbrooke', 'saguenay', 'trois-rivières', 'trois-rivieres',
    'terrebonne', 'saint-jean-sur-richelieu', 'saint-jean',
  ];

  const BUDGET_RANGES = [
    t('professionals.filters.all_budgets'),
    t('professionals.filters.budget_ranges.under_50'),
    t('professionals.filters.budget_ranges.50_75'),
    t('professionals.filters.budget_ranges.75_100'),
    t('professionals.filters.budget_ranges.100_150'),
    t('professionals.filters.budget_ranges.over_150'),
  ];

  const AVAILABILITY_OPTIONS = [
    t('professionals.filters.all_availability'),
    t('professionals.filters.availability_options.available_now'),
    t('professionals.filters.availability_options.within_2_weeks'),
    t('professionals.filters.availability_options.within_1_month'),
    t('professionals.filters.availability_options.busy'),
  ];

  const RESPONSE_TIME_OPTIONS = [
    t('professionals.filters.all_response_times'),
    t('professionals.filters.response_time_options.under_6h'),
    t('professionals.filters.response_time_options.under_24h'),
    t('professionals.filters.response_time_options.under_48h'),
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
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'client' | 'professional' | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [mapRadius, setMapRadius] = useState(50);
  const [inviteTarget, setInviteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchProfessionals();
    requestUserLocation();
    checkUser();
  }, [typeFilter]); // re-fetch when ?type= changes

  // Reset filters when language changes to ensure translated values match
  useEffect(() => {
    setSelectedService(SERVICES[0]);
    setSelectedRegion(REGIONS[0]);
    setSelectedBudget(BUDGET_RANGES[0]);
    setSelectedAvailability(AVAILABILITY_OPTIONS[0]);
    setSelectedResponseTime(RESPONSE_TIME_OPTIONS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      if (data?.user_type) setUserType(data.user_type as 'client' | 'professional');
    }
  };

  const handleStartConversation = async (professionalId: string) => {
    if (!userId) {
      navigate('/auth?mode=login');
      return;
    }

    try {
      // Get or create conversation between current user and professional
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        user_1_id: userId,
        user_2_id: professionalId,
      });

      if (error) throw error;

      if (conversationId) {
        // Redirect to messages page with conversation ID
        navigate(`/messages?conversation=${conversationId}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  useEffect(() => {
    filterAndSortProfessionals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionals, searchTerm, selectedService, selectedRegion, selectedBudget, selectedAvailability, selectedResponseTime, sortBy, userLocation]);

  const requestUserLocation = async () => {
    const location = await getUserLocation();
    if (location) {
      setUserLocation(location);
      setLocationPermission('granted');
    } else {
      setLocationPermission('denied');
    }
  };

  const fetchProfessionals = async () => {
    try {
      // Show RBQ-verified professionals AND all trade professionals (whose
      // RBQ/CCQ verification is optional — they get full visibility).
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          company_name,
          rbq_number,
          services_offered,
          insurance_info,
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
          last_active_at,
          activity_score,
          total_proposals_sent,
          proposals_last_30_days,
          professional_type
        `)
        .eq('user_type', 'professional')
        .or('is_rbq_verified.eq.true,professional_type.eq.trade_professional');

      // Only restrict at DB level for trade_professional (exclusive filter).
      // For entrepreneur we filter client-side so old accounts (professional_type=NULL)
      // are included without relying on PostgREST OR-null syntax.
      if (typeFilter === 'trade_professional') {
        query = query.eq('professional_type', 'trade_professional');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProfessionals = () => {
    let filtered = [...professionals];

    // Professional type filter (client-side, reliable for NULL accounts)
    if (typeFilter === 'entrepreneur') {
      // Keep entrepreneurs and old accounts (NULL = entrepreneur by default)
      filtered = filtered.filter(
        (pro) => !pro.professional_type || pro.professional_type === 'entrepreneur'
      );
    }
    // trade_professional is already filtered at DB level; no client-side override needed

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (pro) =>
          pro.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pro.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pro.services_offered?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Service filter
    if (selectedService !== SERVICES[0]) {
      if (selectedService === "Autre") {
        // Show professionals whose services are not in the predefined list
        filtered = filtered.filter((pro) => {
          const offered = pro.services_offered?.toLowerCase() || "";
          return offered && !KNOWN_SERVICES_LOWER.some(s => offered.includes(s));
        });
      } else {
        filtered = filtered.filter((pro) =>
          pro.services_offered?.toLowerCase().includes(selectedService.toLowerCase())
        );
      }
    }

    // Region filter - use REGIONS[0] which is the translated "All Regions" option
    if (selectedRegion !== REGIONS[0]) {
      if (selectedRegion === "Autre") {
        // Show professionals from regions not in the predefined list
        filtered = filtered.filter((pro) => {
          const proRegion = pro.region?.toLowerCase() || "";
          const proCity = pro.city?.toLowerCase() || "";
          return !KNOWN_REGIONS_LOWER.some(r => proRegion.includes(r) || proCity.includes(r));
        });
      } else {
        filtered = filtered.filter((pro) =>
          pro.city?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
          pro.region?.toLowerCase().includes(selectedRegion.toLowerCase())
        );
      }
    }

    // Budget filter (hourly rate) - use index-based comparison for i18n support
    if (selectedBudget !== BUDGET_RANGES[0]) {
      filtered = filtered.filter((pro) => {
        if (!pro.hourly_rate_min && !pro.hourly_rate_max) return false;
        
        const minRate = pro.hourly_rate_min || 0;
        const maxRate = pro.hourly_rate_max || 9999;
        const budgetIndex = BUDGET_RANGES.indexOf(selectedBudget);
        
        switch (budgetIndex) {
          case 1: // Under 50$/h
            return minRate < 50;
          case 2: // 50-75$/h
            return (minRate >= 50 && minRate <= 75) || (maxRate >= 50 && maxRate <= 75);
          case 3: // 75-100$/h
            return (minRate >= 75 && minRate <= 100) || (maxRate >= 75 && maxRate <= 100);
          case 4: // 100-150$/h
            return (minRate >= 100 && minRate <= 150) || (maxRate >= 100 && maxRate <= 150);
          case 5: // 150$/h and more
            return maxRate >= 150;
          default:
            return true;
        }
      });
    }

    // Availability filter - use index-based comparison for i18n support
    if (selectedAvailability !== AVAILABILITY_OPTIONS[0]) {
      filtered = filtered.filter((pro) => {
        const today = new Date();
        const availableFrom = pro.available_from ? new Date(pro.available_from) : null;
        const availabilityIndex = AVAILABILITY_OPTIONS.indexOf(selectedAvailability);
        
        switch (availabilityIndex) {
          case 1: // Available now
            return pro.availability_status === 'available' && (!availableFrom || availableFrom <= today);
          case 2: { // Available within 2 weeks
            const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
            return pro.availability_status !== 'unavailable' && (!availableFrom || availableFrom <= twoWeeksFromNow);
          }
          case 3: { // Available within 1 month
            const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            return pro.availability_status !== 'unavailable' && (!availableFrom || availableFrom <= oneMonthFromNow);
          }
          case 4: // Currently busy
            return pro.availability_status === 'busy';
          default:
            return true;
        }
      });
    }

    // Response time filter - use index-based comparison for i18n support
    if (selectedResponseTime !== RESPONSE_TIME_OPTIONS[0]) {
      filtered = filtered.filter((pro) => {
        const responseTime = pro.response_time_hours || 999;
        const responseIndex = RESPONSE_TIME_OPTIONS.indexOf(selectedResponseTime);
        
        switch (responseIndex) {
          case 1: // Under 6 hours
            return responseTime <= 6;
          case 2: // Under 24 hours
            return responseTime <= 24;
          case 3: // Under 48 hours
            return responseTime <= 48;
          default:
            return true;
        }
      });
    }

    // Sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "name":
        filtered.sort((a, b) => a.company_name.localeCompare(b.company_name));
        break;
      case "rating":
        filtered.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case "proximity":
        if (userLocation) {
          filtered = sortByProximity(filtered, userLocation);
        } else {
          // Fallback to recent if no location
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        break;
      case "activity":
        filtered.sort((a, b) => {
          const scoreA = a.activity_score || 0;
          const scoreB = b.activity_score || 0;
          return scoreB - scoreA;
        });
        break;
    }

    setFilteredProfessionals(filtered);
  };

  const translateService = (service: string): string => {
    const normalizedService = service.toLowerCase().trim();
    const serviceMap = t('professionals.filters.service_map', { returnObjects: true }) as Record<string, string>;
    return serviceMap[normalizedService] || service;
  };

  const getServiceBadges = (services: string | null) => {
    if (!services) return [];
    return services
      .split(',')
      .map((s) => translateService(s.trim()))
      .filter(Boolean)
      .slice(0, 3);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main>
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-8 sm:pb-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold">
              {typeFilter === 'entrepreneur'
                ? 'Trouver un entrepreneur général'
                : typeFilter === 'trade_professional'
                ? 'Trouver un professionnel métier'
                : t('professionals.hero_title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {typeFilter === 'entrepreneur'
                ? 'Entrepreneurs généraux vérifiés RBQ — construction, rénovation, gestion de projets'
                : typeFilter === 'trade_professional'
                ? 'Spécialistes certifiés CCQ — électriciens, plombiers, maçons, menuisiers…'
                : t('professionals.hero_subtitle')}
            </p>
            
            {/* Main Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('professionals.search_placeholder')}
                className="pl-12 pr-4 h-14 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{professionals.length}</div>
                <div className="text-sm text-muted-foreground">{t('professionals.stats.verified')}</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">{t('professionals.card.verified')}</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">4.8/5</div>
                <div className="text-sm text-muted-foreground">{t('professionals.stats.avg_rating')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-6 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t('professionals.map.title', 'Professionnels près de vous')}
            </h2>
            <div className="flex gap-2">
              <Button
                variant={showMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMap(true)}
              >
                <Map className="h-4 w-4 mr-2" />
                {t('professionals.map.view_map', 'Carte')}
              </Button>
              <Button
                variant={!showMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMap(false)}
              >
                <List className="h-4 w-4 mr-2" />
                {t('professionals.map.view_list', 'Liste')}
              </Button>
            </div>
          </div>
          
          {showMap && (
            <Suspense fallback={
              <Skeleton className="h-[400px] w-full rounded-lg" />
            }>
              <InteractiveMap
                mode="professionals"
                professionals={filteredProfessionals
                  .filter(p => p.latitude && p.longitude)
                  .map(p => ({
                    id: p.id,
                    full_name: p.full_name,
                    company_name: p.company_name,
                    city: p.city,
                    region: p.region,
                    latitude: p.latitude!,
                    longitude: p.longitude!,
                    service_radius_km: p.travel_distance_km || 50,
                    services_offered: p.services_offered,
                    years_experience: p.years_experience,
                    is_rbq_verified: p.is_rbq_verified,
                    rbq_number: p.rbq_number,
                    average_rating: p.average_rating || 0,
                    total_reviews: p.total_reviews || 0,
                  }))}
                onRadiusChange={setMapRadius}
                onLocationChange={(lat, lng) => setUserLocation({ lat, lng })}
                defaultRadius={mapRadius}
                height="400px"
              />
            </Suspense>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-72 xl:w-80 flex-shrink-0">
              <Card className="lg:sticky lg:top-24 max-h-[80vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5" />
                      {t('professionals.filters_title')}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedService(SERVICES[0]);
                        setSelectedRegion(REGIONS[0]);
                        setSelectedBudget(BUDGET_RANGES[0]);
                        setSelectedAvailability(AVAILABILITY_OPTIONS[0]);
                        setSelectedResponseTime(RESPONSE_TIME_OPTIONS[0]);
                        setSearchTerm("");
                      }}
                    >
                      {t('professionals.filters.reset')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Service Filter */}
                  <div className="space-y-2">
                    <Label>{t('professionals.filters.all_services')}</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger aria-label={t('professionals.filters.all_services')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICES.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Region Filter */}
                  <div className="space-y-2">
                    <Label>{t('professionals.filters.all_regions')}</Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger aria-label={t('professionals.filters.all_regions')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Budget Filter */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {t('professionals.filters.budget_label')}
                    </Label>
                    <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                      <SelectTrigger aria-label={t('professionals.filters.budget_label')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map((budget) => (
                          <SelectItem key={budget} value={budget}>
                            {budget}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Availability Filter */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('professionals.filters.availability_label')}
                    </Label>
                    <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                      <SelectTrigger aria-label={t('professionals.filters.availability_label')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABILITY_OPTIONS.map((availability) => (
                          <SelectItem key={availability} value={availability}>
                            {availability}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Response Time Filter */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('professionals.filters.response_time_label')}
                    </Label>
                    <Select value={selectedResponseTime} onValueChange={setSelectedResponseTime}>
                      <SelectTrigger aria-label={t('professionals.filters.response_time_label')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESPONSE_TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label>{t('professionals.sort.sort_by')}</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger aria-label={t('professionals.sort.sort_by')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">{t('professionals.sort.recent')}</SelectItem>
                        <SelectItem value="name">{t('professionals.sort.name')}</SelectItem>
                        <SelectItem value="rating">{t('professionals.sort.rating')}</SelectItem>
                        <SelectItem value="proximity">
                          <div className="flex items-center gap-2">
                            <NavigationIcon className="h-4 w-4" />
                            {t('professionals.sort.proximity')}
                            {!userLocation && (
                              <span className="text-xs text-muted-foreground">({t('professionals.sort.location_required')})</span>
                            )}
                          </div>
                        </SelectItem>
                        <SelectItem value="activity">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {t('professionals.sort.activity')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Permission Banner */}
                  {sortBy === 'proximity' && !userLocation && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                      <div className="flex items-start gap-2">
                        <NavigationIcon className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-orange-900">{t('professionals.geolocation.disabled')}</p>
                          <p className="text-orange-700 text-xs mt-1">
                            {t('professionals.geolocation.enable_message')}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={requestUserLocation}
                          >
                            {t('professionals.geolocation.enable')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>

            {/* Results */}
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  {filteredProfessionals.length === 1 
                    ? t('professionals.stats.results_count', { count: filteredProfessionals.length })
                    : t('professionals.stats.results_count_plural', { count: filteredProfessionals.length })
                  }
                </p>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="h-4 bg-muted rounded" />
                          <div className="h-4 bg-muted rounded w-5/6" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredProfessionals.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{t('professionals.no_results.title')}</h3>
                    <p className="text-muted-foreground mb-6">
                      {t('professionals.no_results.description')}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedService(SERVICES[0]);
                        setSelectedRegion(REGIONS[0]);
                        setSelectedBudget(BUDGET_RANGES[0]);
                        setSelectedAvailability(AVAILABILITY_OPTIONS[0]);
                        setSelectedResponseTime(RESPONSE_TIME_OPTIONS[0]);
                        setSearchTerm("");
                      }}
                    >
                      {t('professionals.no_results.reset_button')}
                    </Button>
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
                              {pro.is_rbq_verified ? (
                                <Badge variant="default" className="ml-2 bg-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {t('professionals.card.verified')}
                                </Badge>
                              ) : pro.professional_type === 'trade_professional' ? (
                                <Badge variant="outline" className="ml-2 text-muted-foreground border-border">
                                  Non vérifié
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {t('professionals.card.pending_verification')}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {pro.full_name}
                            </CardDescription>
                          </div>
                          <FavoriteButton
                            professionalId={pro.id}
                            userId={userId}
                            size="icon"
                            variant="ghost"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* RBQ Number */}
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">RBQ:</span>
                          <span className="font-mono font-semibold">{pro.rbq_number}</span>
                        </div>

                        {/* Location with Distance */}
                        {(pro.city || pro.region || pro.distance !== undefined) && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <span>
                                {[pro.city, pro.region].filter(Boolean).join(', ')}
                              </span>
                              {pro.distance !== undefined && (
                                <Badge variant="outline" className="text-xs">
                                  <NavigationIcon className="h-3 w-3 mr-1" />
                                  {formatDistance(pro.distance)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Experience and Activity */}
                        <div className="flex items-center gap-4">
                          {pro.years_experience && (
                            <div className="text-sm">
                              <span className="font-medium">{pro.years_experience}</span>
                              <span className="text-muted-foreground"> {t('professionals.card.years_exp')}</span>
                            </div>
                          )}
                          {sortBy === 'activity' && pro.activity_score !== null && pro.activity_score > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {t('professionals.card.activity_score')}: {pro.activity_score.toFixed(0)}/100
                            </Badge>
                          )}
                        </div>

                        <Separator />

                        {/* Budget / Hourly Rate */}
                        {(pro.hourly_rate_min || pro.hourly_rate_max) && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              {pro.hourly_rate_min && pro.hourly_rate_max
                                ? `${pro.hourly_rate_min} - ${pro.hourly_rate_max} ${t('professionals.card.hourly_rate')}`
                                : pro.hourly_rate_min
                                ? `${t('projects.card.from')} ${pro.hourly_rate_min} ${t('professionals.card.hourly_rate')}`
                                : `${t('projects.card.up_to')} ${pro.hourly_rate_max} ${t('professionals.card.hourly_rate')}`}
                            </span>
                          </div>
                        )}

                        {/* Availability */}
                        {pro.availability_status && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={
                              pro.availability_status === 'available' 
                                ? 'text-green-600 font-medium' 
                                : pro.availability_status === 'busy'
                                ? 'text-orange-600'
                                : 'text-red-600'
                            }>
                              {pro.availability_status === 'available' 
                                ? t('professionals.card.available')
                                : pro.availability_status === 'busy'
                                ? t('professionals.card.busy')
                                : t('professionals.card.unavailable')}
                            </span>
                            {pro.available_from && new Date(pro.available_from) > new Date() && (
                              <span className="text-muted-foreground text-xs">
                                ({t('professionals.card.available_from')} {new Date(pro.available_from).toLocaleDateString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA')})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Response Time */}
                        {pro.response_time_hours && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t('professionals.card.response_time', { hours: pro.response_time_hours })}
                            </span>
                          </div>
                        )}

                        <Separator />

                        {/* Services */}
                        {pro.services_offered && (
                          <div>
                            <p className="text-sm font-medium mb-2">{t('professionals.card.services_offered')}</p>
                            <div className="flex flex-wrap gap-2">
                              {getServiceBadges(pro.services_offered).map((service, index) => (
                                <Badge key={index} variant="secondary">
                                  {service}
                                </Badge>
                              ))}
                              {pro.services_offered.split(',').length > 3 && (
                                <Badge variant="outline">
                                  +{pro.services_offered.split(',').length - 3} {t('professionals.card.others')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Rating */}
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
                            ({pro.average_rating.toFixed(1)} • {pro.total_reviews} {t('professionals.card.reviews')})
                          </span>
                        </div>

                        {/* Projects count */}
                        {pro.total_projects > 0 && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{pro.total_projects}</span> {pro.total_projects === 1 ? t('professionals.card.project') : t('professionals.card.projects')}
                          </div>
                        )}

                        <Separator />

                        {/* Contact Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            className="flex-1 min-w-[140px]"
                            onClick={() => navigate(`/professional/${pro.id}`)}
                          >
                            {t('professionals.card.view_profile')}
                          </Button>
                          {userType === 'client' && (
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setInviteTarget({
                                  id: pro.id,
                                  name: pro.company_name || pro.full_name,
                                })
                              }
                              title={t('professionals.card.invite', { defaultValue: 'Inviter à soumissionner' })}
                            >
                              <Award className="h-4 w-4 mr-1.5" />
                              {t('professionals.card.invite', { defaultValue: 'Inviter' })}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleStartConversation(pro.id)}
                            title={t('professionals.card.contact')}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Phone className="h-4 w-4" />
                          </Button>
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
          open={!!inviteTarget}
          onOpenChange={(open) => !open && setInviteTarget(null)}
          professionalId={inviteTarget.id}
          professionalName={inviteTarget.name}
        />
      )}
    </div>
  );
};

export default Professionals;

