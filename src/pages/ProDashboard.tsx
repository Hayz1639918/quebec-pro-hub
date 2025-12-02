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
  ClipboardList,
  Hammer,
  Send,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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

interface AssignedProject {
  id: string;
  title: string;
  category: string;
  city: string | null;
  progress_percentage: number;
  progress_status: string;
  current_phase: string | null;
  contract_id: string | null;
  client_id: string;
  client_name: string;
  contract_status: string | null;
  contract_signed: boolean;
  start_date: string | null;
}

interface PendingContract {
  id: string;
  title: string;
  project_title: string | null;
  project_id: string | null;
  client_name: string;
  total_amount: number;
  created_at: string;
  client_signed_at: string | null;
  professional_signed_at: string | null;
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
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pendingContractsList, setPendingContractsList] = useState<PendingContract[]>([]);

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

      // Commenté temporairement pour permettre l'accès au dashboard
      // if (!prof?.is_rbq_verified) {
      //   navigate('/pro/profile');
      //   return;
      // }

      await fetchDashboardData(session.user.id);
      await fetchPendingContractsList(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchPendingContractsList = async (uid: string) => {
    try {
      // Fetch contracts where professional hasn't signed yet
      const { data: contractsData, error } = await supabase
        .from('contracts')
        .select(`
          id,
          title,
          project_id,
          total_amount,
          created_at,
          client_signed_at,
          professional_signed_at,
          projects:project_id (title),
          profiles:client_id (full_name, company_name)
        `)
        .eq('professional_id', uid)
        .is('professional_signed_at', null)
        .in('status', ['draft', 'pending', 'active'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching pending contracts:', error.message);
        setPendingContractsList([]);
        return;
      }

      if (contractsData) {
        const formatted: PendingContract[] = contractsData.map((c: any) => ({
          id: c.id,
          title: c.title,
          project_title: c.projects?.title || null,
          project_id: c.project_id,
          client_name: c.profiles?.company_name || c.profiles?.full_name || 'Client',
          total_amount: c.total_amount,
          created_at: c.created_at,
          client_signed_at: c.client_signed_at,
          professional_signed_at: c.professional_signed_at,
        }));
        setPendingContractsList(formatted);
      }
    } catch (error) {
      console.warn('Error fetching pending contracts:', error);
      setPendingContractsList([]);
    }
  };

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

      // Fetch assigned projects (where this professional was accepted)
      // Note: This requires migration 031_project_workflow_notifications.sql to be applied
      try {
        const { data: assignedProjectsData, error: assignedError } = await supabase
          .from('projects')
          .select(`
            id,
            title,
            category,
            city,
            progress_percentage,
            progress_status,
            current_phase,
            contract_id,
            client_id,
            profiles:client_id (full_name, company_name),
            contracts:contract_id (status, client_signed_at, professional_signed_at, start_date)
          `)
          .eq('assigned_professional_id', uid)
          .order('updated_at', { ascending: false })
          .limit(10);

        // If error (columns don't exist yet), silently ignore
        if (assignedError) {
          console.warn('Assigned projects query failed (migration 031 may not be applied yet):', assignedError.message);
          setAssignedProjects([]);
        } else if (assignedProjectsData) {
          const formattedAssignedProjects: AssignedProject[] = assignedProjectsData.map((p: any) => ({
            id: p.id,
            title: p.title,
            category: p.category,
            city: p.city,
            progress_percentage: p.progress_percentage || 0,
            progress_status: p.progress_status || 'not_started',
            current_phase: p.current_phase,
            contract_id: p.contract_id,
            client_id: p.client_id,
            client_name: p.profiles?.company_name || p.profiles?.full_name || 'Client',
            contract_status: p.contracts?.status || null,
            contract_signed: !!(p.contracts?.client_signed_at && p.contracts?.professional_signed_at),
            start_date: p.contracts?.start_date || null,
          }));
          setAssignedProjects(formattedAssignedProjects);
        }
      } catch (assignedErr) {
        console.warn('Could not fetch assigned projects:', assignedErr);
        setAssignedProjects([]);
      }
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
                <Briefcase className="h-8 w-8 text-primary" />
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
                <TrendingUp className="h-8 w-8 text-success" />
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
                <Star className="h-8 w-8 text-warning" />
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
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.pendingContracts} contrats en attente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Contracts - Contracts awaiting professional signature */}
        {pendingContractsList.length > 0 && (
          <Card className="mb-8 border-warning/30 bg-warning-light">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-warning" />
                Contrats à signer
                <Badge variant="destructive" className="ml-2">{pendingContractsList.length}</Badge>
              </CardTitle>
              <CardDescription>Ces contrats nécessitent votre signature</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingContractsList.map((contract) => (
                  <div 
                    key={contract.id} 
                    className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/contracts?contract=${contract.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{contract.title}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {contract.project_title && (
                            <p>Projet: {contract.project_title}</p>
                          )}
                          <p>Client: {contract.client_name}</p>
                          <p className="font-medium text-foreground">
                            Montant: {contract.total_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-warning-light text-warning border-warning/50">
                          À signer
                        </Badge>
                        {contract.client_signed_at && (
                          <span className="text-xs text-success flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Signé par le client
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Créé le {format(new Date(contract.created_at), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <Button size="sm" className="bg-warning hover:bg-warning/90 text-warning-foreground">
                        Voir et signer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                className="h-auto py-4 flex-col gap-2 bg-primary hover:bg-primary/90"
                onClick={() => navigate('/pro/my-projects')}
              >
                <Hammer className="h-6 w-6" />
                <span>{t('pro_dashboard.quick_actions.my_projects')}</span>
                {assignedProjects.length > 0 && (
                  <Badge variant="secondary" className="bg-white text-primary">
                    {assignedProjects.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 border-primary text-primary hover:bg-primary/5"
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
                      className="h-full bg-success"
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
                      className="h-full bg-primary"
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
                <Star className="h-8 w-8 text-warning" />
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
                <Users className="h-8 w-8 text-primary" />
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

