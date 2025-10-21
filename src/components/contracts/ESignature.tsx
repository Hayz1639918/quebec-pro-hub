import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pen, RotateCcw, Check, X, ExternalLink, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useDocuSign } from "@/hooks/useDocuSign";
import { DocuSignConfigComponent } from "./DocuSignConfig";
import type { ContractSigningData } from "@/services/docusign";

interface ESignatureProps {
  onSignatureComplete: (signatureData: {
    signature_image: string;
    signed_at: string;
    ip_address?: string;
    user_agent?: string;
    coordinates?: { x: number; y: number };
    docusign_envelope_id?: string;
  }) => void;
  signerName: string;
  contractTitle: string;
  contractContent?: string;
  clientEmail?: string;
  clientName?: string;
  professionalEmail?: string;
  professionalName?: string;
  disabled?: boolean;
  trigger?: React.ReactNode;
  useDocuSign?: boolean;
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
  useDocuSign = false,
}: ESignatureProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { 
    isInitialized: isDocuSignInitialized, 
    sendContract, 
    getSigningUrl, 
    isLoading: isDocuSignLoading 
  } = useDocuSign();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showDocuSignConfig, setShowDocuSignConfig] = useState(false);
  const [docusignEnvelopeId, setDocusignEnvelopeId] = useState<string | null>(null);
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

  // Envoyer le contrat via DocuSign
  const sendViaDocuSign = async () => {
    if (!contractContent || !clientEmail || !clientName || !professionalEmail || !professionalName) {
      toast({
        variant: "destructive",
        title: t('contracts.docusign.missing_data'),
        description: t('contracts.docusign.missing_data_description'),
      });
      return;
    }

    const contractData: ContractSigningData = {
      contractId: '', // Will be set by the parent component
      contractTitle,
      contractContent,
      clientEmail,
      clientName,
      professionalEmail,
      professionalName,
      returnUrl: window.location.origin + '/contracts',
    };

    const envelope = await sendContract(contractData);
    if (envelope) {
      setDocusignEnvelopeId(envelope.envelopeId);
      toast({
        title: t('contracts.docusign.contract_sent'),
        description: t('contracts.docusign.contract_sent_description'),
      });
    }
  };

  // Obtenir l'URL de signature DocuSign
  const getDocuSignSigningUrl = async () => {
    if (!docusignEnvelopeId) return;

    const currentUserEmail = signerName === clientName ? clientEmail : professionalEmail;
    if (!currentUserEmail) return;

    const signingUrl = await getSigningUrl(
      docusignEnvelopeId,
      currentUserEmail,
      window.location.origin + '/contracts'
    );

    if (signingUrl) {
      window.open(signingUrl, '_blank');
    }
  };

  const saveSignature = () => {
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

    // Convert canvas to base64
    const signatureImage = canvas.toDataURL('image/png');
    setSignatureData(signatureImage);

    // Get additional data
    const ipAddress = '127.0.0.1'; // In a real app, get from API
    const userAgent = navigator.userAgent;
    const coordinates = lastPoint || { x: 0, y: 0 };

    onSignatureComplete({
      signature_image: signatureImage,
      signed_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      coordinates,
      docusign_envelope_id: docusignEnvelopeId || undefined,
    });

    toast({
      title: t('contracts.signature.signed'),
      description: t('contracts.signature.signed_description', { signer: signerName }),
    });

    setIsOpen(false);
  };

  const cancelSignature = () => {
    clearSignature();
    setIsOpen(false);
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

        <Tabs defaultValue={useDocuSign ? "docusign" : "canvas"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="canvas">{t('contracts.signature.canvas_signature')}</TabsTrigger>
            <TabsTrigger value="docusign" disabled={!useDocuSign}>
              {t('contracts.signature.docusign_signature')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="space-y-6">
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
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelSignature}>
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel')}
              </Button>
              <Button onClick={saveSignature} disabled={isSignatureEmpty()}>
                <Check className="h-4 w-4 mr-2" />
                {t('contracts.signature.confirm_signature')}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="docusign" className="space-y-6">
            {/* DocuSign Configuration */}
            {!isDocuSignInitialized && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {t('contracts.docusign.setup_required')}
                  </CardTitle>
                  <CardDescription>
                    {t('contracts.docusign.setup_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setShowDocuSignConfig(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    {t('contracts.docusign.configure')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* DocuSign Actions */}
            {isDocuSignInitialized && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{contractTitle}</CardTitle>
                    <CardDescription>
                      {t('contracts.docusign.send_for_signature')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!docusignEnvelopeId ? (
                      <Button 
                        onClick={sendViaDocuSign} 
                        disabled={isDocuSignLoading}
                        className="w-full"
                      >
                        {isDocuSignLoading ? t('common.loading') : t('contracts.docusign.send_contract')}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="font-medium">{t('contracts.docusign.contract_sent')}</span>
                        </div>
                        <Button 
                          onClick={getDocuSignSigningUrl}
                          disabled={isDocuSignLoading}
                          className="w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t('contracts.docusign.open_signing_url')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* DocuSign Configuration Modal */}
        {showDocuSignConfig && (
          <Dialog open={showDocuSignConfig} onOpenChange={setShowDocuSignConfig}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('contracts.docusign.configuration')}</DialogTitle>
                <DialogDescription>
                  {t('contracts.docusign.config_description')}
                </DialogDescription>
              </DialogHeader>
              <DocuSignConfigComponent 
                onConfigSaved={() => {
                  setShowDocuSignConfig(false);
                  toast({
                    title: t('contracts.docusign.config_saved'),
                    description: t('contracts.docusign.config_saved_description'),
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};
