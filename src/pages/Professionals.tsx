import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

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
}

const Professionals = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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

  useEffect(() => {
    fetchProfessionals();
    requestUserLocation();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'professional')
        .eq('is_rbq_verified', true)
        .order('created_at', { ascending: false });

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
    if (selectedService !== "Tous les services") {
      filtered = filtered.filter((pro) =>
        pro.services_offered?.toLowerCase().includes(selectedService.toLowerCase())
      );
    }

    // Region filter
    if (selectedRegion !== "Toutes les régions") {
      filtered = filtered.filter((pro) =>
        pro.city?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
        pro.region?.toLowerCase().includes(selectedRegion.toLowerCase())
      );
    }

    // Budget filter (hourly rate)
    if (selectedBudget !== "Tous les budgets") {
      filtered = filtered.filter((pro) => {
        if (!pro.hourly_rate_min && !pro.hourly_rate_max) return false;
        
        const minRate = pro.hourly_rate_min || 0;
        const maxRate = pro.hourly_rate_max || 9999;
        
        switch (selectedBudget) {
          case "Moins de 50 $/h":
            return minRate < 50;
          case "50 - 75 $/h":
            return (minRate >= 50 && minRate <= 75) || (maxRate >= 50 && maxRate <= 75);
          case "75 - 100 $/h":
            return (minRate >= 75 && minRate <= 100) || (maxRate >= 75 && maxRate <= 100);
          case "100 - 150 $/h":
            return (minRate >= 100 && minRate <= 150) || (maxRate >= 100 && maxRate <= 150);
          case "150 $/h et plus":
            return maxRate >= 150;
          default:
            return true;
        }
      });
    }

    // Availability filter
    if (selectedAvailability !== "Toutes disponibilités") {
      filtered = filtered.filter((pro) => {
        const today = new Date();
        const availableFrom = pro.available_from ? new Date(pro.available_from) : null;
        
        switch (selectedAvailability) {
          case "Disponible immédiatement":
            return pro.availability_status === 'available' && (!availableFrom || availableFrom <= today);
          case "Disponible dans 2 semaines": {
            const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
            return pro.availability_status !== 'unavailable' && (!availableFrom || availableFrom <= twoWeeksFromNow);
          }
          case "Disponible dans 1 mois": {
            const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            return pro.availability_status !== 'unavailable' && (!availableFrom || availableFrom <= oneMonthFromNow);
          }
          case "Occupé actuellement":
            return pro.availability_status === 'busy';
          default:
            return true;
        }
      });
    }

    // Response time filter
    if (selectedResponseTime !== "Tous les temps de réponse") {
      filtered = filtered.filter((pro) => {
        const responseTime = pro.response_time_hours || 999;
        
        switch (selectedResponseTime) {
          case "Moins de 6 heures":
            return responseTime <= 6;
          case "Moins de 24 heures":
            return responseTime <= 24;
          case "Moins de 48 heures":
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

  const getServiceBadges = (services: string | null) => {
    if (!services) return [];
    return services
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold">
              {t('professionals.hero_title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('professionals.hero_subtitle')}
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

      {/* Main Content */}
      <section className="flex-1 py-12">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <Card className="sticky top-24">
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                            <CardTitle className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              {pro.company_name}
                              {pro.is_rbq_verified && (
                                <Badge variant="default" className="ml-2">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {t('professionals.card.verified')}
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
                                ? `${pro.hourly_rate_min} - ${pro.hourly_rate_max} $/h`
                                : pro.hourly_rate_min
                                ? `À partir de ${pro.hourly_rate_min} $/h`
                                : `Jusqu'à ${pro.hourly_rate_max} $/h`}
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
                                ? 'Disponible' 
                                : pro.availability_status === 'busy'
                                ? 'Occupé'
                                : 'Non disponible'}
                            </span>
                            {pro.available_from && new Date(pro.available_from) > new Date() && (
                              <span className="text-muted-foreground text-xs">
                                (dès le {new Date(pro.available_from).toLocaleDateString('fr-CA')})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Response Time */}
                        {pro.response_time_hours && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Répond en ~{pro.response_time_hours}h
                            </span>
                          </div>
                        )}

                        <Separator />

                        {/* Services */}
                        {pro.services_offered && (
                          <div>
                            <p className="text-sm font-medium mb-2">Services offerts:</p>
                            <div className="flex flex-wrap gap-2">
                              {getServiceBadges(pro.services_offered).map((service, index) => (
                                <Badge key={index} variant="secondary">
                                  {service}
                                </Badge>
                              ))}
                              {pro.services_offered.split(',').length > 3 && (
                                <Badge variant="outline">
                                  +{pro.services_offered.split(',').length - 3} autres
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
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1" 
                            onClick={() => {
                              alert(t('professionals.card.profile_in_dev'));
                            }}
                          >
                            {t('professionals.card.view_profile')}
                          </Button>
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

      <Footer />
    </div>
  );
};

export default Professionals;

