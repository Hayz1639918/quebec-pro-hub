import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Loader2, Send } from 'lucide-react';

interface InviteProfessionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
  /** Optional pre-selected project id so the dialog can be reused from a project page */
  projectId?: string;
  onInvited?: () => void;
}

interface ClientProject {
  id: string;
  title: string;
  status: string;
  alreadyInvited?: boolean;
}

const ELIGIBLE_STATUSES = ['draft', 'open', 'in_review'];

export const InviteProfessionalDialog = ({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  projectId,
  onInvited,
}: InviteProfessionalDialogProps) => {
  const { toast } = useToast();
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    void loadProjects();
    setSelectedProject(projectId || '');
    setMessage('');
  }, [open, projectId, professionalId]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Connexion requise',
          description: 'Veuillez vous connecter pour inviter un entrepreneur.',
        });
        onOpenChange(false);
        return;
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, status')
        .eq('client_id', user.id)
        .in('status', ELIGIBLE_STATUSES)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const projectIds = (projectsData || []).map((p: any) => p.id);
      const invitedSet = new Set<string>();
      if (projectIds.length > 0) {
        const { data: existing } = await (supabase as any)
          .from('project_invitations')
          .select('project_id')
          .eq('professional_id', professionalId)
          .in('project_id', projectIds);
        (existing || []).forEach((row: any) => invitedSet.add(row.project_id));
      }

      const enriched = (projectsData || []).map((p: any) => ({
        ...p,
        alreadyInvited: invitedSet.has(p.id),
      })) as ClientProject[];

      setProjects(enriched);

      if (projectId && enriched.some((p) => p.id === projectId)) {
        setSelectedProject(projectId);
      }
    } catch (e: any) {
      console.error('Error loading projects for invitation:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger vos projets.',
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const submit = async () => {
    if (!selectedProject) {
      toast({
        variant: 'destructive',
        title: 'Projet requis',
        description: 'Veuillez choisir le projet pour lequel vous invitez cet entrepreneur.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await (supabase as any).from('project_invitations').insert({
        project_id: selectedProject,
        client_id: user.id,
        professional_id: professionalId,
        message: message.trim() || null,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            variant: 'destructive',
            title: 'Déjà invité',
            description: 'Cet entrepreneur a déjà été invité sur ce projet.',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Invitation envoyée',
        description: `${professionalName} sera notifié(e) et pourra accepter ou décliner.`,
      });
      onOpenChange(false);
      onInvited?.();
    } catch (e: any) {
      console.error('Error sending invitation:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\u2019envoyer l\u2019invitation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const availableProjects = projects.filter((p) => !p.alreadyInvited);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Inviter à soumissionner
          </DialogTitle>
          <DialogDescription>
            Choisissez le projet sur lequel vous voulez que <strong>{professionalName}</strong> soumette une proposition.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Projet *</Label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de vos projets...
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Vous n'avez aucun projet ouvert. Créez d'abord un projet.
              </p>
            ) : (
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} disabled={p.alreadyInvited}>
                      {p.title}
                      {p.alreadyInvited && ' (déjà invité)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {projects.length > 0 && availableProjects.length === 0 && (
              <p className="text-xs text-amber-600">
                Tous vos projets ouverts ont déjà reçu une invitation pour cet entrepreneur.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Message personnalisé (optionnel)</Label>
            <Textarea
              rows={4}
              placeholder="Expliquez brièvement pourquoi vous l'invitez sur ce projet..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={
              submitting ||
              loadingProjects ||
              !selectedProject ||
              availableProjects.length === 0
            }
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer l'invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteProfessionalDialog;
