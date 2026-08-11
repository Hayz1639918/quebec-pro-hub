import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { getMyProfile } from '@/services/profile-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProfessionalProposalForm from '@/components/forms/ProfessionalProposalForm';
import {
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  User,
  MessageSquare,
  ArrowLeft,
  Send,
  Eye,
  Clock,
  FileText,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Paperclip,
  Image as ImageIcon,
  FileDown,
  X,
  XCircle,
  FolderOpen,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import ProjectReportsTab, { type ProjectReport } from '@/components/projects/ProjectReportsTab';
import ProjectFilesTab, { type ProjectImage } from '@/components/projects/ProjectFilesTab';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  city: string;
  region: string;
  status: string;
  deadline: string | null;
  created_at: string;
  proposals_count: number;
  views_count: number;
  client_id: string;
  contract_id?: string | null;
  assigned_professional_id?: string | null;
  progress_percentage?: number;
  current_phase?: string | null;
}

interface ProjectContract {
  id: string;
  title: string;
  status: string;
  total_amount: number;
  created_at: string;
  client_signed_at: string | null;
  professional_signed_at: string | null;
  professional_name: string;
  company_name: string | null;
}

interface AcceptedProposal {
  id: string;
  message: string;
  estimated_budget: number | null;
  estimated_duration_days: number | null;
  created_at: string;
  professional_name: string;
  company_name: string | null;
}


interface Profile {
  id: string;
  full_name: string;
  user_type: string;
  company_name?: string;
}

type ClientProfile = Pick<Profile, 'id' | 'full_name' | 'company_name'>;


const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

const ProjectDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const STATUS_LABELS: Record<string, string> = {
    open: t('projects.status.open'),
    in_progress: t('projects.status.in_progress'),
    completed: t('projects.status.completed'),
    cancelled: t('projects.status.cancelled'),
  };
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [projectContract, setProjectContract] = useState<ProjectContract | null>(null);
  const [acceptedProposal, setAcceptedProposal] = useState<AcceptedProposal | null>(null);
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([]);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [allProposals, setAllProposals] = useState<Array<{
    id: string;
    message: string;
    estimated_budget: number | null;
    estimated_duration_days: number | null;
    status: string;
    created_at: string;
    professional_name: string;
    company_name: string | null;
  }>>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Array<{
    id: string;
    title: string;
    amount: number;
    status: string;
    due_date: string | null;
  }>>([]);

  // US-044: accepter / refuser une proposition directement depuis la fiche projet
  const [processingProposalId, setProcessingProposalId] = useState<string | null>(null);

  const handleProposalAction = async (proposalId: string, action: 'accept' | 'reject') => {
    setProcessingProposalId(proposalId);
    try {
      const { error } = await supabase.rpc(
        action === 'accept' ? 'accept_proposal' : 'reject_proposal',
        { proposal_uuid: proposalId }
      );
      if (error) throw error;
      if (action === 'accept') {
        toast.success('Proposition acceptée', {
          description: "Le projet passe en cours. L'entrepreneur peut maintenant préparer le contrat.",
        });
      } else {
        toast.success('Proposition refusée');
      }
      await Promise.all([fetchProjectDetails(), fetchProjectDocuments()]);
    } catch (err: unknown) {
      toast.error("Erreur lors de la mise à jour", {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    } finally {
      setProcessingProposalId(null);
    }
  };

  // US-038 + US-039: Marquer comme terminé + recommandations
  const [markingComplete, setMarkingComplete] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendedPros, setRecommendedPros] = useState<{
    id: string;
    full_name: string;
    company_name: string | null;
    services_offered: string | null;
    city: string | null;
    region: string | null;
    average_rating: number;
    total_reviews: number;
  }[]>([]);
  const handleMarkAsComplete = async () => {
    if (!project) return;
    setMarkingComplete(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', project.id);
      if (error) throw error;
      setProject(prev => prev ? { ...prev, status: 'completed' } : prev);
      // Fetch recommendations from same category
      await fetchRecommendations(project.category);
      setShowRecommendations(true);
      toast.success('Projet marqué comme terminé !');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setMarkingComplete(false);
    }
  };

  const fetchRecommendations = async (category: string) => {
    try {
      const { data } = await supabase
        .from('public_professional_profiles')
        .select('id, full_name, company_name, services_offered, city, region, average_rating, total_reviews')
        .eq('user_type', 'professional')
        .eq('is_rbq_verified', true)
        .ilike('services_offered', `%${category}%`)
        .order('average_rating', { ascending: false })
        .limit(3);
      if (data) setRecommendedPros(data);
      else {
        // Fallback: top rated professionals
        const { data: topPros } = await supabase
          .from('public_professional_profiles')
          .select('id, full_name, company_name, services_offered, city, region, average_rating, total_reviews')
          .eq('user_type', 'professional')
          .eq('is_rbq_verified', true)
          .order('average_rating', { ascending: false })
          .limit(3);
        setRecommendedPros(topPros || []);
      }
    } catch (e) {
      console.error('Error fetching recommendations:', e);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchCurrentUser();
  }, [id]);

  // Incrémenter le compteur de vues une fois que le projet et l'utilisateur sont chargés
  useEffect(() => {
    if (project && currentUser && currentUser.id !== project.client_id) {
      incrementViewCount();
    }
  }, [project?.id, currentUser?.id]);

  useEffect(() => {
    if (project?.id) {
      fetchProjectDocuments();
    }
  }, [project?.id]);

  const fetchProjectDocuments = async () => {
    if (!project?.id) return;

    try {
      // Fetch accepted proposal (soumission acceptée)
      const { data: proposalData } = await supabase
        .from('proposals')
        .select(`
          id,
          message,
          estimated_budget,
          estimated_duration_days,
          created_at,
          profiles:professional_id (full_name, company_name)
        `)
        .eq('project_id', project.id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (proposalData) {
        setAcceptedProposal({
          id: proposalData.id,
          message: proposalData.message,
          estimated_budget: proposalData.estimated_budget,
          estimated_duration_days: proposalData.estimated_duration_days,
          created_at: proposalData.created_at,
          professional_name: (proposalData.profiles as { full_name?: string | null; company_name?: string | null } | null)?.full_name || 'Entrepreneur',
          company_name: (proposalData.profiles as { full_name?: string | null; company_name?: string | null } | null)?.company_name || null,
        });
      }

      // Fetch contract if exists
      if (project.contract_id) {
        const { data: contractData } = await supabase
          .from('contracts')
          .select(`
            id,
            title,
            status,
            total_amount,
            created_at,
            client_signed_at,
            professional_signed_at,
            profiles:professional_id (full_name, company_name)
          `)
          .eq('id', project.contract_id)
          .single();

        if (contractData) {
          setProjectContract({
            id: contractData.id,
            title: contractData.title,
            status: contractData.status,
            total_amount: contractData.total_amount,
            created_at: contractData.created_at,
            client_signed_at: contractData.client_signed_at,
            professional_signed_at: contractData.professional_signed_at,
            professional_name: (contractData.profiles as { full_name?: string | null; company_name?: string | null } | null)?.full_name || 'Entrepreneur',
            company_name: (contractData.profiles as { full_name?: string | null; company_name?: string | null } | null)?.company_name || null,
          });
        }

        // US-045 — jalons pour la timeline d'avancement
        const { data: msData } = await supabase
          .from('contract_milestones')
          .select('id, title, amount, status, due_date')
          .eq('contract_id', project.contract_id)
          .order('created_at', { ascending: true });
        if (msData) setMilestones(msData);
      }

      // Fetch all proposals (for project owner's Documents tab)
      const { data: allProposalsData } = await supabase
        .from('proposals')
        .select(`
          id,
          message,
          estimated_budget,
          estimated_duration_days,
          status,
          created_at,
          profiles:professional_id (full_name, company_name)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (allProposalsData) {
        setAllProposals(allProposalsData.map((p) => ({
          id: p.id,
          message: p.message,
          estimated_budget: p.estimated_budget,
          estimated_duration_days: p.estimated_duration_days,
          status: p.status,
          created_at: p.created_at,
          professional_name: p.profiles?.full_name || 'Entrepreneur',
          company_name: p.profiles?.company_name || null,
        })));
      }

      // Fetch reports
      try {
        const { data: reportsData } = await supabase
          .from('project_reports')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false });

        if (reportsData) {
          setProjectReports(reportsData);
        }
      } catch (e) {
        // Table might not exist
        console.warn('Could not fetch project reports');
      }
    } catch (error) {
      console.warn('Error fetching project documents:', error);
    }
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await getMyProfile();
      setCurrentUser(profile);
    }
  };

  const fetchProjectDetails = async () => {
    if (!id) return;

    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;

      setProject(projectData);

      // Récupérer les infos du client
      const clientResult = projectData.status === 'open'
        ? await supabase
            .from('public_project_clients')
            .select('id, full_name, company_name')
            .eq('project_id', projectData.id)
            .single()
        : await supabase
            .from('profiles')
            .select('id, full_name, company_name')
            .eq('id', projectData.client_id)
            .single();
      const { data: clientData, error: clientError } = clientResult;

      if (clientError) throw clientError;
      setClient(clientData);

      // Récupérer les pièces jointes du projet
      const { data: imagesData } = await supabase
        .from('project_images')
        .select('*')
        .eq('project_id', id)
        .order('display_order', { ascending: true });

      if (imagesData) {
        setProjectImages(imagesData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      toast.error(t('project_details.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    if (!id || !project) return;
    
    // Vérifier si cette vue a déjà été comptée dans cette session
    const viewedKey = `project_viewed_${id}`;
    if (sessionStorage.getItem(viewedKey)) {
      return; // Déjà vu dans cette session
    }
    
    try {
      // Utiliser une requête RPC ou une mise à jour atomique
      const { error } = await supabase.rpc('increment_project_views', { project_uuid: id });
      
      if (error) {
        // Fallback si la fonction RPC n'existe pas
        await supabase
          .from('projects')
          .update({ views_count: project.views_count + 1 })
          .eq('id', id);
      }
      
      // Marquer comme vu dans cette session
      sessionStorage.setItem(viewedKey, 'true');
      
      // Mettre à jour l'état local
      setProject(prev => prev ? { ...prev, views_count: prev.views_count + 1 } : null);
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation des vues:', error);
    }
  };

  const handleContactClient = async () => {
    if (!currentUser || currentUser.user_type !== 'professional') {
      toast.error(t('project_details.error_pro_only'));
      return;
    }

    if (!project?.client_id) return;

    try {
      // Déterminer l'ordre des participants (participant_1_id doit être < participant_2_id)
      const participant1 = currentUser.id < project.client_id ? currentUser.id : project.client_id;
      const participant2 = currentUser.id < project.client_id ? project.client_id : currentUser.id;

      // Vérifier si une conversation existe déjà
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1_id', participant1)
        .eq('participant_2_id', participant2)
        .maybeSingle();

      let conversationId = existingConversation?.id;

      if (!conversationId) {
        // Créer une nouvelle conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            participant_1_id: participant1,
            participant_2_id: participant2,
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConversation.id;

        // Envoyer un message de présentation automatique
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: currentUser.id,
            receiver_id: project.client_id,
            content: `Bonjour, je suis intéressé(e) par votre projet "${project.title}". J'aimerais discuter des détails avec vous.`,
            project_id: id,
          });

        // Créer une notification pour le client
        await supabase
          .from('notifications')
          .insert({
            user_id: project.client_id,
            type: 'new_message',
            title: t('notifications.types.new_message'),
            message: `${currentUser.company_name || currentUser.full_name} ${t('messages.sent_message_about')} "${project.title}"`,
            action_url: `/messages?conversation=${conversationId}`,
            metadata: { conversation_id: conversationId, project_id: id },
          });
      }

      // Rediriger vers la conversation spécifique
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      toast.error(t('project_details.error_conversation'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Projet introuvable</h1>
            <p className="text-muted-foreground mb-4">{t('project_details.not_found_desc')}</p>
            <Button onClick={() => {
              if (currentUser?.user_type === 'client') {
                navigate('/dashboard?tab=projects');
              } else {
                navigate('/projects');
              }
            }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('project_details.back_to_projects')}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isProfessional = currentUser?.user_type === 'professional';
  const isProjectOwner = currentUser?.id === project.client_id;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        {/* Bouton retour */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => {
            if (currentUser?.user_type === 'client') {
              navigate('/dashboard?tab=projects');
            } else {
              navigate('/projects');
            }
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentUser?.user_type === 'client' ? 'Retour à mes projets' : t('project_details.back_to_projects')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations principales */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-3xl">{project.title}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={STATUS_COLORS[project.status]}>
                        {STATUS_LABELS[project.status] || project.status}
                      </Badge>
                      <Badge variant="outline">
                        <Tag className="mr-1 h-3 w-3" />
                        {project.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Localisation</p>
                      <p className="font-medium">{project.city}, {project.region}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium">
                        {project.budget_min && project.budget_max
                          ? `${project.budget_min.toLocaleString()} $ - ${project.budget_max.toLocaleString()} $`
                          : 'À discuter'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Publié le</p>
                      <p className="font-medium">
                        {format(new Date(project.created_at), 'PPP', { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {project.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Échéance</p>
                        <p className="font-medium">
                          {format(new Date(project.deadline), 'PPP', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-semibold">{project.proposals_count}</span> proposition{project.proposals_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-semibold">{project.views_count}</span> vue{project.views_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* US-045 — Avancement global + timeline des jalons */}
                {(project.status === 'in_progress' || project.status === 'completed') && (
                  (() => {
                    const paidLike = milestones.filter(m => m.status === 'approved' || m.status === 'paid').length;
                    const derived = milestones.length > 0
                      ? Math.round((paidLike / milestones.length) * 100)
                      : 0;
                    const pct = project.status === 'completed'
                      ? 100
                      : (typeof project.progress_percentage === 'number' && project.progress_percentage > 0
                          ? project.progress_percentage
                          : derived);
                    const msMeta: Record<string, { label: string; dot: string; text: string }> = {
                      pending:   { label: 'À venir',    dot: 'bg-gray-300',   text: 'text-muted-foreground' },
                      requested: { label: 'Demandé',    dot: 'bg-yellow-400', text: 'text-yellow-700' },
                      approved:  { label: 'Approuvé',   dot: 'bg-green-500',  text: 'text-green-700' },
                      paid:      { label: 'Payé',       dot: 'bg-green-600',  text: 'text-green-700' },
                      rejected:  { label: 'À revoir',   dot: 'bg-red-400',    text: 'text-red-700' },
                    };
                    return (
                      <>
                        <Separator />
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold flex items-center gap-2">
                              <ClipboardList className="h-4 w-4" />
                              Avancement
                            </h3>
                            <span className="text-sm font-medium">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                          {project.current_phase && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Phase actuelle : <span className="font-medium text-foreground">{project.current_phase}</span>
                            </p>
                          )}

                          {milestones.length > 0 && (
                            <div className="mt-4 relative pl-4">
                              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
                              <div className="space-y-3">
                                {milestones.map((m) => {
                                  const meta = msMeta[m.status] || msMeta.pending;
                                  return (
                                    <div key={m.id} className="relative flex items-start gap-3">
                                      <span className={`relative z-10 mt-1 h-2.5 w-2.5 rounded-full ${meta.dot} ring-2 ring-background shrink-0`} />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <p className="text-sm font-medium">{m.title}</p>
                                          <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          <span>{Number(m.amount).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                                          {m.due_date && <span>· échéance {format(new Date(m.due_date), 'dd MMM yyyy', { locale: fr })}</span>}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()
                )}

                {/* Section Pièces jointes */}
                {projectImages.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Pièces jointes ({projectImages.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {projectImages.map((image) => {
                          const isPDF = image.image_url.toLowerCase().includes('.pdf');
                          const fileName = image.image_url.split('/').pop() || 'fichier';
                          
                          return (
                            <div 
                              key={image.id}
                              className="relative group border rounded-lg overflow-hidden bg-gray-50 hover:border-primary transition-colors"
                            >
                              {isPDF ? (
                                // Affichage pour PDF
                                <div className="aspect-square flex flex-col items-center justify-center p-4">
                                  <FileText className="h-12 w-12 text-red-500 mb-2" />
                                  <span className="text-xs text-center text-muted-foreground truncate w-full px-2">
                                    {fileName}
                                  </span>
                                </div>
                              ) : (
                                // Affichage pour images
                                <div className="aspect-square">
                                  <img 
                                    src={image.image_url} 
                                    alt={image.caption || `Image ${image.display_order + 1}`}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setPreviewImage(image.image_url)}
                                  />
                                </div>
                              )}
                              
                              {/* Overlay avec actions */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {!isPDF && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPreviewImage(image.image_url)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => window.open(image.image_url, '_blank')}
                                >
                                  {isPDF ? <ExternalLink className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Formulaire de proposition (pour professionnels) */}
            {isProfessional && !isProjectOwner && project.status === 'open' && (
              <>
                {!showProposalForm ? (
                  <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="text-green-900">
                        Soumettre une soumission professionnelle
                      </CardTitle>
                      <CardDescription>
                        Remplissez une soumission détaillée conforme aux standards québécois avec export PDF
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-green-600">✓</span>
                          <span>Formulaire en 5 sections professionnelles</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-green-600">✓</span>
                          <span>Décomposition budgétaire détaillée</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-green-600">✓</span>
                          <span>Calendrier et équipe inclus</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-green-600">✓</span>
                          <span>Export PDF automatique (format québécois)</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setShowProposalForm(true)}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <Send className="mr-2 h-5 w-5" />
                        Créer ma soumission professionnelle
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Soumission professionnelle</CardTitle>
                      <CardDescription>
                        Remplissez tous les détails de votre proposition
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProfessionalProposalForm
                        projectId={project.id}
                        professionalId={currentUser.id}
                        onSuccess={() => {
                          setShowProposalForm(false);
                          toast.success('Soumission envoyée avec succès !');
                          // Refresh project data to update proposal count
                          fetchProjectDetails();
                        }}
                        onCancel={() => setShowProposalForm(false)}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Onglet Documents du projet - pour le client propriétaire */}
          {isProjectOwner && (
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Documents du projet
              </h2>

              <Tabs defaultValue="soumissions">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="soumissions" className="relative">
                    Soumissions
                    {allProposals.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs w-4 h-4 font-bold">
                        {allProposals.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="contrat">
                    Contrat
                    {projectContract && !projectContract.client_signed_at && (
                      <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-orange-500 text-white text-xs w-2 h-2" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="rapports" className="relative">
                    Rapports
                    {projectReports.filter(r => !r.is_read_by_client).length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs w-4 h-4 font-bold">
                        {projectReports.filter(r => !r.is_read_by_client).length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="fichiers">
                    Fichiers joints
                    {projectImages.length > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs w-4 h-4 font-bold">
                        {projectImages.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Soumissions */}
                <TabsContent value="soumissions" className="mt-4">
                  {allProposals.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>Aucune soumission reçue pour l'instant.</p>
                        <p className="text-sm mt-1">Les professionnels peuvent soumettre leurs offres depuis la page publique du projet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {allProposals.map((proposal) => {
                        const statusConfig: Record<string, { label: string; className: string }> = {
                          pending:  { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
                          accepted: { label: 'Acceptée',   className: 'bg-green-100 text-green-800 border-green-300' },
                          rejected: { label: 'Refusée',    className: 'bg-red-100 text-red-800 border-red-300' },
                        };
                        const cfg = statusConfig[proposal.status] || { label: proposal.status, className: '' };
                        return (
                          <Card
                            key={proposal.id}
                            className={proposal.status === 'accepted' ? 'border-green-300 bg-green-50/30' : ''}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <CardTitle className="text-base">
                                    {proposal.company_name || proposal.professional_name}
                                  </CardTitle>
                                  <CardDescription>
                                    Reçue le {format(new Date(proposal.created_at), 'dd MMM yyyy', { locale: fr })}
                                  </CardDescription>
                                </div>
                                <Badge className={cfg.className}>
                                  {proposal.status === 'accepted' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                  {cfg.label}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {proposal.estimated_budget && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {proposal.estimated_budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                                  </span>
                                )}
                                {proposal.estimated_duration_days && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {proposal.estimated_duration_days} jours
                                  </span>
                                )}
                              </div>
                              <p className="text-sm line-clamp-3 text-muted-foreground">{proposal.message}</p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/proposal/${proposal.id}`)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                                  Voir les détails
                                </Button>
                                {proposal.status === 'pending' && project.status === 'open' && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      disabled={processingProposalId === proposal.id}
                                      onClick={() => handleProposalAction(proposal.id, 'accept')}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                      Accepter
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive border-destructive/40 hover:bg-destructive/10"
                                      disabled={processingProposalId === proposal.id}
                                      onClick={() => handleProposalAction(proposal.id, 'reject')}
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                      Refuser
                                    </Button>
                                  </>
                                )}
                                {proposal.status === 'accepted' && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => navigate(`/proposal/${proposal.id}?showPDF=true`)}
                                  >
                                    <FileDown className="h-3.5 w-3.5 mr-1.5" />
                                    Télécharger PDF
                                  </Button>
                                )}
                              </div>
                              {proposal.status === 'accepted' && !projectContract && (
                                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span><strong>En attente du contrat</strong> — L'entrepreneur doit vous envoyer un contrat à signer.</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Onglet Contrat */}
                <TabsContent value="contrat" className="mt-4">
                  {!projectContract ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>Aucun contrat disponible pour ce projet.</p>
                        {acceptedProposal && (
                          <p className="text-sm mt-1">Une soumission a été acceptée — l'entrepreneur prépare le contrat.</p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className={projectContract.client_signed_at && projectContract.professional_signed_at ? 'border-green-300 bg-green-50/30' : 'border-orange-300 bg-orange-50/30'}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              {projectContract.title}
                            </CardTitle>
                            <CardDescription>
                              Par {projectContract.company_name || projectContract.professional_name}
                            </CardDescription>
                          </div>
                          {projectContract.client_signed_at && projectContract.professional_signed_at ? (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Signé
                            </Badge>
                          ) : !projectContract.client_signed_at ? (
                            <Badge className="bg-orange-500 text-white">À signer</Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                              En attente signature entrepreneur
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Montant: <span className="font-medium text-foreground">{projectContract.total_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></p>
                          <p>Créé le {format(new Date(projectContract.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                          {projectContract.client_signed_at && (
                            <p>Signé par vous le {format(new Date(projectContract.client_signed_at), 'dd MMM yyyy', { locale: fr })}</p>
                          )}
                          {projectContract.professional_signed_at && (
                            <p>Signé par l'entrepreneur le {format(new Date(projectContract.professional_signed_at), 'dd MMM yyyy', { locale: fr })}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => navigate(`/contracts?contract=${projectContract.id}`)}
                          className={!projectContract.client_signed_at ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {!projectContract.client_signed_at ? 'Voir et signer le contrat' : 'Voir le contrat'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Onglet Rapports */}
                <TabsContent value="rapports" className="mt-4">
                  <ProjectReportsTab
                    reports={projectReports}
                    onMarkAsRead={async (reportId) => {
                      try {
                        await supabase.from('project_reports').update({ is_read_by_client: true }).eq('id', reportId);
                        setProjectReports(prev => prev.map(r => r.id === reportId ? { ...r, is_read_by_client: true } : r));
                      } catch {
                        console.warn('Could not mark report as read');
                      }
                    }}
                  />
                </TabsContent>

                {/* Onglet Fichiers joints */}
                <TabsContent value="fichiers" className="mt-4">
                  <ProjectFilesTab images={projectImages} onPreview={setPreviewImage} />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Informations client */}
            {client && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{client.full_name}</p>
                      {client.company_name && (
                        <p className="text-sm text-muted-foreground">{client.company_name}</p>
                      )}
                    </div>
                  </div>

                  {isProfessional && !isProjectOwner && (
                    <>
                      <Separator />
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleContactClient}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contacter le client
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions pour le propriétaire */}
            {isProjectOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gérer le projet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/dashboard?tab=proposals')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Voir les offres
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/edit-project/${project.id}`)}
                  >
                    Modifier le projet
                  </Button>
                  {project.status !== 'completed' && project.status !== 'cancelled' && (
                    <Button
                      variant="default"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleMarkAsComplete}
                      disabled={markingComplete}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {markingComplete ? 'Mise à jour...' : 'Marquer comme terminé'}
                    </Button>
                  )}
                  {project.status === 'completed' && (
                    <Button
                      variant="outline"
                      className="w-full border-green-300 text-green-700"
                      onClick={() => fetchRecommendations(project.category).then(() => setShowRecommendations(true))}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Voir les recommandations
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Recommendations dialog (US-039) */}
      <Dialog open={showRecommendations} onOpenChange={setShowRecommendations}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              Projet terminé — Bravo !
            </DialogTitle>
            <DialogDescription>
              Merci d'avoir utilisé BâtirNet. Voici quelques professionnels recommandés pour votre prochain projet dans la même catégorie.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
            {(project.assigned_professional_id || acceptedProposal) && (
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1.5"
                onClick={() => {
                  setShowRecommendations(false);
                  if (project.assigned_professional_id) navigate(`/professional/${project.assigned_professional_id}`);
                }}
              >
                <ThumbsUp className="h-5 w-5 text-green-600" />
                <span className="text-xs font-medium">Réembaucher</span>
                <span className="text-[10px] text-muted-foreground line-clamp-1">
                  {acceptedProposal?.company_name || acceptedProposal?.professional_name || 'cet entrepreneur'}
                </span>
              </Button>
            )}
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={async () => {
                const shareUrl = `${window.location.origin}/`;
                const shareData = {
                  title: 'BâtirNet',
                  text: 'Je te recommande BâtirNet pour tes projets de construction et rénovation au Québec.',
                  url: shareUrl,
                };
                try {
                  if (navigator.share) await navigator.share(shareData);
                  else {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success('Lien copié — partagez-le avec un ami !');
                  }
                } catch { /* user cancelled share */ }
              }}
            >
              <User className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Parrainer un ami</span>
              <span className="text-[10px] text-muted-foreground">Partager BâtirNet</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => { setShowRecommendations(false); navigate('/dashboard/new-project'); }}
            >
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Nouveau projet</span>
              <span className="text-[10px] text-muted-foreground">Publier une demande</span>
            </Button>
          </div>
          <Separator />
          <p className="text-xs font-medium text-muted-foreground">Professionnels recommandés</p>
          <div className="space-y-3 py-2">
            {recommendedPros.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Aucune recommandation disponible pour le moment.</p>
            ) : recommendedPros.map((pro) => (
              <div key={pro.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{pro.company_name || pro.full_name}</p>
                  {pro.company_name && <p className="text-xs text-muted-foreground">{pro.full_name}</p>}
                  {(pro.city || pro.region) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {pro.city}{pro.city && pro.region && ', '}{pro.region}
                    </p>
                  )}
                  {pro.average_rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium">{pro.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({pro.total_reviews} avis)</span>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => { setShowRecommendations(false); navigate(`/professional/${pro.id}`); }}>
                  Voir le profil
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecommendations(false)}>Fermer</Button>
            <Button onClick={() => { setShowRecommendations(false); navigate('/professionals'); }}>
              Explorer tous les professionnels
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de prévisualisation d'image */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img 
              src={previewImage} 
              alt="Prévisualisation"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(previewImage, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir dans un nouvel onglet
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = previewImage;
                  link.download = previewImage.split('/').pop() || 'image';
                  link.click();
                }}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
