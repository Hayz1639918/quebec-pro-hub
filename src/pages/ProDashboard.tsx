import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  HardHat,
  Award,
  Wrench,
  Search,
  Building2,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { canUseProfessionalPlatform, getProfessionalCompletionRoute } from '@/lib/auth-routing';

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

// Reusable quick-action button
const ActionBtn = ({
  icon: Icon, label, onClick, badge, primary, span, iconColor,
}: {
  icon: React.ElementType; label: string; onClick: () => void;
  badge?: number; primary?: boolean; span?: boolean; iconColor?: string;
}) => (
  <Button
    variant="outline"
    className={`h-auto py-3 sm:py-4 flex-col gap-1.5 text-[11px] sm:text-xs md:text-sm relative ${primary ? 'border-primary text-primary hover:bg-primary/5' : ''} ${span ? 'col-span-2 sm:col-span-1' : ''}`}
    onClick={onClick}
  >
    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor || ''}`} />
    <span className="text-center leading-tight">{label}</span>
    {badge !== undefined && badge > 0 && (
      <Badge variant="destructive" className="absolute -top-1 -right-1 text-[10px] h-4 min-w-4 px-1">{badge}</Badge>
    )}
  </Button>
);

const ProDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [professionalType, setProfessionalType] = useState<'entrepreneur' | 'trade_professional'>('entrepreneur');
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
  const [pendingInvitations, setPendingInvitations] = useState<Array<{
    id: string;
    project_id: string;
    project_title: string;
    client_name: string;
    message: string | null;
    created_at: string;
  }>>([]);
  const [respondingInvitation, setRespondingInvitation] = useState<string | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Array<{
    id: string;
    client_name: string;
    project_name: string | null;
    scheduled_at: string;
    meeting_url: string | null;
  }>>([]);

  // US-052 — Revenue summary (real data from contractor_payments + contracts)
  const [revenue, setRevenue] = useState({
    total: 0,        // Sum of active contracts.total_amount
    pending: 0,      // Sum of contractor_payments.net_amount where status pending/in_escrow
    paid: 0,         // Sum of contractor_payments.net_amount where status released
    paidThisMonth: 0,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'apercu');

  // Keep the URL in sync so notifications can deep-link to a tab
  useEffect(() => {
    const current = searchParams.get('tab');
    if (current !== activeTab) {
      const next = new URLSearchParams(searchParams);
      if (activeTab === 'apercu') {
        next.delete('tab');
      } else {
        next.set('tab', activeTab);
      }
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }
      setUserId(session.user.id);

      // Fetch professional profile — select only stable columns (avoid missing column errors)
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('user_type, profile_completed, professional_type')
        .eq('id', session.user.id)
        .single();

      if (profError || !prof) {
        // Query failed (DB error, network, or RLS issue) — send to auth to re-authenticate
        navigate('/auth?mode=login', { replace: true });
        return;
      }

      if (prof.user_type !== 'professional') {
        navigate('/', { replace: true });
        return;
      }

      // Set professional sub-type (default to entrepreneur for backward compat)
      const subType = (prof.professional_type as 'entrepreneur' | 'trade_professional') || 'entrepreneur';
      setProfessionalType(subType);

      if (!canUseProfessionalPlatform(prof)) {
        navigate(getProfessionalCompletionRoute(prof.professional_type), { replace: true });
        return;
      }

      await fetchDashboardData(session.user.id);
      await fetchPendingContractsList(session.user.id);
      await fetchPendingInvitations(session.user.id);
      await fetchUpcomingMeetings(session.user.id);
      setLoading(false);
    })();
  }, []);

  // Realtime: refresh invitations on insert/update (separate effect so cleanup runs properly)
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`pro-invitations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_invitations',
          filter: `professional_id=eq.${userId}`,
        },
        () => fetchPendingInvitations(userId)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchUpcomingMeetings = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('pro_meetings')
        .select('id, client_name, project_name, scheduled_at, meeting_url, status')
        .eq('organizer_id', uid)
        .eq('status', 'upcoming')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);
      if (error) throw error;
      setUpcomingMeetings(data || []);
    } catch (e) {
      console.error('Error fetching upcoming meetings:', e);
    }
  };

  const fetchPendingInvitations = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('project_invitations')
        .select('id, project_id, client_id, message, status, created_at, projects:project_id(title), profiles!project_invitations_client_id_fkey(full_name, company_name)')
        .eq('professional_id', uid)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching invitations:', error.message);
        setPendingInvitations([]);
        return;
      }

      setPendingInvitations(
        (data || []).map((inv) => ({
          id: inv.id,
          project_id: inv.project_id,
          project_title: inv.projects?.title || 'Projet sans titre',
          client_name:
            inv.profiles?.company_name || inv.profiles?.full_name || 'Client',
          message: inv.message,
          created_at: inv.created_at,
        }))
      );
    } catch (e) {
      console.warn('Error fetching invitations:', e);
      setPendingInvitations([]);
    }
  };

  const respondToInvitation = async (
    invitationId: string,
    response: 'accepted' | 'declined',
    projectId?: string
  ) => {
    setRespondingInvitation(invitationId);
    try {
      const { error } = await supabase.rpc('respond_to_invitation', {
        p_invitation_id: invitationId,
        p_response: response,
      });
      if (error) throw error;
      if (response === 'accepted' && projectId) {
        // Take the pro straight to the project page where they submit a proposal
        navigate(`/project/${projectId}`);
      } else {
        setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      }
    } catch (e: unknown) {
      console.error('Error responding to invitation:', e);
    } finally {
      setRespondingInvitation(null);
    }
  };

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
          profiles!contracts_client_id_fkey (full_name, company_name)
        `)
        .eq('professional_id', uid)
        .is('professional_signed_at', null)
        .in('status', ['draft', 'pending_client_signature', 'pending_professional_signature', 'pending_both_signatures'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching pending contracts:', error.message);
        setPendingContractsList([]);
        return;
      }

      if (contractsData) {
        const formatted: PendingContract[] = contractsData.map((c) => ({
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
        .in('status', ['draft', 'pending_client_signature', 'pending_professional_signature', 'pending_both_signatures']);

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

      // US-052 — Revenue stats from contractor_payments + active contracts
      try {
        const { data: paymentRows } = await supabase
          .from('contractor_payments')
          .select('status, net_amount, released_at, created_at')
          .eq('contractor_id', uid);
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        let paid = 0, pending = 0, paidThisMonth = 0;
        (paymentRows || []).forEach((r: { status: string; net_amount: number; released_at: string | null }) => {
          const amount = Number(r.net_amount || 0);
          if (r.status === 'released' || r.status === 'succeeded') {
            paid += amount;
            if (r.released_at && new Date(r.released_at) >= startOfMonth) paidThisMonth += amount;
          } else if (r.status === 'pending' || r.status === 'in_escrow' || r.status === 'processing') {
            pending += amount;
          }
        });

        const { data: contractRows } = await supabase
          .from('contracts')
          .select('total_amount, status')
          .eq('professional_id', uid)
          .in('status', ['signed', 'pending_client_signature', 'pending_professional_signature', 'pending_both_signatures']);
        const totalActive = (contractRows || []).reduce(
          (sum: number, c: { total_amount: number | null }) => sum + Number(c.total_amount || 0),
          0,
        );

        setRevenue({ total: totalActive, pending, paid, paidThisMonth });
      } catch (revErr) {
        console.warn('Revenue fetch failed:', revErr);
      }

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
            profiles!projects_client_id_fkey (full_name, company_name),
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
          const formattedAssignedProjects: AssignedProject[] = assignedProjectsData.map((p) => ({
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
        <div className="mb-4 sm:mb-6 md:mb-8 flex items-start gap-3">
          {professionalType === 'trade_professional'
            ? <HardHat className="h-7 w-7 text-amber-600 mt-1 flex-shrink-0" />
            : <Building2 className="h-7 w-7 text-blue-600 mt-1 flex-shrink-0" />
          }
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
              {professionalType === 'trade_professional' ? 'Tableau de bord — Professionnel Métier' : 'Tableau de bord — Entrepreneur'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {professionalType === 'trade_professional'
                ? 'Gérez vos missions, certifications, portfolio et réputation.'
                : t('pro_dashboard.subtitle')}
            </p>
          </div>
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

        {/* US-052 — Revenue Summary (real data) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="border-success/30 bg-success-light/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium uppercase tracking-wide text-success">Total encaissé</p>
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <p className="text-2xl font-bold">
                {revenue.paid.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {revenue.paidThisMonth > 0
                  ? `${revenue.paidThisMonth.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} ce mois-ci`
                  : 'Aucun versement ce mois-ci'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-warning/30 bg-warning-light/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium uppercase tracking-wide text-warning">En attente</p>
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <p className="text-2xl font-bold">
                {revenue.pending.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Jalons à valider</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Contrats actifs</p>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">
                {revenue.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Valeur contractuelle totale</p>
            </CardContent>
          </Card>
        </div>

        {/* US-053 — Navigation tabs — context-aware by professional type */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${professionalType === 'entrepreneur' ? 4 : 4}, 1fr)` }}>
            <TabsTrigger value="apercu" className="text-xs sm:text-sm">Aperçu</TabsTrigger>
            {professionalType === 'entrepreneur' ? (
              <>
                <TabsTrigger value="invitations" className="relative text-xs sm:text-sm">
                  Invitations
                  {(pendingContractsList.length + pendingInvitations.length) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {pendingContractsList.length + pendingInvitations.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reunions" className="text-xs sm:text-sm">
                  <Video className="h-3 w-3 mr-1 hidden sm:inline" />Réunions
                </TabsTrigger>
                <TabsTrigger value="abonnement" className="text-xs sm:text-sm">
                  <CreditCard className="h-3 w-3 mr-1 hidden sm:inline" />Abonnement
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="missions" className="relative text-xs sm:text-sm">
                  Missions
                  {assignedProjects.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {assignedProjects.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="profil-metier" className="text-xs sm:text-sm">
                  <HardHat className="h-3 w-3 mr-1 hidden sm:inline" />Profil métier
                </TabsTrigger>
                <TabsTrigger value="abonnement" className="text-xs sm:text-sm">
                  <CreditCard className="h-3 w-3 mr-1 hidden sm:inline" />Abonnement
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Tab: Invitations (entrepreneur only) */}
          <TabsContent value="invitations" className="mt-4 space-y-4">
            {/* Section 1: Direct invitations from clients (US-053) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Invitations de clients
                </CardTitle>
                <CardDescription>
                  Des clients vous ont sollicité directement pour soumissionner sur leurs projets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvitations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">
                    Aucune invitation client en attente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingInvitations.map((inv) => (
                      <div key={inv.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold truncate">{inv.project_title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Invité par : <span className="font-medium text-foreground">{inv.client_name}</span>
                            </p>
                            {inv.message && (
                              <p className="text-sm text-muted-foreground italic mt-2 line-clamp-2">
                                "{inv.message}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(inv.created_at), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-blue-600 border-blue-300 shrink-0">
                            Nouvelle
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/project/${inv.project_id}`)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Voir le projet
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={respondingInvitation === inv.id}
                            onClick={() => respondToInvitation(inv.id, 'declined')}
                          >
                            Décliner
                          </Button>
                          <Button
                            size="sm"
                            disabled={respondingInvitation === inv.id}
                            onClick={() => respondToInvitation(inv.id, 'accepted', inv.project_id)}
                          >
                            Accepter et soumissionner
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Contracts to sign */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  Contrats à signer
                </CardTitle>
                <CardDescription>Propositions acceptées en attente de votre signature</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingContractsList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">Aucun contrat en attente.</p>
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
                {upcomingMeetings.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Aucune réunion planifiée pour le moment.</p>
                    <Button onClick={() => navigate('/pro/meetings')} className="gap-2">
                      <Video className="h-4 w-4" />
                      Planifier une réunion
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 border rounded-lg p-4">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{m.client_name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {m.project_name || 'Réunion'} · {format(new Date(m.scheduled_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                          </p>
                        </div>
                        {m.meeting_url ? (
                          <Button asChild size="sm" variant="outline" className="gap-2 flex-shrink-0">
                            <a href={m.meeting_url} target="_blank" rel="noopener noreferrer">
                              <Video className="h-4 w-4" />
                              Rejoindre
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    <Button onClick={() => navigate('/pro/meetings')} className="w-full gap-2">
                      <Video className="h-4 w-4" />
                      Gérer mes réunions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Missions (trade_professional only) */}
          <TabsContent value="missions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-amber-600" />
                  Mes missions en cours
                </CardTitle>
                <CardDescription>Projets sur lesquels vous êtes assigné</CardDescription>
              </CardHeader>
              <CardContent>
                {assignedProjects.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Aucune mission en cours.</p>
                    <Button onClick={() => navigate('/projects')} variant="outline" className="gap-2">
                      <Search className="h-4 w-4" />
                      Parcourir les projets disponibles
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {assignedProjects.length} mission{assignedProjects.length > 1 ? 's' : ''} en cours.
                    </p>
                    {assignedProjects.slice(0, 3).map(project => (
                      <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/pro/project/${project.id}/progress`)}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{project.title}</h4>
                            <p className="text-sm text-muted-foreground">{project.category} · {project.city || '—'}</p>
                          </div>
                          <Badge variant="outline">{project.progress_status}</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progression</span>
                            <span>{project.progress_percentage}%</span>
                          </div>
                          <Progress value={project.progress_percentage} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                    <Button onClick={() => navigate('/pro/my-projects')} className="w-full gap-2">
                      <Hammer className="h-4 w-4" />
                      Voir toutes mes missions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Profil métier (trade_professional only) */}
          <TabsContent value="profil-metier" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pro/profile')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <HardHat className="h-8 w-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Profil métier</p>
                    <p className="text-xs text-muted-foreground">Spécialité, licences RBQ, certifications CCQ</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pro/portfolio')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Briefcase className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Portfolio</p>
                    <p className="text-xs text-muted-foreground">Photos avant/après, réalisations</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pro/reviews')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Star className="h-8 w-8 text-warning flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Mes avis</p>
                    <p className="text-xs text-muted-foreground">Témoignages clients vérifiés</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pro/profile?tab=tarifs')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Award className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Grille de tarifs</p>
                    <p className="text-xs text-muted-foreground">Tarifs horaires et forfaits</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Abonnement (both types) */}
          <TabsContent value="abonnement" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Mon abonnement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-success-light/30 border border-success/30 rounded-lg mb-4">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Plan Gratuit — accès complet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Toutes les fonctionnalités essentielles sont activées pendant la phase de lancement.
                    </p>
                  </div>
                  <Badge variant="default" className="bg-success">Actif</Badge>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate('/pro/subscription')}>
                  Détails de l'abonnement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions — context-aware by professional type */}
        <Card className="mb-4 sm:mb-6 md:mb-8">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl">{t('pro_dashboard.quick_actions.title')}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('pro_dashboard.quick_actions.description')}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 md:pt-0">
            {professionalType === 'entrepreneur' ? (
              /* ── Entrepreneur quick actions (Epics 10-18) ── */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <ActionBtn icon={Hammer} label={t('pro_dashboard.quick_actions.my_projects')} onClick={() => navigate('/pro/my-projects')} badge={assignedProjects.length || undefined} primary />
                <ActionBtn icon={User} label="Mon profil public" onClick={() => navigate(`/professional/${userId}`)} primary />
                <ActionBtn icon={Award} label="Licences et vérification" onClick={() => navigate('/pro/profile?tab=licences')} />
                <ActionBtn icon={FileText} label={t('pro_dashboard.quick_actions.my_contracts')} onClick={() => navigate('/contracts')} />
                <ActionBtn icon={Briefcase} label="Mon portfolio" onClick={() => navigate('/pro/portfolio')} />
                <ActionBtn icon={DollarSign} label="Mes paiements" onClick={() => navigate('/pro/payments')} iconColor="text-green-600" />
                <ActionBtn icon={CreditCard} label="Compte bancaire" onClick={() => navigate('/pro/bank-account')} />
                <ActionBtn icon={Video} label="Réunions Zoom" onClick={() => navigate('/pro/meetings')} iconColor="text-blue-600" />
                <ActionBtn icon={Calendar} label="Disponibilités" onClick={() => navigate('/pro/calendar')} />
                <ActionBtn icon={Star} label="Mes avis" onClick={() => navigate('/pro/reviews')} iconColor="text-amber-500" />
                <ActionBtn icon={Users} label="Sous-traitants" onClick={() => navigate('/pro/subcontractors')} />
              </div>
            ) : (
              /* ── Professionnel Métier quick actions (Epics 30-32) ── */
              <div className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <ActionBtn icon={HardHat} label="Mon profil métier" onClick={() => navigate('/pro/profile')} primary iconColor="text-amber-600" />
                  <ActionBtn icon={User} label="Mon profil public" onClick={() => navigate(`/professional/${userId}`)} primary />
                  <ActionBtn icon={Search} label="Trouver un projet" onClick={() => navigate('/projects')} span />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <ActionBtn icon={MessageSquare} label="Messagerie" onClick={() => navigate('/messages')} badge={stats.unreadMessages || undefined} />
                  <ActionBtn icon={FileText} label="Mes contrats" onClick={() => navigate('/contracts')} />
                  <ActionBtn icon={Briefcase} label="Mon portfolio" onClick={() => navigate('/pro/portfolio')} span />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <ActionBtn icon={Star} label="Mes évaluations" onClick={() => navigate('/pro/reviews')} iconColor="text-amber-500" />
                  <ActionBtn icon={Award} label="Grille de tarifs" onClick={() => navigate('/pro/profile?tab=tarifs')} iconColor="text-green-600" />
                  <ActionBtn icon={Hammer} label={t('pro_dashboard.quick_actions.my_projects')} onClick={() => navigate('/pro/my-projects')} badge={assignedProjects.length || undefined} />
                  <ActionBtn icon={Calendar} label="Disponibilités" onClick={() => navigate('/pro/calendar')} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <ActionBtn icon={Video} label="Réunions Zoom" onClick={() => navigate('/pro/meetings')} iconColor="text-blue-600" />
                </div>
              </div>
            )}
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
