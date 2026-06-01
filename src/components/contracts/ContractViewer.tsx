import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  AlertCircle,
  RotateCcw
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
import { DisputeForm } from "@/components/disputes/DisputeForm";
import { DisputesList } from "@/components/disputes/DisputesList";
import { AlertTriangle } from "lucide-react";
import {
  PaymentHandlingBadge,
  PaymentHandlingHint,
  type PaymentHandlingMode,
} from "@/components/payments/PaymentHandlingDisplay";

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
  const [rejectingMilestone, setRejectingMilestone] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);

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

      // First, try to get the contract with simple query
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error) {
        console.error('Error fetching contract:', error);
        // If table doesn't exist yet, silently fail
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Contracts table not yet created. Please apply migration 008_add_contracts_system.sql');
          setContract(null);
          return;
        }
        throw error;
      }

      if (data) {
        // Fetch related data separately to avoid foreign key issues
        let clientName = null;
        let professionalName = null;
        let companyName = null;
        let projectTitle = null;

        // Get client name
        if (data.client_id) {
          const { data: clientData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.client_id)
            .single();
          clientName = clientData?.full_name;
        }

        // Get professional name
        if (data.professional_id) {
          const { data: proData } = await supabase
            .from('profiles')
            .select('full_name, company_name')
            .eq('id', data.professional_id)
            .single();
          professionalName = proData?.full_name;
          companyName = proData?.company_name;
        }

        // Get project title
        if (data.project_id) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('title')
            .eq('id', data.project_id)
            .single();
          projectTitle = projectData?.title;
        }

        const transformedContract: Contract = {
          ...data,
          client_name: clientName,
          professional_name: professionalName,
          company_name: companyName,
          project_title: projectTitle,
        };
        setContract(transformedContract);
      }
    } catch (error: any) {
      console.error('Error fetching contract:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error?.message || t('contracts.error_loading_contract'),
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
        return 'bg-success-light text-success';
      case 'pending_client_signature':
      case 'pending_professional_signature':
      case 'pending_both_signatures':
        return 'bg-warning-light text-warning';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      case 'expired':
        return 'bg-warning-light text-warning';
      default:
        return 'bg-muted text-muted-foreground';
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
      toast({ title: 'Jalon approuvé', description: 'Le jalon a été approuvé avec succès.' });
      await fetchMilestones();
    } catch (e) {
      console.error('Error approving milestone:', e);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'approuver le jalon." });
    }
  };

  const rejectMilestone = async () => {
    if (!rejectingMilestone) return;
    try {
      await supabase.rpc('reject_milestone', { p_milestone: rejectingMilestone, p_reason: rejectReason || null });
      toast({ title: 'Jalon rejeté', description: 'Le jalon a été rejeté.' });
      setRejectingMilestone(null);
      setRejectReason("");
      await fetchMilestones();
    } catch (e) {
      console.error('Error rejecting milestone:', e);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de rejeter le jalon." });
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(contract.contract_pdf_url!, '_blank', 'noopener,noreferrer')}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('contracts.download_pdf')}
            </Button>
          )}
        </div>
      </div>

      {/* Contract Content - Display exactly like template preview */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document du contrat
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open in new window for printing - include signatures with dates
                let printContent = contract.contract_content || '';
                
                // Helper to inject signature
                const injectSig = (html: string, label: string, sigImage: string, signedDate: string): string => {
                  const sigHtml = `
                    <div style="text-align: center; margin: 5px 0;">
                      <img src="${sigImage}" alt="${label}" style="max-height: 50px; max-width: 180px;" />
                    </div>
                  `;
                  return html.replace(
                    new RegExp(`<div class="signature-line"><span class="signature-label">${label}</span></div>`, 'gi'),
                    `<div class="signature-line" style="border-top: none; min-height: 60px;">${sigHtml}<span class="signature-label">${label}</span></div>`
                  );
                };
                
                // Inject client signature if exists
                if (contract.client_signed_at && contract.client_signature_data) {
                  const clientSigData = contract.client_signature_data as SignatureData;
                  const clientDate = formatDate(contract.client_signed_at);
                  
                  printContent = injectSig(printContent, 'Signature du client', clientSigData.signature_image, clientDate);
                  
                  // Update date field
                  const clientBlockRegex = /(Signature du client[\s\S]*?<span class="field-label">Date :<\/span>\s*<span class="field-value">)[^<]*(<\/span>)/gi;
                  printContent = printContent.replace(clientBlockRegex, `$1${clientDate}$2`);
                }
                
                // Inject professional signature if exists
                if (contract.professional_signed_at && contract.professional_signature_data) {
                  const proSigData = contract.professional_signature_data as SignatureData;
                  const proDate = formatDate(contract.professional_signed_at);
                  
                  // Handle various label variations
                  ["Signature de l'entrepreneur", "Signature de l''entrepreneur", "Entrepreneur général"].forEach(label => {
                    printContent = injectSig(printContent, label, proSigData.signature_image, proDate);
                  });
                  
                  // Update date field
                  const proBlockRegex = /((?:Signature de l'entrepreneur|Entrepreneur général)[\s\S]*?<span class="field-label">Date :<\/span>\s*<span class="field-value">)[^<]*(<\/span>)/gi;
                  printContent = printContent.replace(proBlockRegex, `$1${proDate}$2`);
                }
                
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(printContent);
                  printWindow.document.title = contract.title;
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Ouvrir / Imprimer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            let content = contract.contract_content ?? "";
            const isFullHtmlTemplate = content.includes('<!DOCTYPE') || content.includes('<html') || content.includes('<style');
            
            // Helper function to inject signature with date into a signature block
            const injectSignatureInBlock = (
              html: string, 
              signatureLabel: string, 
              signatureImage: string, 
              signedAt: string
            ): string => {
              // Pattern to find the signature block and its associated date field
              const blockPattern = new RegExp(
                `(<div class="signature-block">\\s*` +
                `<div class="signature-line"><span class="signature-label">${signatureLabel}</span></div>` +
                `[\\s\\S]*?)` +
                `(<span class="field-label">Date :</span>\\s*<span class="field-value">)[^<]*(</span>)`,
                'gi'
              );
              
              // Replace signature line with image and date field with actual date
              let result = html;
              
              // First, inject the signature image
              const sigHtml = `
                <div style="text-align: center; margin: 5px 0;">
                  <img src="${signatureImage}" alt="${signatureLabel}" style="max-height: 50px; max-width: 180px;" />
                </div>
              `;
              
              result = result.replace(
                new RegExp(`<div class="signature-line"><span class="signature-label">${signatureLabel}</span></div>`, 'gi'),
                `<div class="signature-line" style="border-top: none; min-height: 60px;">${sigHtml}<span class="signature-label">${signatureLabel}</span></div>`
              );
              
              return result;
            };
            
            // Inject client signature if exists
            if (contract.client_signed_at && contract.client_signature_data) {
              const clientSigData = contract.client_signature_data as SignatureData;
              const clientDate = formatDate(contract.client_signed_at);
              
              // Inject signature image
              content = injectSignatureInBlock(
                content,
                'Signature du client',
                clientSigData.signature_image,
                contract.client_signed_at
              );
              
              // Replace the date field in client's signature block
              // Find the client signature block and update its date
              const clientBlockRegex = /(Signature du client[\s\S]*?<span class="field-label">Date :<\/span>\s*<span class="field-value">)[^<]*(<\/span>)/gi;
              content = content.replace(clientBlockRegex, `$1${clientDate}$2`);
              
              // Also handle alternative patterns
              content = content.replace(/\[SIGNATURE CLIENT\]/gi, 
                `<img src="${clientSigData.signature_image}" style="max-height: 50px;" />`
              );
            }
            
            // Inject professional signature if exists
            if (contract.professional_signed_at && contract.professional_signature_data) {
              const proSigData = contract.professional_signature_data as SignatureData;
              const proDate = formatDate(contract.professional_signed_at);
              
              // Inject signature image for various label variations
              const proLabels = ["Signature de l'entrepreneur", "Signature de l''entrepreneur", "Entrepreneur général"];
              proLabels.forEach(label => {
                content = injectSignatureInBlock(content, label, proSigData.signature_image, contract.professional_signed_at!);
              });
              
              // Replace the date field in professional's signature block
              const proBlockRegex = /((?:Signature de l'entrepreneur|Entrepreneur général)[\s\S]*?<span class="field-label">Date :<\/span>\s*<span class="field-value">)[^<]*(<\/span>)/gi;
              content = content.replace(proBlockRegex, `$1${proDate}$2`);
              
              // Also handle alternative patterns
              content = content.replace(/\[SIGNATURE ENTREPRENEUR\]/gi, 
                `<img src="${proSigData.signature_image}" style="max-height: 50px;" />`
              );
              content = content.replace(/\[SIGNATURE PROFESSIONNEL\]/gi, 
                `<img src="${proSigData.signature_image}" style="max-height: 50px;" />`
              );
            }
            
            if (isFullHtmlTemplate) {
              // Full HTML template - render in iframe without sanitization for exact rendering
              return (
                <div className="bg-gray-200 p-6">
                  <div className="bg-white shadow-xl mx-auto" style={{ maxWidth: '850px' }}>
                    <iframe
                      srcDoc={content}
                      className="w-full border-0"
                      style={{ height: 'min(1100px, 85vh)' }}
                      title="Contrat"
                    />
                  </div>
                </div>
              );
            } else {
              // Simple content - styled view
              const sanitized = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
              return (
                <ScrollArea className="h-[min(800px,80vh)]">
                  <div className="bg-gray-200 p-8 min-h-full">
                    <div className="bg-white shadow-lg mx-auto max-w-4xl p-8">
                      <div
                        className="prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitized }}
                      />
                    </div>
                  </div>
                </ScrollArea>
              );
            }
          })()}
        </CardContent>
      </Card>
      
      {/* Signature Status - Separate from document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pen className="h-5 w-5" />
            Statut des signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Client Signature Status */}
            <div className="border rounded-lg p-6 bg-slate-50">
              <h4 className="font-semibold mb-4 text-center">Signature du client</h4>
              <div className="flex flex-col items-center">
                {contract.client_signed_at ? (
                  <>
                    {contract.client_signature_data ? (
                      <div className="bg-white border rounded-lg p-4 mb-3 w-full max-w-xs">
                        <img
                          src={(contract.client_signature_data as SignatureData).signature_image}
                          alt="Signature client"
                          className="max-h-20 mx-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-10 w-10 text-success" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-success mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Signé</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{contract.client_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(contract.client_signed_at)}</p>
                    {contract.client_signature_data && (
                      <p className="text-xs font-mono text-muted-foreground/70 mt-1">
                        Code: {(contract.client_signature_data as SignatureData).verification_code}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                      <Clock className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground">En attente de signature</p>
                    <p className="text-sm text-muted-foreground">{contract.client_name}</p>
                  </>
                )}
              </div>
            </div>

            {/* Professional Signature Status */}
            <div className="border rounded-lg p-6 bg-slate-50">
              <h4 className="font-semibold mb-4 text-center">Signature de l'entrepreneur</h4>
              <div className="flex flex-col items-center">
                {contract.professional_signed_at ? (
                  <>
                    {contract.professional_signature_data ? (
                      <div className="bg-white border rounded-lg p-4 mb-3 w-full max-w-xs">
                        <img
                          src={(contract.professional_signature_data as SignatureData).signature_image}
                          alt="Signature professionnel"
                          className="max-h-20 mx-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-10 w-10 text-success" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-success mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Signé</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{contract.professional_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(contract.professional_signed_at)}</p>
                    {contract.professional_signature_data && (
                      <p className="text-xs font-mono text-muted-foreground/70 mt-1">
                        Code: {(contract.professional_signature_data as SignatureData).verification_code}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                      <Clock className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground">En attente de signature</p>
                    <p className="text-sm text-muted-foreground">{contract.professional_name}</p>
                    {contract.company_name && (
                      <p className="text-xs text-muted-foreground">{contract.company_name}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modalité de règlement */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-medium">Modalité de règlement</span>
            </div>
            <PaymentHandlingBadge
              mode={(contract.payment_handling === "offline" ? "offline" : "platform") as PaymentHandlingMode}
            />
          </div>
          <PaymentHandlingHint
            className="mt-2"
            mode={(contract.payment_handling === "offline" ? "offline" : "platform") as PaymentHandlingMode}
            audience="neutral"
          />
        </CardContent>
      </Card>

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Jalons de paiement ({milestones.length})
            </CardTitle>
            <CardDescription>
              Total: {formatCurrency(milestones.reduce((s, m) => s + m.amount, 0), contract?.currency || 'CAD')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.map(m => {
              const statusConfig: Record<string, { label: string; className: string }> = {
                pending: { label: 'En attente', className: 'bg-muted text-muted-foreground' },
                requested: { label: 'Validation demandée', className: 'bg-warning-light text-warning' },
                approved: { label: 'Approuvé', className: 'bg-success-light text-success' },
                rejected: { label: 'Rejeté', className: 'bg-destructive/10 text-destructive' },
                paid: { label: 'Payé', className: 'bg-success-light text-success' },
              };
              const cfg = statusConfig[m.status] || statusConfig.pending;
              return (
                <div key={m.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{m.title}</span>
                      <Badge className={cfg.className}>{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{formatCurrency(m.amount, contract?.currency || 'CAD')}</span>
                      {m.due_date && <span>Échéance: {formatDate(m.due_date)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {currentUserId === contract?.professional_id && (m.status === 'pending' || m.status === 'rejected') && (
                      <Button size="sm" onClick={() => requestValidation(m.id)}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {m.status === 'rejected' ? 'Resoumettre' : 'Demander validation'}
                      </Button>
                    )}
                    {currentUserId === contract?.client_id && m.status === 'requested' && (
                      <>
                        <Button size="sm" onClick={() => approveMilestone(m.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approuver
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setRejectingMilestone(m.id)}>
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Reject Milestone Dialog */}
      <Dialog open={!!rejectingMilestone} onOpenChange={(open) => { if (!open) { setRejectingMilestone(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le jalon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Veuillez indiquer le motif du rejet. L'entrepreneur sera notifié et pourra resoumettre le jalon.
            </p>
            <Textarea
              placeholder="Motif du rejet (optionnel)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectingMilestone(null); setRejectReason(""); }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={rejectMilestone}>
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disputes Section */}
      {contract.status === 'signed' && currentUserId && (
        <>
          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={() => setDisputeDialogOpen(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Signaler un litige
            </Button>
          </div>

          <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Signaler un litige</DialogTitle>
              </DialogHeader>
              <DisputeForm
                contractId={contractId}
                userId={currentUserId}
                onSubmitted={() => setDisputeDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <DisputesList contractId={contractId} userId={currentUserId} />
        </>
      )}

      {/* Sign Button - Outside the PDF view */}
      {showSignButton && canSign() && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {currentUserId === contract.client_id ? 'Signez ce contrat' : 'Signez ce contrat en tant qu\'entrepreneur'}
              </h3>
              <p className="text-muted-foreground mb-4">
                En signant ce contrat, vous acceptez les termes et conditions ci-dessus.
              </p>
              <ESignature
                onSignatureComplete={handleSignContract}
                signerName={getSignerName()}
                contractTitle={contract.title}
                contractContent={contract.contract_content}
                contract={contract}
                currentUserId={currentUserId}
                disabled={signing}
                trigger={
                  <Button size="lg" disabled={signing} className="px-8">
                    <Pen className="h-5 w-5 mr-2" />
                    {signing ? t('contracts.signing') : t('contracts.sign_contract')}
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
