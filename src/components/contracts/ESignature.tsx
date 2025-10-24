import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pen, RotateCcw, Check, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { signatureService, type SignatureData } from "@/services/signature-service";
import { generateSignedContractPDF } from "@/lib/contract-pdf-generator";
import { supabase } from "@/integrations/supabase/client";
import type { Contract } from "@/types/contracts";

interface ESignatureProps {
  onSignatureComplete: (signatureData: SignatureData) => void;
  signerName: string;
  contractTitle: string;
  contractContent?: string;
  clientEmail?: string;
  clientName?: string;
  professionalEmail?: string;
  professionalName?: string;
  disabled?: boolean;
  trigger?: React.ReactNode;
  contract?: Contract; // Pour le téléchargement PDF
  currentUserId?: string; // Pour l'audit trail
}

export const ESignature = ({
  onSignatureComplete,
  signerName,
  contractTitle,
  contractContent,
  clientEmail,
  clientName,
  professionalEmail,
  professionalName,
  disabled = false,
  trigger,
  contract,
  currentUserId,
}: ESignatureProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas size
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        
        // Set drawing properties
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setLastPoint({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPoint) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastPoint({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // DocuSign functionality removed (using in-house canvas signature only)

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if there's any content on the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((value, index) => {
      return index % 4 === 3 && value > 0; // Check alpha channel
    });

    if (!hasContent) {
      toast({
        variant: "destructive",
        title: t('contracts.signature.empty_signature'),
        description: t('contracts.signature.empty_signature_description'),
      });
      return;
    }

    try {
      // Convert canvas to base64
      const signatureImage = canvas.toDataURL('image/png');
      setSignatureData(signatureImage);

      // Create signature with all security data
      const signatureData = await signatureService.createSignature(
        signatureImage,
        contractContent || '',
        lastPoint || { x: 0, y: 0 }
      );

      // Add audit trail entry
      if (contract && currentUserId) {
             await signatureService.addAuditTrailEntry(contract.id, {
               event_type: 'signed',
               user_id: currentUserId,
               user_name: signerName,
               created_at: signatureData.signed_at,
               details: {
                 verification_code: signatureData.verification_code,
                 signature_method: 'canvas',
               },
             });
      }

      // Send confirmation email
      if (contract) {
        const recipientEmail = signerName === clientName ? clientEmail : professionalEmail;
        if (recipientEmail) {
          await signatureService.sendSignatureConfirmationEmail(
            contract.id,
            recipientEmail,
            signerName,
            signatureData.verification_code
          );
        }
      }

      onSignatureComplete(signatureData);

      toast({
        title: t('contracts.signature.signed'),
        description: t('contracts.signature.signed_description', { 
          signer: signerName,
          code: signatureData.verification_code 
        }),
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error creating signature:', error);
      toast({
        variant: "destructive",
        title: "Erreur de signature",
        description: "Une erreur est survenue lors de la création de la signature",
      });
    }
  };

  const cancelSignature = () => {
    clearSignature();
    setIsOpen(false);
  };

  // Télécharger le PDF du contrat signé
  const handleDownloadPDF = async () => {
    if (!contract) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Informations du contrat manquantes",
      });
      return;
    }

    try {
      // Récupérer les signatures depuis la base de données
      const { data: contractData } = await supabase
        .from('contracts')
        .select('client_signature_data, professional_signature_data')
        .eq('id', contract.id)
        .single();

      if (!contractData) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Contrat non trouvé",
        });
        return;
      }

      const clientSignature = contractData.client_signature_data as SignatureData | null;
      const professionalSignature = contractData.professional_signature_data as SignatureData | null;

      await generateSignedContractPDF(contract, clientSignature, professionalSignature);

      // Ajouter une entrée d'audit
      if (currentUserId) {
        await signatureService.addAuditTrailEntry(contract.id, {
          event_type: 'downloaded',
          user_id: currentUserId,
          user_name: signerName,
          timestamp: new Date().toISOString(),
          details: {
            download_type: 'pdf',
            downloaded_by: signerName,
          },
        });
      }

      toast({
        title: "PDF généré",
        description: "Le PDF du contrat a été généré avec succès",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le PDF",
      });
    }
  };

  const isSignatureEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;

    const ctx = canvas.getContext('2d');
    if (!ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return !imageData.data.some((value, index) => {
      return index % 4 === 3 && value > 0;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button disabled={disabled}>
            <Pen className="h-4 w-4 mr-2" />
            {t('contracts.signature.sign')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('contracts.signature.title')}</DialogTitle>
          <DialogDescription>
            {t('contracts.signature.description', { 
              signer: signerName, 
              contract: contractTitle 
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            {/* Contract Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{contractTitle}</CardTitle>
                <CardDescription>
                  {t('contracts.signature.signer')}: {signerName}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Signature Canvas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{t('contracts.signature.sign_here')}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  disabled={isSignatureEmpty()}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('contracts.signature.clear')}
                </Button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  className="w-full h-32 cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ touchAction: 'none' }}
                />
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                {t('contracts.signature.instructions')}
              </p>
            </div>

            {/* Legal Notice */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">
                      {t('contracts.signature.legal_notice_title')}
                    </p>
                    <p className="text-blue-800">
                      {t('contracts.signature.legal_notice_text')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div>
                {contract && (
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger PDF
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={cancelSignature}>
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
                <Button onClick={saveSignature} disabled={isSignatureEmpty()}>
                  <Check className="h-4 w-4 mr-2" />
                  {t('contracts.signature.confirm_signature')}
                </Button>
              </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
