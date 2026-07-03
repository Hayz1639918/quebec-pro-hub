import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProjectList from "@/components/dashboard/ProjectList";
import ProposalsList, { type Proposal } from "@/components/dashboard/ProposalsList";
import ClientContractsTab, { type ClientContract } from "@/components/dashboard/ClientContractsTab";
import ClientInvoicesTab, { type MilestoneTransaction } from "@/components/dashboard/ClientInvoicesTab";
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
  Hammer,
  ClipboardList,
  Eye,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  assigned_professional_id?: string | null;
  progress_percentage?: number;
  progress_status?: string;
  current_phase?: string | null;
  contract_id?: string | null;
  // Contract signature info
  contract_signed?: boolean;
  client_signed_at?: string | null;
  professional_signed_at?: string | null;
  professional_name?: string | null;
}

interface ActiveProject {
  id: string;
  title: string;
  category: string;
  progress_percentage: number;
  progress_status: string;
  current_phase: string | null;
  professional_name: string;
  professional_id: string;
  contract_id: string | null;
  contract_signed: boolean;
  unread_reports: number;
}

interface ProjectReport {
  id: string;
  project_id: string;
  project_title: string;
  title: string;
  content: string;
  report_type: string;
  progress_percentage: number | null;
  professional_name: string;
  created_at: string;
  is_read_by_client: boolean;
}

interface PendingContract {
  id: string;
  title: string;
  project_title: string | null;
  project_id: string | null;
  professional_name: string;
  company_name: string | null;
  total_amount: number;
  created_at: string;
  client_signed_at: string | null;
  professional_signed_at: string | null;
}



