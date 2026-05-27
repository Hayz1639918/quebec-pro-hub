// Générateur de PDF professionnel pour contrats signés
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Contract } from '@/types/contracts';
import type { SignatureData } from '@/services/signature-service';

export async function generateSignedContractPDF(
  contract: Contract,
  clientSignature: SignatureData | null,
  professionalSignature: SignatureData | null
): Promise<void> {
  const html = generateContractHTML(contract, clientSignature, professionalSignature);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Veuillez autoriser les pop-ups pour générer le PDF');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Contrat - ${contract.title}</title>
        <style>${getContractPDFStyles()}</style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

function generateContractHTML(
  contract: Contract,
  clientSignature: SignatureData | null,
  professionalSignature: SignatureData | null
): string {
  const isSigned = clientSignature && professionalSignature;
  
  return `
    <div class="contract-document">
      <!-- En-tête officiel -->
      <header class="contract-header">
        <div class="logo">
          <h1>BâtirNet</h1>
          <p>Plateforme Canadienne de Construction</p>
        </div>
        <div class="contract-info">
          <div class="info-badge ${isSigned ? 'signed' : 'pending'}">
            ${isSigned ? 'CONTRAT SIGNÉ' : 'EN ATTENTE DE SIGNATURE'}
          </div>
          <p><strong>Contrat #:</strong> ${contract.id.substring(0, 8).toUpperCase()}</p>
          <p><strong>Date de création:</strong> ${format(new Date(contract.created_at), 'd MMMM yyyy', { locale: fr })}</p>
          ${isSigned ? `<p><strong>Date de signature:</strong> ${format(new Date(contract.signed_at!), 'd MMMM yyyy', { locale: fr })}</p>` : ''}
        </div>
      </header>

      <!-- Titre du contrat -->
      <div class="contract-title">
        <h2>${contract.title}</h2>
      </div>

      <!-- Parties contractantes -->
      <section class="parties-section">
        <h3>ENTRE LES PARTIES SUIVANTES :</h3>
        
        <div class="party">
          <h4>LE CLIENT</h4>
          <p><strong>Nom:</strong> ${contract.client_name}</p>
          <p><strong>Email:</strong> ${contract.client_id}</p>
        </div>

        <div class="party">
          <h4>LE PROFESSIONNEL</h4>
          <p><strong>Nom:</strong> ${contract.professional_name}</p>
          <p><strong>Entreprise:</strong> ${contract.company_name || 'N/A'}</p>
        </div>
      </section>

      <!-- Contenu du contrat -->
      <section class="contract-content">
        ${contract.contract_content}
      </section>

      <!-- Conditions financières -->
      <section class="financial-section">
        <h3>CONDITIONS FINANCIÈRES</h3>
        <table class="financial-table">
          <tr>
            <td>Montant total:</td>
            <td class="amount">${contract.total_amount.toLocaleString('fr-CA')} ${contract.currency}</td>
          </tr>
          <tr>
            <td>Dépôt initial (${contract.deposit_percentage}%):</td>
            <td class="amount">${(contract.total_amount * contract.deposit_percentage / 100).toLocaleString('fr-CA')} ${contract.currency}</td>
          </tr>
        </table>
      </section>

      <!-- Section signatures -->
      <section class="signatures-section">
        <h3>SIGNATURES</h3>
        
        <div class="signatures-container">
          <!-- Signature Client -->
          <div class="signature-box">
            <h4>Signature du Client</h4>
            ${clientSignature ? `
              <div class="signature-image-container">
                <img src="${clientSignature.signature_image}" alt="Signature client" class="signature-image" />
              </div>
              <div class="signature-details">
                <p><strong>${contract.client_name}</strong></p>
                <p>Signé le: ${format(new Date(clientSignature.signed_at), 'd MMMM yyyy à HH:mm', { locale: fr })}</p>
                <p class="verification-code">Code: ${clientSignature.verification_code}</p>
                <p class="signature-meta">IP: ${clientSignature.ip_address}</p>
              </div>
            ` : `
              <div class="signature-pending">
                <p>⏳ En attente de signature</p>
              </div>
            `}
          </div>

          <!-- Signature Professionnel -->
          <div class="signature-box">
            <h4>Signature du Professionnel</h4>
            ${professionalSignature ? `
              <div class="signature-image-container">
                <img src="${professionalSignature.signature_image}" alt="Signature professionnel" class="signature-image" />
              </div>
              <div class="signature-details">
                <p><strong>${contract.professional_name}</strong></p>
                <p>Signé le: ${format(new Date(professionalSignature.signed_at), 'd MMMM yyyy à HH:mm', { locale: fr })}</p>
                <p class="verification-code">Code: ${professionalSignature.verification_code}</p>
                <p class="signature-meta">IP: ${professionalSignature.ip_address}</p>
              </div>
            ` : `
              <div class="signature-pending">
                <p>⏳ En attente de signature</p>
              </div>
            `}
          </div>
        </div>
      </section>

      <!-- Certificat de signature (si signé) -->
      ${isSigned ? `
        <section class="certificate-section">
          <h3>CERTIFICAT DE SIGNATURE ÉLECTRONIQUE</h3>
          <div class="certificate">
            <p>Ce document a été signé électroniquement conformément aux lois canadiennes sur les signatures électroniques.</p>
            <table class="certificate-table">
              <tr>
                <td><strong>Hash du document:</strong></td>
                <td class="mono">${clientSignature?.document_hash?.substring(0, 32)}...</td>
              </tr>
              <tr>
                <td><strong>Date et heure du serveur:</strong></td>
                <td>${format(new Date(), 'd MMMM yyyy à HH:mm:ss', { locale: fr })} EST</td>
              </tr>
              <tr>
                <td><strong>Vérification en ligne:</strong></td>
                <td>https://batirnet.ca/verify/${clientSignature?.verification_code}</td>
              </tr>
            </table>
          </div>
        </section>
      ` : ''}

      <!-- Pied de page -->
      <footer class="contract-footer">
        <p>Document généré par BâtirNet - Plateforme de construction canadienne</p>
        <p>Ce document est juridiquement contraignant une fois signé par les deux parties</p>
        <p class="page-number">Page 1</p>
      </footer>
    </div>
  `;
}

function getContractPDFStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }

    .contract-document {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
    }

    .contract-header {
      display: flex;
      justify-content: space-between;
      padding-bottom: 10mm;
      border-bottom: 2pt solid #2563eb;
      margin-bottom: 10mm;
    }

    .logo h1 {
      font-size: 24pt;
      color: #2563eb;
      font-weight: bold;
    }

    .logo p {
      font-size: 10pt;
      color: #6b7280;
    }

    .contract-info {
      text-align: right;
      font-size: 9pt;
    }

    .info-badge {
      padding: 4mm 6mm;
      border-radius: 2mm;
      font-weight: bold;
      margin-bottom: 3mm;
      display: inline-block;
    }

    .info-badge.signed {
      background: #dcfce7;
      color: #166534;
    }

    .info-badge.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .contract-title {
      text-align: center;
      margin: 15mm 0;
    }

    .contract-title h2 {
      font-size: 20pt;
      color: #1f2937;
      text-transform: uppercase;
    }

    .parties-section {
      margin: 10mm 0;
      padding: 8mm;
      background: #f9fafb;
      border: 1pt solid #e5e7eb;
      border-radius: 2mm;
    }

    .parties-section h3 {
      font-size: 14pt;
      color: #1f2937;
      margin-bottom: 6mm;
      text-align: center;
    }

    .party {
      margin: 6mm 0;
      padding: 4mm;
      background: white;
      border-left: 3pt solid #2563eb;
      padding-left: 6mm;
    }

    .party h4 {
      font-size: 12pt;
      color: #2563eb;
      margin-bottom: 3mm;
    }

    .contract-content {
      margin: 10mm 0;
      text-align: justify;
    }

    .financial-section {
      margin: 10mm 0;
      padding: 6mm;
      background: #eff6ff;
      border: 1pt solid #bfdbfe;
      border-radius: 2mm;
    }

    .financial-table {
      width: 100%;
      margin-top: 4mm;
    }

    .financial-table td {
      padding: 2mm;
    }

    .financial-table .amount {
      text-align: right;
      font-weight: bold;
      font-size: 12pt;
      color: #2563eb;
    }

    .signatures-section {
      margin: 15mm 0;
      page-break-inside: avoid;
    }

    .signatures-section h3 {
      font-size: 14pt;
      color: #1f2937;
      margin-bottom: 8mm;
      text-align: center;
      text-transform: uppercase;
    }

    .signatures-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10mm;
    }

    .signature-box {
      border: 2pt solid #e5e7eb;
      border-radius: 2mm;
      padding: 6mm;
      background: white;
    }

    .signature-box h4 {
      font-size: 11pt;
      color: #4b5563;
      margin-bottom: 4mm;
      text-align: center;
    }

    .signature-image-container {
      min-height: 50mm;
      border-bottom: 1pt solid #9ca3af;
      margin-bottom: 3mm;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
    }

    .signature-image {
      max-width: 100%;
      max-height: 45mm;
    }

    .signature-details {
      font-size: 9pt;
      color: #4b5563;
    }

    .signature-details p {
      margin: 1mm 0;
    }

    .verification-code {
      font-family: 'Courier New', monospace;
      background: #f3f4f6;
      padding: 1mm;
      margin: 2mm 0 !important;
    }

    .signature-meta {
      font-size: 8pt;
      color: #9ca3af;
    }

    .signature-pending {
      min-height: 50mm;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fef3c7;
      color: #92400e;
      border: 1pt dashed #fbbf24;
      border-radius: 2mm;
    }

    .certificate-section {
      margin: 15mm 0;
      padding: 8mm;
      background: #f0fdf4;
      border: 2pt solid #86efac;
      border-radius: 2mm;
      page-break-inside: avoid;
    }

    .certificate-section h3 {
      font-size: 12pt;
      color: #166534;
      margin-bottom: 6mm;
      text-align: center;
    }

    .certificate {
      font-size: 9pt;
    }

    .certificate-table {
      width: 100%;
      margin-top: 4mm;
      border-collapse: collapse;
    }

    .certificate-table td {
      padding: 2mm;
      border-bottom: 1pt solid #d1fae5;
    }

    .mono {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      word-break: break-all;
    }

    .contract-footer {
      margin-top: 20mm;
      padding-top: 6mm;
      border-top: 1pt solid #e5e7eb;
      text-align: center;
      font-size: 8pt;
      color: #6b7280;
    }

    .contract-footer p {
      margin: 1mm 0;
    }

    .page-number {
      margin-top: 4mm;
      font-style: italic;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .contract-document {
        padding: 10mm;
      }
    }

    @page {
      size: A4;
      margin: 15mm;
    }
  `;
}
