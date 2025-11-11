import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const STATUS_COLORS = {
  open: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const Projects = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const CATEGORIES = [
    t('projects.filters.all_categories'),
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
  ];

  const REGIONS = [
    t('projects.filters.all_regions'),
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

  const BUDGETS = [
    t('projects.filters.all_budgets'),
    t('projects.filters.budgets.under_5k'),
    t('projects.filters.budgets.5k_10k'),
    t('projects.filters.budgets.10k_25k'),
    t('projects.filters.budgets.25k_50k'),
    t('projects.filters.budgets.50k_100k'),
    t('projects.filters.budgets.over_100k'),
  ];

  const STATUS_LABELS = {
    open: t('dashboard.projects.status.open'),
    in_progress: t('dashboard.projects.status.in_progress'),
    completed: t('dashboard.projects.status.completed'),
    cancelled: t('dashboard.projects.status.cancelled'),
  };
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [selectedBudget, setSelectedBudget] = useState(BUDGETS[0]);
  const [sortBy, setSortBy] = useState("recent");
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfessional, setIsProfessional] = useState<boolean>(false);
  const [proposalFor, setProposalFor] = useState<string | null>(null);
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalBudget, setProposalBudget] = useState("");
  const [proposalDuration, setProposalDuration] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_type,is_rbq_verified')
          .eq('id', session.user.id)
          .single();
        setIsProfessional(prof?.user_type === 'professional' && prof?.is_rbq_verified === true);
      }
      fetchProjects();
    })();
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
    if (!min && !max) return t('projects.card.to_discuss');
    if (min && max) return `${min.toLocaleString()} $ - ${max.toLocaleString()} $`;
    if (min) return `${t('new_project.form.from')} ${min.toLocaleString()} $`;
    if (max) return `${t('new_project.form.up_to')} ${max.toLocaleString()} $`;
    return t('projects.card.to_discuss');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('new_project.form.today');
    if (diffDays === 1) return t('new_project.form.yesterday');
    if (diffDays < 7) return t('new_project.form.days_ago', { count: diffDays });
    if (diffDays < 30) return t('new_project.form.weeks_ago', { count: Math.floor(diffDays / 7) });
    return date.toLocaleDateString('fr-CA');
  };

  const submitProposal = async () => {
    if (!userId || !proposalFor || !proposalMessage) return;
    try {
      const { error } = await supabase.from('proposals').insert({
        project_id: proposalFor,
        professional_id: userId,
        message: proposalMessage,
        estimated_budget: proposalBudget ? Number(proposalBudget) : null,
        estimated_duration_days: proposalDuration ? Number(proposalDuration) : null,
      });
      if (error) throw error;
      setProposalFor(null);
      setProposalMessage("");
      setProposalBudget("");
      setProposalDuration("");
    } catch (e) {
      console.error('Error submitting proposal:', e);
    }
  };

  const contactClient = async (clientId: string) => {
    if (!userId) { navigate('/auth?mode=login'); return; }
    try {
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        user_1_id: userId,
        user_2_id: clientId,
      });
      if (error) throw error;
      if (conversationId) navigate(`/messages?conversation=${conversationId}`);
    } catch (e) {
      console.error('Error starting conversation:', e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold">
              {t('projects.hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('projects.hero.subtitle')}
            </p>
            
            {/* Main Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('projects.search')}
                className="pl-12 pr-4 h-14 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{projects.length}</div>
                <div className="text-sm text-muted-foreground">{t('projects.stats.active_projects')}</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {projects.reduce((acc, p) => acc + p.proposals_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">{t('projects.stats.total_proposals')}</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.proposals_count, 0) / projects.length) : 0}
                </div>
                <div className="text-sm text-muted-foreground">{t('projects.stats.proposals_per_project')}</div>
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
                        setSelectedCategory(CATEGORIES[0]);
                        setSelectedRegion(REGIONS[0]);
                        setSelectedBudget(BUDGETS[0]);
                        setSearchTerm("");
                      }}
                    >
                      {t('professionals.filters.reset')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label>{t('new_project.form.category')}</Label>
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
                    <Label>{t('new_project.form.region')}</Label>
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
                    <Label>{t('new_project.form.budget')}</Label>
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
                    <Label>{t('professionals.sort.sort_by')}</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">{t('projects.sort.recent')}</SelectItem>
                        <SelectItem value="budget_high">{t('projects.sort.budget_desc')}</SelectItem>
                        <SelectItem value="budget_low">{t('projects.sort.budget_asc')}</SelectItem>
                        <SelectItem value="proposals">{t('projects.sort.proposals')}</SelectItem>
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
                  {filteredProjects.length === 1 
                    ? t('projects.stats.results_count', { count: filteredProjects.length })
                    : t('projects.stats.results_count_plural', { count: filteredProjects.length })
                  }
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
                    <h3 className="text-xl font-semibold mb-2">{t('projects.no_results.title')}</h3>
                    <p className="text-muted-foreground mb-6">
                      {t('projects.no_results.description')}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory(CATEGORIES[0]);
                        setSelectedRegion(REGIONS[0]);
                        setSelectedBudget(BUDGETS[0]);
                        setSearchTerm("");
                      }}
                    >
                      {t('projects.no_results.reset')}
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
                                {t('projects.card.published')} {formatDate(project.created_at)}
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
                              {t('projects.card.deadline')}: {new Date(project.deadline).toLocaleDateString('fr-CA')}
                            </span>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {project.proposals_count} {t('projects.card.proposals')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {project.views_count} {t('projects.card.views')}
                          </span>
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button className="flex-1" onClick={() => navigate(`/project/${project.id}`)}>
                            {t('projects.card.view_details')}
                          </Button>
                          {isProfessional && (
                            <Button variant="outline" onClick={() => setProposalFor(project.id)}>
                              {t('projects.card.submit_proposal')}
                            </Button>
                          )}
                        </div>
                        {proposalFor === project.id && (
                          <div className="mt-3 border rounded-lg p-3 space-y-3">
                            <div>
                              <Label>{t('proposals.form.message')}</Label>
                              <Textarea rows={3} value={proposalMessage} onChange={e => setProposalMessage(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>{t('proposals.form.budget')}</Label>
                                <Input type="number" value={proposalBudget} onChange={e => setProposalBudget(e.target.value)} />
                              </div>
                              <div>
                                <Label>{t('proposals.form.duration')}</Label>
                                <Input type="number" value={proposalDuration} onChange={e => setProposalDuration(e.target.value)} />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setProposalFor(null)}>{t('proposals.form.cancel')}</Button>
                              <Button onClick={submitProposal} disabled={!proposalMessage}>{t('proposals.form.send')}</Button>
                            </div>
                          </div>
                        )}
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


/* eslint-disable no-irregular-whitespace */


