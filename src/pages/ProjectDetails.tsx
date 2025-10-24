import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Clock
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

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  completed: 'Complété',
  cancelled: 'Annulé',
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Formulaire de proposition
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalBudget, setProposalBudget] = useState('');
  const [proposalDelay, setProposalDelay] = useState('');

  useEffect(() => {
    fetchProjectDetails();
    fetchCurrentUser();
    incrementViewCount();
  }, [id]);

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
      toast.error('Impossible de charger les détails du projet');
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
      toast.error('Vous devez être connecté en tant que professionnel');
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
            title: 'Nouveau message',
            message: `${currentUser.company_name || currentUser.full_name} vous a envoyé un message concernant votre projet "${project.title}"`,
            metadata: { conversation_id: conversationId, project_id: id },
          });
      }

      // Rediriger vers la conversation spécifique
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      toast.error('Erreur lors de l\'ouverture de la conversation');
    }
  };

  const handleSubmitProposal = async () => {
    if (!currentUser || currentUser.user_type !== 'professional') {
      toast.error('Vous devez être connecté en tant que professionnel pour soumettre une proposition');
      return;
    }

    if (!proposalMessage.trim()) {
      toast.error('Veuillez entrer un message');
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
        toast.error('Vous avez déjà soumis une proposition pour ce projet');
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
          metadata: { 
            project_id: id, 
            proposal_id: proposalData.id,
            conversation_id: conversationId 
          },
        });

      toast.success('Proposition envoyée avec succès !');
      setProposalMessage('');
      setProposalBudget('');
      setProposalDelay('');
      
      // Rediriger vers le dashboard pour voir les propositions
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la proposition:', error);
      toast.error('Erreur lors de l\'envoi de la proposition');
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
            <p className="text-muted-foreground mb-4">Ce projet n'existe pas ou a été supprimé.</p>
            <Button onClick={() => navigate('/projects')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux projets
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
          onClick={() => navigate('/projects')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux projets
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
              <Card>
                <CardHeader>
                  <CardTitle>Soumettre une proposition</CardTitle>
                  <CardDescription>
                    Présentez votre offre au client pour ce projet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Décrivez votre expertise, votre approche pour ce projet..."
                      value={proposalMessage}
                      onChange={(e) => setProposalMessage(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget proposé ($)</Label>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="ex: 25000"
                        value={proposalBudget}
                        onChange={(e) => setProposalBudget(e.target.value)}
                        min="0"
                        step="100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delay">Délai estimé (jours)</Label>
                      <Input
                        id="delay"
                        type="number"
                        placeholder="ex: 30"
                        value={proposalDelay}
                        onChange={(e) => setProposalDelay(e.target.value)}
                        min="1"
                        step="1"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSubmitProposal} 
                    disabled={submitting || !proposalMessage.trim()}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? 'Envoi en cours...' : 'Envoyer la proposition'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

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
                    onClick={() => navigate('/messages')}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Voir les propositions
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

