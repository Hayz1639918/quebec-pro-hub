-- Migration: Update contract templates with APCHQ/RBQ-style professional contracts
-- Date: 2025-11-28
-- Description: Adds professional contract templates with official government styling
-- Reference: RBQ / APCHQ format

-- ============================================
-- PART 1: DELETE OLD TEMPLATES
-- ============================================

DELETE FROM contract_templates WHERE name IN (
  'Contrat de construction résidentielle',
  'Contrat de rénovation',
  'Formulaire de soumission',
  'Contrat préliminaire',
  'Contrat d''entreprise',
  'Contrat d''entreprise à forfait',
  'Contrat à prix coûtant majoré',
  'Contrat de sous-traitance',
  'Attestation de réception des travaux'
);

-- ============================================
-- PART 2: INSERT NEW PROFESSIONAL TEMPLATES (RBQ STYLE)
-- ============================================

-- Template 1: Contrat préliminaire (Preliminary Contract)
INSERT INTO contract_templates (name, description, category, template_content, variables) VALUES
(
  'Contrat préliminaire',
  'Contrat initial qui précède le contrat d''entreprise définitif. Établit les conditions générales et l''intention des parties avant le début des travaux.',
  'preliminary',
  '<!DOCTYPE html>
<html>
<head>
  <title>Contrat préliminaire - {{project_title}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Roboto", Arial, sans-serif; margin: 25px; line-height: 1.4; font-size: 9pt; background: #fff; }
    
    /* Titre principal */
    .main-title { font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase; margin-bottom: 3px; }
    .subtitle { font-size: 10pt; text-align: center; color: #555; margin-bottom: 15px; }
    
    /* Encadré d''instructions */
    .instruction-box { background: #f5f5f5; border: 1px solid #ccc; padding: 8px; margin-bottom: 15px; font-size: 8pt; }
    
    /* En-têtes de section RBQ */
    .section-header { background: #4a4a4a; padding: 5px 8px; margin-top: 12px; margin-bottom: 8px; }
    .section-header-text { color: #fff; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    
    /* Sous-sections */
    .subsection-header { background: #e0e0e0; padding: 4px 8px; margin-top: 8px; margin-bottom: 6px; }
    .subsection-header-text { font-size: 9pt; font-weight: 700; color: #333; }
    
    /* Contenu de section */
    .section-content { padding: 0 5px; margin-bottom: 10px; }
    
    /* Lignes de champs */
    .field-row { display: flex; margin-bottom: 8px; align-items: flex-end; }
    .field-label { font-size: 9pt; margin-right: 3px; white-space: nowrap; }
    .field-value { flex: 1; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; min-height: 14px; }
    .field-value-small { width: 120px; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; margin-right: 15px; }
    
    /* Tableaux */
    .table { width: 100%; margin: 8px 0; border: 1px solid #ccc; border-collapse: collapse; }
    .table-header { background: #e8e8e8; border-bottom: 1px solid #999; }
    .table-row { border-bottom: 1px solid #ccc; }
    .table-cell { padding: 5px; font-size: 8pt; border-right: 1px solid #ccc; }
    .table-cell:last-child { border-right: none; }
    .table-cell-header { padding: 5px; font-size: 8pt; font-weight: 700; border-right: 1px solid #ccc; }
    .table-cell-header:last-child { border-right: none; }
    
    /* Cases à cocher */
    .checkbox-row { display: flex; align-items: center; margin-bottom: 4px; margin-left: 10px; }
    .checkbox { width: 10px; height: 10px; border: 1px solid #333; margin-right: 6px; display: inline-block; }
    .checkbox.checked { background: #333; }
    .checkbox-label { font-size: 9pt; }
    
    /* Encadré important */
    .important-box { border: 2px solid #333; padding: 10px; margin: 10px 0; background: #fffde7; }
    .important-title { font-weight: 700; font-size: 10pt; margin-bottom: 5px; }
    
    /* Prix */
    .price-box { border: 2px solid #333; background: #f8f8f8; padding: 12px; margin: 10px 0; }
    .price-row { display: flex; justify-content: space-between; margin-bottom: 4px; padding: 0 10px; }
    .price-label { font-size: 10pt; }
    .price-value { font-size: 10pt; font-weight: 700; }
    .total-row { display: flex; justify-content: space-between; border-top: 2px solid #333; margin-top: 8px; padding-top: 8px; padding-left: 10px; padding-right: 10px; }
    .total-label { font-size: 12pt; font-weight: 700; }
    .total-value { font-size: 14pt; font-weight: 700; }
    
    /* Signature */
    .signature-section { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 10px; }
    .signature-block { width: 45%; }
    .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .signature-label { font-size: 8pt; color: #666; }
    
    /* Listes */
    .list-item { display: flex; margin-bottom: 3px; padding-left: 10px; }
    .list-bullet { width: 15px; font-size: 9pt; }
    .list-text { flex: 1; font-size: 9pt; }
    
    /* Pied de page */
    .footer { position: fixed; bottom: 15px; left: 25px; right: 25px; border-top: 1px solid #ccc; padding-top: 5px; text-align: center; font-size: 7pt; color: #666; }
    
    @media print { .footer { position: fixed; } }
  </style>
</head>
<body>
  <div class="main-title">CONTRAT PRÉLIMINAIRE</div>
  <div class="subtitle">Document officiel</div>
  
  <div class="instruction-box">
    Ce contrat préliminaire constitue un engagement ferme entre les parties. Le client dispose d''un délai de réflexion de 10 jours suivant la signature pour résoudre le contrat sans pénalité.
  </div>
  
  <div class="field-row">
    <span class="field-label">N° de contrat :</span>
    <span class="field-value-small">{{contract_number}}</span>
    <span class="field-label">Date :</span>
    <span class="field-value-small">{{contract_date}}</span>
  </div>
  
  <div class="section-header"><span class="section-header-text">IDENTIFICATION DES PARTIES</span></div>
  
  <div class="subsection-header"><span class="subsection-header-text">Le Client (Maître d''ouvrage)</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Nom complet :</span>
      <span class="field-value">{{client_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Adresse :</span>
      <span class="field-value">{{client_address}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Téléphone :</span>
      <span class="field-value-small">{{client_phone}}</span>
      <span class="field-label">Courriel :</span>
      <span class="field-value">{{client_email}}</span>
    </div>
  </div>
  
  <div class="subsection-header"><span class="subsection-header-text">L''Entrepreneur</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Raison sociale :</span>
      <span class="field-value">{{company_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Représentant :</span>
      <span class="field-value">{{professional_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">N° de licence :</span>
      <span class="field-value-small">{{license_number}}</span>
      <span class="field-label">Téléphone :</span>
      <span class="field-value">{{professional_phone}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Courriel :</span>
      <span class="field-value">{{professional_email}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">OBJET DU CONTRAT</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Titre du projet :</span>
      <span class="field-value">{{project_title}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Adresse des travaux :</span>
      <span class="field-value">{{project_address}}</span>
    </div>
    <div class="subsection-header"><span class="subsection-header-text">Description des travaux</span></div>
    <p style="font-size: 9pt; margin-bottom: 10px;">{{project_description}}</p>
    
    <div class="subsection-header"><span class="subsection-header-text">Type de travaux</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Construction neuve</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Rénovation</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Agrandissement</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Autre : _______________</span></div>
  </div>
  
  <div class="section-header"><span class="section-header-text">PRIX ET PAIEMENT</span></div>
  <div class="price-box">
    <div class="price-row">
      <span class="price-label">Prix préliminaire (avant taxes) :</span>
      <span class="price-value">{{total_amount}} $</span>
    </div>
    <div class="price-row">
      <span class="price-label">TPS (5%) :</span>
      <span class="price-value">{{tps_amount}} $</span>
    </div>
    <div class="price-row">
      <span class="price-label">TVQ (9.975%) :</span>
      <span class="price-value">{{tvq_amount}} $</span>
    </div>
    <div class="total-row">
      <span class="total-label">TOTAL :</span>
      <span class="total-value">{{total_with_taxes}} $</span>
    </div>
  </div>
  
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Dépôt à la signature :</span>
      <span class="field-value-small">{{deposit_amount}} $</span>
      <span class="field-label">({{deposit_percentage}}% du prix)</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">ÉCHÉANCIER PRÉVU</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Date de début prévue :</span>
      <span class="field-value-small">{{start_date}}</span>
      <span class="field-label">Date de fin prévue :</span>
      <span class="field-value">{{end_date}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">CONDITIONS SUSPENSIVES</span></div>
  <div class="section-content">
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Obtention du financement par le client</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Obtention des permis de construction nécessaires</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Réalisation d''une étude de sol satisfaisante</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Autre : _______________</span></div>
  </div>
  
  <div class="important-box">
    <div class="important-title">DROIT DE RÉSOLUTION</div>
    <p style="font-size: 9pt;">Le client peut résoudre le présent contrat dans les <strong>10 jours</strong> suivant sa signature, en transmettant un avis écrit à l''entrepreneur. En cas de résolution, le dépôt sera remboursé dans les 15 jours.</p>
  </div>
  
  <div class="section-header"><span class="section-header-text">CONDITIONS PARTICULIÈRES</span></div>
  <div class="section-content">
    <p style="font-size: 9pt;">{{special_conditions}}</p>
  </div>
  
  <div class="signature-section">
    <p style="font-size: 9pt; font-weight: 700;">En signant ce contrat, les parties déclarent avoir lu et accepté toutes les conditions ci-dessus.</p>
    <div class="signature-row">
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Signature du client</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Nom :</span>
          <span class="field-value">{{client_name}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Signature de l''entrepreneur</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Nom :</span>
          <span class="field-value">{{professional_name}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">BâtirNet - Plateforme de mise en relation professionnelle</div>
</body>
</html>',
  '{
    "contract_number": "string",
    "contract_date": "date",
    "client_name": "string",
    "client_address": "string",
    "client_phone": "string",
    "client_email": "string",
    "company_name": "string",
    "professional_name": "string",
    "license_number": "string",
    "professional_phone": "string",
    "professional_email": "string",
    "project_title": "string",
    "project_address": "string",
    "project_description": "string",
    "total_amount": "number",
    "tps_amount": "number",
    "tvq_amount": "number",
    "total_with_taxes": "number",
    "deposit_amount": "number",
    "deposit_percentage": "number",
    "start_date": "date",
    "end_date": "date",
    "special_conditions": "string",
    "signature_date": "date"
  }'::jsonb
);

-- Template 2: Contrat d'entreprise à forfait (Fixed Price Contract)
INSERT INTO contract_templates (name, description, category, template_content, variables) VALUES
(
  'Contrat d''entreprise à forfait',
  'Contrat à prix fixe pour travaux de construction ou rénovation. Le prix total est déterminé à l''avance et reste fixe sauf modifications convenues.',
  'construction',
  '<!DOCTYPE html>
<html>
<head>
  <title>Contrat d''entreprise - {{project_title}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Roboto", Arial, sans-serif; margin: 25px; line-height: 1.4; font-size: 9pt; background: #fff; }
    .main-title { font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase; margin-bottom: 3px; }
    .subtitle { font-size: 10pt; text-align: center; color: #555; margin-bottom: 15px; }
    .instruction-box { background: #f5f5f5; border: 1px solid #ccc; padding: 8px; margin-bottom: 15px; font-size: 8pt; }
    .section-header { background: #4a4a4a; padding: 5px 8px; margin-top: 12px; margin-bottom: 8px; }
    .section-header-text { color: #fff; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .subsection-header { background: #e0e0e0; padding: 4px 8px; margin-top: 8px; margin-bottom: 6px; }
    .subsection-header-text { font-size: 9pt; font-weight: 700; color: #333; }
    .section-content { padding: 0 5px; margin-bottom: 10px; }
    .field-row { display: flex; margin-bottom: 8px; align-items: flex-end; }
    .field-label { font-size: 9pt; margin-right: 3px; white-space: nowrap; }
    .field-value { flex: 1; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; min-height: 14px; }
    .field-value-small { width: 120px; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; margin-right: 15px; }
    .table { width: 100%; margin: 8px 0; border: 1px solid #ccc; border-collapse: collapse; }
    .table-header { background: #e8e8e8; }
    .table-row { border-bottom: 1px solid #ccc; }
    .table-cell { padding: 5px; font-size: 8pt; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; }
    .table-cell:last-child { border-right: none; }
    .table-cell-header { padding: 5px; font-size: 8pt; font-weight: 700; border-right: 1px solid #ccc; border-bottom: 1px solid #999; background: #e8e8e8; }
    .table-cell-header:last-child { border-right: none; }
    .checkbox-row { display: flex; align-items: center; margin-bottom: 4px; margin-left: 10px; }
    .checkbox { width: 10px; height: 10px; border: 1px solid #333; margin-right: 6px; display: inline-block; }
    .important-box { border: 2px solid #333; padding: 10px; margin: 10px 0; background: #fffde7; }
    .important-title { font-weight: 700; font-size: 10pt; margin-bottom: 5px; }
    .price-box { border: 2px solid #333; background: #f8f8f8; padding: 12px; margin: 10px 0; }
    .price-row { display: flex; justify-content: space-between; margin-bottom: 4px; padding: 0 10px; }
    .price-label { font-size: 10pt; }
    .price-value { font-size: 10pt; font-weight: 700; }
    .total-row { display: flex; justify-content: space-between; border-top: 2px solid #333; margin-top: 8px; padding-top: 8px; padding-left: 10px; padding-right: 10px; }
    .total-label { font-size: 12pt; font-weight: 700; }
    .total-value { font-size: 14pt; font-weight: 700; }
    .signature-section { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 10px; }
    .signature-block { width: 45%; }
    .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .signature-label { font-size: 8pt; color: #666; }
    .list-item { display: flex; margin-bottom: 3px; padding-left: 10px; }
    .list-bullet { width: 15px; font-size: 9pt; }
    .list-text { flex: 1; font-size: 9pt; }
    .footer { position: fixed; bottom: 15px; left: 25px; right: 25px; border-top: 1px solid #ccc; padding-top: 5px; text-align: center; font-size: 7pt; color: #666; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="main-title">CONTRAT D''ENTREPRISE À FORFAIT</div>
  <div class="subtitle">Travaux de construction / rénovation résidentielle</div>
  
  <div class="instruction-box">
    Le présent contrat est conclu entre les parties identifiées ci-dessous. Il définit les termes et conditions applicables à l''exécution des travaux convenus.
  </div>
  
  <div class="field-row">
    <span class="field-label">N° de contrat :</span>
    <span class="field-value-small">{{contract_number}}</span>
    <span class="field-label">Date :</span>
    <span class="field-value-small">{{contract_date}}</span>
  </div>
  
  <div class="section-header"><span class="section-header-text">ARTICLE 1 - IDENTIFICATION DES PARTIES</span></div>
  
  <div class="subsection-header"><span class="subsection-header-text">Le Client (Maître d''ouvrage)</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Nom complet :</span>
      <span class="field-value">{{client_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Adresse :</span>
      <span class="field-value">{{client_address}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Téléphone :</span>
      <span class="field-value-small">{{client_phone}}</span>
      <span class="field-label">Courriel :</span>
      <span class="field-value">{{client_email}}</span>
    </div>
  </div>
  
  <div class="subsection-header"><span class="subsection-header-text">L''Entrepreneur</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Raison sociale :</span>
      <span class="field-value">{{company_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Représentant :</span>
      <span class="field-value">{{professional_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">N° de licence :</span>
      <span class="field-value-small">{{license_number}}</span>
      <span class="field-label">Téléphone :</span>
      <span class="field-value">{{professional_phone}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Courriel :</span>
      <span class="field-value">{{professional_email}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">ARTICLE 2 - OBJET DU CONTRAT</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Titre du projet :</span>
      <span class="field-value">{{project_title}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Adresse des travaux :</span>
      <span class="field-value">{{project_address}}</span>
    </div>
    <div class="subsection-header"><span class="subsection-header-text">Description détaillée des travaux</span></div>
    <p style="font-size: 9pt; margin-bottom: 10px;">{{project_description}}</p>
  </div>
  
  <div class="section-header"><span class="section-header-text">ARTICLE 3 - PRIX DU CONTRAT</span></div>
  <div class="price-box">
    <div class="price-row">
      <span class="price-label">Prix forfaitaire (avant taxes) :</span>
      <span class="price-value">{{total_amount}} $</span>
    </div>
    <div class="price-row">
      <span class="price-label">TPS (5%) :</span>
      <span class="price-value">{{tps_amount}} $</span>
    </div>
    <div class="price-row">
      <span class="price-label">TVQ (9.975%) :</span>
      <span class="price-value">{{tvq_amount}} $</span>
    </div>
    <div class="total-row">
      <span class="total-label">PRIX TOTAL :</span>
      <span class="total-value">{{total_with_taxes}} $</span>
    </div>
  </div>
  <div class="section-content">
    <p style="font-size: 8pt; color: #666;">Ce prix est ferme et définitif, sauf modifications demandées par le client et approuvées par avenant.</p>
  </div>
  
  <div class="section-header"><span class="section-header-text">ARTICLE 4 - MODALITÉS DE PAIEMENT</span></div>
  <div class="section-content">
    <table class="table">
      <tr class="table-header">
        <td class="table-cell-header" style="width: 50%;">Étape / Jalon</td>
        <td class="table-cell-header" style="width: 25%;">Pourcentage</td>
        <td class="table-cell-header" style="width: 25%;">Montant</td>
      </tr>
      <tr class="table-row">
        <td class="table-cell">À la signature du contrat (dépôt)</td>
        <td class="table-cell">{{deposit_percentage}}%</td>
        <td class="table-cell">{{deposit_amount}} $</td>
      </tr>
      <tr class="table-row">
        <td class="table-cell">Au début des travaux</td>
        <td class="table-cell">{{milestone_1_percentage}}%</td>
        <td class="table-cell">{{milestone_1_amount}} $</td>
      </tr>
      <tr class="table-row">
        <td class="table-cell">À mi-parcours des travaux</td>
        <td class="table-cell">{{milestone_2_percentage}}%</td>
        <td class="table-cell">{{milestone_2_amount}} $</td>
      </tr>
      <tr class="table-row">
        <td class="table-cell">À la réception des travaux</td>
        <td class="table-cell">{{final_percentage}}%</td>
        <td class="table-cell">{{final_amount}} $</td>
      </tr>
    </table>
  </div>
  
  <div class="section-header"><span class="section-header-text">ARTICLE 5 - ÉCHÉANCIER DES TRAVAUX</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Date de début :</span>
      <span class="field-value-small">{{start_date}}</span>
      <span class="field-label">Date de fin :</span>
      <span class="field-value-small">{{end_date}}</span>
      <span class="field-label">Durée :</span>
      <span class="field-value">{{duration}} jours</span>
    </div>
  </div>
  
  <div class="page-break"></div>
  
  <div class="section-header"><span class="section-header-text">ARTICLE 6 - GARANTIE</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Durée de la garantie :</span>
      <span class="field-value">{{warranty_period}} mois à compter de la réception des travaux</span>
    </div>
    <div class="subsection-header"><span class="subsection-header-text">La garantie couvre</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">Les défauts de fabrication et d''installation</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">Les vices cachés découlant des travaux</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">La conformité aux normes et codes en vigueur</span></div>
  </div>
  
  <div class="section-header"><span class="section-header-text">ARTICLE 7 - ASSURANCES</span></div>
  <div class="section-content">
    <p style="font-size: 9pt; margin-bottom: 8px;">L''entrepreneur déclare détenir les assurances suivantes :</p>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">Responsabilité civile générale : 2 000 000 $ minimum</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">CNESST / WSIB : Compte actif et en règle</span></div>
  </div>
  
  <div class="section-header"><span class="section-header-text">ARTICLE 8 - CONDITIONS GÉNÉRALES</span></div>
  <div class="section-content">
    <div class="list-item">
      <span class="list-bullet">1.</span>
      <span class="list-text">Les travaux seront exécutés selon les règles de l''art et conformément aux normes en vigueur.</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">2.</span>
      <span class="list-text">Toute modification aux travaux devra faire l''objet d''un avenant écrit signé par les deux parties.</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">3.</span>
      <span class="list-text">Le client s''engage à donner accès au chantier et à fournir les autorisations nécessaires.</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">4.</span>
      <span class="list-text">En cas de litige, les parties s''engagent à tenter une résolution à l''amiable avant toute procédure.</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">ARTICLE 9 - CONDITIONS PARTICULIÈRES</span></div>
  <div class="section-content">
    <p style="font-size: 9pt;">{{special_conditions}}</p>
  </div>
  
  <div class="signature-section">
    <p style="font-size: 9pt; font-weight: 700; margin-bottom: 5px;">En signant ce contrat, les parties déclarent avoir lu et accepté toutes les conditions ci-dessus.</p>
    <div class="signature-row">
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Signature du client</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Nom :</span>
          <span class="field-value">{{client_name}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Signature de l''entrepreneur</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Nom :</span>
          <span class="field-value">{{professional_name}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">BâtirNet - Plateforme de mise en relation professionnelle</div>
</body>
</html>',
  '{
    "contract_number": "string",
    "contract_date": "date",
    "client_name": "string",
    "client_address": "string",
    "client_phone": "string",
    "client_email": "string",
    "company_name": "string",
    "professional_name": "string",
    "license_number": "string",
    "professional_phone": "string",
    "professional_email": "string",
    "project_title": "string",
    "project_address": "string",
    "project_description": "string",
    "total_amount": "number",
    "tps_amount": "number",
    "tvq_amount": "number",
    "total_with_taxes": "number",
    "deposit_percentage": "number",
    "deposit_amount": "number",
    "milestone_1_percentage": "number",
    "milestone_1_amount": "number",
    "milestone_2_percentage": "number",
    "milestone_2_amount": "number",
    "final_percentage": "number",
    "final_amount": "number",
    "start_date": "date",
    "end_date": "date",
    "duration": "number",
    "warranty_period": "number",
    "special_conditions": "string",
    "signature_date": "date"
  }'::jsonb
);

-- Template 3: Contrat à prix coûtant majoré (Cost-Plus Contract)
INSERT INTO contract_templates (name, description, category, template_content, variables) VALUES
(
  'Contrat à prix coûtant majoré',
  'Contrat où le client rembourse les coûts réels de l''entrepreneur, plus un pourcentage ou un montant fixe pour les frais généraux et les bénéfices.',
  'construction',
  '<!DOCTYPE html>
<html>
<head>
  <title>Contrat à prix coûtant majoré - {{project_title}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Roboto", Arial, sans-serif; margin: 25px; line-height: 1.4; font-size: 9pt; background: #fff; }
    .main-title { font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase; margin-bottom: 3px; }
    .subtitle { font-size: 10pt; text-align: center; color: #555; margin-bottom: 15px; }
    .instruction-box { background: #f5f5f5; border: 1px solid #ccc; padding: 8px; margin-bottom: 15px; font-size: 8pt; }
    .section-header { background: #4a4a4a; padding: 5px 8px; margin-top: 12px; margin-bottom: 8px; }
    .section-header-text { color: #fff; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .subsection-header { background: #e0e0e0; padding: 4px 8px; margin-top: 8px; margin-bottom: 6px; }
    .subsection-header-text { font-size: 9pt; font-weight: 700; color: #333; }
    .section-content { padding: 0 5px; margin-bottom: 10px; }
    .field-row { display: flex; margin-bottom: 8px; align-items: flex-end; }
    .field-label { font-size: 9pt; margin-right: 3px; white-space: nowrap; }
    .field-value { flex: 1; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; min-height: 14px; }
    .field-value-small { width: 120px; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; margin-right: 15px; }
    .table { width: 100%; margin: 8px 0; border: 1px solid #ccc; border-collapse: collapse; }
    .table-row { border-bottom: 1px solid #ccc; }
    .table-cell { padding: 5px; font-size: 8pt; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; }
    .table-cell:last-child { border-right: none; }
    .table-cell-header { padding: 5px; font-size: 8pt; font-weight: 700; border-right: 1px solid #ccc; border-bottom: 1px solid #999; background: #e8e8e8; }
    .table-cell-header:last-child { border-right: none; }
    .checkbox-row { display: flex; align-items: center; margin-bottom: 4px; margin-left: 10px; }
    .checkbox { width: 10px; height: 10px; border: 1px solid #333; margin-right: 6px; display: inline-block; }
    .important-box { border: 2px solid #333; padding: 10px; margin: 10px 0; background: #fffde7; }
    .important-title { font-weight: 700; font-size: 10pt; margin-bottom: 5px; }
    .price-box { border: 2px solid #333; background: #f8f8f8; padding: 12px; margin: 10px 0; }
    .signature-section { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 10px; }
    .signature-block { width: 45%; }
    .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .signature-label { font-size: 8pt; color: #666; }
    .list-item { display: flex; margin-bottom: 3px; padding-left: 10px; }
    .list-bullet { width: 15px; font-size: 9pt; }
    .list-text { flex: 1; font-size: 9pt; }
    .footer { position: fixed; bottom: 15px; left: 25px; right: 25px; border-top: 1px solid #ccc; padding-top: 5px; text-align: center; font-size: 7pt; color: #666; }
  </style>
</head>
<body>
  <div class="main-title">CONTRAT À PRIX COÛTANT MAJORÉ</div>
  <div class="subtitle">Travaux de construction / rénovation</div>
  
  <div class="instruction-box">
    Ce contrat prévoit le remboursement des coûts réels encourus par l''entrepreneur, plus une majoration pour les frais généraux et le bénéfice. Le client doit approuver les dépenses selon les modalités convenues.
  </div>
  
  <div class="field-row">
    <span class="field-label">N° de contrat :</span>
    <span class="field-value-small">{{contract_number}}</span>
    <span class="field-label">Date :</span>
    <span class="field-value-small">{{contract_date}}</span>
  </div>
  
  <div class="section-header"><span class="section-header-text">IDENTIFICATION DES PARTIES</span></div>
  
  <div class="subsection-header"><span class="subsection-header-text">Le Client</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Nom :</span>
      <span class="field-value">{{client_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Adresse :</span>
      <span class="field-value">{{client_address}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Téléphone :</span>
      <span class="field-value-small">{{client_phone}}</span>
      <span class="field-label">Courriel :</span>
      <span class="field-value">{{client_email}}</span>
    </div>
  </div>
  
  <div class="subsection-header"><span class="subsection-header-text">L''Entrepreneur</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Entreprise :</span>
      <span class="field-value">{{company_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Représentant :</span>
      <span class="field-value-small">{{professional_name}}</span>
      <span class="field-label">Licence :</span>
      <span class="field-value">{{license_number}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Courriel :</span>
      <span class="field-value">{{professional_email}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">OBJET DU CONTRAT</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Projet :</span>
      <span class="field-value">{{project_title}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Adresse :</span>
      <span class="field-value">{{project_address}}</span>
    </div>
    <p style="font-size: 9pt; margin-top: 8px;">{{project_description}}</p>
  </div>
  
  <div class="section-header"><span class="section-header-text">STRUCTURE DES COÛTS</span></div>
  <div class="important-box">
    <div class="important-title">MAJORATION APPLICABLE</div>
    <div class="field-row">
      <span class="field-label">Pourcentage de majoration sur les coûts :</span>
      <span class="field-value-small">{{markup_percentage}} %</span>
    </div>
    <p style="font-size: 8pt; margin-top: 5px;">Cette majoration couvre les frais généraux, l''administration et le bénéfice de l''entrepreneur.</p>
  </div>
  
  <div class="section-content">
    <div class="subsection-header"><span class="subsection-header-text">Coûts remboursables</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">Main-d''œuvre (taux horaire selon échelle convenue)</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">Matériaux (coût réel avec factures)</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">Location d''équipement</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">Sous-traitance approuvée</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">Permis et frais connexes</span></div>
    
    <div class="subsection-header"><span class="subsection-header-text">Budget estimatif</span></div>
    <div class="field-row">
      <span class="field-label">Estimation des coûts :</span>
      <span class="field-value-small">{{estimated_cost}} $</span>
      <span class="field-label">Plafond maximum :</span>
      <span class="field-value">{{cost_ceiling}} $</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">TAUX DE MAIN-D''ŒUVRE</span></div>
  <div class="section-content">
    <table class="table">
      <tr>
        <td class="table-cell-header">Classification</td>
        <td class="table-cell-header">Taux horaire</td>
      </tr>
      <tr class="table-row">
        <td class="table-cell">Entrepreneur / Superviseur</td>
        <td class="table-cell">{{rate_supervisor}} $ / h</td>
      </tr>
      <tr class="table-row">
        <td class="table-cell">Ouvrier qualifié</td>
        <td class="table-cell">{{rate_skilled}} $ / h</td>
      </tr>
      <tr class="table-row">
        <td class="table-cell">Apprenti / Aide</td>
        <td class="table-cell">{{rate_helper}} $ / h</td>
      </tr>
    </table>
  </div>
  
  <div class="section-header"><span class="section-header-text">FACTURATION ET PAIEMENT</span></div>
  <div class="section-content">
    <div class="list-item">
      <span class="list-bullet">•</span>
      <span class="list-text">Facturation : {{billing_frequency}}</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">•</span>
      <span class="list-text">Paiement dû dans les {{payment_terms}} jours suivant réception de la facture</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">•</span>
      <span class="list-text">Toutes les factures doivent être accompagnées des pièces justificatives</span>
    </div>
    <div class="field-row" style="margin-top: 10px;">
      <span class="field-label">Dépôt initial :</span>
      <span class="field-value">{{deposit_amount}} $</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">GARANTIE ET DURÉE</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Durée estimée :</span>
      <span class="field-value-small">{{duration}} jours</span>
      <span class="field-label">Garantie :</span>
      <span class="field-value">{{warranty_period}} mois</span>
    </div>
  </div>
  
  <div class="signature-section">
    <p style="font-size: 9pt; font-weight: 700;">Les parties acceptent les termes de ce contrat à prix coûtant majoré.</p>
    <div class="signature-row">
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Signature du client</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Signature de l''entrepreneur</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">BâtirNet - Plateforme de mise en relation professionnelle</div>
</body>
</html>',
  '{
    "contract_number": "string",
    "contract_date": "date",
    "client_name": "string",
    "client_address": "string",
    "client_phone": "string",
    "client_email": "string",
    "company_name": "string",
    "professional_name": "string",
    "license_number": "string",
    "professional_email": "string",
    "project_title": "string",
    "project_address": "string",
    "project_description": "string",
    "markup_percentage": "number",
    "estimated_cost": "number",
    "cost_ceiling": "number",
    "rate_supervisor": "number",
    "rate_skilled": "number",
    "rate_helper": "number",
    "billing_frequency": "string",
    "payment_terms": "number",
    "deposit_amount": "number",
    "duration": "number",
    "warranty_period": "number",
    "signature_date": "date"
  }'::jsonb
);

-- Template 4: Contrat de sous-traitance (Subcontracting Agreement)
INSERT INTO contract_templates (name, description, category, template_content, variables) VALUES
(
  'Contrat de sous-traitance',
  'Contrat entre un entrepreneur général et un sous-traitant pour l''exécution d''une partie spécifique des travaux.',
  'subcontract',
  '<!DOCTYPE html>
<html>
<head>
  <title>Contrat de sous-traitance - {{project_title}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Roboto", Arial, sans-serif; margin: 25px; line-height: 1.4; font-size: 9pt; background: #fff; }
    .main-title { font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase; margin-bottom: 3px; }
    .subtitle { font-size: 10pt; text-align: center; color: #555; margin-bottom: 15px; }
    .section-header { background: #4a4a4a; padding: 5px 8px; margin-top: 12px; margin-bottom: 8px; }
    .section-header-text { color: #fff; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .subsection-header { background: #e0e0e0; padding: 4px 8px; margin-top: 8px; margin-bottom: 6px; }
    .subsection-header-text { font-size: 9pt; font-weight: 700; color: #333; }
    .section-content { padding: 0 5px; margin-bottom: 10px; }
    .field-row { display: flex; margin-bottom: 8px; align-items: flex-end; }
    .field-label { font-size: 9pt; margin-right: 3px; white-space: nowrap; }
    .field-value { flex: 1; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; min-height: 14px; }
    .field-value-small { width: 120px; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; margin-right: 15px; }
    .table { width: 100%; margin: 8px 0; border: 1px solid #ccc; border-collapse: collapse; }
    .table-row { border-bottom: 1px solid #ccc; }
    .table-cell { padding: 5px; font-size: 8pt; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; }
    .table-cell:last-child { border-right: none; }
    .table-cell-header { padding: 5px; font-size: 8pt; font-weight: 700; border-right: 1px solid #ccc; border-bottom: 1px solid #999; background: #e8e8e8; }
    .checkbox-row { display: flex; align-items: center; margin-bottom: 4px; margin-left: 10px; }
    .checkbox { width: 10px; height: 10px; border: 1px solid #333; margin-right: 6px; display: inline-block; }
    .price-box { border: 2px solid #333; background: #f8f8f8; padding: 12px; margin: 10px 0; }
    .price-row { display: flex; justify-content: space-between; margin-bottom: 4px; padding: 0 10px; }
    .price-label { font-size: 10pt; }
    .price-value { font-size: 10pt; font-weight: 700; }
    .total-row { display: flex; justify-content: space-between; border-top: 2px solid #333; margin-top: 8px; padding-top: 8px; padding-left: 10px; padding-right: 10px; }
    .total-label { font-size: 12pt; font-weight: 700; }
    .total-value { font-size: 14pt; font-weight: 700; }
    .signature-section { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 10px; }
    .signature-block { width: 45%; }
    .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .signature-label { font-size: 8pt; color: #666; }
    .list-item { display: flex; margin-bottom: 3px; padding-left: 10px; }
    .list-bullet { width: 15px; font-size: 9pt; }
    .list-text { flex: 1; font-size: 9pt; }
    .footer { position: fixed; bottom: 15px; left: 25px; right: 25px; border-top: 1px solid #ccc; padding-top: 5px; text-align: center; font-size: 7pt; color: #666; }
  </style>
</head>
<body>
  <div class="main-title">CONTRAT DE SOUS-TRAITANCE</div>
  <div class="subtitle">Accord entre entrepreneur général et sous-traitant</div>
  
  <div class="field-row">
    <span class="field-label">N° de contrat :</span>
    <span class="field-value-small">{{contract_number}}</span>
    <span class="field-label">Date :</span>
    <span class="field-value-small">{{contract_date}}</span>
  </div>
  
  <div class="section-header"><span class="section-header-text">ENTREPRENEUR GÉNÉRAL (DONNEUR D''ORDRE)</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Entreprise :</span>
      <span class="field-value">{{general_contractor_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Représentant :</span>
      <span class="field-value-small">{{gc_representative}}</span>
      <span class="field-label">Licence :</span>
      <span class="field-value">{{gc_license}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Téléphone :</span>
      <span class="field-value-small">{{gc_phone}}</span>
      <span class="field-label">Courriel :</span>
      <span class="field-value">{{gc_email}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">SOUS-TRAITANT</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Entreprise :</span>
      <span class="field-value">{{subcontractor_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Représentant :</span>
      <span class="field-value-small">{{sub_representative}}</span>
      <span class="field-label">Licence :</span>
      <span class="field-value">{{sub_license}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Spécialité :</span>
      <span class="field-value">{{sub_specialty}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Téléphone :</span>
      <span class="field-value-small">{{sub_phone}}</span>
      <span class="field-label">Courriel :</span>
      <span class="field-value">{{sub_email}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">PROJET PRINCIPAL</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Projet :</span>
      <span class="field-value">{{project_title}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Adresse du chantier :</span>
      <span class="field-value">{{project_address}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Client final :</span>
      <span class="field-value">{{end_client}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">TRAVAUX SOUS-TRAITÉS</span></div>
  <div class="section-content">
    <div class="subsection-header"><span class="subsection-header-text">Description des travaux</span></div>
    <p style="font-size: 9pt; margin-bottom: 10px;">{{work_description}}</p>
    
    <div class="subsection-header"><span class="subsection-header-text">Le sous-traitant s''engage à fournir</span></div>
    <div class="checkbox-row"><span class="checkbox" style="background:#333;"></span><span class="checkbox-label">Main-d''œuvre qualifiée</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Matériaux (préciser) : _______________</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Équipement et outillage</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Permis spécifiques requis</span></div>
  </div>
  
  <div class="section-header"><span class="section-header-text">PRIX ET PAIEMENT</span></div>
  <div class="price-box">
    <div class="price-row">
      <span class="price-label">Montant du sous-contrat :</span>
      <span class="price-value">{{subcontract_amount}} $</span>
    </div>
    <div class="price-row">
      <span class="price-label">TPS (5%) :</span>
      <span class="price-value">{{tps_amount}} $</span>
    </div>
    <div class="price-row">
      <span class="price-label">TVQ (9.975%) :</span>
      <span class="price-value">{{tvq_amount}} $</span>
    </div>
    <div class="total-row">
      <span class="total-label">TOTAL :</span>
      <span class="total-value">{{total_amount}} $</span>
    </div>
  </div>
  
  <div class="section-content">
    <div class="subsection-header"><span class="subsection-header-text">Modalités de paiement</span></div>
    <div class="list-item">
      <span class="list-bullet">•</span>
      <span class="list-text">Retenue de garantie : {{holdback_percentage}}%</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">•</span>
      <span class="list-text">Paiement : dans les {{payment_terms}} jours suivant facturation approuvée</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">ÉCHÉANCIER</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Début des travaux :</span>
      <span class="field-value-small">{{start_date}}</span>
      <span class="field-label">Fin des travaux :</span>
      <span class="field-value">{{end_date}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">OBLIGATIONS DU SOUS-TRAITANT</span></div>
  <div class="section-content">
    <div class="list-item">
      <span class="list-bullet">1.</span>
      <span class="list-text">Exécuter les travaux selon les règles de l''art et les plans fournis</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">2.</span>
      <span class="list-text">Maintenir une assurance responsabilité civile de 2 000 000 $ minimum</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">3.</span>
      <span class="list-text">Respecter les normes de santé et sécurité sur le chantier</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">4.</span>
      <span class="list-text">Fournir une attestation CNESST/WSIB valide</span>
    </div>
    <div class="list-item">
      <span class="list-bullet">5.</span>
      <span class="list-text">Ne pas céder ce contrat sans autorisation écrite</span>
    </div>
  </div>
  
  <div class="signature-section">
    <p style="font-size: 9pt; font-weight: 700;">Les parties acceptent les termes de ce contrat de sous-traitance.</p>
    <div class="signature-row">
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Entrepreneur général</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Sous-traitant</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">BâtirNet - Plateforme de mise en relation professionnelle</div>
</body>
</html>',
  '{
    "contract_number": "string",
    "contract_date": "date",
    "general_contractor_name": "string",
    "gc_representative": "string",
    "gc_license": "string",
    "gc_phone": "string",
    "gc_email": "string",
    "subcontractor_name": "string",
    "sub_representative": "string",
    "sub_license": "string",
    "sub_specialty": "string",
    "sub_phone": "string",
    "sub_email": "string",
    "project_title": "string",
    "project_address": "string",
    "end_client": "string",
    "work_description": "string",
    "subcontract_amount": "number",
    "tps_amount": "number",
    "tvq_amount": "number",
    "total_amount": "number",
    "holdback_percentage": "number",
    "payment_terms": "number",
    "start_date": "date",
    "end_date": "date",
    "signature_date": "date"
  }'::jsonb
);

-- Template 5: Attestation de réception des travaux (Work Acceptance Certificate)
INSERT INTO contract_templates (name, description, category, template_content, variables) VALUES
(
  'Attestation de réception des travaux',
  'Document confirmant la réception des travaux par le client, marquant le début de la période de garantie.',
  'acceptance',
  '<!DOCTYPE html>
<html>
<head>
  <title>Attestation de réception - {{project_title}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Roboto", Arial, sans-serif; margin: 25px; line-height: 1.4; font-size: 9pt; background: #fff; }
    .main-title { font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase; margin-bottom: 3px; }
    .subtitle { font-size: 10pt; text-align: center; color: #555; margin-bottom: 15px; }
    .section-header { background: #4a4a4a; padding: 5px 8px; margin-top: 12px; margin-bottom: 8px; }
    .section-header-text { color: #fff; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .subsection-header { background: #e0e0e0; padding: 4px 8px; margin-top: 8px; margin-bottom: 6px; }
    .subsection-header-text { font-size: 9pt; font-weight: 700; color: #333; }
    .section-content { padding: 0 5px; margin-bottom: 10px; }
    .field-row { display: flex; margin-bottom: 8px; align-items: flex-end; }
    .field-label { font-size: 9pt; margin-right: 3px; white-space: nowrap; }
    .field-value { flex: 1; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; min-height: 14px; }
    .field-value-small { width: 120px; border-bottom: 1px solid #333; font-size: 9pt; padding-bottom: 2px; margin-right: 15px; }
    .checkbox-row { display: flex; align-items: center; margin-bottom: 4px; margin-left: 10px; }
    .checkbox { width: 10px; height: 10px; border: 1px solid #333; margin-right: 6px; display: inline-block; }
    .important-box { border: 2px solid #333; padding: 10px; margin: 10px 0; background: #e8f5e9; }
    .important-title { font-weight: 700; font-size: 10pt; margin-bottom: 5px; }
    .warning-box { border: 2px solid #f57c00; padding: 10px; margin: 10px 0; background: #fff3e0; }
    .text-area { border: 1px solid #333; min-height: 60px; padding: 5px; margin: 8px 0; }
    .signature-section { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 10px; }
    .signature-block { width: 45%; }
    .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .signature-label { font-size: 8pt; color: #666; }
    .footer { position: fixed; bottom: 15px; left: 25px; right: 25px; border-top: 1px solid #ccc; padding-top: 5px; text-align: center; font-size: 7pt; color: #666; }
  </style>
</head>
<body>
  <div class="main-title">ATTESTATION DE RÉCEPTION DES TRAVAUX</div>
  <div class="subtitle">Fin de chantier et début de la période de garantie</div>
  
  <div class="field-row">
    <span class="field-label">N° du contrat :</span>
    <span class="field-value-small">{{contract_number}}</span>
    <span class="field-label">Date de réception :</span>
    <span class="field-value-small">{{reception_date}}</span>
  </div>
  
  <div class="section-header"><span class="section-header-text">IDENTIFICATION DES PARTIES</span></div>
  
  <div class="subsection-header"><span class="subsection-header-text">Le Client</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Nom :</span>
      <span class="field-value">{{client_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Adresse :</span>
      <span class="field-value">{{client_address}}</span>
    </div>
  </div>
  
  <div class="subsection-header"><span class="subsection-header-text">L''Entrepreneur</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Entreprise :</span>
      <span class="field-value">{{company_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Représentant :</span>
      <span class="field-value-small">{{professional_name}}</span>
      <span class="field-label">Licence :</span>
      <span class="field-value">{{license_number}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">PROJET</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Titre :</span>
      <span class="field-value">{{project_title}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Adresse des travaux :</span>
      <span class="field-value">{{project_address}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Date de début :</span>
      <span class="field-value-small">{{start_date}}</span>
      <span class="field-label">Date de fin :</span>
      <span class="field-value">{{end_date}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">DÉCLARATION DE RÉCEPTION</span></div>
  <div class="section-content">
    <p style="font-size: 9pt; margin-bottom: 10px;">Le client déclare avoir procédé à l''inspection des travaux et :</p>
    
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label"><strong>Réception sans réserve</strong> - Les travaux sont conformes et acceptés sans restriction</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label"><strong>Réception avec réserves</strong> - Les travaux sont acceptés sous réserve des corrections listées ci-dessous</span></div>
  </div>
  
  <div class="section-header"><span class="section-header-text">LISTE DES RÉSERVES (si applicable)</span></div>
  <div class="section-content">
    <div class="text-area">{{deficiencies_list}}</div>
    <div class="field-row">
      <span class="field-label">Délai pour correction :</span>
      <span class="field-value">{{correction_deadline}}</span>
    </div>
  </div>
  
  <div class="important-box">
    <div class="important-title">DÉBUT DE LA GARANTIE</div>
    <p style="font-size: 9pt;">La période de garantie de <strong>{{warranty_period}} mois</strong> débute à la date de réception des travaux.</p>
    <div class="field-row" style="margin-top: 8px;">
      <span class="field-label">Date de début de garantie :</span>
      <span class="field-value-small">{{reception_date}}</span>
      <span class="field-label">Date de fin de garantie :</span>
      <span class="field-value">{{warranty_end_date}}</span>
    </div>
  </div>
  
  <div class="section-header"><span class="section-header-text">DOCUMENTS REMIS AU CLIENT</span></div>
  <div class="section-content">
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Plans « tel que construit »</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Manuels d''entretien des équipements</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Certificats de garantie des fabricants</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Certificat de conformité / Inspection finale</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Clés et télécommandes : _____ ensembles</span></div>
    <div class="checkbox-row"><span class="checkbox"></span><span class="checkbox-label">Autre : _______________</span></div>
  </div>
  
  <div class="section-header"><span class="section-header-text">SOLDE DU CONTRAT</span></div>
  <div class="section-content">
    <div class="field-row">
      <span class="field-label">Montant total du contrat :</span>
      <span class="field-value-small">{{total_amount}} $</span>
    </div>
    <div class="field-row">
      <span class="field-label">Montants déjà versés :</span>
      <span class="field-value-small">{{paid_amount}} $</span>
    </div>
    <div class="field-row">
      <span class="field-label">Solde à payer :</span>
      <span class="field-value-small">{{balance_due}} $</span>
    </div>
    <div class="field-row">
      <span class="field-label">Retenue de garantie :</span>
      <span class="field-value">{{holdback_amount}} $ (libérable le {{holdback_release_date}})</span>
    </div>
  </div>
  
  <div class="signature-section">
    <p style="font-size: 9pt; font-weight: 700;">Les parties confirment la réception des travaux aux conditions décrites ci-dessus.</p>
    <div class="signature-row">
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Signature du client</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Nom :</span>
          <span class="field-value">{{client_name}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
      <div class="signature-block">
        <div class="signature-line"><span class="signature-label">Signature de l''entrepreneur</span></div>
        <div class="field-row" style="margin-top: 10px;">
          <span class="field-label">Nom :</span>
          <span class="field-value">{{professional_name}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date :</span>
          <span class="field-value">{{signature_date}}</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">BâtirNet - Plateforme de mise en relation professionnelle</div>
</body>
</html>',
  '{
    "contract_number": "string",
    "reception_date": "date",
    "client_name": "string",
    "client_address": "string",
    "company_name": "string",
    "professional_name": "string",
    "license_number": "string",
    "project_title": "string",
    "project_address": "string",
    "start_date": "date",
    "end_date": "date",
    "deficiencies_list": "string",
    "correction_deadline": "date",
    "warranty_period": "number",
    "warranty_end_date": "date",
    "total_amount": "number",
    "paid_amount": "number",
    "balance_due": "number",
    "holdback_amount": "number",
    "holdback_release_date": "date",
    "signature_date": "date"
  }'::jsonb
);

-- ============================================
-- PART 3: UPDATE CATEGORY ENUM IF NEEDED
-- ============================================

-- Add new categories to the contracts system if they don't exist
DO $$
BEGIN
  -- This is informational - categories are stored as text in contract_templates
  RAISE NOTICE 'Contract templates updated with RBQ/APCHQ styling';
  RAISE NOTICE 'New categories available: preliminary, subcontract, acceptance';
END $$;
