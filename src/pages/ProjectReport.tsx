import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Send,
  FileText,
  Camera,
  CheckCircle,
  AlertTriangle,
  Info,
  Wrench,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Project {
  id: string;
  title: string;
  category: string;
  city: string | null;
  progress_percentage: number;
  client_id: string;
  client_name: string;
}

const REPORT_TYPES = [
  { value: 'progress', label: 'Rapport d\'avancement', icon: Wrench, description: 'Mise à jour sur l\'avancement des travaux' },
  { value: 'milestone', label: 'Étape terminée', icon: CheckCircle, description: 'Une phase importante a été complétée' },
  { value: 'issue', label: 'Problème rencontré', icon: AlertTriangle, description: 'Signaler un problème ou un retard' },
  { value: 'photo', label: 'Rapport photos', icon: Camera, description: 'Partager des photos du chantier' },
  { value: 'completion', label: 'Fin des travaux', icon: CheckCircle, description: 'Les travaux sont terminés' },
];

const ProjectReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [reportType, setReportType] = useState('progress');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [includeProgress, setIncludeProgress] = useState(true);
  const [progressPercentage, setProgressPercentage] = useState(0);

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
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          category,
          city,
          progress_percentage,
          client_id,
          profiles:client_id (full_name, company_name)
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
        client_id: projectData.client_id,
        client_name: (projectData.profiles as any)?.company_name || (projectData.profiles as any)?.full_name || 'Client',
      };

      setProject(formattedProject);
      setProgressPercentage(formattedProject.progress_percentage);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Erreur lors du chargement du projet');
    }
  };

  const handleSendReport = async () => {
    if (!project || !userId) return;

    if (!title.trim()) {
      toast.error('Veuillez entrer un titre pour le rapport');
      return;
    }

    if (!content.trim()) {
      toast.error('Veuillez entrer un contenu pour le rapport');
      return;
    }

    setSending(true);
    try {
      // Create the report
      const { data: report, error: reportError } = await supabase
        .from('project_reports')
        .insert({
          project_id: project.id,
          professional_id: userId,
          title: title.trim(),
          content: content.trim(),
          report_type: reportType,
          progress_percentage: includeProgress ? progressPercentage : null,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Update project progress if included
      if (includeProgress) {
        await supabase
          .from('projects')
          .update({
            progress_percentage: progressPercentage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);
      }

      // Create notification for client (the trigger will also do this, but let's be explicit)
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', userId)
        .single();

      const professionalName = userData?.company_name || userData?.full_name || 'Votre entrepreneur';

      await supabase.from('notifications').insert({
        user_id: project.client_id,
        type: 'project_report',
        title: '📊 Nouveau rapport de projet',
        message: `${professionalName} a envoyé un rapport pour "${project.title}": ${title}`,
        related_project_id: project.id,
        action_url: `/dashboard?project=${project.id}`,
        metadata: {
          report_id: report.id,
          report_type: reportType,
          progress_percentage: includeProgress ? progressPercentage : null,
        },
      });

      toast.success('Rapport envoyé avec succès !');
      navigate(`/pro/project/${project.id}/progress`);
    } catch (error: any) {
      console.error('Error sending report:', error);
      toast.error('Erreur lors de l\'envoi du rapport');
    } finally {
      setSending(false);
    }
  };

  const getReportTypeInfo = () => {
    return REPORT_TYPES.find(rt => rt.value === reportType);
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

  const typeInfo = getReportTypeInfo();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="container mx-auto px-6 lg:px-8 pt-24 pb-12 flex-1">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate(`/pro/project/${project.id}/progress`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'avancement
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Send className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Envoyer un rapport</h1>
          </div>
          <p className="text-muted-foreground">
            Projet: {project.title} • Client: {project.client_name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Nouveau rapport</CardTitle>
                <CardDescription>
                  Tenez votre client informé de l'avancement des travaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Type Selection */}
                <div>
                  <Label className="mb-3 block">Type de rapport</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {REPORT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = reportType === type.value;
                      return (
                        <div
                          key={type.value}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setReportType(type.value)}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div>
                              <p className={`font-medium ${isSelected ? 'text-primary' : ''}`}>{type.label}</p>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">Titre du rapport</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`Ex: ${reportType === 'progress' ? 'Avancement semaine 3' : reportType === 'milestone' ? 'Toiture terminée' : 'Mise à jour du projet'}`}
                    className="mt-2"
                  />
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="content">Détails du rapport</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Décrivez l'état d'avancement, les travaux réalisés, les prochaines étapes..."
                    className="mt-2 min-h-[200px]"
                  />
                </div>

                {/* Include Progress */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="include-progress"
                    checked={includeProgress}
                    onCheckedChange={(checked) => setIncludeProgress(checked === true)}
                  />
                  <Label htmlFor="include-progress" className="cursor-pointer">
                    Inclure une mise à jour du pourcentage d'avancement
                  </Label>
                </div>

                {/* Progress Slider */}
                {includeProgress && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <Label className="mb-2 block">Nouvel avancement du projet</Label>
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
                    <Progress value={progressPercentage} className="h-2 mt-3" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Avancement actuel: {project.progress_percentage}%
                    </p>
                  </div>
                )}

                {/* Send Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSendReport}
                    disabled={sending || !title.trim() || !content.trim()}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Envoi en cours...' : 'Envoyer le rapport'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/pro/project/${project.id}/progress`)}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Tips */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aperçu du rapport</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    {typeInfo && <typeInfo.icon className="h-4 w-4 text-primary" />}
                    <Badge variant="secondary">{typeInfo?.label}</Badge>
                  </div>
                  <h4 className="font-semibold mb-2">{title || 'Titre du rapport'}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {content || 'Le contenu de votre rapport apparaîtra ici...'}
                  </p>
                  {includeProgress && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Avancement</span>
                        <span className="font-semibold">{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Conseils
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>• Envoyez des rapports réguliers pour maintenir la confiance du client</p>
                <p>• Incluez des détails sur les travaux réalisés et les prochaines étapes</p>
                <p>• Signalez rapidement les problèmes ou retards potentiels</p>
                <p>• Les rapports avec photos ont plus d'impact</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectReport;





