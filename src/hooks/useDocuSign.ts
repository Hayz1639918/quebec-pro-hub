import { useState, useEffect } from 'react';
import { docuSignService, DocuSignConfig, ContractSigningData, DocuSignEnvelope } from '@/services/docusign';
import { useToast } from '@/hooks/use-toast';

export const useDocuSign = () => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser DocuSign avec la configuration
  const initialize = async (config: DocuSignConfig) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await docuSignService.initialize(config);
      setIsInitialized(true);
      
      toast({
        title: 'DocuSign initialisé',
        description: 'Service de signature électronique prêt',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d\'initialisation DocuSign';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erreur DocuSign',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer un contrat pour signature
  const sendContract = async (data: ContractSigningData): Promise<DocuSignEnvelope | null> => {
    if (!isInitialized) {
      toast({
        variant: 'destructive',
        title: 'DocuSign non initialisé',
        description: 'Veuillez d\'abord initialiser le service DocuSign',
      });
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const envelope = await docuSignService.sendContractForSigning(data);
      
      toast({
        title: 'Contrat envoyé',
        description: 'Le contrat a été envoyé pour signature via DocuSign',
      });
      
      return envelope;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'envoi du contrat';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erreur d\'envoi',
        description: errorMessage,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir le statut d'une enveloppe
  const getEnvelopeStatus = async (envelopeId: string): Promise<DocuSignEnvelope | null> => {
    if (!isInitialized) {
      setError('DocuSign non initialisé');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const envelope = await docuSignService.getEnvelopeStatus(envelopeId);
      return envelope;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du statut';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir l'URL de signature
  const getSigningUrl = async (envelopeId: string, recipientEmail: string, returnUrl: string): Promise<string | null> => {
    if (!isInitialized) {
      setError('DocuSign non initialisé');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const url = await docuSignService.getRecipientView(envelopeId, recipientEmail, returnUrl);
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de l\'URL de signature';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Annuler une enveloppe
  const voidEnvelope = async (envelopeId: string, reason: string): Promise<boolean> => {
    if (!isInitialized) {
      setError('DocuSign non initialisé');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await docuSignService.voidEnvelope(envelopeId, reason);
      
      toast({
        title: 'Contrat annulé',
        description: 'Le contrat a été annulé avec succès',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'annulation';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erreur d\'annulation',
        description: errorMessage,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Télécharger le document signé
  const downloadSignedDocument = async (envelopeId: string): Promise<Blob | null> => {
    if (!isInitialized) {
      setError('DocuSign non initialisé');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const blob = await docuSignService.downloadSignedDocument(envelopeId);
      
      toast({
        title: 'Document téléchargé',
        description: 'Le document signé a été téléchargé avec succès',
      });
      
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erreur de téléchargement',
        description: errorMessage,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    initialize,
    sendContract,
    getEnvelopeStatus,
    getSigningUrl,
    voidEnvelope,
    downloadSignedDocument,
  };
};
