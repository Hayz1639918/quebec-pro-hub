import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, FileText, User, Building2, Calendar, DollarSign, Eye } from 'lucide-react';
import DOMPurify from 'dompurify';
import {
  PAYMENT_HANDLING_SELECT_OPTIONS,
  PaymentHandlingHint,
  PaymentHandlingPreferenceNotice,
  type PaymentHandlingMode,
  type PaymentHandlingPreference,
} from '@/components/payments/PaymentHandlingDisplay';

type Template = { id: string; name: string; description: string | null; template_content: string; variables?: Record<string, unknown> };
type Project = { id: string; title: string; description: string; client_id: string; assigned_professional_id?: string | null; payment_handling_preference?: string | null };

const ProposeContract = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectProject = searchParams.get('project');

  const [userId, setUserId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'fill' | 'preview'>('select');

  // Form state - all contract fields
  const [form, setForm] = useState({
    // Selection
    project_id: '',
    template_id: '',
    
    // Contract info
    title: '',
    contract_number: '',
    
    // Client info
    client_name: '',
    client_address: '',
    client_phone: '',
    client_email: '',
    
    // Professional info
    professional_name: '',
    company_name: '',
    license_number: '',
    professional_phone: '',
    professional_email: '',
    professional_address: '',
    
    // Project info
    project_title: '',
    project_description: '',
    project_address: '',
    
    // Financial
    total_amount: '',
    deposit_percentage: '10',
    payment_handling: 'platform',
    
    // Dates
    start_date: '',
    end_date: '',
    
    // Other
    special_conditions: '',
    
    // Checkboxes - Type de travaux
    work_type_construction: false,
    work_type_renovation: false,
    work_type_extension: false,
    work_type_other: false,
    work_type_other_text: '',
    
    // Checkboxes - Conditions suspensives
    condition_financing: false,
    condition_permits: false,
    condition_soil_study: false,
    condition_other: false,
    condition_other_text: '',
    
    // Checkboxes - Sous-traitant fournit
    subcontractor_labor: true,
    subcontractor_materials: false,
    subcontractor_materials_text: '',
    subcontractor_equipment: false,
    subcontractor_permits: false,
  });

  const selectedTemplate = useMemo(() => templates.find(t => t.id === form.template_id) || null, [templates, form.template_id]);
  const selectedProject = useMemo(() => projects.find(p => p.id === form.project_id) || null, [projects, form.project_id]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?mode=login'); return; }
      setUserId(session.user.id);
      const { data: prof } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single();
      if (!prof || prof.user_type !== 'professional') { navigate('/auth?mode=login', { replace: true }); return; }
      
      await fetchTemplates();
      await fetchProjects(session.user.id);
      await loadProfessionalInfo(session.user.id);
      
      setLoading(false);
      if (preselectProject) {
        setForm(f => ({ ...f, project_id: preselectProject }));
      }
    })();
  }, []);

  // Load professional info when component mounts
  const loadProfessionalInfo = async (uid: string) => {
    const { data: proData } = await supabase
      .from('profiles')
      .select('full_name, company_name, email, phone, rbq_number, address, city, postal_code')
      .eq('id', uid)
      .single();
    
    if (proData) {
      const proAddress = [proData.address, proData.city, proData.postal_code].filter(Boolean).join(', ');
      setForm(f => ({
        ...f,
        professional_name: proData.full_name || '',
        company_name: proData.company_name || proData.full_name || '',
        license_number: proData.rbq_number || '',
        professional_phone: proData.phone || '',
        professional_email: proData.email || '',
        professional_address: proAddress,
        contract_number: `CTR-${Date.now().toString(36).toUpperCase()}`,
      }));
    }
  };

  // Load client info when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadClientInfo(selectedProject.client_id);
      const pref = selectedProject.payment_handling_preference;
      setForm(f => ({
        ...f,
        project_title: selectedProject.title,
        project_description: selectedProject.description || '',
        title: `Contrat - ${selectedProject.title}`,
        payment_handling: pref === 'platform' || pref === 'offline' ? pref : f.payment_handling,
      }));
    }
  }, [selectedProject]);

  const loadClientInfo = async (clientId: string) => {
    const { data: clientData } = await supabase
      .from('profiles')
      .select('full_name, email, phone, address, city, postal_code')
      .eq('id', clientId)
      .single();
    
    if (clientData) {
      const clientAddress = [clientData.address, clientData.city, clientData.postal_code].filter(Boolean).join(', ');
      setForm(f => ({
        ...f,
        client_name: clientData.full_name || '',
        client_phone: clientData.phone || '',
        client_email: clientData.email || '',
        client_address: clientAddress,
        project_address: clientAddress,
      }));
    }
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('contract_templates')
      .select('id,name,description,template_content')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setTemplates(data || []);
  };

  const fetchProjects = async (uid: string) => {
    const { data } = await supabase
      .from('projects')
      .select('id,title,description,client_id,assigned_professional_id,payment_handling_preference')
      .or(`status.eq.open,and(status.eq.in_progress,assigned_professional_id.eq.${uid})`)
      .order('created_at', { ascending: false });
    setProjects(data || []);
  };

  // Generate the contract content by replacing all variables
  const generateContent = () => {
    if (!selectedTemplate) return '';
    
    let content = selectedTemplate.template_content;
    const today = new Date().toLocaleDateString('fr-CA');
    
    // Calculate taxes
    const amount = parseFloat(form.total_amount) || 0;
    const tps = amount * 0.05;
    const tvq = amount * 0.09975;
    const totalWithTaxes = amount + tps + tvq;
    const depositPercent = parseFloat(form.deposit_percentage) || 0;
    const depositAmount = amount * (depositPercent / 100);
    
    // Helper to create checked/unchecked checkbox HTML
    const checkbox = (checked: boolean) => checked 
      ? '<span class="checkbox" style="background:#333;"></span>' 
      : '<span class="checkbox"></span>';
    
    // All variables
    const variables: Record<string, string> = {
      // Contract info
      contract_number: form.contract_number,
      contract_date: today,
      signature_date: today,
      
      // Client info
      client_name: form.client_name || '________________',
      client_address: form.client_address || '________________',
      client_phone: form.client_phone || '________________',
      client_email: form.client_email || '________________',
      
      // Professional info
      professional_name: form.professional_name || '________________',
      company_name: form.company_name || '________________',
      license_number: form.license_number || '________________',
      professional_phone: form.professional_phone || '________________',
      professional_email: form.professional_email || '________________',
      professional_address: form.professional_address || '________________',
      
      // Project info
      project_title: form.project_title || form.title || '________________',
      project_description: form.project_description || '________________',
      project_address: form.project_address || form.client_address || '________________',
      
      // Amounts
      total_amount: amount.toLocaleString('fr-CA', { minimumFractionDigits: 2 }),
      tps_amount: tps.toLocaleString('fr-CA', { minimumFractionDigits: 2 }),
      tvq_amount: tvq.toLocaleString('fr-CA', { minimumFractionDigits: 2 }),
      total_with_taxes: totalWithTaxes.toLocaleString('fr-CA', { minimumFractionDigits: 2 }),
      deposit_percentage: depositPercent.toString(),
      deposit_amount: depositAmount.toLocaleString('fr-CA', { minimumFractionDigits: 2 }),
      
      // Dates
      start_date: form.start_date ? new Date(form.start_date).toLocaleDateString('fr-CA') : '________________',
      end_date: form.end_date ? new Date(form.end_date).toLocaleDateString('fr-CA') : '________________',
      
      // Special conditions
      special_conditions: form.special_conditions || 'Aucune condition particulière',
    };
    
    // Replace all variables
    Object.entries(variables).forEach(([k, v]) => {
      const re = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
      content = content.replace(re, v);
    });
    
    // Replace checkboxes for "Type de travaux"
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Construction neuve<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.work_type_construction)}<span class="checkbox-label">Construction neuve</span></div>`
    );
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Rénovation<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.work_type_renovation)}<span class="checkbox-label">Rénovation</span></div>`
    );
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Agrandissement<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.work_type_extension)}<span class="checkbox-label">Agrandissement</span></div>`
    );
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Autre : _______________<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.work_type_other)}<span class="checkbox-label">Autre : ${form.work_type_other_text || '_______________'}</span></div>`
    );
    
    // Replace checkboxes for "Conditions suspensives"
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Obtention du financement par le client<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.condition_financing)}<span class="checkbox-label">Obtention du financement par le client</span></div>`
    );
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Obtention des permis de construction nécessaires<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.condition_permits)}<span class="checkbox-label">Obtention des permis de construction nécessaires</span></div>`
    );
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Réalisation d''une étude de sol satisfaisante<\/span><\/div>/,
      `<div class="checkbox-row">${checkbox(form.condition_soil_study)}<span class="checkbox-label">Réalisation d'une étude de sol satisfaisante</span></div>`
    );
    // Handle SQL escaped apostrophes
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Réalisation d'une étude de sol satisfaisante<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.condition_soil_study)}<span class="checkbox-label">Réalisation d'une étude de sol satisfaisante</span></div>`
    );
    
    // Replace checkboxes for "Sous-traitant fournit" (for subcontractor contract)
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox" style="background:#333;"><\/span><span class="checkbox-label">Main-d''œuvre qualifiée<\/span><\/div>/,
      `<div class="checkbox-row">${checkbox(form.subcontractor_labor)}<span class="checkbox-label">Main-d'œuvre qualifiée</span></div>`
    );
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox" style="background:#333;"><\/span><span class="checkbox-label">Main-d'œuvre qualifiée<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.subcontractor_labor)}<span class="checkbox-label">Main-d'œuvre qualifiée</span></div>`
    );
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Matériaux \(préciser\) : _______________<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.subcontractor_materials)}<span class="checkbox-label">Matériaux (préciser) : ${form.subcontractor_materials_text || '_______________'}</span></div>`
    );
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Équipement et outillage<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.subcontractor_equipment)}<span class="checkbox-label">Équipement et outillage</span></div>`
    );
    content = content.replace(
      /<div class="checkbox-row"><span class="checkbox"><\/span><span class="checkbox-label">Permis spécifiques requis<\/span><\/div>/g,
      `<div class="checkbox-row">${checkbox(form.subcontractor_permits)}<span class="checkbox-label">Permis spécifiques requis</span></div>`
    );
    
    return content;
  };

  const handleSubmit = async () => {
    if (!userId || !selectedProject || !selectedTemplate) return;
    if (!form.title || !form.total_amount) {
      toast.error('Veuillez remplir le titre et le montant');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { data: client } = await supabase.from('profiles').select('id').eq('id', selectedProject.client_id).single();
      if (!client) {
        toast.error('Client introuvable');
        return;
      }
      
      const contractContent = generateContent();
      const isAssignedToProject = selectedProject.assigned_professional_id === userId;
      
      if (isAssignedToProject) {
        // Create contract directly
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .insert({
            project_id: selectedProject.id,
            client_id: client.id,
            professional_id: userId,
            template_id: selectedTemplate.id,
            title: form.title,
            description: form.special_conditions || null,
            contract_content: contractContent,
            variables: form,
            total_amount: Number(form.total_amount),
            currency: 'CAD',
            deposit_percentage: Number(form.deposit_percentage || '0'),
            start_date: form.start_date || null,
            end_date: form.end_date || null,
            payment_handling: form.payment_handling,
            status: 'draft',
          })
          .select()
          .single();
        
        if (contractError) {
          console.error('Erreur création contrat:', contractError);
          toast.error('Erreur lors de la création du contrat: ' + contractError.message);
          return;
        }
        
        toast.success('Contrat créé avec succès !');
        navigate(`/contracts?contract=${contractData.id}`);
      } else {
        // Create contract proposal
        const { error } = await supabase.from('contract_proposals').insert({
          project_id: selectedProject.id,
          client_id: client.id,
          professional_id: userId,
          template_id: selectedTemplate.id,
          title: form.title,
          description: form.special_conditions || null,
          variables: form,
          contract_content_draft: contractContent,
          total_amount: Number(form.total_amount),
          currency: 'CAD',
          deposit_percentage: Number(form.deposit_percentage || '0'),
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          payment_handling: form.payment_handling,
          status: 'pending',
        });
        
        if (error) {
          console.error('Erreur création proposition:', error);
          toast.error('Erreur lors de la création de la proposition: ' + error.message);
          return;
        }
        
        toast.success('Proposition de contrat envoyée !');
        navigate('/pro/dashboard');
      }
    } catch (error: unknown) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Créer un contrat</h1>
          <p className="text-muted-foreground mt-1">Remplissez tous les champs pour générer votre contrat professionnel</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${currentStep === 'select' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'select' ? 'bg-primary text-white' : 'bg-muted'}`}>1</div>
            <span>Sélection</span>
          </div>
          <div className="flex-1 h-px bg-muted" />
          <div className={`flex items-center gap-2 ${currentStep === 'fill' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'fill' ? 'bg-primary text-white' : 'bg-muted'}`}>2</div>
            <span>Informations</span>
          </div>
          <div className="flex-1 h-px bg-muted" />
          <div className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-primary text-white' : 'bg-muted'}`}>3</div>
            <span>Prévisualisation</span>
          </div>
        </div>

        {/* Step 1: Selection */}
        {currentStep === 'select' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sélectionnez le projet et le modèle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Projet *</Label>
                  <Select value={form.project_id} onValueChange={(v) => updateForm('project_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Modèle de contrat *</Label>
                  <Select value={form.template_id} onValueChange={(v) => updateForm('template_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep('fill')}
                  disabled={!form.project_id || !form.template_id}
                >
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Fill all fields */}
        {currentStep === 'fill' && (
          <div className="space-y-6">
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="client" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client
                </TabsTrigger>
                <TabsTrigger value="professional" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Entrepreneur
                </TabsTrigger>
                <TabsTrigger value="project" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Projet
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financier
                </TabsTrigger>
              </TabsList>

              <TabsContent value="client">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations du client (Maître d'ouvrage)</CardTitle>
                    <CardDescription>Ces informations apparaîtront dans le contrat</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom complet *</Label>
                        <Input 
                          value={form.client_name} 
                          onChange={e => updateForm('client_name', e.target.value)}
                          placeholder="Jean Tremblay"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Courriel</Label>
                        <Input 
                          type="email"
                          value={form.client_email} 
                          onChange={e => updateForm('client_email', e.target.value)}
                          placeholder="jean@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input 
                          value={form.client_phone} 
                          onChange={e => updateForm('client_phone', e.target.value)}
                          placeholder="514-555-0123"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Adresse complète</Label>
                        <Input 
                          value={form.client_address} 
                          onChange={e => updateForm('client_address', e.target.value)}
                          placeholder="123 Rue Principale, Montréal, H2X 1Y2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="professional">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de l'entrepreneur</CardTitle>
                    <CardDescription>Vos informations professionnelles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Raison sociale / Entreprise *</Label>
                        <Input 
                          value={form.company_name} 
                          onChange={e => updateForm('company_name', e.target.value)}
                          placeholder="Construction ABC Inc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Représentant *</Label>
                        <Input 
                          value={form.professional_name} 
                          onChange={e => updateForm('professional_name', e.target.value)}
                          placeholder="Pierre Dupont"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>N° de licence RBQ *</Label>
                        <Input 
                          value={form.license_number} 
                          onChange={e => updateForm('license_number', e.target.value)}
                          placeholder="1234-5678-90"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input 
                          value={form.professional_phone} 
                          onChange={e => updateForm('professional_phone', e.target.value)}
                          placeholder="514-555-0456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Courriel</Label>
                        <Input 
                          type="email"
                          value={form.professional_email} 
                          onChange={e => updateForm('professional_email', e.target.value)}
                          placeholder="info@construction-abc.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Adresse</Label>
                        <Input 
                          value={form.professional_address} 
                          onChange={e => updateForm('professional_address', e.target.value)}
                          placeholder="456 Rue Industrielle, Laval, H7L 3K4"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="project">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations du projet</CardTitle>
                    <CardDescription>Détails des travaux à réaliser</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Titre du contrat *</Label>
                        <Input 
                          value={form.title} 
                          onChange={e => updateForm('title', e.target.value)}
                          placeholder="Contrat de rénovation cuisine"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Titre du projet</Label>
                        <Input 
                          value={form.project_title} 
                          onChange={e => updateForm('project_title', e.target.value)}
                          placeholder="Rénovation cuisine complète"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Adresse des travaux</Label>
                        <Input 
                          value={form.project_address} 
                          onChange={e => updateForm('project_address', e.target.value)}
                          placeholder="123 Rue Principale, Montréal, H2X 1Y2"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Description des travaux</Label>
                        <Textarea 
                          value={form.project_description} 
                          onChange={e => updateForm('project_description', e.target.value)}
                          placeholder="Détaillez les travaux à réaliser..."
                          rows={4}
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {/* Type de travaux - Checkboxes */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Type de travaux</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.work_type_construction}
                            onChange={e => setForm(f => ({ ...f, work_type_construction: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Construction neuve</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.work_type_renovation}
                            onChange={e => setForm(f => ({ ...f, work_type_renovation: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Rénovation</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.work_type_extension}
                            onChange={e => setForm(f => ({ ...f, work_type_extension: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Agrandissement</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.work_type_other}
                            onChange={e => setForm(f => ({ ...f, work_type_other: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Autre</span>
                        </label>
                      </div>
                      {form.work_type_other && (
                        <Input 
                          value={form.work_type_other_text}
                          onChange={e => updateForm('work_type_other_text', e.target.value)}
                          placeholder="Précisez le type de travaux..."
                          className="mt-2 max-w-md"
                        />
                      )}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {/* Conditions suspensives - Checkboxes */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Conditions suspensives</Label>
                      <p className="text-sm text-muted-foreground">Le contrat est conditionnel à :</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.condition_financing}
                            onChange={e => setForm(f => ({ ...f, condition_financing: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Obtention du financement par le client</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.condition_permits}
                            onChange={e => setForm(f => ({ ...f, condition_permits: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Obtention des permis de construction</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.condition_soil_study}
                            onChange={e => setForm(f => ({ ...f, condition_soil_study: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Réalisation d'une étude de sol satisfaisante</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.condition_other}
                            onChange={e => setForm(f => ({ ...f, condition_other: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">Autre condition</span>
                        </label>
                      </div>
                      {form.condition_other && (
                        <Input 
                          value={form.condition_other_text}
                          onChange={e => updateForm('condition_other_text', e.target.value)}
                          placeholder="Précisez la condition..."
                          className="mt-2 max-w-md"
                        />
                      )}
                    </div>
                    
                    {/* Options spécifiques sous-traitance (visible si template sous-traitance) */}
                    {selectedTemplate?.name?.toLowerCase().includes('sous-traitance') && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Le sous-traitant s'engage à fournir</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={form.subcontractor_labor}
                                onChange={e => setForm(f => ({ ...f, subcontractor_labor: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <span className="text-sm">Main-d'œuvre qualifiée</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={form.subcontractor_materials}
                                onChange={e => setForm(f => ({ ...f, subcontractor_materials: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <span className="text-sm">Matériaux</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={form.subcontractor_equipment}
                                onChange={e => setForm(f => ({ ...f, subcontractor_equipment: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <span className="text-sm">Équipement et outillage</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={form.subcontractor_permits}
                                onChange={e => setForm(f => ({ ...f, subcontractor_permits: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <span className="text-sm">Permis spécifiques requis</span>
                            </label>
                          </div>
                          {form.subcontractor_materials && (
                            <Input 
                              value={form.subcontractor_materials_text}
                              onChange={e => updateForm('subcontractor_materials_text', e.target.value)}
                              placeholder="Précisez les matériaux..."
                              className="mt-2 max-w-md"
                            />
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial">
                <Card>
                  <CardHeader>
                    <CardTitle>Conditions financières et échéancier</CardTitle>
                    <CardDescription>Montants, acompte et dates du projet</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Montant total (avant taxes) *</Label>
                        <Input 
                          type="number"
                          value={form.total_amount} 
                          onChange={e => updateForm('total_amount', e.target.value)}
                          placeholder="25000"
                        />
                        {form.total_amount && (
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>TPS (5%): {(parseFloat(form.total_amount) * 0.05).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $</p>
                            <p>TVQ (9.975%): {(parseFloat(form.total_amount) * 0.09975).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $</p>
                            <p className="font-semibold">Total: {(parseFloat(form.total_amount) * 1.14975).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Acompte à la signature (%)</Label>
                        <Input 
                          type="number"
                          value={form.deposit_percentage} 
                          onChange={e => updateForm('deposit_percentage', e.target.value)}
                          placeholder="10"
                        />
                        {form.total_amount && form.deposit_percentage && (
                          <p className="text-sm text-muted-foreground">
                            = {(parseFloat(form.total_amount) * parseFloat(form.deposit_percentage) / 100).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <PaymentHandlingPreferenceNotice
                          preference={selectedProject?.payment_handling_preference as PaymentHandlingPreference | null | undefined}
                        />
                        <Label htmlFor="proposal-payment-handling">Modalité de règlement</Label>
                        <Select value={form.payment_handling} onValueChange={v => updateForm('payment_handling', v)}>
                          <SelectTrigger id="proposal-payment-handling" aria-describedby="proposal-payment-handling-hint">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="platform">{PAYMENT_HANDLING_SELECT_OPTIONS.platform}</SelectItem>
                            <SelectItem value="offline">{PAYMENT_HANDLING_SELECT_OPTIONS.offline}</SelectItem>
                          </SelectContent>
                        </Select>
                        <PaymentHandlingHint
                          id="proposal-payment-handling-hint"
                          mode={form.payment_handling as PaymentHandlingMode}
                          audience="pro"
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date de début prévue</Label>
                        <Input 
                          type="date"
                          value={form.start_date} 
                          onChange={e => updateForm('start_date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de fin prévue</Label>
                        <Input 
                          type="date"
                          value={form.end_date} 
                          onChange={e => updateForm('end_date', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Conditions particulières</Label>
                      <Textarea 
                        value={form.special_conditions} 
                        onChange={e => updateForm('special_conditions', e.target.value)}
                        placeholder="Ajoutez des conditions spécifiques au projet..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('select')}>
                Retour
              </Button>
              <Button onClick={() => setCurrentStep('preview')}>
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser le contrat
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 'preview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Prévisualisation du contrat
                </CardTitle>
                <CardDescription>Vérifiez que toutes les informations sont correctes avant de créer le contrat</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  const content = generateContent();
                  const isFullHtml = content.includes('<!DOCTYPE') || content.includes('<html') || content.includes('<style');
                  
                  if (isFullHtml) {
                    // Full HTML template - display in iframe WITHOUT sanitization for exact rendering
                    return (
                      <div className="bg-gray-200 p-6">
                        <div className="bg-white shadow-xl mx-auto" style={{ maxWidth: '850px' }}>
                          <iframe
                            srcDoc={content}
                            className="w-full border-0"
                            style={{ height: 'min(1100px, 85vh)' }}
                            title="Prévisualisation du contrat"
                          />
                        </div>
                      </div>
                    );
                  } else {
                    // Simple content
                    return (
                      <ScrollArea className="h-[min(700px,75vh)]">
                        <div className="bg-gray-100 p-4">
                          <div className="bg-white shadow-lg mx-auto max-w-4xl p-8">
                            <div 
                              className="prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                            />
                          </div>
                        </div>
                      </ScrollArea>
                    );
                  }
                })()}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('fill')}>
                Modifier les informations
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} size="lg">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? 'Création en cours...' : 'Créer le contrat'}
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProposeContract;
