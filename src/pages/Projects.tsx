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
  Calendar,
  MapPin,
  Search,
  SlidersHorizontal,
  DollarSign,
  Clock,
  User,
  Briefcase,
  Eye,
  MessageSquare,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  deadline: string | null;
  client_id: string;
  created_at: string;
  updated_at: string;
  proposals_count: number;
  views_count: number;
}

const CATEGORIES = [
  "Toutes les catégories",
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
  "Cuisine et salle de bain",
  "Extension et agrandissement",
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

const BUDGETS = [
  "Tous les budgets",
  "Moins de 5 000 $",
  "5 000 $ - 10 000 $",
  "10 000 $ - 25 000 $",
  "25 000 $ - 50 000 $",
  "50 000 $ - 100 000 $",
  "Plus de 100 000 $",
];

const STATUS_LABELS = {
  open: "Ouvert",
  in_progress: "En cours",
  completed: "Complété",
  cancelled: "Annulé",
};

const STATUS_COLORS = {
  open: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [selectedRegion, setSelectedRegion] = useState("Toutes les régions");
  const [selectedBudget, setSelectedBudget] = useState("Tous les budgets");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterAndSortProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, searchTerm, selectedCategory, selectedRegion, selectedBudget, sortBy]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProjects = () => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "Toutes les catégories") {
      filtered = filtered.filter((project) =>
        project.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Region filter
    if (selectedRegion !== "Toutes les régions") {
      filtered = filtered.filter((project) =>
        project.city?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
        project.region?.toLowerCase().includes(selectedRegion.toLowerCase())
      );
    }

    // Budget filter
    if (selectedBudget !== "Tous les budgets") {
      filtered = filtered.filter((project) => {
        const min = project.budget_min || 0;
        const max = project.budget_max || Infinity;
        
        switch (selectedBudget) {
          case "Moins de 5 000 $":
            return max < 5000;
          case "5 000 $ - 10 000 $":
            return min >= 5000 && max <= 10000;
          case "10 000 $ - 25 000 $":
            return min >= 10000 && max <= 25000;
          case "25 000 $ - 50 000 $":
            return min >= 25000 && max <= 50000;
          case "50 000 $ - 100 000 $":
            return min >= 50000 && max <= 100000;
          case "Plus de 100 000 $":
            return min > 100000;
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
      case "budget_low":
        filtered.sort((a, b) => (a.budget_min || 0) - (b.budget_min || 0));
        break;
      case "budget_high":
        filtered.sort((a, b) => (b.budget_max || 0) - (a.budget_max || 0));
        break;
      case "proposals":
        filtered.sort((a, b) => b.proposals_count - a.proposals_count);
        break;
    }

    setFilteredProjects(filtered);
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "Budget à discuter";
    if (min && max) return `${min.toLocaleString()} $ - ${max.toLocaleString()} $`;
    if (min) return `À partir de ${min.toLocaleString()} $`;
    if (max) return `Jusqu'à ${max.toLocaleString()} $`;
    return "Budget à discuter";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return date.toLocaleDateString('fr-CA');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold">
              Découvrez les projets disponibles
            </h1>
            <p className="text-xl text-muted-foreground">
              Trouvez des opportunités de projets de construction et rénovation près de chez vous
            </p>
            
            {/* Main Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un projet par titre, description ou catégorie..."
                className="pl-12 pr-4 h-14 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Projets actifs</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {projects.reduce((acc, p) => acc + p.proposals_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Propositions envoyées</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.proposals_count, 0) / projects.length) : 0}
                </div>
                <div className="text-sm text-muted-foreground">Propositions/projet</div>
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
                        setSelectedCategory("Toutes les catégories");
                        setSelectedRegion("Toutes les régions");
                        setSelectedBudget("Tous les budgets");
                        setSearchTerm("");
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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

                  {/* Budget Filter */}
                  <div className="space-y-2">
                    <Label>Budget</Label>
                    <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGETS.map((budget) => (
                          <SelectItem key={budget} value={budget}>
                            {budget}
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
                        <SelectItem value="budget_high">Budget élevé</SelectItem>
                        <SelectItem value="budget_low">Budget faible</SelectItem>
                        <SelectItem value="proposals">Plus de propositions</SelectItem>
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
                  {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''} trouvé{filteredProjects.length !== 1 ? 's' : ''}
                </p>
              </div>

              {loading ? (
                <div className="grid gap-6">
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
              ) : filteredProjects.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun projet trouvé</h3>
                    <p className="text-muted-foreground mb-6">
                      Essayez de modifier vos critères de recherche
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory("Toutes les catégories");
                        setSelectedRegion("Toutes les régions");
                        setSelectedBudget("Tous les budgets");
                        setSearchTerm("");
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{project.title}</CardTitle>
                              <Badge className={STATUS_COLORS[project.status]}>
                                {STATUS_LABELS[project.status]}
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Publié {formatDate(project.created_at)}
                              </span>
                              {(project.city || project.region) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {[project.city, project.region].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Category */}
                        {project.category && (
                          <Badge variant="secondary">
                            {project.category}
                          </Badge>
                        )}

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {project.description}
                        </p>

                        {/* Budget */}
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span>{formatBudget(project.budget_min, project.budget_max)}</span>
                        </div>

                        {/* Deadline */}
                        {project.deadline && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Échéance: {new Date(project.deadline).toLocaleDateString('fr-CA')}
                            </span>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {project.proposals_count} proposition{project.proposals_count !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {project.views_count} vue{project.views_count !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => navigate(`/project/${project.id}`)}>
                            Voir les détails
                          </Button>
                          <Button variant="outline">
                            Soumettre une proposition
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

export default Projects;

