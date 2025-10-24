import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  Building2, 
  Clock, 
  Shield, 
  Download,
  Eye,
  Pen,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Contract, ContractStatus } from "@/types/contracts";
import type { SignatureData } from "@/services/signature-service";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { ESignature } from "./ESignature";
import { Button as UIButton } from "@/components/ui/button";

interface ContractViewerProps {
  contractId: string;
  onContractUpdate?: (contract: Contract) => void;
  showSignButton?: boolean;
  currentUserId?: string;
}

export const ContractViewer = ({
  contractId,
  onContractUpdate,
  showSignButton = true,
  currentUserId,
}: ContractViewerProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [milestones, setMilestones] = useState<Array<{ id: string; title: string; amount: number; due_date: string | null; status: string }>>([]);

  useEffect(() => {
    if (contractId) {
      fetchContract();
      fetchMilestones();
    }
  }, [contractId]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_milestones')
        .select('id,title,amount,due_date,status')
        .eq('contract_id', contractId);
      if (!error) setMilestones(data || []);
    } catch {
      // ignore
    }
  };

  const fetchContract = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:profiles!contracts_client_id_fkey(full_name),
          professional:profiles!contracts_professional_id_fkey(full_name, company_name),
          project:projects(title)
        `)
        .eq('id', contractId)
        .single();

      if (error) {
        // If table doesn't exist yet, silently fail
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Contracts table not yet created. Please apply migration 008_add_contracts_system.sql');
          setContract(null);
          return;
        }
        throw error;
      }

      if (data) {
        // Transform the data to match our interface
        const transformedContract: Contract = {
          ...data,
          client_name: data.client?.full_name,
          professional_name: data.professional?.full_name,
          company_name: data.professional?.company_name,
          project_title: data.project?.title,
        };
        setContract(transformedContract);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('contracts.error_loading_contract'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async (signatureData: SignatureData) => {
    if (!contract || !currentUserId) return;

    try {
      setSigning(true);

      const isClient = currentUserId === contract.client_id;
      const updateData = isClient
        ? {
            client_signature_data: signatureData,
            client_signed_at: new Date().toISOString(),
          }
        : {
            professional_signature_data: signatureData,
            professional_signed_at: new Date().toISOString(),
          };

      const { data, error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;

      setContract(data);
      onContractUpdate?.(data);

      toast({
        title: t('contracts.signed_successfully'),
        description: t('contracts.signed_successfully_description'),
      });
    } catch (error) {
      console.error('Error signing contract:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('contracts.error_signing'),
      });
    } finally {
      setSigning(false);
    }
  };

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'pending_client_signature':
      case 'pending_professional_signature':
      case 'pending_both_signatures':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const requestValidation = async (milestoneId: string) => {
    try {
      await supabase.rpc('request_milestone_validation', { p_milestone: milestoneId });
      await fetchMilestones();
    } catch (e) {
      console.error('Error requesting validation:', e);
    }
  };

  const approveMilestone = async (milestoneId: string) => {
    try {
      await supabase.rpc('approve_milestone', { p_milestone: milestoneId });
      await fetchMilestones();
    } catch (e) {
      console.error('Error approving milestone:', e);
    }
  };

  const getStatusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'signed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending_client_signature':
      case 'pending_professional_signature':
      case 'pending_both_signatures':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: ContractStatus) => {
    switch (status) {
      case 'signed':
        return t('contracts.status.signed');
      case 'pending_client_signature':
        return t('contracts.status.pending_client_signature');
      case 'pending_professional_signature':
        return t('contracts.status.pending_professional_signature');
      case 'pending_both_signatures':
        return t('contracts.status.pending_both_signatures');
      case 'draft':
        return t('contracts.status.draft');
      case 'cancelled':
        return t('contracts.status.cancelled');
      case 'expired':
        return t('contracts.status.expired');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('common.not_specified');
    const locale = i18n.language === 'fr' ? fr : enUS;
    return format(new Date(dateString), 'PPP', { locale });
  };

  const formatCurrency = (amount: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const canSign = () => {
    if (!contract || !currentUserId) return false;
    
    const isClient = currentUserId === contract.client_id;
    const isProfessional = currentUserId === contract.professional_id;
    
    if (!isClient && !isProfessional) return false;
    
    if (contract.status === 'signed' || contract.status === 'cancelled' || contract.status === 'expired') {
      return false;
    }
    
    if (isClient && contract.client_signed_at) return false;
    if (isProfessional && contract.professional_signed_at) return false;
    
    return true;
  };

  const getSignerName = () => {
    if (!contract || !currentUserId) return '';
    
    const isClient = currentUserId === contract.client_id;
    return isClient ? contract.client_name || t('common.client') : contract.professional_name || t('common.professional');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">{t('contracts.not_found')}</h3>
        <p className="text-muted-foreground">{t('contracts.not_found_description')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{contract.title}</h1>
          <p className="text-muted-foreground mt-1">{contract.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(contract.status)}>
            {getStatusIcon(contract.status)}
            <span className="ml-1">{getStatusLabel(contract.status)}</span>
          </Badge>
          {contract.contract_pdf_url && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('contracts.download_pdf')}
            </Button>
          )}
        </div>
      </div>

      {/* Contract Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('contracts.contract_content')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full">
            {(() => {
              const sanitized = DOMPurify.sanitize(contract.contract_content ?? "", { USE_PROFILES: { html: true } });
              return (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitized }}
                />
              );
            })()}
          </ScrollArea>
        </CardContent>
      </Card>

      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('contracts.milestones') || 'Jalons'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.map(m => (
              <div key={m.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{m.title} — {formatCurrency(m.amount, contract?.currency || 'CAD')}</div>
                  {m.due_date && <div className="text-xs text-muted-foreground">Échéance: {formatDate(m.due_date)}</div>}
                  <div className="text-xs text-muted-foreground">Statut: {m.status}</div>
                </div>
                {currentUserId === contract?.professional_id && m.status === 'pending' && (
                  <UIButton size="sm" onClick={() => requestValidation(m.id)}>Demander validation</UIButton>
                )}
                {currentUserId === contract?.client_id && m.status === 'requested' && (
                  <UIButton size="sm" onClick={() => approveMilestone(m.id)}>Valider</UIButton>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contract Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('contracts.parties')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">{t('contracts.client')}</h4>
              <p className="font-medium">{contract.client_name}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">{t('contracts.professional')}</h4>
              <p className="font-medium">{contract.professional_name}</p>
              <p className="text-sm text-muted-foreground">{contract.company_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('contracts.financial_terms')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">{t('contracts.total_amount')}</h4>
              <p className="text-2xl font-bold">{formatCurrency(contract.total_amount, contract.currency)}</p>
            </div>
            {contract.deposit_percentage > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">{t('contracts.deposit')}</h4>
                <p className="font-medium">
                  {contract.deposit_percentage}% ({formatCurrency(contract.total_amount * contract.deposit_percentage / 100, contract.currency)})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('contracts.timeline')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">{t('contracts.start_date')}</h4>
              <p className="font-medium">{formatDate(contract.start_date)}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">{t('contracts.end_date')}</h4>
              <p className="font-medium">{formatDate(contract.end_date)}</p>
            </div>
            {contract.estimated_duration_days && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">{t('contracts.estimated_duration')}</h4>
                <p className="font-medium">{contract.estimated_duration_days} {t('contracts.days')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('contracts.legal')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">{t('contracts.warranty')}</h4>
              <p className="font-medium">{contract.warranty_period_months} {t('contracts.months')}</p>
            </div>
            {contract.special_conditions && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">{t('contracts.special_conditions')}</h4>
                <p className="text-sm">{contract.special_conditions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pen className="h-5 w-5" />
            {t('contracts.signatures')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Signature */}
            <div className="space-y-3">
              <h4 className="font-medium">{t('contracts.client_signature')}</h4>
              <div className="border rounded-lg p-4 min-h-24 flex items-center justify-center">
                {contract.client_signed_at ? (
                  <div className="text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-600">{t('contracts.signed')}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(contract.client_signed_at)}</p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Pen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('contracts.not_signed')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Signature */}
            <div className="space-y-3">
              <h4 className="font-medium">{t('contracts.professional_signature')}</h4>
              <div className="border rounded-lg p-4 min-h-24 flex items-center justify-center">
                {contract.professional_signed_at ? (
                  <div className="text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-600">{t('contracts.signed')}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(contract.professional_signed_at)}</p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Pen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('contracts.not_signed')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sign Button */}
          {showSignButton && canSign() && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-center">
                <ESignature
                  onSignatureComplete={handleSignContract}
                  signerName={getSignerName()}
                  contractTitle={contract.title}
                  disabled={signing}
                  trigger={
                    <Button size="lg" disabled={signing}>
                      <Pen className="h-4 w-4 mr-2" />
                      {signing ? t('contracts.signing') : t('contracts.sign_contract')}
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
