import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Shield, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateSignedContractPDF } from '@/lib/contract-pdf-generator';
import type { Contract } from '@/types/contracts';
import type { SignatureData } from '@/services/signature-service';

export default function VerifySignature() {
  const { verificationCode } = useParams<{ verificationCode: string }>();
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<{
    contract: Contract | null;
    clientSignature: SignatureData | null;
    professionalSignature: SignatureData | null;
    isValid: boolean;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    if (verificationCode) {
      verifySignature();
    }
  }, [verificationCode]);

  const verifySignature = async () => {
    try {
      setLoading(true);
      
      // Rechercher le contrat avec ce code de vérification
      const { data: contracts } = await supabase
        .from('contracts')
        .select(`
          *,
          client_name:profiles!client_id(full_name),
          professional_name:profiles!professional_id(full_name),
          company_name:profiles!professional_id(company_name)
        `)
        .or(`client_signature_data->verification_code.eq.${verificationCode},professional_signature_data->verification_code.eq.${verificationCode}`)
        .single();

      if (!contracts) {
        setVerification({
          contract: null,
          clientSignature: null,
          professionalSignature: null,
          isValid: false,
          reason: 'Code de vérification non trouvé'
        });
        return;
      }

      // Extraire les signatures
      const clientSignature = contracts.client_signature_data as SignatureData | null;
      const professionalSignature = contracts.professional_signature_data as SignatureData | null;

      // Vérifier si le code correspond à une signature
      const isClientCode = clientSignature?.verification_code === verificationCode;
      const isProfessionalCode = professionalSignature?.verification_code === verificationCode;
      
      setVerification({
        contract: contracts as Contract,
        clientSignature,
        professionalSignature,
        isValid: isClientCode || isProfessionalCode,
        reason: isClientCode || isProfessionalCode ? undefined : 'Code de vérification invalide'
      });

    } catch (error) {
      console.error('Error verifying signature:', error);
      setVerification({
        contract: null,
        clientSignature: null,
        professionalSignature: null,
        isValid: false,
        reason: 'Erreur lors de la vérification'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!verification?.contract) return;
    
    try {
      await generateSignedContractPDF(
        verification.contract,
        verification.clientSignature,
        verification.professionalSignature
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Vérification en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Vérification de Signature Électronique</CardTitle>
                <p className="text-muted-foreground">
                  Code de vérification: <span className="font-mono font-bold">{verificationCode}</span>
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {verification?.isValid ? (
              <>
                {/* Status de validation */}
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Signature Valide</h3>
                    <p className="text-sm text-green-700">
                      Cette signature électronique est authentique et vérifiée
                    </p>
                  </div>
                </div>

                {/* Détails du contrat */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Détails du contrat</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground text-sm">ID Contrat:</span>
                        <p className="font-mono text-sm">{verification.contract?.id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Titre:</span>
                        <p className="font-medium">{verification.contract?.title}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Statut:</span>
                        <Badge variant={verification.contract?.status === 'signed' ? 'default' : 'secondary'}>
                          {verification.contract?.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground text-sm">Montant:</span>
                        <p className="font-medium">
                          {verification.contract?.total_amount?.toLocaleString('fr-CA')} {verification.contract?.currency}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Créé le:</span>
                        <p className="text-sm">
                          {verification.contract?.created_at ? format(new Date(verification.contract.created_at), 'd MMMM yyyy', { locale: fr }) : '-'}
                        </p>
                      </div>
                      {verification.contract?.signed_at && (
                        <div>
                          <span className="text-muted-foreground text-sm">Signé le:</span>
                          <p className="text-sm">
                            {format(new Date(verification.contract.signed_at), 'd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Signatures</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Signature Client */}
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">Signature du Client</h5>
                      {verification.clientSignature ? (
                        <div className="space-y-3">
                          <div className="border rounded p-2 bg-gray-50">
                            <img 
                              src={verification.clientSignature.signature_image} 
                              alt="Signature client" 
                              className="max-w-full h-20 object-contain"
                            />
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>Signé le:</strong> {format(new Date(verification.clientSignature.signed_at), 'd MMMM yyyy à HH:mm', { locale: fr })}</p>
                            <p><strong>Code:</strong> <span className="font-mono">{verification.clientSignature.verification_code}</span></p>
                            <p><strong>IP:</strong> {verification.clientSignature.ip_address}</p>
                            {verification.clientSignature.geolocation && (
                              <p><strong>Position:</strong> {verification.clientSignature.geolocation.latitude.toFixed(4)}, {verification.clientSignature.geolocation.longitude.toFixed(4)}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Non signé</p>
                      )}
                    </div>

                    {/* Signature Professionnel */}
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">Signature du Professionnel</h5>
                      {verification.professionalSignature ? (
                        <div className="space-y-3">
                          <div className="border rounded p-2 bg-gray-50">
                            <img 
                              src={verification.professionalSignature.signature_image} 
                              alt="Signature professionnel" 
                              className="max-w-full h-20 object-contain"
                            />
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>Signé le:</strong> {format(new Date(verification.professionalSignature.signed_at), 'd MMMM yyyy à HH:mm', { locale: fr })}</p>
                            <p><strong>Code:</strong> <span className="font-mono">{verification.professionalSignature.verification_code}</span></p>
                            <p><strong>IP:</strong> {verification.professionalSignature.ip_address}</p>
                            {verification.professionalSignature.geolocation && (
                              <p><strong>Position:</strong> {verification.professionalSignature.geolocation.latitude.toFixed(4)}, {verification.professionalSignature.geolocation.longitude.toFixed(4)}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Non signé</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Télécharger le PDF
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/contracts" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Voir tous les contrats
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Signature Non Trouvée</h3>
                  <p className="text-sm text-red-700">
                    {verification?.reason || 'Code de vérification invalide'}
                  </p>
                </div>
              </div>
            )}

            {/* Informations légales */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Informations Légales</h4>
              <p className="text-sm text-blue-800">
                Cette signature électronique est conforme aux lois canadiennes sur les signatures électroniques. 
                Le document original est stocké de manière sécurisée avec une piste d'audit complète.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

