import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      console.error('Error checking user:', error);
      navigate("/auth?mode=login");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      // Count projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status')
        .eq('client_id', userId);

      const activeProjects = projects?.filter(p => p.status === 'open' || p.status === 'in_progress').length || 0;
      const totalProjects = projects?.length || 0;

      // Count proposals (would need to join with projects)
      const { count: proposalsCount } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .in('project_id', projects?.map(p => p.id) || []);

      setStats({
        activeProjects,
        totalProjects,
        proposalsReceived: proposalsCount || 0,
        favoritesPros: 0, // Will implement favorites later
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
            <TabsList>
              <TabsTrigger value="overview">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="projects">
                <Briefcase className="h-4 w-4 mr-2" />
                Mes Projets
              </TabsTrigger>
              <TabsTrigger value="proposals">
                <MessageSquare className="h-4 w-4 mr-2" />
                Propositions
              </TabsTrigger>
              <TabsTrigger value="favorites">
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
                    <Button onClick={() => navigate("/dashboard/new-project")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nouveau projet
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.totalProjects === 0 ? (
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
                    <p className="text-muted-foreground">Liste des projets à venir...</p>
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

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle>Professionnels favoris</CardTitle>
                  <CardDescription>
                    Votre shortlist de professionnels sélectionnés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Aucun favori pour le moment
                    </p>
                    <Button variant="outline" onClick={() => navigate("/professionals")}>
                      Découvrir des professionnels
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;

