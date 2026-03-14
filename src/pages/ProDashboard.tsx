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
  CheckCircle2,
  Eye,
  User,
  Hammer,
  DollarSign,
  Bell,
  Video,
  CreditCard,
  Calendar,
  Clock,
  Linkedin,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([]);
  const [pendingContractsList, setPendingContractsList] = useState<PendingContract[]>([]);

  // US-052 — Revenue summary
  const [revenue, setRevenue] = useState({
    total: 0,
    pending: 0,
    paid: 0,
  });
  const [activeTab, setActiveTab] = useState("apercu");

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

      // Redirect to pending verification if RBQ not verified
      if (!prof?.is_rbq_verified) {
        navigate('/pending-verification');
        return;
      }

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
          <div>Chargement...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      <Navigation />
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 flex-1">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Dashboard Professionnel</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            {t('pro_dashboard.subtitle')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">{t('pro_dashboard.stats.active_projects')}</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold">{stats.activeProjects}</p>
                </div>
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">{t('pro_dashboard.stats.acceptance_rate')}</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold">{stats.acceptanceRate}%</p>
                </div>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-success flex-shrink-0 ml-2" />
              </div>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
                {stats.proposalsAccepted}/{stats.proposalsSent} propositions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">{t('pro_dashboard.stats.avg_rating')}</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-warning flex-shrink-0 ml-2" />
              </div>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1 sm:mt-2">{stats.totalReviews} avis</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">{t('pro_dashboard.stats.unread_messages')}</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold">{stats.unreadMessages}</p>
                </div>
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0 ml-2" />
              </div>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
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

        {/* US-052 — Revenue Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-green-700">Total encaissé</p>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {revenue.paid.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
              <p className="text-xs text-green-600 mt-1">Versements reçus</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-amber-700">En attente</p>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-900">
                {revenue.pending.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
              <p className="text-xs text-amber-600 mt-1">Jalons à valider</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-blue-700">Total contrats actifs</p>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {revenue.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
              <p className="text-xs text-blue-600 mt-1">Valeur contractuelle</p>
            </CardContent>
          </Card>
        </div>

        {/* US-053 — Navigation tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-4 sm:grid-cols-4 w-full">
            <TabsTrigger value="apercu" className="text-xs sm:text-sm">
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="invitations" className="relative text-xs sm:text-sm">
              Invitations
              {pendingContractsList.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {pendingContractsList.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reunions" className="text-xs sm:text-sm">
              <Video className="h-3 w-3 mr-1 hidden sm:inline" />
              Réunions
            </TabsTrigger>
            <TabsTrigger value="abonnement" className="text-xs sm:text-sm">
              <CreditCard className="h-3 w-3 mr-1 hidden sm:inline" />
              Abonnement
            </TabsTrigger>
          </TabsList>

          {/* Tab: Invitations */}
          <TabsContent value="invitations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Invitations & Contrats à signer
                </CardTitle>
                <CardDescription>Propositions clients en attente de votre réponse</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingContractsList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune invitation en attente.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingContractsList.map(contract => (
                      <div key={contract.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/contracts?contract=${contract.id}`)}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{contract.title}</h4>
                            <p className="text-sm text-muted-foreground">Client : {contract.client_name}</p>
                            <p className="text-sm font-medium mt-1">{contract.total_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
                          </div>
                          <Badge variant="outline" className="text-amber-600 border-amber-300">À signer</Badge>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-muted-foreground">{format(new Date(contract.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                          <Button size="sm">Voir et signer</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Réunions Zoom */}
          <TabsContent value="reunions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  Réunions Zoom planifiées
                </CardTitle>
                <CardDescription>Vos prochaines réunions avec les clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-4">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Aucune réunion planifiée pour le moment.</p>
                  <Button onClick={() => navigate('/pro/meetings')} className="gap-2">
                    <Video className="h-4 w-4" />
                    Gérer mes réunions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Abonnement */}
          <TabsContent value="abonnement" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Mon abonnement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <p className="font-semibold">Plan Gratuit</p>
                    <p className="text-sm text-muted-foreground">3 soumissions / mois · Visibilité standard</p>
                  </div>
                  <Badge variant="outline">Actif</Badge>
                </div>
                <Button className="w-full" onClick={() => navigate('/pro/subscription')}>
                  Passer au Plan Premium
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mb-4 sm:mb-6 md:mb-8">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl">{t('pro_dashboard.quick_actions.title')}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('pro_dashboard.quick_actions.description')}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 border-primary text-primary hover:bg-primary/5 text-[11px] sm:text-xs md:text-sm"
                onClick={() => navigate('/pro/my-projects')}
              >
                <Hammer className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                <span className="text-center leading-tight">{t('pro_dashboard.quick_actions.my_projects')}</span>
                {assignedProjects.length > 0 && (
                  <Badge variant="default" className="text-[10px] sm:text-xs">
                    {assignedProjects.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 border-primary text-primary hover:bg-primary/5 text-[11px] sm:text-xs md:text-sm"
                onClick={() => navigate(`/professional/${userId}`)}
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                <span className="text-center leading-tight">Visualiser mon profil</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm col-span-2 sm:col-span-1"
                onClick={() => navigate('/projects')}
              >
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                <span className="text-center leading-tight">{t('pro_dashboard.quick_actions.browse_projects')}</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm"
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                <span className="text-center leading-tight">{t('pro_dashboard.quick_actions.messaging')}</span>
                {stats.unreadMessages > 0 && (
                  <Badge variant="destructive" className="text-[10px] sm:text-xs">
                    {stats.unreadMessages}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm"
                onClick={() => navigate('/contracts')}
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                <span className="text-center leading-tight">{t('pro_dashboard.quick_actions.my_contracts')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm col-span-2 sm:col-span-1"
                onClick={() => navigate('/pro/portfolio')}
              >
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                <span className="text-center leading-tight">Mon portfolio</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-3">
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm"
                onClick={() => navigate('/pro/meetings')}
              >
                <Video className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                <span className="text-center leading-tight">Réunions Zoom</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm"
                onClick={() => navigate('/pro/payments')}
              >
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
                <span className="text-center leading-tight">Mes paiements</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm"
                onClick={() => navigate('/pro/bank-account')}
              >
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                <span className="text-center leading-tight">Compte bancaire</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm col-span-2 sm:col-span-1"
                onClick={() => navigate('/pro/entrepreneur-profile')}
              >
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                <span className="text-center leading-tight">Profil entrepreneur</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]" onClick={() => navigate('/pro/subscription')}>
            <CardContent className="p-3 sm:p-4 md:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">Améliorer mon abonnement</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Boostez votre visibilité</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]" onClick={() => navigate('/pro/reviews')}>
            <CardContent className="p-3 sm:p-4 md:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Star className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-warning flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">Mes évaluations</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Gérer ma réputation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] sm:col-span-2 md:col-span-1" onClick={() => navigate('/pro/subcontractors')}>
            <CardContent className="p-3 sm:p-4 md:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">Mes sous-traitants</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Gérer mon équipe</p>
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

