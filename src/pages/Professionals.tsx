import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
}

const SERVICES = [
  "Tous les services",
  "Rénovation résidentielle",
  "Construction neuve",
  "Toiture",
  "Plomberie",
  "Électricité",
  "Menuiserie",
  "Maçonnerie",
  "Peinture",
  "Isolation",
  "Aménagement paysager",
];

const REGIONS = [
  "Toutes les régions",
  "Montréal",
  "Québec",
  "Laval",
  "Gatineau",
  "Longueuil",
  "Sherbrooke",
  "Saguenay",
  "Trois-Rivières",
  "Terrebonne",
  "Saint-Jean-sur-Richelieu",
];

const Professionals = () => {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("Tous les services");
  const [selectedRegion, setSelectedRegion] = useState("Toutes les régions");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    filterAndSortProfessionals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionals, searchTerm, selectedService, selectedRegion, sortBy]);

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
              Trouvez votre entrepreneur qualifié
            </h1>
            <p className="text-xl text-muted-foreground">
              Découvrez des professionnels vérifiés RBQ pour tous vos projets de construction et rénovation
            </p>
            
            {/* Main Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par nom, entreprise ou service..."
                className="pl-12 pr-4 h-14 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{professionals.length}</div>
                <div className="text-sm text-muted-foreground">Professionnels vérifiés</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Certifiés RBQ</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">4.8/5</div>
                <div className="text-sm text-muted-foreground">Note moyenne</div>
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
                      Filtres
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedService("Tous les services");
                        setSelectedRegion("Toutes les régions");
                        setSearchTerm("");
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Service Filter */}
                  <div className="space-y-2">
                    <Label>Type de service</Label>
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
                    <Label>Région</Label>
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

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label>Trier par</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Plus récents</SelectItem>
                        <SelectItem value="name">Nom (A-Z)</SelectItem>
                        <SelectItem value="rating">Meilleures notes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Results */}
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  {filteredProfessionals.length} professionnel{filteredProfessionals.length !== 1 ? 's' : ''} trouvé{filteredProfessionals.length !== 1 ? 's' : ''}
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
                    <h3 className="text-xl font-semibold mb-2">Aucun professionnel trouvé</h3>
                    <p className="text-muted-foreground mb-6">
                      Essayez de modifier vos critères de recherche
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedService("Tous les services");
                        setSelectedRegion("Toutes les régions");
                        setSearchTerm("");
                      }}
                    >
                      Réinitialiser les filtres
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
                                  Vérifié
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {pro.full_name}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* RBQ Number */}
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">RBQ:</span>
                          <span className="font-mono font-semibold">{pro.rbq_number}</span>
                        </div>

                        {/* Location */}
                        {(pro.city || pro.region) && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {[pro.city, pro.region].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Experience */}
                        {pro.years_experience && (
                          <div className="text-sm">
                            <span className="font-medium">{pro.years_experience} ans</span>
                            <span className="text-muted-foreground"> d'expérience</span>
                          </div>
                        )}

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
                            ({pro.average_rating.toFixed(1)} • {pro.total_reviews} avis)
                          </span>
                        </div>

                        {/* Projects count */}
                        {pro.total_projects > 0 && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{pro.total_projects}</span> projet{pro.total_projects > 1 ? 's' : ''} réalisé{pro.total_projects > 1 ? 's' : ''}
                          </div>
                        )}

                        <Separator />

                        {/* Contact Actions */}
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => navigate(`/professional/${pro.id}`)}>
                            Voir le profil
                          </Button>
                          <Button variant="outline" size="icon">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Mail className="h-4 w-4" />
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

