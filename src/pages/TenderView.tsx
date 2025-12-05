import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import TenderPDF from '@/components/pdf/TenderPDF';
import { 
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  Shield,
  ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const TenderView = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [project, setProject] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  
  // Vérifier si on doit afficher le PDF automatiquement
  const shouldShowPDF = searchParams.get('showPDF') === 'true';

  useEffect(() => {
    fetchTenderDetails();
  }, [id]);
  
  // Effet pour gérer l'affichage du PDF quand les données sont prêtes
  useEffect(() => {
    if (shouldShowPDF && project && client && !loading) {
      // Petit délai pour s'assurer que le DOM est prêt
      const timer = setTimeout(() => {
        setShowPDFViewer(true);
        setPdfReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldShowPDF, project, client, loading]);

  const fetchTenderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch from the view that includes client details
      const { data: tenderData, error: tenderError } = await supabase
        .from('tenders_complete')
        .select('*')
        .eq('id', id)
        .single();

      if (tenderError) throw tenderError;

      if (tenderData) {
        // Separate project and client data
        const {
          client_name,
          client_company,
          client_email,
          client_phone,
          ...projectData
        } = tenderData;

        setProject(projectData);
        setClient({
          full_name: client_name,
          company_name: client_company,
          email: client_email,
          phone: client_phone,
        });
      }
    } catch (error: any) {
      console.error('Error fetching tender:', error);
      toast.error('Erreur lors du chargement de l\'appel d\'offres');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Non spécifiée';
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Non spécifié';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Chargement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project || !client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Appel d'offres introuvable</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header avec actions */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPDFViewer(!showPDFViewer)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPDFViewer ? 'Masquer' : 'Prévisualiser'} PDF
            </Button>
            
            <PDFDownloadLink
              document={<TenderPDF project={project} client={client} />}
              fileName={`Appel_Offres_${project.tender_number || project.id}.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <Button className="gap-2" disabled={pdfLoading}>
                  <Download className="h-4 w-4" />
                  {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {/* Prévisualisation PDF */}
        {showPDFViewer && project && client && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <div style={{ height: '800px', width: '100%' }}>
                <PDFViewer 
                  key={`pdf-${project.id}-${pdfReady}`}
                  width="100%" 
                  height="100%"
                >
                  <TenderPDF project={project} client={client} />
                </PDFViewer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Détails de l'appel d'offres */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {project.tender_number || 'Numéro en attente'}
                </CardDescription>
              </div>
              <Badge className="bg-blue-600">
                Appel d'offres
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Donneur d'ouvrage */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Donneur d'ouvrage
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{client.company_name || client.full_name}</p>
                  {client.email && <p className="text-gray-600">{client.email}</p>}
                  {client.phone && <p className="text-gray-600">{client.phone}</p>}
                </div>
              </div>

              {/* Informations générales */}
              <div>
                <h3 className="font-semibold mb-3">Informations générales</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{project.city}, {project.region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>
                      {formatCurrency(project.budget_min)} - {formatCurrency(project.budget_max)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Début : {formatDate(project.project_start_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates importantes */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {project.site_visit_date && (
                <div>
                  <p className="font-medium">Visite de chantier</p>
                  <p className="text-gray-600">{formatDate(project.site_visit_date)}</p>
                </div>
              )}
              {project.questions_deadline && (
                <div>
                  <p className="font-medium">Date limite pour questions</p>
                  <p className="text-gray-600">{formatDate(project.questions_deadline)}</p>
                </div>
              )}
              <div>
                <p className="font-medium">Date limite de soumission</p>
                <p className="text-red-600 font-semibold">
                  {formatDate(project.submission_deadline)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{project.description}</p>
            {project.work_description_detailed && (
              <>
                <h4 className="font-semibold mb-2">Description détaillée</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {project.work_description_detailed}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Spécifications techniques */}
        {project.technical_specifications && project.technical_specifications.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Spécifications techniques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {project.technical_specifications.map((spec: any, index: number) => (
                  <li key={index} className="text-gray-700">
                    {typeof spec === 'string' ? spec : spec.description || spec.name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Jalons */}
        {project.milestones && project.milestones.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Jalons du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.milestones.map((milestone: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-semibold">{milestone.name || milestone.title}</p>
                    <p className="text-sm text-gray-600">
                      {milestone.date ? formatDate(milestone.date) : 'Date à déterminer'}
                    </p>
                    {milestone.deliverables && (
                      <p className="text-sm text-gray-500">{milestone.deliverables}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exigences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Exigences d'assurance et de licence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Assurances requises</h4>
                {project.insurance_requirements && Object.keys(project.insurance_requirements).length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {project.insurance_requirements.liability && (
                      <li>Responsabilité civile : {formatCurrency(project.insurance_requirements.liability)}</li>
                    )}
                    {project.insurance_requirements.professional && (
                      <li>Responsabilité professionnelle : {formatCurrency(project.insurance_requirements.professional)}</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    Selon les normes de l'industrie
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Licences RBQ</h4>
                {project.licensing_requirements && Object.keys(project.licensing_requirements).length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {Object.entries(project.licensing_requirements).map(([key, value]: [string, any]) => (
                      <li key={key}>{value}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    Licence RBQ valide requise
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critères d'évaluation */}
        {project.evaluation_criteria && Object.keys(project.evaluation_criteria).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Critères d'évaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(project.evaluation_criteria).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-700">{key}</span>
                    <Badge variant="secondary">{value}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default TenderView;

