import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

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

interface ProjectReport {
  id: string;
  title: string;
  report_type: string;
  content: string;
  progress_percentage: number | null;
  created_at: string;
  is_read_by_client: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  user_type: string;
  company_name?: string;
}

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
  const [client, setClient] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [projectContract, setProjectContract] = useState<ProjectContract | null>(null);
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([]);
  
  // Formulaire de proposition (ancien - à garder pour compatibilité)
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalBudget, setProposalBudget] = useState('');
  const [proposalDelay, setProposalDelay] = useState('');

  useEffect(() => {
    fetchProjectDetails();
    fetchCurrentUser();
    incrementViewCount();
  }, [id]);

  useEffect(() => {
    if (project?.id) {
      fetchProjectDocuments();
    }
  }, [project?.id]);

  const fetchProjectDocuments = async () => {
    if (!project?.id) return;

    try {
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
            professional_name: (contractData.profiles as any)?.full_name || 'Entrepreneur',
            company_name: (contractData.profiles as any)?.company_name || null,
          });
        }
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
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
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', projectData.client_id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      toast.error(t('project_details.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    if (!id) return;
    
    try {
      await supabase
        .from('projects')
        .update({ views_count: (project?.views_count || 0) + 1 })
        .eq('id', id);
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
            type: 'message',
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

  const handleSubmitProposal = async () => {
    if (!currentUser || currentUser.user_type !== 'professional') {
      toast.error(t('project_details.error_pro_submit'));
      return;
    }

    if (!proposalMessage.trim()) {
      toast.error(t('project_details.error_message_required'));
      return;
    }

    setSubmitting(true);

    try {
      if (!project?.client_id) return;

      // Vérifier si une proposition existe déjà pour ce projet et ce professionnel
      const { data: existingProposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('project_id', id)
        .eq('professional_id', currentUser.id)
        .maybeSingle();

      if (existingProposal) {
        toast.error(t('project_details.error_already_submitted'));
        setSubmitting(false);
        return;
      }

      // Créer la proposition dans la table proposals
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .insert({
          project_id: id,
          professional_id: currentUser.id,
          message: proposalMessage.trim(),
          estimated_budget: proposalBudget ? parseFloat(proposalBudget) : null,
          estimated_duration_days: proposalDelay ? parseInt(proposalDelay) : null,
          status: 'pending',
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      // Incrémenter le compteur de propositions
      await supabase
        .from('projects')
        .update({ proposals_count: (project?.proposals_count || 0) + 1 })
        .eq('id', id);

      // Déterminer l'ordre des participants pour la conversation
      const participant1 = currentUser.id < project.client_id ? currentUser.id : project.client_id;
      const participant2 = currentUser.id < project.client_id ? project.client_id : currentUser.id;

      // Créer une conversation si elle n'existe pas
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1_id', participant1)
        .eq('participant_2_id', participant2)
        .maybeSingle();

      let conversationId = existingConversation?.id;

      if (!conversationId) {
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
      }

      // Envoyer un message pour notifier le client
      let messageContent = `📋 **Nouvelle proposition pour: ${project?.title}**\n\n${proposalMessage}`;
      
      if (proposalBudget) {
        messageContent += `\n\n💰 **Budget proposé:** ${proposalBudget} $`;
      }
      
      if (proposalDelay) {
        messageContent += `\n⏱️ **Délai estimé:** ${proposalDelay} jours`;
      }

      messageContent += `\n\n✨ Consultez la proposition complète dans votre espace "Propositions"`;

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          receiver_id: project.client_id,
          content: messageContent,
          project_id: id,
        });

      // Créer une notification pour le client
      await supabase
        .from('notifications')
        .insert({
          user_id: project?.client_id,
          type: 'proposal',
          title: 'Nouvelle proposition reçue',
          message: `${currentUser.company_name || currentUser.full_name} a soumis une proposition pour votre projet "${project?.title}"`,
          action_url: `/proposal/${proposalData.id}?showPDF=true`,
          metadata: { 
            project_id: id, 
            proposal_id: proposalData.id,
            conversation_id: conversationId 
          },
        });

      toast.success(t('project_details.success_submitted'));
      setProposalMessage('');
      setProposalBudget('');
      setProposalDelay('');
      
      // Rediriger vers le dashboard pour voir les propositions
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la proposition:', error);
      toast.error(t('project_details.error_sending'));
    } finally {
      setSubmitting(false);
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
      
      <main className="container mx-auto px-6 lg:px-8 pt-24 pb-12 flex-1">
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

          {/* Section Documents du projet - pour le client propriétaire */}
          {isProjectOwner && (projectContract || projectReports.length > 0) && (
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents du projet
              </h2>
              
              {/* Contrat */}
              {projectContract && (
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
                        <Badge className="bg-orange-500 text-white">
                          À signer
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                          En attente signature entrepreneur
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>Montant: <span className="font-medium text-foreground">{projectContract.total_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></p>
                        <p>Créé le {format(new Date(projectContract.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                      </div>
                      <Button 
                        onClick={() => navigate(`/contracts?contract=${projectContract.id}`)}
                        className={projectContract.client_signed_at ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {!projectContract.client_signed_at ? 'Voir et signer' : 'Voir le contrat'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rapports */}
              {projectReports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Rapports de l'entrepreneur ({projectReports.length})
                      {projectReports.filter(r => !r.is_read_by_client).length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {projectReports.filter(r => !r.is_read_by_client).length} nouveau(x)
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projectReports.map((report) => (
                        <div 
                          key={report.id}
                          className={`border rounded-lg p-4 transition-colors ${!report.is_read_by_client ? 'bg-blue-50 border-blue-300 shadow-sm' : 'hover:bg-muted/30'}`}
                          onClick={async () => {
                            if (!report.is_read_by_client) {
                              try {
                                await supabase
                                  .from('project_reports')
                                  .update({ is_read_by_client: true })
                                  .eq('id', report.id);
                                setProjectReports(prev => 
                                  prev.map(r => r.id === report.id ? { ...r, is_read_by_client: true } : r)
                                );
                              } catch (e) {
                                console.warn('Could not mark report as read');
                              }
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-lg">{report.title}</h4>
                                {!report.is_read_by_client && (
                                  <Badge className="bg-blue-600 text-xs">Nouveau</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground capitalize">
                                Type: {report.report_type.replace(/_/g, ' ')}
                              </p>
                            </div>
                            {report.progress_percentage !== null && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">Avancement</p>
                                <Badge variant="outline" className="text-lg font-bold">
                                  {report.progress_percentage}%
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 border mb-3">
                            <p className="text-sm whitespace-pre-wrap">{report.content}</p>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {format(new Date(report.created_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                            </span>
                            {!report.is_read_by_client && (
                              <span className="text-blue-600 font-medium">Cliquez pour marquer comme lu</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                    onClick={() => navigate('/dashboard')}
                  >
                    Modifier le projet
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectDetails;

