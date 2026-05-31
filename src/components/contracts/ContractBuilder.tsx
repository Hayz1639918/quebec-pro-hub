import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  User, 
  Building2, 
  DollarSign, 
  Calendar,
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  Plus,
  Trash2,
  Milestone as MilestoneIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ContractTemplate } from "@/types/contracts";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  PAYMENT_HANDLING_SELECT_OPTIONS,
  PaymentHandlingHint,
  PaymentHandlingPreferenceNotice,
  type PaymentHandlingMode,
} from "@/components/payments/PaymentHandlingDisplay";

interface ContractBuilderProps {
  template: ContractTemplate;
  onCancel: () => void;
  onContractCreated: (contractId: string) => void;
  userId: string;
}

interface Professional {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  rbq_number: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  address: string;
  payment_handling_preference?: string | null;
}

interface MilestoneRow {
  id: string;
  title: string;
  amount: string;
  due_date: string;
}

export const ContractBuilder = ({
  template,
  onCancel,
  onContractCreated,
  userId
}: ContractBuilderProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  type ClientProfile = {
    full_name?: string;
    phone?: string | null;
    email?: string;
    address?: string | null;
  };
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    project_id: '',
    professional_id: '',
    title: '',
    description: '',
    total_amount: '',
    deposit_percentage: '25',
    start_date: '',
    end_date: '',
    warranty_period_months: '12',
    special_conditions: '',
    payment_handling: 'platform'
  });

  // Milestones
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);

  const milestonesTotal = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );

  const contractTotal = parseFloat(formData.total_amount) || 0;
  const milestonesExceedTotal = milestonesTotal > contractTotal && contractTotal > 0;
  const milestonesTotalMismatch =
    milestones.length > 0 &&
    contractTotal > 0 &&
    Math.abs(milestonesTotal - contractTotal) > 0.01 &&
    !milestonesExceedTotal;

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: '', amount: '', due_date: '' }
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Omit<MilestoneRow, 'id'>, value: string) => {
    setMilestones(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  useEffect(() => {
    fetchClientProfile();
    fetchProfessionals();
    fetchProjects();
  }, [userId]);

  // Pré-remplir la modalité de règlement à partir de la préférence du projet
  useEffect(() => {
    if (!formData.project_id) return;
    const pref = projects.find(p => p.id === formData.project_id)?.payment_handling_preference;
    if (pref === 'platform' || pref === 'offline') {
      setFormData(prev => ({ ...prev, payment_handling: pref }));
    }
  }, [formData.project_id, projects]);

  const fetchClientProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setClientProfile(data);
    } catch (error) {
      console.error('Error fetching client profile:', error);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email, rbq_number')
        .eq('user_type', 'professional')
        .order('full_name');

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, address, payment_handling_preference')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateContractContent = () => {
    const selectedProfessional = professionals.find(p => p.id === formData.professional_id);
    const selectedProject = projects.find(p => p.id === formData.project_id);
    
    if (!selectedProfessional || !selectedProject || !clientProfile) {
      return '';
    }

    // Variables pour remplir le template
    const variables: Record<string, string> = {
      client_name: clientProfile.full_name || '',
      client_address: clientProfile.address || '',
      client_phone: clientProfile.phone || '',
      client_email: clientProfile.email || '',
      professional_name: selectedProfessional.full_name || '',
      company_name: selectedProfessional.company_name || '',
      rbq_number: selectedProfessional.rbq_number || '',
      professional_address: '',
      professional_phone: '',
      professional_email: selectedProfessional.email || '',
      project_title: formData.title || selectedProject.title,
      project_description: formData.description || selectedProject.description || '',
      project_address: selectedProject.address || '',
      start_date: formData.start_date || '',
      end_date: formData.end_date || '',
      total_amount: formData.total_amount || '0',
      deposit_percentage: formData.deposit_percentage || '0',
      deposit_amount: (parseFloat(formData.total_amount || '0') * parseFloat(formData.deposit_percentage || '0') / 100).toFixed(2),
      payment_terms: formData.payment_handling === 'offline'
        ? 'Règlement hors plateforme (virement, chèque ou comptant) directement entre le client et l\'entrepreneur, selon l\'avancement des travaux'
        : 'Paiement via la plateforme (escrow sécurisé), libéré selon l\'avancement des travaux et la validation des jalons',
      warranty_period: formData.warranty_period_months || '12',
      special_conditions: formData.special_conditions || 'Aucune condition spéciale',
      signature_date: format(new Date(), 'yyyy-MM-dd'),
      signature_location: ''
    };

    // Remplacer les variables dans le template
    let content = template.template_content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    return content;
  };

  const handleCreateContract = async () => {
    // Validation
    if (!formData.project_id || !formData.professional_id) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "Veuillez sélectionner un projet et un professionnel",
      });
      return;
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "Veuillez entrer un montant valide",
      });
      return;
    }

    if (milestonesExceedTotal) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "Le total des jalons ne peut pas dépasser le montant du contrat.",
      });
      return;
    }

    const invalidMilestones = milestones.filter(
      m => !m.title.trim() || !m.amount || parseFloat(m.amount) <= 0
    );
    if (invalidMilestones.length > 0) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "Chaque jalon doit avoir un titre et un montant valide.",
      });
      return;
    }

    try {
      setLoading(true);

      const selectedProfessional = professionals.find(p => p.id === formData.professional_id);
      const selectedProject = projects.find(p => p.id === formData.project_id);
      
      const contractContent = generateContractContent();
      
      // Créer le contrat
      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          project_id: formData.project_id,
          template_id: template.id,
          client_id: userId,
          professional_id: formData.professional_id,
          title: formData.title || `Contrat - ${selectedProject?.title}`,
          description: formData.description,
          contract_content: contractContent,
          variables: {
            client_name: clientProfile?.full_name,
            professional_name: selectedProfessional?.full_name,
            company_name: selectedProfessional?.company_name,
            project_title: formData.title || selectedProject?.title,
            total_amount: formData.total_amount,
            start_date: formData.start_date,
            end_date: formData.end_date
          },
          total_amount: parseFloat(formData.total_amount),
          currency: 'CAD',
          deposit_percentage: parseFloat(formData.deposit_percentage),
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          warranty_period_months: parseInt(formData.warranty_period_months),
          special_conditions: formData.special_conditions || null,
          payment_handling: formData.payment_handling,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Insérer les jalons
      if (milestones.length > 0) {
        const milestoneRows = milestones.map(m => ({
          contract_id: contract.id,
          title: m.title.trim(),
          amount: parseFloat(m.amount),
          due_date: m.due_date || null,
          status: 'pending' as const,
        }));

        const { error: milestoneError } = await supabase
          .from('contract_milestones')
          .insert(milestoneRows);

        if (milestoneError) throw milestoneError;
      }

      toast({
        title: t('contracts.contract_created'),
        description: t('contracts.contract_created_description'),
      });

      onContractCreated(contract.id);
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('contracts.error_creating_contract'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{t('contracts.create_contract')}</h2>
            <p className="text-muted-foreground">
              {t('contracts.builder.using_template')}: {template.name}
            </p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          {template.category}
        </Badge>
      </div>

      {/* Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('contracts.builder.fill_form_description')}
        </AlertDescription>
      </Alert>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('contracts.builder.project_details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">{t('contracts.builder.select_project')} *</Label>
              <Select value={formData.project_id} onValueChange={(value) => handleInputChange('project_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('contracts.builder.select_project_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{t('contracts.builder.contract_title')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('contracts.builder.contract_title_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('contracts.builder.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('contracts.builder.description_placeholder')}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('contracts.builder.professional_details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="professional">{t('contracts.builder.select_professional')} *</Label>
              <Select value={formData.professional_id} onValueChange={(value) => handleInputChange('professional_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('contracts.builder.select_professional_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((pro) => (
                    <SelectItem key={pro.id} value={pro.id}>
                      {pro.full_name} - {pro.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('contracts.builder.financial_terms')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_amount">{t('contracts.builder.total_amount')} * (CAD)</Label>
                <Input
                  id="total_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => handleInputChange('total_amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">{t('contracts.builder.deposit_percentage')} (%)</Label>
                <Input
                  id="deposit"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.deposit_percentage}
                  onChange={(e) => handleInputChange('deposit_percentage', e.target.value)}
                />
              </div>
            </div>

            {formData.total_amount && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t('contracts.builder.deposit_amount')}: <span className="font-semibold text-foreground">
                    {(parseFloat(formData.total_amount) * parseFloat(formData.deposit_percentage) / 100).toFixed(2)} CAD
                  </span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <PaymentHandlingPreferenceNotice
                preference={projects.find(p => p.id === formData.project_id)?.payment_handling_preference as PaymentHandlingMode | "negotiable" | null | undefined}
              />
              <Label htmlFor="payment_handling">Modalité de règlement</Label>
              <Select
                value={formData.payment_handling}
                onValueChange={(v) => handleInputChange('payment_handling', v)}
              >
                <SelectTrigger id="payment_handling" aria-describedby="payment-handling-hint">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">{PAYMENT_HANDLING_SELECT_OPTIONS.platform}</SelectItem>
                  <SelectItem value="offline">{PAYMENT_HANDLING_SELECT_OPTIONS.offline}</SelectItem>
                </SelectContent>
              </Select>
              <PaymentHandlingHint
                id="payment-handling-hint"
                mode={formData.payment_handling as PaymentHandlingMode}
                audience="client"
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('contracts.builder.timeline')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">{t('contracts.builder.start_date')}</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">{t('contracts.builder.end_date')}</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty">{t('contracts.builder.warranty_period')} (mois)</Label>
              <Input
                id="warranty"
                type="number"
                min="0"
                value={formData.warranty_period_months}
                onChange={(e) => handleInputChange('warranty_period_months', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Special Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('contracts.builder.special_conditions')}</CardTitle>
          <CardDescription>{t('contracts.builder.special_conditions_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.special_conditions}
            onChange={(e) => handleInputChange('special_conditions', e.target.value)}
            placeholder={t('contracts.builder.special_conditions_placeholder')}
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MilestoneIcon className="h-5 w-5" />
            Jalons de paiement
          </CardTitle>
          <CardDescription>
            Définissez les étapes de paiement liées à l'avancement des travaux.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.length > 0 && (
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="grid grid-cols-[1fr_150px_150px_40px] gap-3 items-end"
                >
                  <div className="space-y-1">
                    {index === 0 && (
                      <Label className="text-xs text-muted-foreground">Titre</Label>
                    )}
                    <Input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                      placeholder="Ex: Fondations terminées"
                    />
                  </div>
                  <div className="space-y-1">
                    {index === 0 && (
                      <Label className="text-xs text-muted-foreground">Montant ($)</Label>
                    )}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={milestone.amount}
                      onChange={(e) => updateMilestone(milestone.id, 'amount', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    {index === 0 && (
                      <Label className="text-xs text-muted-foreground">Échéance</Label>
                    )}
                    <Input
                      type="date"
                      value={milestone.due_date}
                      onChange={(e) => updateMilestone(milestone.id, 'due_date', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMilestone(milestone.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un jalon
          </Button>

          {milestones.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  Total des jalons
                </span>
                <span
                  className={`text-sm font-semibold ${
                    milestonesExceedTotal
                      ? 'text-destructive'
                      : milestonesTotalMismatch
                        ? 'text-warning'
                        : 'text-success'
                  }`}
                >
                  {milestonesTotal.toFixed(2)} $ / {contractTotal.toFixed(2)} $
                </span>
              </div>

              {milestonesExceedTotal && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Le total des jalons dépasse le montant du contrat.
                  </AlertDescription>
                </Alert>
              )}

              {milestonesTotalMismatch && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Le total des jalons ne correspond pas au montant total du contrat.
                    Différence&nbsp;: {Math.abs(milestonesTotal - contractTotal).toFixed(2)} $
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleCreateContract} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? t('common.loading') : t('contracts.builder.create_and_continue')}
        </Button>
      </div>
    </div>
  );
};