const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get initial tab from URL or default to "overview"
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteProfessional[]>([]);
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([]);
  const [pendingContracts, setPendingContracts] = useState<PendingContract[]>([]);
  const [allContracts, setAllContracts] = useState<ClientContract[]>([]);
  const [milestonesTransactions, setMilestonesTransactions] = useState<MilestoneTransaction[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<"all" | "open" | "in_progress" | "completed">("all");
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
      await fetchActiveProjectsAndReports(session.user.id);
      await fetchPendingContracts(session.user.id);
      await fetchAllContracts(session.user.id);
      await fetchMilestoneTransactions(session.user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate("/auth?mode=login");
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async (projectIds: string[]) => {
    if (projectIds.length === 0) {
      setProposals([]);
      return;
    }

    try {
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('proposals')
        .select(`
          *,
          professional:professional_id(full_name, company_name),
          project:project_id(title)
        `)
        .in('project_id', projectIds)
        .eq('status', 'pending')  // Afficher uniquement les offres en attente
        .order('created_at', { ascending: false });

      if (proposalsError) throw proposalsError;

      setProposals(proposalsData || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      setLoadingProjects(true);
      
      // Fetch all projects with contract details
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          contracts:contract_id (
            id,
            client_signed_at,
            professional_signed_at
          ),
          profiles:assigned_professional_id (full_name, company_name)
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Transform data to include contract signature info
      const transformedProjects: Project[] = (projectsData || []).map((p) => ({
        ...p,
        contract_signed: !!(p.contracts?.client_signed_at && p.contracts?.professional_signed_at),
        client_signed_at: p.contracts?.client_signed_at || null,
        professional_signed_at: p.contracts?.professional_signed_at || null,
        professional_name: p.profiles?.company_name || p.profiles?.full_name || null,
      }));

      setProjects(transformedProjects);

      const activeProjects = transformedProjects?.filter(p => p.status === 'open' || p.status === 'in_progress').length || 0;
      const totalProjects = transformedProjects?.length || 0;
      
      const projectIds = transformedProjects?.map(p => p.id) || [];

      // Fetch proposals with details
      await fetchProposals(projectIds);

      // Count proposals still awaiting the client's decision (matches the
      // "à examiner" label and the Offres tab, which both show pending only)
      const { count: proposalsCount } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('status', 'pending');

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
      await generateActivities(transformedProjects || [], userId);
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

  const fetchActiveProjectsAndReports = async (userId: string) => {
    try {
      // Fetch projects with assigned professional
      // Note: This requires migration 031_project_workflow_notifications.sql to be applied
      const { data: assignedProjectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          category,
          progress_percentage,
          progress_status,
          current_phase,
          contract_id,
          assigned_professional_id,
          profiles:assigned_professional_id (full_name, company_name),
          contracts:contract_id (client_signed_at, professional_signed_at)
        `)
        .eq('client_id', userId)
        .not('assigned_professional_id', 'is', null)
        .order('updated_at', { ascending: false });

      // If columns don't exist yet (migration not applied), silently return
      if (projectsError) {
        console.warn('Active projects query failed (migration 031 may not be applied yet):', projectsError.message);
        setActiveProjects([]);
        setProjectReports([]);
        return;
      }

      if (assignedProjectsData && assignedProjectsData.length > 0) {
        const projectIds = assignedProjectsData.map(p => p.id);
        
        // Count unread reports for each project (project_reports table may not exist)
        const unreadCountByProject: Record<string, number> = {};
        try {
          const { data: reportsCount } = await supabase
            .from('project_reports')
            .select('project_id')
            .in('project_id', projectIds)
            .eq('is_read_by_client', false);
          
          reportsCount?.forEach(r => {
            unreadCountByProject[r.project_id] = (unreadCountByProject[r.project_id] || 0) + 1;
          });
        } catch (e) {
          console.warn('project_reports table may not exist yet');
        }

        const formattedProjects: ActiveProject[] = assignedProjectsData.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          progress_percentage: p.progress_percentage || 0,
          progress_status: p.progress_status || 'not_started',
          current_phase: p.current_phase,
          professional_name: p.profiles?.company_name || p.profiles?.full_name || 'Entrepreneur',
          professional_id: p.assigned_professional_id,
          contract_id: p.contract_id,
          contract_signed: !!(p.contracts?.client_signed_at && p.contracts?.professional_signed_at),
          unread_reports: unreadCountByProject[p.id] || 0,
        }));

        setActiveProjects(formattedProjects);

        // Fetch recent reports (table may not exist)
        try {
          const { data: reportsData } = await supabase
            .from('project_reports')
            .select(`
              id,
              project_id,
              title,
              content,
              report_type,
              progress_percentage,
              created_at,
              is_read_by_client,
              projects:project_id (title),
              profiles:professional_id (full_name, company_name)
            `)
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })
            .limit(10);

          if (reportsData) {
            const formattedReports: ProjectReport[] = reportsData.map((r) => ({
              id: r.id,
              project_id: r.project_id,
              project_title: r.projects?.title || 'Projet',
              title: r.title,
              content: r.content,
              report_type: r.report_type,
              progress_percentage: r.progress_percentage,
              professional_name: r.profiles?.company_name || r.profiles?.full_name || 'Entrepreneur',
              created_at: r.created_at,
              is_read_by_client: r.is_read_by_client,
            }));
            setProjectReports(formattedReports);
          }
        } catch (e) {
          console.warn('Could not fetch project reports');
          setProjectReports([]);
        }
      } else {
        setActiveProjects([]);
        setProjectReports([]);
      }
    } catch (error) {
      console.warn('Error fetching active projects (migration may not be applied):', error);
      setActiveProjects([]);
      setProjectReports([]);
    }
  };

  const markReportAsRead = async (reportId: string) => {
    try {
      await supabase
        .from('project_reports')
        .update({ is_read_by_client: true })
        .eq('id', reportId);

      // Update local state
      setProjectReports(prev => 
        prev.map(r => r.id === reportId ? { ...r, is_read_by_client: true } : r)
      );
    } catch (error) {
      console.error('Error marking report as read:', error);
    }
  };

  const fetchPendingContracts = async (userId: string) => {
    try {
      // Fetch contracts where client hasn't signed yet
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
          profiles:professional_id (full_name, company_name)
        `)
        .eq('client_id', userId)
        .is('client_signed_at', null)
        .in('status', ['draft', 'pending_client_signature', 'pending_professional_signature', 'pending_both_signatures'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching pending contracts:', error.message);
        setPendingContracts([]);
        return;
      }

      if (contractsData) {
        const formatted: PendingContract[] = contractsData.map((c) => ({
          id: c.id,
          title: c.title,
          project_title: c.projects?.title || null,
          project_id: c.project_id,
          professional_name: c.profiles?.full_name || 'Entrepreneur',
          company_name: c.profiles?.company_name || null,
          total_amount: c.total_amount,
          created_at: c.created_at,
          client_signed_at: c.client_signed_at,
          professional_signed_at: c.professional_signed_at,
        }));
        setPendingContracts(formatted);
      }
    } catch (error) {
      console.warn('Error fetching pending contracts:', error);
      setPendingContracts([]);
    }
  };

  const fetchAllContracts = async (userId: string) => {
    try {
      // Fetch all contracts for the client (signed first, then pending)
      const { data: contractsData, error } = await supabase
        .from('contracts')
        .select(`
          id,
          title,
          project_id,
          total_amount,
          status,
          created_at,
          client_signed_at,
          professional_signed_at,
          projects:project_id (title),
          profiles:professional_id (full_name, company_name)
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching all contracts:', error.message);
        setAllContracts([]);
        return;
      }

      if (contractsData) {
        const formatted: ClientContract[] = contractsData.map((c) => ({
          id: c.id,
          title: c.title,
          project_title: c.projects?.title || null,
          project_id: c.project_id,
          professional_name: c.profiles?.full_name || 'Entrepreneur',
          company_name: c.profiles?.company_name || null,
          total_amount: c.total_amount,
          status: c.status,
          created_at: c.created_at,
          client_signed_at: c.client_signed_at,
          professional_signed_at: c.professional_signed_at,
        }));
        
        // Sort: fully signed first, then pending signature, then others
        formatted.sort((a, b) => {
          const aFullySigned = a.client_signed_at && a.professional_signed_at;
          const bFullySigned = b.client_signed_at && b.professional_signed_at;
          const aPending = !a.client_signed_at;
          const bPending = !b.client_signed_at;
          
          if (aPending && !bPending) return -1; // Pending first (needs action)
          if (!aPending && bPending) return 1;
          if (aFullySigned && !bFullySigned) return -1;
          if (!aFullySigned && bFullySigned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setAllContracts(formatted);
      }
    } catch (error) {
      console.warn('Error fetching all contracts:', error);
      setAllContracts([]);
    }
  };

  const fetchMilestoneTransactions = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('contract_milestones')
        .select(`
          id, title, amount, status, validated_at, created_at,
          contracts:contract_id (
            id, title, project_id,
            projects:project_id (title),
            profiles:professional_id (full_name)
          )
        `)
        .eq('contracts.client_id', userId)
        .order('created_at', { ascending: false });

      if (data) {
        const formatted = data
          .filter((m) => m.contracts)
          .map((m) => ({
            id: m.id,
            title: m.title,
            contract_title: m.contracts?.title || '',
            contract_id: m.contracts?.id || '',
            project_title: m.contracts?.projects?.title || null,
            professional_name: m.contracts?.profiles?.full_name || 'Entrepreneur',
            amount: m.amount,
            status: m.status,
            validated_at: m.validated_at,
            created_at: m.created_at,
          }));
        setMilestonesTransactions(formatted);
      }
    } catch (error) {
      console.warn('Error fetching milestone transactions:', error);
    }
  };

  const handleDownloadInvoice = (contract: ClientContract) => {
    const doc = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Facture — ${contract.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
    h1 { color: #0066cc; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f0f5ff; }
    .total { font-size: 1.2em; font-weight: bold; text-align: right; margin-top: 20px; }
    .footer { margin-top: 40px; font-size: 0.85em; color: #666; }
  </style>
</head>
<body>
  <h1>BâtirNet — Facture</h1>
  <p><strong>Date :</strong> ${format(new Date(), 'PPP', { locale: fr })}</p>
  <p><strong>Contrat :</strong> ${contract.title}</p>
  ${contract.project_title ? `<p><strong>Projet :</strong> ${contract.project_title}</p>` : ''}
  <p><strong>Entrepreneur :</strong> ${contract.professional_name}${contract.company_name ? ` — ${contract.company_name}` : ''}</p>
  <p><strong>Statut du contrat :</strong> ${contract.status === 'active' ? 'Actif' : contract.status}</p>
  <table>
    <thead><tr><th>Description</th><th>Montant</th></tr></thead>
    <tbody>
      <tr><td>${contract.title}</td><td>${contract.total_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td></tr>
    </tbody>
  </table>
  <p class="total">Total : ${contract.total_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
  <div class="footer">
    <p>BâtirNet — Plateforme de mise en relation pour la construction au Québec</p>
    <p>Ce document est généré automatiquement et ne constitue pas une facture officielle sans signature.</p>
  </div>
</body>
</html>`;
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${contract.id.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
            title: t('notifications.types.project_update'),
            description: t('notifications.types.project_updated_desc', { title: project.title }),
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
            title: t('notifications.types.new_proposal'),
            description: t('notifications.types.proposal_received_desc', { 
              name: proposal.profiles?.full_name || t('notifications.types.a_professional') 
            }),
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
        title: t('dashboard.projects.delete_success.title'),
        description: t('dashboard.projects.delete_success.description'),
      });

      // Refresh projects
      if (user) {
        await fetchStats(user.id);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('dashboard.projects.delete_error'),
      });
    }
  };

  const handleEditProject = (projectId: string) => {
    navigate(`/edit-project/${projectId}`);
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleExportProjectsPDF = () => {
    if (projects.length === 0) {
      toast({
        variant: "destructive",
        title: t('dashboard.projects.no_projects'),
        description: t('dashboard.export.no_projects_to_export'),
      });
      return;
    }

    exportProjectsToPDF(projects, profile);
    toast({
      title: t('dashboard.export.in_progress'),
      description: t('dashboard.export.pdf_generating'),
    });
  };

  const handleExportActivityPDF = () => {
    if (activities.length === 0) {
      toast({
        variant: "destructive",
        title: t('dashboard.recent_activity.no_activity'),
        description: t('dashboard.export.no_activity_to_export'),
      });
      return;
    }

    exportActivityToPDF(activities, profile);
    toast({
      title: t('dashboard.export.in_progress'),
      description: t('dashboard.export.pdf_generating'),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Navigation />
        <div className="flex-1 pt-16 sm:pt-20 md:pt-24 pb-6 sm:pb-8 md:pb-12">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="mb-4 sm:mb-6 md:mb-8 space-y-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-7 w-10 bg-muted animate-pulse rounded" />
                    <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navigation />
      
      <div className="flex-1 pt-16 sm:pt-20 md:pt-24 pb-6 sm:pb-8 md:pb-12">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
              Bonjour, {profile?.full_name || 'Client'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-3 md:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[11px] sm:text-xs md:text-sm font-medium truncate pr-1 sm:pr-2">Projets actifs</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.activeProjects}</div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">
                  sur {stats.totalProjects} total
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-3 md:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[11px] sm:text-xs md:text-sm font-medium truncate pr-1 sm:pr-2">Propositions</CardTitle>
                <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.proposalsReceived}</div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">
                  à examiner
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-3 md:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[11px] sm:text-xs md:text-sm font-medium truncate pr-1 sm:pr-2">Favoris</CardTitle>
                <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.favoritesPros}</div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">
                  professionnels
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-2.5 sm:p-3 md:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[11px] sm:text-xs md:text-sm font-medium truncate pr-1 sm:pr-2">Contrats</CardTitle>
                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{allContracts.length}</div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">
                  en cours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            // Update URL without adding to history
            setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true });
          }} className="space-y-4 sm:space-y-6">
            {/* Mobile-friendly scrollable tabs container */}
            <div className="relative -mx-4 sm:mx-0">
              <div 
                className="overflow-x-auto px-4 sm:px-0 pb-2 scroll-momentum scrollbar-thin"
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'thin'
                }}
              >
                <TabsList className="inline-flex w-max min-w-full sm:w-full sm:min-w-0 h-auto p-1 sm:p-1.5 gap-0.5 sm:gap-1">
                  <TabsTrigger value="overview" className="flex-shrink-0 min-w-fit px-2.5 sm:px-3 py-2 sm:py-2.5 gap-1 sm:gap-1.5 touch-target">
                    <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[11px] sm:text-xs md:text-sm whitespace-nowrap">Accueil</span>
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="flex-shrink-0 min-w-fit px-2.5 sm:px-3 py-2 sm:py-2.5 gap-1 sm:gap-1.5 touch-target">
                    <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[11px] sm:text-xs md:text-sm whitespace-nowrap">Projets</span>
                  </TabsTrigger>
                  <TabsTrigger value="proposals" className="flex-shrink-0 min-w-fit px-2.5 sm:px-3 py-2 sm:py-2.5 gap-1 sm:gap-1.5 touch-target">
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[11px] sm:text-xs md:text-sm whitespace-nowrap">Offres</span>
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="flex-shrink-0 min-w-fit px-2.5 sm:px-3 py-2 sm:py-2.5 gap-1 sm:gap-1.5 touch-target">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[11px] sm:text-xs md:text-sm whitespace-nowrap">Contrats</span>
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="flex-shrink-0 min-w-fit px-2.5 sm:px-3 py-2 sm:py-2.5 gap-1 sm:gap-1.5 touch-target">
                    <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[11px] sm:text-xs md:text-sm whitespace-nowrap">Factures</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex-shrink-0 min-w-fit px-2.5 sm:px-3 py-2 sm:py-2.5 gap-1 sm:gap-1.5 touch-target">
                    <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[11px] sm:text-xs md:text-sm whitespace-nowrap">Activité</span>
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="flex-shrink-0 min-w-fit px-2.5 sm:px-3 py-2 sm:py-2.5 gap-1 sm:gap-1.5 touch-target">
                    <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[11px] sm:text-xs md:text-sm whitespace-nowrap">Favoris</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* Fade gradient indicators for scroll */}
              <div className="absolute left-0 top-0 bottom-2 w-4 bg-gradient-to-r from-background to-transparent pointer-events-none sm:hidden" />
              <div className="absolute right-0 top-0 bottom-2 w-4 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.quick_actions.title')}</CardTitle>
                    <CardDescription>
                      {t('dashboard.quick_actions.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      size="lg"
                      onClick={() => navigate("/dashboard/new-project")}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      {t('dashboard.quick_actions.new_project')}
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboard.recent_activity.title')}</CardTitle>
                    <CardDescription>
                      {t('dashboard.recent_activity.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.totalProjects === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>{t('dashboard.recent_activity.no_activity')}</p>
                        <p className="text-sm mt-1">{t('dashboard.recent_activity.create_first')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>{t('dashboard.recent_activity.account_created')}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Pending Contracts - Contracts awaiting signature */}
              {pendingContracts.length > 0 && (
                <Card className="border-warning/30 bg-warning-light">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-warning" />
                      Contrats en attente de signature
                      <Badge variant="destructive" className="ml-2">{pendingContracts.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Ces contrats nécessitent votre signature pour démarrer les travaux
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingContracts.map((contract) => (
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
                                <p>De: {contract.company_name || contract.professional_name}</p>
                                <p className="font-medium text-foreground">
                                  Montant: {contract.total_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="outline" className="bg-warning-light text-warning border-warning/50">
                                En attente
                              </Badge>
                              {contract.professional_signed_at && (
                                <span className="text-xs text-success flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Signé par l'entrepreneur
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              Reçu le {format(new Date(contract.created_at), 'dd MMM yyyy', { locale: fr })}
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

              {/* Active Projects section removed - redundant with Projects tab */}

              {/* Recent Reports */}
              {projectReports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      Rapports récents
                    </CardTitle>
                    <CardDescription>
                      Dernières mises à jour de vos entrepreneurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {projectReports.slice(0, 5).map((report) => (
                        <div 
                          key={report.id} 
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            !report.is_read_by_client ? 'bg-primary-light border-primary/20' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            if (!report.is_read_by_client) {
                              markReportAsRead(report.id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{report.title}</h4>
                                {!report.is_read_by_client && (
                                  <Badge variant="default" className="text-xs">Nouveau</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {report.project_title} • {report.professional_name}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2">{report.content}</p>
                              {report.progress_percentage !== null && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Progress value={report.progress_percentage} className="h-1.5 flex-1 max-w-32" />
                                  <span className="text-xs font-medium">{report.progress_percentage}%</span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                              {format(new Date(report.created_at), 'dd MMM', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Getting Started Guide */}
              {stats.totalProjects === 0 && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {t('dashboard.getting_started.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('dashboard.getting_started.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <span className="text-sm font-semibold text-primary">1</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{t('dashboard.getting_started.step1_title')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t('dashboard.getting_started.step1_desc')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <span className="text-sm font-semibold text-primary">2</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{t('dashboard.getting_started.step2_title')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t('dashboard.getting_started.step2_desc')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <span className="text-sm font-semibold text-primary">3</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{t('dashboard.getting_started.step3_title')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t('dashboard.getting_started.step3_desc')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <span className="text-sm font-semibold text-primary">4</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{t('dashboard.getting_started.step4_title')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t('dashboard.getting_started.step4_desc')}
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
                      <CardTitle>{t('dashboard.projects.title')}</CardTitle>
                      <CardDescription>
                        {t('dashboard.projects.description')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {projects.length > 0 && (
                        <Button variant="outline" size="sm" onClick={handleExportProjectsPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          {t('dashboard.export.export_pdf')}
                        </Button>
                      )}
                      <Button onClick={() => navigate("/dashboard/new-project")}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('dashboard.projects.new_project')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-4">{t('common.loading')}</p>
                    </div>
                  ) : stats.totalProjects === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t('dashboard.projects.no_projects')}</h3>
                      <p className="text-muted-foreground mb-6">
                        {t('dashboard.projects.create_first')}
                      </p>
                      <Button onClick={() => navigate("/dashboard/new-project")}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('dashboard.quick_actions.new_project')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder={t('dashboard.projects.search_placeholder')}
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {([
                            { value: 'all', label: t('dashboard.projects.filter_all') },
                            { value: 'open', label: t('dashboard.projects.filter_open') },
                            { value: 'in_progress', label: t('dashboard.projects.filter_in_progress') },
                            { value: 'completed', label: t('dashboard.projects.filter_completed') },
                          ] as const).map((opt) => (
                            <Button
                              key={opt.value}
                              type="button"
                              size="sm"
                              variant={projectStatusFilter === opt.value ? 'default' : 'outline'}
                              onClick={() => setProjectStatusFilter(opt.value)}
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {(() => {
                        const term = projectSearch.trim().toLowerCase();
                        const filteredProjects = projects.filter((p) => {
                          const matchesStatus =
                            projectStatusFilter === 'all' ? true : p.status === projectStatusFilter;
                          const matchesTerm =
                            term === '' ||
                            p.title.toLowerCase().includes(term) ||
                            (p.category || '').toLowerCase().includes(term);
                          return matchesStatus && matchesTerm;
                        });
                        if (filteredProjects.length === 0) {
                          return (
                            <div className="text-center py-10 text-muted-foreground">
                              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                              <p>{t('dashboard.projects.no_results')}</p>
                            </div>
                          );
                        }
                        return (
                    <ProjectList
                      projects={[...filteredProjects].sort((a, b) => {
                        // Projects with signed contracts first
                        const aSigned = a.contract_signed === true;
                        const bSigned = b.contract_signed === true;
                        const aHasPendingContract = a.contract_id && !a.contract_signed;
                        const bHasPendingContract = b.contract_id && !b.contract_signed;
                        const aInProgress = a.status === 'in_progress';
                        const bInProgress = b.status === 'in_progress';
                        
                        // Signed contracts first
                        if (aSigned && !bSigned) return -1;
                        if (!aSigned && bSigned) return 1;
                        
                        // Then pending contracts
                        if (aHasPendingContract && !bHasPendingContract) return -1;
                        if (!aHasPendingContract && bHasPendingContract) return 1;
                        
                        // Then in progress
                        if (aInProgress && !bInProgress) return -1;
                        if (!aInProgress && bInProgress) return 1;
                        
                        // Then by date
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      })}
                      onDelete={handleDeleteProject}
                      onEdit={handleEditProject}
                      onView={handleViewProject}
                      onProjectCompleted={() => {
                        if (user?.id) {
                          fetchStats(user.id);
                          fetchActiveProjectsAndReports(user.id);
                        }
                      }}
                    />
                        );
                      })()}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Proposals Tab */}
            <TabsContent value="proposals">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.proposals.title')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.proposals.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProposalsList 
                    proposals={proposals} 
                    onStatusUpdate={() => {
                      // Refresh proposals and stats after status update
                      const projectIds = projects.map(p => p.id);
                      fetchProposals(projectIds);
                      if (user?.id) {
                        fetchStats(user.id);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contracts Tab */}
            <TabsContent value="contracts">
              <ClientContractsTab contracts={allContracts} />
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <ClientInvoicesTab
                contracts={allContracts}
                milestones={milestonesTransactions}
                onDownloadInvoice={handleDownloadInvoice}
              />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('dashboard.activity_timeline.title')}</CardTitle>
                      <CardDescription>
                        {t('dashboard.activity_timeline.description')}
                      </CardDescription>
                    </div>
                    {activities.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleExportActivityPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('dashboard.export.export_pdf')}
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
                  <CardTitle>{t('dashboard.favorites.title')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.favorites.description')}
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

