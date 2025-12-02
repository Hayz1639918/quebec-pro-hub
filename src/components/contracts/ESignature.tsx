import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Pen, RotateCcw, Check, X, Download, Type, PenTool } from "lucide-react";
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
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState(signerName);

  // Initialize canvas when dialog opens
  useEffect(() => {
    if (isOpen && canvasRef.current && signatureMode === 'draw') {
      initializeCanvas();
    }
  }, [isOpen, signatureMode]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Reset canvas size (fixed dimensions)
      canvas.width = 400;
      canvas.height = 160;
      
      // Set drawing properties
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 160);
    }
  };

  // Get coordinates from mouse or touch event
  const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factor between CSS display size and canvas internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      if (!touch) return null;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Calculate position relative to canvas, accounting for CSS scaling
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    
    setIsDrawing(true);
    const coords = getEventCoordinates(e);
    if (coords) {
      setLastPoint(coords);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const coords = getEventCoordinates(e);
    if (!ctx || !lastPoint || !coords) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearSignature = () => {
    if (signatureMode === 'draw') {
      initializeCanvas();
    }
    setTypedSignature(signerName);
    setSignatureData(null);
  };

  // Generate signature image from typed text
  const generateTypedSignatureImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Signature styling - cursive font
    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'italic 48px "Brush Script MT", "Segoe Script", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the signature text
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
    
    // Add underline
    const textWidth = ctx.measureText(typedSignature).width;
    ctx.beginPath();
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 1;
    ctx.moveTo((canvas.width - textWidth) / 2, canvas.height / 2 + 30);
    ctx.lineTo((canvas.width + textWidth) / 2, canvas.height / 2 + 30);
    ctx.stroke();
    
    return canvas.toDataURL('image/png');
  };

  // Check if canvas has drawing content
  const hasCanvasContent = (): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Check if any pixel is not white (RGB 255,255,255)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // If pixel is not white, there's content
      if (r !== 255 || g !== 255 || b !== 255) {
        return true;
      }
    }
    return false;
  };

  const saveSignature = async () => {
    let signatureImage: string;

    if (signatureMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!hasCanvasContent()) {
        toast({
          variant: "destructive",
          title: t('contracts.signature.empty_signature'),
          description: t('contracts.signature.empty_signature_description'),
        });
        return;
      }

      signatureImage = canvas.toDataURL('image/png');
    } else {
      // Typed signature mode
      if (!typedSignature.trim()) {
        toast({
          variant: "destructive",
          title: t('contracts.signature.empty_signature'),
          description: "Veuillez entrer votre nom pour la signature",
        });
        return;
      }
      signatureImage = generateTypedSignatureImage();
    }

    setSignatureData(signatureImage);

    try {

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
            signature_method: signatureMode === 'draw' ? 'dessin' : 'texte',
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
    if (signatureMode === 'type') {
      return !typedSignature.trim();
    }
    return !hasCanvasContent();
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

            {/* Signature Tabs */}
            <Tabs value={signatureMode} onValueChange={(v) => setSignatureMode(v as 'draw' | 'type')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="draw" className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  Dessiner
                </TabsTrigger>
                <TabsTrigger value="type" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Taper
                </TabsTrigger>
              </TabsList>

              {/* Draw signature */}
              <TabsContent value="draw" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t('contracts.signature.sign_here')}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {t('contracts.signature.clear')}
                  </Button>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={160}
                    className="cursor-crosshair bg-white rounded block mx-auto"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ touchAction: 'none', width: '100%', maxWidth: '400px', height: '160px' }}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  {t('contracts.signature.instructions')} (souris ou écran tactile)
                </p>
              </TabsContent>

              {/* Type signature */}
              <TabsContent value="type" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Tapez votre signature</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTypedSignature(signerName)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
                
                <Input
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Entrez votre nom complet"
                  className="text-lg"
                />
                
                {/* Preview of typed signature */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white min-h-24 flex items-center justify-center">
                  <p 
                    className="text-4xl text-center"
                    style={{ 
                      fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                      fontStyle: 'italic',
                      color: '#1e3a5f'
                    }}
                  >
                    {typedSignature || signerName}
                  </p>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  Votre signature apparaîtra comme ci-dessus
                </p>
              </TabsContent>
            </Tabs>

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
