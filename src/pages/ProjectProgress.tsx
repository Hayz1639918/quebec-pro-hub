import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Hammer,
  CheckCircle,
  Clock,
  AlertCircle,
  Pause,
  Play,
  Save,
  Send,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Project {
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
  start_date: string | null;
  end_date: string | null;
}

interface ProjectReport {
  id: string;
  title: string;
  content: string;
  report_type: string;
  progress_percentage: number | null;
  created_at: string;
  is_read_by_client: boolean;
}

const PHASES = [
  'Préparation du chantier',
  'Fondations',
  'Structure',
  'Toiture',
  'Plomberie',
  'Électricité',
  'Isolation',
  'Finitions intérieures',
  'Peinture',
  'Finitions extérieures',
  'Nettoyage final',
  'Livraison',
];

const ProjectProgress = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [progressStatus, setProgressStatus] = useState('in_progress');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }
      setUserId(session.user.id);

      // Verify user is a professional
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profile?.user_type !== 'professional') {
        navigate('/');
        return;
      }

      await fetchProjectData(session.user.id);
      setLoading(false);
    })();
  }, [id]);

  const fetchProjectData = async (uid: string) => {
    if (!id) return;

    try {
      // Fetch project with client info
      const { data: projectData, error: projectError } = await supabase
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
          contracts:contract_id (start_date, end_date)
        `)
        .eq('id', id)
        .eq('assigned_professional_id', uid)
        .single();

      if (projectError || !projectData) {
        toast.error('Projet non trouvé ou accès non autorisé');
        navigate('/pro/dashboard');
        return;
      }

      const formattedProject: Project = {
        id: projectData.id,
        title: projectData.title,
        category: projectData.category,
        city: projectData.city,
        progress_percentage: projectData.progress_percentage || 0,
        progress_status: projectData.progress_status || 'not_started',
        current_phase: projectData.current_phase,
        contract_id: projectData.contract_id,
        client_id: projectData.client_id,
        client_name: (projectData.profiles as any)?.company_name || (projectData.profiles as any)?.full_name || 'Client',
        start_date: (projectData.contracts as any)?.start_date || null,
        end_date: (projectData.contracts as any)?.end_date || null,
      };

      setProject(formattedProject);
      setProgressPercentage(formattedProject.progress_percentage);
      setCurrentPhase(formattedProject.current_phase || '');
      setProgressStatus(formattedProject.progress_status);

      // Fetch reports
      const { data: reportsData } = await supabase
        .from('project_reports')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Erreur lors du chargement du projet');
    }
  };

  const handleSaveProgress = async () => {
    if (!project || !userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          progress_percentage: progressPercentage,
          current_phase: currentPhase || null,
          progress_status: progressStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)
        .eq('assigned_professional_id', userId);

      if (error) throw error;

      // Update local state
      setProject(prev => prev ? {
        ...prev,
        progress_percentage: progressPercentage,
        current_phase: currentPhase,
        progress_status: progressStatus,
      } : null);

      toast.success('Avancement mis à jour avec succès');
    } catch (error: any) {
      console.error('Error saving progress:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-600" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-600" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'paused':
        return 'En pause';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Non commencé';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="container mx-auto px-6 lg:px-8 py-12 flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="container mx-auto px-6 lg:px-8 py-12 flex-1">
          <p>Projet non trouvé</p>
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
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/pro/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Hammer className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{project.title}</h1>
          </div>
          <p className="text-muted-foreground">
            Client: {project.client_name} • {project.category}
            {project.city && ` • ${project.city}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Update Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(progressStatus)}
                  Gestion de l'avancement
                </CardTitle>
                <CardDescription>
                  Mettez à jour l'avancement du projet pour tenir votre client informé
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Slider */}
                <div>
                  <Label className="mb-2 block">Pourcentage d'avancement</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[progressPercentage]}
                      onValueChange={(values) => setProgressPercentage(values[0])}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold w-16 text-right">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3 mt-3" />
                </div>

                {/* Current Phase */}
                <div>
                  <Label htmlFor="phase">Phase actuelle</Label>
                  <Select value={currentPhase} onValueChange={setCurrentPhase}>
                    <SelectTrigger id="phase" className="mt-2">
                      <SelectValue placeholder="Sélectionnez une phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {PHASES.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                          {phase}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Statut du projet</Label>
                  <Select value={progressStatus} onValueChange={setProgressStatus}>
                    <SelectTrigger id="status" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Non commencé</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="paused">En pause</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveProgress} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/pro/project/${project.id}/report`)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer un rapport
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du projet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge variant={progressStatus === 'in_progress' ? 'default' : 'secondary'}>
                    {getStatusLabel(progressStatus)}
                  </Badge>
                </div>
                {project.start_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date de début</span>
                    <span>{format(new Date(project.start_date), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                )}
                {project.end_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date de fin prévue</span>
                    <span>{format(new Date(project.end_date), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                )}
                {project.contract_id && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/contracts?contract=${project.contract_id}`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Voir le contrat
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Rapports envoyés</CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun rapport envoyé</p>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 5).map((report) => (
                      <div key={report.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{report.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(report.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </p>
                          </div>
                          {report.is_read_by_client ? (
                            <Badge variant="secondary" className="text-xs">Lu</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Non lu</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectProgress;



