import axios from 'axios';

// Types pour DocuSign
export interface DocuSignConfig {
  basePath: string;
  accessToken: string;
  accountId: string;
  integratorKey: string;
  userId: string;
  privateKey: string;
  expiresIn: number;
}

export interface DocuSignEnvelope {
  envelopeId: string;
  status: 'sent' | 'delivered' | 'completed' | 'declined' | 'voided';
  statusChangedDateTime: string;
  recipients: {
    signers: Array<{
      recipientId: string;
      email: string;
      name: string;
      status: 'sent' | 'delivered' | 'signed' | 'declined';
      signedDateTime?: string;
    }>;
  };
}

export interface ContractSigningData {
  contractId: string;
  contractTitle: string;
  contractContent: string;
  clientEmail: string;
  clientName: string;
  professionalEmail: string;
  professionalName: string;
  returnUrl: string;
}

class DocuSignService {
  private config: DocuSignConfig | null = null;
  private baseUrl: string = '';

  constructor() {
    // Constructor vide
  }

  // Initialiser la configuration DocuSign
  async initialize(config: DocuSignConfig): Promise<void> {
    this.config = config;
    this.baseUrl = config.basePath;
  }

  // Obtenir un token d'accès JWT (simulation pour la démo)
  async getAccessToken(): Promise<string> {
    if (!this.config) {
      throw new Error('DocuSign not initialized');
    }

    // En mode démo, on simule un token
    if (this.config.basePath.includes('demo')) {
      return 'demo-access-token';
    }

    try {
      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: this.generateJWT()
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting DocuSign access token:', error);
      throw new Error('Failed to get DocuSign access token');
    }
  }

  // Générer un JWT pour l'authentification (simulation)
  private generateJWT(): string {
    if (!this.config) {
      throw new Error('DocuSign not initialized');
    }

    // En mode démo, on simule un JWT
    if (this.config.basePath.includes('demo')) {
      return 'demo-jwt-token';
    }

    // Dans un vrai projet, utilisez une librairie JWT comme 'jsonwebtoken'
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.config.integratorKey,
      sub: this.config.userId,
      aud: 'account-d.docusign.com',
      iat: now,
      exp: now + this.config.expiresIn,
      scope: 'signature impersonation'
    };

