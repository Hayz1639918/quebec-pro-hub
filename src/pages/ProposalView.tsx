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
import ProposalPDF from '@/components/pdf/ProposalPDF';
import { 
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  HardHat,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const ProposalView = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [proposal, setProposal] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPDFViewer, setShowPDFViewer] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchProposalDetails();
    
    // Afficher automatiquement la prévisualisation PDF si demandé
    if (searchParams.get('showPDF') === 'true') {
      setShowPDFViewer(true);
    }
  }, [id, searchParams]);

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

  const fetchProposalDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch from the view that includes all details
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals_complete')
        .select('*')
        .eq('id', id)
        .single();

      if (proposalError) throw proposalError;

      if (proposalData) {
        // Separate the data
        const {
          project_title,
          tender_number,
          project_category,
          project_city,
          project_region,
          client_name,
          client_company,
          client_email,
          professional_name,
          professional_company,
          professional_email,
          professional_phone,
          professional_rbq,
          ...proposalOnly
        } = proposalData;

        setProposal(proposalOnly);
        setProject({
          title: project_title,
          tender_number,
          category: project_category,
          city: project_city,
          region: project_region,
        });
        setClient({
          full_name: client_name,
          company_name: client_company,
          email: client_email,
        });
        setProfessional({
          full_name: professional_name,
          company_name: professional_company,
          email: professional_email,
          phone: professional_phone,
          rbq_license: professional_rbq,
        });
      }
    } catch (error: any) {
      console.error('Error fetching proposal:', error);
      toast.error('Erreur lors du chargement de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success(
        newStatus === 'accepted' 
          ? 'Soumission acceptée avec succès' 
          : 'Soumission refusée'
      );
      
      // Refresh data
      fetchProposalDetails();
    } catch (error: any) {
      console.error('Error updating proposal:', error);
      toast.error('Erreur lors de la mise à jour du statut');
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Calendar, label: 'En attente' },
      accepted: { variant: 'default', icon: CheckCircle2, label: 'Acceptée' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Refusée' },
      withdrawn: { variant: 'outline', icon: XCircle, label: 'Retirée' },
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
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

  if (!proposal || !project || !professional || !client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Soumission introuvable</div>
        </div>
        <Footer />
      </div>
    );
  }

  const isClient = currentUser?.id === proposal.client_id;
  const isProfessional = currentUser?.id === proposal.professional_id;
  const canUpdateStatus = isClient && proposal.status === 'pending';

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
            {canUpdateStatus && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('rejected')}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Refuser
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('accepted')}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accepter
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowPDFViewer(!showPDFViewer)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPDFViewer ? 'Masquer' : 'Prévisualiser'} PDF
            </Button>
            
            <PDFDownloadLink
              document={
                <ProposalPDF 
                  proposal={proposal} 
                  project={project}
                  professional={professional}
                  client={client}
                />
              }
              fileName={`Soumission_${proposal.proposal_number || proposal.id}.pdf`}
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
        {showPDFViewer && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <div style={{ height: 'min(800px, 80vh)', width: '100%' }}>
                <PDFViewer width="100%" height="100%">
                  <ProposalPDF 
                    proposal={proposal}
                    project={project}
                    professional={professional}
                    client={client}
                  />
                </PDFViewer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* En-tête de la soumission */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">Soumission</CardTitle>
                  {getStatusBadge(proposal.status)}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {proposal.proposal_number || 'Numéro en attente'}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Soumise le</p>
                <p className="font-semibold">{formatDate(proposal.created_at)}</p>
                {proposal.valid_until && (
                  <p className="text-sm text-gray-500 mt-1">
                    Valide jusqu'au {formatDate(proposal.valid_until)}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Professionnel */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Soumissionnaire
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {professional.company_name || professional.full_name}
                  </p>
                  {professional.phone && <p className="text-gray-600">{professional.phone}</p>}
                  {professional.email && <p className="text-gray-600">{professional.email}</p>}
                  {proposal.rbq_license_number && (
                    <p className="text-gray-600 font-medium mt-2 flex items-center gap-1.5">
                      <HardHat className="h-4 w-4" />
                      Licence RBQ : {proposal.rbq_license_number}
                    </p>
                  )}
                </div>
              </div>

              {/* Projet */}
              <div>
                <h3 className="font-semibold mb-3">Projet concerné</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{project.title}</p>
                  {project.tender_number && (
                    <p className="text-gray-600">Appel d'offres : {project.tender_number}</p>
                  )}
                  <p className="text-gray-600">
                    {project.city}, {project.region}
                  </p>
                  <p className="text-gray-600">Catégorie : {project.category}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prix et durée */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prix proposé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-700">
                {formatCurrency(proposal.estimated_budget)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Taxes en sus</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Délai d'exécution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {proposal.estimated_duration_days} jours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Description de la proposition */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Portée des travaux</CardTitle>
          </CardHeader>
          <CardContent>
            {proposal.detailed_description ? (
              <p className="text-gray-700 whitespace-pre-wrap">
                {proposal.detailed_description}
              </p>
            ) : (
              <p className="text-gray-700">{proposal.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Méthodologie */}
        {proposal.work_methodology && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Méthodologie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {proposal.work_methodology}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Composition de l'équipe */}
        {proposal.team_composition && proposal.team_composition.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Composition de l'équipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proposal.team_composition.map((member: any, index: number) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.role}</p>
                    <p className="text-sm text-gray-500">{member.experience}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendrier détaillé */}
        {proposal.timeline_details && proposal.timeline_details.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Calendrier détaillé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {proposal.timeline_details.map((phase: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{phase.name || phase.phase}</p>
                      <p className="text-sm text-gray-600">{phase.duration}</p>
                    </div>
                    <div className="text-right text-sm">
                      {phase.date ? formatDate(phase.date) : 'À déterminer'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Décomposition budgétaire */}
        {proposal.budget_breakdown && Object.keys(proposal.budget_breakdown).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Décomposition budgétaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(proposal.budget_breakdown).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-gray-700">{key}</span>
                    <span className="font-semibold">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Garanties et assurances */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Garanties et assurances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Garantie offerte</p>
                <p className="text-gray-600">
                  {proposal.warranty_offered_months || 12} mois sur l'ensemble des travaux
                </p>
              </div>
              {proposal.insurance_proof_url && (
                <div>
                  <p className="font-medium">Certificat d'assurance</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => window.open(proposal.insurance_proof_url, '_blank')}
                  >
                    Voir le certificat
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Références */}
        {proposal.references && proposal.references.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Références</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {proposal.references.map((ref: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <p className="font-semibold">{ref.project_name || `Référence ${index + 1}`}</p>
                    <p className="text-sm text-gray-600">Client : {ref.client_name}</p>
                    {ref.contact_phone && (
                      <p className="text-sm text-gray-600">Tél. : {ref.contact_phone}</p>
                    )}
                    {ref.year && (
                      <p className="text-sm text-gray-600">Année : {ref.year}</p>
                    )}
                    {ref.value && (
                      <p className="text-sm font-medium text-green-600">
                        Valeur : {formatCurrency(ref.value)}
                      </p>
                    )}
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

export default ProposalView;

