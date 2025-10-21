import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProjectList from "@/components/dashboard/ProjectList";
import ActivityTimeline, { ActivityItem } from "@/components/dashboard/ActivityTimeline";
import FavoritesList from "@/components/dashboard/FavoritesList";
import CompareDialog from "@/components/dashboard/CompareDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { exportProjectsToPDF, exportActivityToPDF } from "@/lib/pdf-export";
import {
  LayoutDashboard,
  Briefcase,
  Star,
  MessageSquare,
  FileText,
  Heart,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Receipt,
  Activity,
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  user_type: string;
}

interface FavoriteProfessional {
  id: string;
  professional_id: string;
  full_name: string;
  company_name: string;
  rbq_number: string;
  services_offered: string | null;
  city: string | null;
  region: string | null;
  years_experience: number | null;
  average_rating: number;
  total_reviews: number;
  total_projects: number;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  availability_status: 'available' | 'busy' | 'unavailable' | null;
  response_time_hours: number | null;
  activity_score: number | null;
  notes: string | null;
  priority: number;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  region: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  proposals_count: number;
  views_count: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteProfessional[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [professionalsToCompare, setProfessionalsToCompare] = useState<FavoriteProfessional[]>([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalProjects: 0,
    proposalsReceived: 0,
    favoritesPros: 0,
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }

      setUser(session.user);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(profileData);

      // Check if user is a client
      if (profileData.user_type !== 'client') {
        toast({
          variant: "destructive",
          title: "Accès refusé",
          description: "Cette page est réservée aux clients",
        });
        navigate("/");
        return;
      }

      // Fetch stats
      await fetchStats(session.user.id);
      await fetchFavorites(session.user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate("/auth?mode=login");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      setLoadingProjects(true);
      
      // Fetch all projects with details
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);

      const activeProjects = projectsData?.filter(p => p.status === 'open' || p.status === 'in_progress').length || 0;
      const totalProjects = projectsData?.length || 0;

      // Count proposals
      const { count: proposalsCount } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .in('project_id', projectsData?.map(p => p.id) || []);

      // Get favorites count (if table exists)
      let favoritesCount = 0;
      try {
        const { count, error } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', userId);
        
        if (!error) {
          favoritesCount = count || 0;
        }
      } catch (error) {
        console.warn('Favorites table not yet created');
      }

      setStats({
        activeProjects,
        totalProjects,
        proposalsReceived: proposalsCount || 0,
        favoritesPros: favoritesCount,
      });

      // Generate activities from projects
      await generateActivities(projectsData || [], userId);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchFavorites = async (userId: string) => {
    try {
      setLoadingFavorites(true);

      const { data, error } = await supabase
        .from('favorites_with_details')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      // If the view doesn't exist yet (migration not applied), silently fail
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Favorites table not yet created. Please apply migration 006_add_favorites.sql');
          setFavorites([]);
          return;
        }
        throw error;
      }

      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      // Don't show error toast if table doesn't exist yet
      const errorMessage = error instanceof Error ? error.message : '';
      if (!errorMessage.includes('does not exist')) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Erreur lors du chargement des favoris",
        });
      }
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      toast({
        title: "Favori retiré",
        description: "Le professionnel a été retiré de votre shortlist",
      });

      // Refresh favorites and stats
      if (user) {
        await fetchFavorites(user.id);
        await fetchStats(user.id);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la suppression du favori",
      });
    }
  };

  const handleCompare = async (selectedIds: string[]) => {
    try {
      // Get full details of selected professionals
      const professionals = favorites.filter(fav => selectedIds.includes(fav.professional_id));
      setProfessionalsToCompare(professionals);
      setCompareDialogOpen(true);
    } catch (error) {
      console.error('Error preparing comparison:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la préparation de la comparaison",
      });
    }
  };

  const generateActivities = async (projectsData: Project[], userId: string) => {
    try {
      setLoadingActivities(true);
      const activityList: ActivityItem[] = [];

      // Add project creation activities
      projectsData.forEach((project) => {
        activityList.push({
          id: `project_created_${project.id}`,
          type: 'project_created',
          title: 'Projet créé',
          description: `Vous avez créé le projet "${project.title}"`,
          timestamp: project.created_at,
          metadata: {
            projectTitle: project.title,
          },
        });

        // Add project updates if updated_at differs from created_at
        if (project.updated_at !== project.created_at) {
          activityList.push({
            id: `project_updated_${project.id}`,
            type: 'project_updated',
            title: 'Projet mis à jour',
            description: `Le projet "${project.title}" a été modifié`,
            timestamp: project.updated_at,
            metadata: {
              projectTitle: project.title,
            },
          });
        }
      });

      // Fetch proposals and add to activities
      const projectIds = projectsData.map(p => p.id);
      if (projectIds.length > 0) {
        const { data: proposals } = await supabase
          .from('proposals')
          .select('*, profiles:professional_id(full_name), projects:project_id(title)')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        proposals?.forEach((proposal: {
          id: string;
          created_at: string;
          estimated_budget?: number;
          profiles?: { full_name?: string };
          projects?: { title?: string };
        }) => {
          activityList.push({
            id: `proposal_${proposal.id}`,
            type: 'proposal_received',
            title: 'Nouvelle proposition reçue',
            description: `${proposal.profiles?.full_name || 'Un professionnel'} vous a envoyé une proposition`,
            timestamp: proposal.created_at,
            metadata: {
              projectTitle: proposal.projects?.title,
              professionalName: proposal.profiles?.full_name,
              amount: proposal.estimated_budget,
            },
          });
        });
      }

      // Sort activities by timestamp (most recent first)
      activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(activityList);
    } catch (error) {
      console.error('Error generating activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès",
      });

      // Refresh projects
      if (user) {
        await fetchStats(user.id);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le projet",
      });
    }
  };

  const handleEditProject = (projectId: string) => {
    // Navigate to edit page (to be implemented)
    toast({
      title: "Fonctionnalité à venir",
      description: "L'édition de projet sera bientôt disponible",
    });
  };

  const handleViewProject = (projectId: string) => {
    // Navigate to project details (to be implemented)
    navigate(`/projects`);
  };

  const handleExportProjectsPDF = () => {
    if (projects.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun projet",
        description: "Vous n'avez aucun projet à exporter",
      });
      return;
    }

    exportProjectsToPDF(projects, profile);
    toast({
      title: "Export en cours",
      description: "Votre PDF est en cours de génération",
    });
  };

  const handleExportActivityPDF = () => {
    if (activities.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucune activité",
        description: "Vous n'avez aucune activité à exporter",
      });
      return;
    }

    exportActivityToPDF(activities, profile);
    toast({
      title: "Export en cours",
      description: "Votre PDF est en cours de génération",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navigation />
      
      <div className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Bonjour, {profile?.full_name || 'Client'} 👋
            </h1>
            <p className="text-muted-foreground">
              Bienvenue sur votre tableau de bord BâtirNet
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeProjects}</div>
                <p className="text-xs text-muted-foreground">
                  Sur {stats.totalProjects} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Propositions reçues</CardTitle>
                <MessageSquare className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.proposalsReceived}</div>
                <p className="text-xs text-muted-foreground">
                  En attente de révision
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Professionnels favoris</CardTitle>
                <Heart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.favoritesPros}</div>
                <p className="text-xs text-muted-foreground">
                  Dans votre shortlist
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Contrats actifs</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  En cours d'exécution
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
              <TabsTrigger value="overview">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Accueil</span>
              </TabsTrigger>
              <TabsTrigger value="projects">
                <Briefcase className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Projets</span>
                <span className="sm:hidden">Projets</span>
              </TabsTrigger>
              <TabsTrigger value="proposals">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Propositions</span>
                <span className="sm:hidden">Offres</span>
              </TabsTrigger>
              <TabsTrigger value="contracts" className="hidden lg:flex">
                <FileText className="h-4 w-4 mr-2" />
                Contrats
              </TabsTrigger>
              <TabsTrigger value="invoices" className="hidden lg:flex">
                <Receipt className="h-4 w-4 mr-2" />
                Factures
              </TabsTrigger>
              <TabsTrigger value="activity" className="hidden lg:flex">
                <Activity className="h-4 w-4 mr-2" />
                Activité
              </TabsTrigger>
              <TabsTrigger value="favorites" className="hidden lg:flex">
                <Heart className="h-4 w-4 mr-2" />
                Favoris
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                    <CardDescription>
                      Démarrez un nouveau projet ou explorez les professionnels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      size="lg"
                      onClick={() => navigate("/dashboard/new-project")}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Créer un nouveau projet
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="lg"
                      onClick={() => navigate("/professionals")}
                    >
                      <Star className="mr-2 h-5 w-5" />
                      Trouver un professionnel
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="lg"
                      onClick={() => navigate("/projects")}
                    >
                      <Briefcase className="mr-2 h-5 w-5" />
                      Explorer les projets
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Activité récente</CardTitle>
                    <CardDescription>
                      Dernières mises à jour sur vos projets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.totalProjects === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Aucune activité récente</p>
                        <p className="text-sm mt-1">Créez votre premier projet pour commencer</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Compte créé avec succès</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Getting Started Guide */}
              {stats.totalProjects === 0 && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Guide de démarrage
                    </CardTitle>
                    <CardDescription>
                      Suivez ces étapes pour démarrer votre premier projet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <span className="text-sm font-semibold text-primary">1</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">Créez votre projet</h4>
                          <p className="text-sm text-muted-foreground">
                            Décrivez votre projet, budget et délais
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <span className="text-sm font-semibold text-primary">2</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">Recevez des propositions</h4>
                          <p className="text-sm text-muted-foreground">
                            Les professionnels qualifiés vous enverront leurs offres
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <span className="text-sm font-semibold text-primary">3</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">Comparez et choisissez</h4>
                          <p className="text-sm text-muted-foreground">
                            Évaluez les offres et sélectionnez le meilleur professionnel
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <span className="text-sm font-semibold text-primary">4</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">Signez et démarrez</h4>
                          <p className="text-sm text-muted-foreground">
                            Formalisez l'accord et suivez l'avancement
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mes Projets</CardTitle>
                      <CardDescription>
                        Gérez tous vos projets de construction et rénovation
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {projects.length > 0 && (
                        <Button variant="outline" size="sm" onClick={handleExportProjectsPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      )}
                      <Button onClick={() => navigate("/dashboard/new-project")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-4">Chargement...</p>
                    </div>
                  ) : stats.totalProjects === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucun projet</h3>
                      <p className="text-muted-foreground mb-6">
                        Créez votre premier projet pour commencer
                      </p>
                      <Button onClick={() => navigate("/dashboard/new-project")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer un projet
                      </Button>
                    </div>
                  ) : (
                    <ProjectList
                      projects={projects}
                      onDelete={handleDeleteProject}
                      onEdit={handleEditProject}
                      onView={handleViewProject}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Proposals Tab */}
            <TabsContent value="proposals">
              <Card>
                <CardHeader>
                  <CardTitle>Propositions reçues</CardTitle>
                  <CardDescription>
                    Consultez toutes les propositions des professionnels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Aucune proposition pour le moment
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contracts Tab */}
            <TabsContent value="contracts">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mes Contrats</CardTitle>
                      <CardDescription>
                        Gérez vos contrats avec les professionnels
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Aucun contrat</h3>
                    <p className="text-muted-foreground mb-4">
                      Les contrats signés avec les professionnels apparaîtront ici
                    </p>
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-left max-w-md mx-auto">
                      <p className="font-semibold text-blue-900 mb-2">🚀 Fonctionnalité à venir</p>
                      <ul className="text-blue-800 space-y-1 list-disc list-inside">
                        <li>Signature électronique des contrats</li>
                        <li>Modèles de contrats personnalisables</li>
                        <li>Suivi des jalons et paiements</li>
                        <li>Archivage sécurisé des documents</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mes Factures</CardTitle>
                      <CardDescription>
                        Consultez et téléchargez vos factures
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
                    <p className="text-muted-foreground mb-4">
                      Vos factures de paiements et transactions apparaîtront ici
                    </p>
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-left max-w-md mx-auto">
                      <p className="font-semibold text-green-900 mb-2">💳 Fonctionnalité à venir</p>
                      <ul className="text-green-800 space-y-1 list-disc list-inside">
                        <li>Facturation automatique par jalon</li>
                        <li>Export PDF des factures</li>
                        <li>Historique des paiements</li>
                        <li>Reçus fiscaux disponibles</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Historique d'activité</CardTitle>
                      <CardDescription>
                        Toutes vos actions et interactions sur la plateforme
                      </CardDescription>
                    </div>
                    {activities.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleExportActivityPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ActivityTimeline activities={activities} loading={loadingActivities} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle>Professionnels favoris</CardTitle>
                  <CardDescription>
                    Votre shortlist de professionnels sélectionnés pour comparaison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FavoritesList
                    favorites={favorites}
                    loading={loadingFavorites}
                    onRemove={handleRemoveFavorite}
                    onCompare={handleCompare}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />

      {/* Compare Dialog */}
      <CompareDialog
        open={compareDialogOpen}
        onOpenChange={setCompareDialogOpen}
        professionals={professionalsToCompare}
      />
    </div>
  );
};

export default Dashboard;

