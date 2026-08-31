import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Hammer,
  FileText,
  MessageSquare,
  ClipboardList,
  Send,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { canUseProfessionalPlatform, getProfessionalCompletionRoute } from '@/lib/auth-routing';

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

const ProMyProjects = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([]);

  const dateLocale = i18n.language === 'fr' ? fr : enUS;

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }

      // Ensure professional
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_type, profile_completed, professional_type')
        .eq('id', session.user.id)
        .single();

      if (prof?.user_type !== 'professional') {
        navigate('/auth?mode=login', { replace: true });
        return;
      }

      if (!canUseProfessionalPlatform(prof)) {
        navigate(getProfessionalCompletionRoute(prof.professional_type), { replace: true });
        return;
      }

      await fetchAssignedProjects(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchAssignedProjects = async (uid: string) => {
    try {
      const { data: assignedProjectsData, error } = await supabase
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
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Error fetching assigned projects:', error.message);
        setAssignedProjects([]);
        return;
      }

      if (assignedProjectsData) {
        const formatted: AssignedProject[] = assignedProjectsData.map((p) => ({
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
        setAssignedProjects(formatted);
      }
    } catch (err) {
      console.warn('Could not fetch assigned projects:', err);
      setAssignedProjects([]);
    }
  };

  const getStatusBadge = (project: AssignedProject) => {
    if (!project.contract_id) {
      return <Badge variant="outline" className="border-warning text-warning">{t('pro_my_projects.status.awaiting_contract')}</Badge>;
    }
    if (!project.contract_signed) {
      return <Badge variant="outline" className="border-warning text-warning">{t('pro_my_projects.status.contract_to_sign')}</Badge>;
    }
    if (project.start_date && new Date(project.start_date) > new Date()) {
      return <Badge variant="outline" className="border-primary text-primary">{t('pro_my_projects.status.starts_on')} {format(new Date(project.start_date), 'dd MMM yyyy', { locale: dateLocale })}</Badge>;
    }
    if (project.progress_status === 'completed') {
      return <Badge className="bg-success">{t('pro_my_projects.status.completed')}</Badge>;
    }
    if (project.progress_status === 'in_progress') {
      return <Badge className="bg-primary">{t('pro_my_projects.status.in_progress')}</Badge>;
    }
    return <Badge variant="outline">{t('pro_my_projects.status.ready_to_start')}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 pt-24">
          <div>{t('common.loading')}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/pro/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('pro_my_projects.back_to_dashboard')}
          </Button>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Hammer className="h-8 w-8 text-primary" />
            {t('pro_my_projects.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('pro_my_projects.subtitle')}
          </p>
        </div>

        {assignedProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Hammer className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{t('pro_my_projects.no_projects')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('pro_my_projects.no_projects_description')}
              </p>
              <Button onClick={() => navigate('/projects')}>
                {t('pro_my_projects.browse_projects')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignedProjects.map((project) => {
              const canStart = project.contract_signed && 
                (!project.start_date || new Date(project.start_date) <= new Date());

              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Badge variant="outline">{project.category}</Badge>
                          {project.city && <span>• {project.city}</span>}
                          <span>• Client: {project.client_name}</span>
                        </div>
                        {getStatusBadge(project)}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {project.contract_signed && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">{t('pro_my_projects.progress')}</span>
                          <span className="font-semibold">{project.progress_percentage}%</span>
                        </div>
                        <Progress value={project.progress_percentage} className="h-3" />
                        {project.current_phase && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {t('pro_my_projects.current_phase')}: {project.current_phase}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                      {!project.contract_id && (
                        <Button
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => navigate(`/pro/contract-proposals/new?project=${project.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {t('pro_my_projects.create_contract')}
                        </Button>
                      )}
                      {project.contract_id && !project.contract_signed && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/contracts?contract=${project.contract_id}`)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {t('pro_my_projects.view_contract')}
                        </Button>
                      )}
                      {canStart && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/pro/project/${project.id}/progress`)}
                          >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            {t('pro_my_projects.manage_progress')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/pro/project/${project.id}/report`)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {t('pro_my_projects.send_report')}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/messages?user=${project.client_id}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t('pro_my_projects.contact_client')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProMyProjects;
