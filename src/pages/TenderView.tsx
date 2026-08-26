import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import {
  ArrowLeft,
  Building2,
  Calendar,
  ClipboardCheck,
  Download,
  FileCheck,
  FileText,
  Loader2,
  MapPin,
  Shield,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TenderPDF from '@/components/pdf/TenderPDF';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDateLong } from '@/lib/format';
import { normalizeTenderProject } from '@/lib/tender-mapper';
import type { PartyInfo, TenderProject } from '@/types/tender';

const DEFAULT_REQUIRED_DOCUMENTS = [
  'Formulaire de soumission dûment complété et signé',
  'Copie de la licence RBQ valide',
  "Certificats d'assurance en vigueur",
  'Devis détaillé et échéancier proposé',
];

const CERTIFICATION_LABELS: Record<string, string> = {
  rbq: 'Licence RBQ obligatoire',
  liability_insurance: 'Assurance responsabilité civile',
  apchq: 'Membre APCHQ',
  asp_construction: 'Formation ASP Construction',
};

const ENTREPRENEUR_LABELS: Record<string, string> = {
  individual: 'Travailleur autonome / individuel',
  company: 'Entreprise',
};

const PAYMENT_LABELS: Record<string, string> = {
  full: 'Paiement complet',
  milestones: 'Versements par jalons',
  negotiable: 'Négociable',
};

const displayDate = (value?: string | null) => (value ? formatDateLong(value) : 'Non précisée');

