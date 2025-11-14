import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Briefcase,
  Star,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  activeProjects: number;
  proposalsSent: number;
  proposalsAccepted: number;
  acceptanceRate: number;
  averageRating: number;
  totalReviews: number;
  unreadMessages: number;
  pendingContracts: number;
}

interface RecentActivity {
  id: string;
  type: 'proposal' | 'message' | 'review' | 'contract';
  title: string;
  description: string;
  date: string;
  status?: string;
}

interface Project {
  id: string;
  title: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  created_at: string;
  proposal_count: number;
}

const ProDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    proposalsSent: 0,
    proposalsAccepted: 0,
    acceptanceRate: 0,
    averageRating: 0,
    totalReviews: 0,
    unreadMessages: 0,
    pendingContracts: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }
      setUserId(session.user.id);

      // Ensure professional
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_type,is_rbq_verified')
        .eq('id', session.user.id)
        .single();

      if (prof?.user_type !== 'professional') {
        navigate('/');
        return;
      }

      if (!prof?.is_rbq_verified) {
        navigate('/pro/profile');
        return;
      }

      await fetchDashboardData(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchDashboardData = async (uid: string) => {
    try {
      // Fetch proposals stats
      const { data: proposals } = await supabase
        .from('proposals')
        .select('status')
        .eq('professional_id', uid);

      const proposalsSent = proposals?.length || 0;
      const proposalsAccepted = proposals?.filter((p) => p.status === 'accepted').length || 0;
      const acceptanceRate = proposalsSent ? Math.round((proposalsAccepted / proposalsSent) * 100) : 0;

      // Fetch reviews stats
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('professional_id', uid);

      const totalReviews = reviews?.length || 0;
      const averageRating =
        totalReviews > 0
          ? Math.round((reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
          : 0;

      // Fetch unread messages
      const { count: unreadMessages } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', uid)
        .eq('is_read', false);

      // Fetch pending contracts
      const { count: pendingContracts } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('professional_id', uid)
        .in('status', ['draft', 'pending_signature']);

      // Fetch active projects (those with proposals)
      const { data: activeProjectsData } = await supabase
        .from('proposals')
        .select('project_id')
        .eq('professional_id', uid)
        .in('status', ['pending', 'accepted']);

      const activeProjects = new Set(activeProjectsData?.map((p) => p.project_id) || []).size;

      setStats({
        activeProjects,
        proposalsSent,
        proposalsAccepted,
        acceptanceRate,
        averageRating,
        totalReviews,
        unreadMessages: unreadMessages || 0,
        pendingContracts: pendingContracts || 0,
      });

      // Fetch recent projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentProjects(projectsData || []);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'À discuter';
    if (min && max) return `${min.toLocaleString()} $ - ${max.toLocaleString()} $`;
    if (min) return `À partir de ${min.toLocaleString()} $`;
    return `Jusqu'à ${max!.toLocaleString()} $`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="container mx-auto px-6 lg:px-8 py-12 flex-1">
          <div>Chargement...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="container mx-auto px-6 lg:px-8 pt-24 pb-12 flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard Professionnel</h1>
          <p className="text-muted-foreground">
            {t('pro_dashboard.subtitle')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pro_dashboard.stats.active_projects')}</p>
                  <p className="text-3xl font-bold">{stats.activeProjects}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pro_dashboard.stats.acceptance_rate')}</p>
                  <p className="text-3xl font-bold">{stats.acceptanceRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.proposalsAccepted}/{stats.proposalsSent} propositions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pro_dashboard.stats.avg_rating')}</p>
                  <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stats.totalReviews} avis</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pro_dashboard.stats.unread_messages')}</p>
                  <p className="text-3xl font-bold">{stats.unreadMessages}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.pendingContracts} contrats en attente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('pro_dashboard.quick_actions.title')}</CardTitle>
            <CardDescription>{t('pro_dashboard.quick_actions.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <Button
                variant="default"
                className="h-auto py-4 flex-col gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/pro/profile')}
              >
                <Edit className="h-6 w-6" />
                <span>Modifier mon profil</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={() => navigate(`/professional/${userId}`)}
              >
                <User className="h-6 w-6" />
                <span>Visualiser mon profil</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/projects')}
              >
                <Eye className="h-6 w-6" />
                <span>{t('pro_dashboard.quick_actions.browse_projects')}</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="h-6 w-6" />
                <span>{t('pro_dashboard.quick_actions.messaging')}</span>
                {stats.unreadMessages > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.unreadMessages}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/contracts')}
              >
                <FileText className="h-6 w-6" />
                <span>{t('pro_dashboard.quick_actions.my_contracts')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/pro/portfolio')}
              >
                <Briefcase className="h-6 w-6" />
                <span>Mon portfolio</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pro_dashboard.new_projects.title')}</CardTitle>
              <CardDescription>{t('pro_dashboard.new_projects.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('pro_dashboard.new_projects.no_projects')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{project.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Badge variant="outline">{project.category}</Badge>
                            {project.city && <span>• {project.city}</span>}
                          </div>
                          <p className="text-sm font-semibold text-primary">
                            {formatBudget(project.budget_min, project.budget_max)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {t('pro_dashboard.new_projects.published')} {format(new Date(project.created_at), 'PPP', { locale: fr })}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/projects?selected=${project.id}`)}
                        >
                          {t('pro_dashboard.new_projects.view_details')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pro_dashboard.overview.title')}</CardTitle>
              <CardDescription>{t('pro_dashboard.overview.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('pro_dashboard.overview.response_rate')}</span>
                    <span className="text-sm font-bold">{stats.proposalsSent > 0 ? '100%' : '0%'}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: stats.proposalsSent > 0 ? '100%' : '0%' }}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('pro_dashboard.overview.acceptance_rate')}</span>
                    <span className="text-sm font-bold">{stats.acceptanceRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${stats.acceptanceRate}%` }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Statistiques clés</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <p className="text-2xl font-bold">{stats.proposalsSent}</p>
                      <p className="text-xs text-muted-foreground">Propositions envoyées</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-2xl font-bold">{stats.proposalsAccepted}</p>
                      <p className="text-xs text-muted-foreground">Contrats signés</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-2xl font-bold">{stats.totalReviews}</p>
                      <p className="text-xs text-muted-foreground">Évaluations</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">{t('pro_dashboard.overview.avg_rating')}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/pro/kpis')}
                >
                  Voir les KPIs détaillés
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pro/subscription')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Améliorer mon abonnement</p>
                  <p className="text-xs text-muted-foreground">Boostez votre visibilité</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pro/reviews')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="font-semibold">Mes évaluations</p>
                  <p className="text-xs text-muted-foreground">Gérer ma réputation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pro/subcontractors')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-semibold">Mes sous-traitants</p>
                  <p className="text-xs text-muted-foreground">Gérer mon équipe</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProDashboard;