    return btoa(JSON.stringify(payload));
  }

  // Créer et envoyer un contrat pour signature
  async sendContractForSigning(data: ContractSigningData): Promise<DocuSignEnvelope> {
    if (!this.config) {
      throw new Error('DocuSign not initialized');
    }

    try {
      // En mode démo, on simule l'envoi
      if (this.config.basePath.includes('demo')) {
        return this.simulateContractSending(data);
      }

      const accessToken = await this.getAccessToken();
      
      // Créer l'enveloppe DocuSign
      const envelope = {
        emailSubject: `Contrat à signer: ${data.contractTitle}`,
        documents: [{
          documentBase64: btoa(data.contractContent),
          name: data.contractTitle,
          fileExtension: 'html',
          documentId: '1'
        }],
        recipients: {
          signers: [
            {
              email: data.clientEmail,
              name: data.clientName,
              recipientId: '1',
              routingOrder: '1',
              tabs: {
                signHereTabs: [{
                  documentId: '1',
                  pageNumber: '1',
                  recipientId: '1',
                  tabLabel: 'ClientSignature',
                  xPosition: '100',
                  yPosition: '100'
                }]
              }
            },
            {
              email: data.professionalEmail,
              name: data.professionalName,
              recipientId: '2',
              routingOrder: '2',
              tabs: {
                signHereTabs: [{
                  documentId: '1',
                  pageNumber: '1',
                  recipientId: '2',
                  tabLabel: 'ProfessionalSignature',
                  xPosition: '100',
                  yPosition: '200'
                }]
              }
            }
          ]
        },
        status: 'sent',
        eventNotification: {
          url: `${data.returnUrl}/api/docusign/webhook`,
          loggingEnabled: 'true',
          includeCertificateOfCompletion: 'true',
          includeDocumentFields: 'true',
          includeEnvelopeVoidReason: 'true',
          includeTimeZone: 'true',
          includeSenderAccountAsCustomField: 'true',
          envelopeEvents: [
            { envelopeEventStatusCode: 'sent' },
            { envelopeEventStatusCode: 'delivered' },
            { envelopeEventStatusCode: 'completed' },
            { envelopeEventStatusCode: 'declined' },
            { envelopeEventStatusCode: 'voided' }
          ],
          recipientEvents: [
            { recipientEventStatusCode: 'sent' },
            { recipientEventStatusCode: 'delivered' },
            { recipientEventStatusCode: 'signed' },
            { recipientEventStatusCode: 'declined' }
          ]
        }
      };

      // Envoyer l'enveloppe
      const response = await axios.post(
        `${this.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes`,
        envelope,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        envelopeId: response.data.envelopeId,
        status: response.data.status,
        statusChangedDateTime: response.data.statusChangedDateTime,
        recipients: {
          signers: [
            {
              recipientId: '1',
              email: data.clientEmail,
              name: data.clientName,
              status: 'sent'
            },
            {
              recipientId: '2',
              email: data.professionalEmail,
              name: data.professionalName,
              status: 'sent'
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error sending contract to DocuSign:', error);
      throw new Error('Failed to send contract to DocuSign');
    }
  }

  // Simulation pour le mode démo
  private simulateContractSending(data: ContractSigningData): DocuSignEnvelope {
    const envelopeId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      envelopeId,
      status: 'sent',
      statusChangedDateTime: new Date().toISOString(),
      recipients: {
        signers: [
          {
            recipientId: '1',
            email: data.clientEmail,
            name: data.clientName,
            status: 'sent'
          },
          {
            recipientId: '2',
            email: data.professionalEmail,
            name: data.professionalName,
            status: 'sent'
          }
        ]
      }
    };
  }

  // Obtenir le statut d'une enveloppe
  async getEnvelopeStatus(envelopeId: string): Promise<DocuSignEnvelope> {
    if (!this.config) {
      throw new Error('DocuSign not initialized');
    }

    try {
      // En mode démo, on simule le statut
      if (this.config.basePath.includes('demo')) {
        return this.simulateEnvelopeStatus(envelopeId);
      }

      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            include: 'recipients'
          }
        }
      );

      return {
        envelopeId: response.data.envelopeId,
        status: response.data.status,
        statusChangedDateTime: response.data.statusChangedDateTime,
        recipients: {
          signers: response.data.recipients?.signers?.map((signer: any) => ({
            recipientId: signer.recipientId,
            email: signer.email,
            name: signer.name,
            status: signer.status,
            signedDateTime: signer.signedDateTime
          })) || []
        }
      };
    } catch (error) {
      console.error('Error getting envelope status:', error);
      throw new Error('Failed to get envelope status');
    }
  }

  // Simulation du statut pour le mode démo
  private simulateEnvelopeStatus(envelopeId: string): DocuSignEnvelope {
    const statuses = ['sent', 'delivered', 'completed'] as const;
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      envelopeId,
      status: randomStatus,
      statusChangedDateTime: new Date().toISOString(),
      recipients: {
        signers: [
          {
            recipientId: '1',
            email: 'client@example.com',
            name: 'Client Example',
            status: randomStatus === 'completed' ? 'signed' : 'sent',
            signedDateTime: randomStatus === 'completed' ? new Date().toISOString() : undefined
          },
          {
            recipientId: '2',
            email: 'professional@example.com',
            name: 'Professional Example',
            status: randomStatus === 'completed' ? 'signed' : 'sent',
            signedDateTime: randomStatus === 'completed' ? new Date().toISOString() : undefined
          }
        ]
      }
    };
  }

  // Obtenir l'URL de signature pour un destinataire
  async getRecipientView(envelopeId: string, recipientEmail: string, returnUrl: string): Promise<string> {
    if (!this.config) {
      throw new Error('DocuSign not initialized');
    }

    try {
      // En mode démo, on simule l'URL
      if (this.config.basePath.includes('demo')) {
        return this.simulateSigningUrl(envelopeId, recipientEmail);
      }

      const accessToken = await this.getAccessToken();
      
      const recipientViewRequest = {
        authenticationMethod: 'email',
        email: recipientEmail,
        returnUrl: returnUrl,
        userName: recipientEmail
      };

      const response = await axios.post(
        `${this.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}/views/recipient`,
        { recipientViewRequest },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.url;
    } catch (error) {
      console.error('Error getting recipient view:', error);
      throw new Error('Failed to get recipient view');
    }
  }

  // Simulation de l'URL de signature pour le mode démo
  private simulateSigningUrl(envelopeId: string, recipientEmail: string): string {
    // Simule une URL DocuSign
    return `https://demo.docusign.net/signing/dsweb-1/sign.aspx?t=${envelopeId}&e=${btoa(recipientEmail)}`;
  }

  // Annuler une enveloppe
  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    if (!this.config) {
      throw new Error('DocuSign not initialized');
    }

    try {
      // En mode démo, on simule l'annulation
      if (this.config.basePath.includes('demo')) {
        console.log(`Demo: Voiding envelope ${envelopeId} with reason: ${reason}`);
        return;
      }

      const accessToken = await this.getAccessToken();
      
      const envelope = {
        status: 'voided',
        voidedReason: reason
      };

      await axios.put(
        `${this.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}`,
        { envelope },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error voiding envelope:', error);
      throw new Error('Failed to void envelope');
    }
  }

  // Télécharger le document signé
  async downloadSignedDocument(envelopeId: string): Promise<Blob> {
    if (!this.config) {
      throw new Error('DocuSign not initialized');
    }

    try {
      // En mode démo, on simule le téléchargement
      if (this.config.basePath.includes('demo')) {
        return this.simulateDocumentDownload();
      }

      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseUrl}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}/documents/combined`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/pdf'
          },
          responseType: 'blob'
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error downloading signed document:', error);
      throw new Error('Failed to download signed document');
    }
  }

  // Simulation du téléchargement pour le mode démo
  private simulateDocumentDownload(): Blob {
    // Crée un PDF de démo
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Demo Contract - Signed) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

    return new Blob([pdfContent], { type: 'application/pdf' });
  }
}

// Instance singleton
export const docuSignService = new DocuSignService();