const TenderView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<TenderProject | null>(null);
  const [client, setClient] = useState<PartyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    void fetchTenderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTenderDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const { data: tenderData, error: tenderError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (tenderError) throw tenderError;
      if (!tenderData) throw new Error('Appel d\'offres introuvable');

      setProject(normalizeTenderProject(tenderData));

      const [{ data: publicClient }, { data: authData }] = await Promise.all([
        supabase
          .from('public_project_clients')
          .select('full_name, company_name')
          .eq('project_id', tenderData.id)
          .maybeSingle(),
        supabase.auth.getSession(),
      ]);

      let privateClient: PartyInfo | null = null;
      const isOwner = authData.session?.user.id === tenderData.client_id;

      if (isOwner) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, company_name, email, phone')
          .eq('id', tenderData.client_id)
          .maybeSingle();

        if (error) {
          console.warn('Could not load private owner contact for tender:', error.message);
        } else {
          privateClient = data;
        }
      }

      setClient({
        full_name: privateClient?.full_name ?? publicClient?.full_name ?? 'Client BâtirNet',
        company_name: privateClient?.company_name ?? publicClient?.company_name ?? null,
        email: privateClient?.email ?? null,
        phone: privateClient?.phone ?? null,
      });
    } catch (error) {
      console.error('Error fetching tender:', error);
      setProject(null);
      setClient(null);
      toast.error("Erreur lors du chargement de l'appel d'offres");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!project || !client || downloading) return;

    setDownloading(true);
    try {
      const blob = await pdf(<TenderPDF project={project} client={client} />).toBlob();
      if (!blob.size) throw new Error('Le PDF généré est vide');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Appel_Offres_${project.tender_number || project.id}.pdf`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success("L'appel d'offres PDF a été généré");
    } catch (error) {
      console.error('Tender PDF generation failed:', error);
      toast.error("Impossible de générer le PDF. Réessayez dans quelques instants.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 pt-28 pb-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p>Chargement de l'appel d'offres...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project || !client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 pt-28 pb-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Appel d'offres introuvable</h1>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const requiredDocuments = project.required_documents?.length
    ? project.required_documents
    : DEFAULT_REQUIRED_DOCUMENTS;
  const certifications = project.required_certifications || [];
  const location = [project.city, project.region, project.postal_code].filter(Boolean).join(', ') || 'Non précisée';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 self-start">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <Button onClick={() => void handleDownloadPdf()} className="gap-2" disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? 'Génération...' : 'Télécharger le PDF'}
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {project.tender_number || project.id}
                </CardDescription>
              </div>
              <Badge>Appel d'offres</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Donneur d'ouvrage
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{client.company_name || client.full_name}</p>
                {client.full_name && client.company_name && <p>{client.full_name}</p>}
                {client.email && <p className="text-muted-foreground">{client.email}</p>}
                {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
                {!client.email && !client.phone && (
                  <p className="text-muted-foreground">Communiquer avec le client par BâtirNet.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Informations générales</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{location}</span>
                </div>
                <div><span className="font-medium">Catégorie :</span> {project.category || 'Non précisée'}</div>
                <div><span className="font-medium">Type :</span> {project.project_type || 'Non précisé'}</div>
                <div>
                  <span className="font-medium">Budget :</span>{' '}
                  {formatCurrency(project.budget_min)} — {formatCurrency(project.budget_max)}
                </div>
                <div><span className="font-medium">Publication :</span> {displayDate(project.created_at)}</div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-orange-200 bg-orange-50/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates et échéancier
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
            <div><p className="font-medium">Début souhaité</p><p>{displayDate(project.project_start_date)}</p></div>
            <div><p className="font-medium">Fin souhaitée</p><p>{displayDate(project.project_end_date)}</p></div>
            <div><p className="font-medium">Visite de chantier</p><p>{displayDate(project.site_visit_date)}</p></div>
            <div><p className="font-medium">Questions avant</p><p>{displayDate(project.questions_deadline)}</p></div>
            <div><p className="font-medium">Soumission avant</p><p className="font-semibold text-destructive">{displayDate(project.submission_deadline)}</p></div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Description des travaux</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap">{project.description || 'Aucune description fournie.'}</p>
            {project.work_description_detailed && (
              <div>
                <h4 className="font-semibold mb-2">Description détaillée</h4>
                <p className="whitespace-pre-wrap text-muted-foreground">{project.work_description_detailed}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Spécifications techniques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.technical_specifications?.length ? (
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  {project.technical_specifications.map((spec, index) => (
                    <li key={index}>{typeof spec === 'string' ? spec : spec.description || spec.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune spécification technique supplémentaire.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Exigences du soumissionnaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">Type d'entrepreneur</p>
                <p className="text-muted-foreground">
                  {project.preferred_entrepreneur_type
                    ? ENTREPRENEUR_LABELS[project.preferred_entrepreneur_type] || project.preferred_entrepreneur_type
                    : 'Aucune préférence particulière'}
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Certifications / accréditations</p>
                {certifications.length ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {certifications.map((certification) => (
                      <li key={certification}>{CERTIFICATION_LABELS[certification] || certification}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Aucune certification additionnelle sélectionnée.</p>
                )}
              </div>
              <div>
                <p className="font-medium mb-1">Assurances</p>
                <ul className="space-y-1 text-muted-foreground">
                  {project.insurance_requirements?.liability !== undefined && (
                    <li>Responsabilité civile : {formatCurrency(project.insurance_requirements.liability)}</li>
                  )}
                  {project.insurance_requirements?.professional !== undefined && (
                    <li>Responsabilité professionnelle : {formatCurrency(project.insurance_requirements.professional)}</li>
                  )}
                  {!project.insurance_requirements || Object.keys(project.insurance_requirements).length === 0 ? (
                    <li>Selon les exigences légales applicables au projet.</li>
                  ) : null}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Documents requis avec la soumission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {requiredDocuments.map((document) => (
                  <li key={document} className="flex items-start gap-2">
                    <span className="mt-0.5">□</span>
                    <span>{document}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Modalités financières
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Mode de paiement souhaité</p>
                <p className="text-muted-foreground">
                  {project.payment_mode ? PAYMENT_LABELS[project.payment_mode] || project.payment_mode : 'À définir'}
                </p>
              </div>
              <p className="text-muted-foreground">
                Le règlement est effectué directement entre le client et l'entrepreneur. BâtirNet sert au suivi des états de paiement et ne conserve pas les fonds.
              </p>
              <div>
                <p className="font-medium">Garantie demandée</p>
                <p className="text-muted-foreground">{project.warranty_period_months || 12} mois, sauf entente contractuelle différente.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {project.evaluation_criteria && Object.keys(project.evaluation_criteria).length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Critères d'évaluation</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(project.evaluation_criteria).map(([criterion, weight]) => (
                <div key={criterion} className="flex justify-between gap-4 border-b last:border-b-0 py-2 text-sm">
                  <span>{criterion}</span>
                  <Badge variant="secondary">{String(weight)}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default TenderView;
