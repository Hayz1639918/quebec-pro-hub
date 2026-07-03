import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet,
  Font
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProposalRecord, TenderProject, PartyInfo } from '@/types/tender';
import { formatCurrency, formatDateLong as formatDate } from '@/lib/format';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

// Styles RBQ / APCHQ - Style officiel gouvernemental
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    paddingTop: 25,
    paddingBottom: 50,
    paddingHorizontal: 30,
    lineHeight: 1.4,
    backgroundColor: '#ffffff',
  },
  // Instructions en haut
  instructionBox: {
    backgroundColor: '#f5f5f5',
    border: '1 solid #cccccc',
    padding: 8,
    marginBottom: 15,
    fontSize: 8,
  },
  instructionText: {
    fontSize: 8,
    color: '#333333',
  },
  // Ligne de champs
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 400,
    marginRight: 3,
  },
  fieldValue: {
    flex: 1,
    borderBottom: '1 solid #333333',
    fontSize: 9,
    paddingBottom: 2,
    minHeight: 12,
  },
  fieldValueSmall: {
    width: 100,
    borderBottom: '1 solid #333333',
    fontSize: 9,
    paddingBottom: 2,
    marginRight: 15,
  },
  fieldValueMedium: {
    width: 150,
    borderBottom: '1 solid #333333',
    fontSize: 9,
    paddingBottom: 2,
    marginRight: 15,
  },
  // En-têtes de section style RBQ (gris foncé avec texte blanc)
  sectionHeader: {
    backgroundColor: '#4a4a4a',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeaderText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Sous-sections
  subsectionHeader: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  subsectionHeaderText: {
    fontSize: 9,
    fontWeight: 700,
    color: '#333333',
  },
  // Contenu de section
  sectionContent: {
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  // Tableaux
  table: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
    border: '1 solid #cccccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #cccccc',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    borderBottom: '1 solid #999999',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    borderRight: '1 solid #cccccc',
  },
  tableCellLast: {
    flex: 1,
    padding: 5,
    fontSize: 8,
  },
  tableCellHeader: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    fontWeight: 700,
    borderRight: '1 solid #cccccc',
  },
  tableCellHeaderLast: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    fontWeight: 700,
  },
  tableCellRight: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    textAlign: 'right',
  },
  // Cases à cocher
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 10,
  },
  checkbox: {
    width: 10,
    height: 10,
    border: '1 solid #333333',
    marginRight: 6,
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    border: '1 solid #333333',
    marginRight: 6,
    backgroundColor: '#333333',
  },
  checkboxLabel: {
    fontSize: 9,
  },
  // Texte normal
  paragraph: {
    fontSize: 9,
    marginBottom: 6,
    textAlign: 'justify',
  },
  boldText: {
    fontWeight: 700,
  },
  // Liste
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 10,
  },
  listBullet: {
    width: 10,
    fontSize: 9,
  },
  listText: {
    flex: 1,
    fontSize: 9,
  },
  // Zone de texte libre
  textArea: {
    border: '1 solid #333333',
    minHeight: 60,
    padding: 5,
    marginTop: 4,
    marginBottom: 8,
  },
  // Encadré de prix
  priceBox: {
    border: '2 solid #333333',
    backgroundColor: '#f8f8f8',
    padding: 12,
    marginVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  priceLabel: {
    fontSize: 10,
  },
  priceValue: {
    fontSize: 10,
    fontWeight: 700,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '2 solid #333333',
    marginTop: 8,
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 700,
  },
  // Signature
  signatureSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '1 solid #cccccc',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLine: {
    borderTop: '1 solid #333333',
    marginTop: 30,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666666',
  },
  // Pied de page
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: '1 solid #cccccc',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#666666',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 8,
    color: '#666666',
  },
  // Titre principal
  mainTitle: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 15,
    color: '#555555',
  },
  // Encadré important
  importantBox: {
    border: '2 solid #333333',
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#fffde7',
  },
  importantTitle: {
    fontWeight: 700,
    fontSize: 10,
    marginBottom: 5,
  },
});

interface ProposalPDFProps {
  proposal: ProposalRecord;
  project: TenderProject;
  professional: PartyInfo;
  client: PartyInfo;
}

export const ProposalPDF: React.FC<ProposalPDFProps> = ({ 
  proposal, 
  project, 
  professional,
  client 
}) => {
  const formatDate = (date: string | null) => {
    if (!date) return '______________________';
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '____________';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <Document>
      {/* PAGE 1: Informations générales */}
      <Page size="A4" style={styles.page}>
        {/* Titre */}
        <Text style={styles.mainTitle}>FORMULAIRE DE SOUMISSION</Text>
        <Text style={styles.subtitle}>Réponse à l'appel d'offres</Text>

        {/* Instructions */}
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            Ce formulaire doit être dûment complété et signé par le soumissionnaire. 
            Toutes les informations fournies seront vérifiées avant l'attribution du contrat.
          </Text>
        </View>

        {/* Champs d'en-tête */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>N° de soumission :</Text>
          <Text style={styles.fieldValueSmall}>{proposal.proposal_number || ''}</Text>
          <Text style={styles.fieldLabel}>Date :</Text>
          <Text style={styles.fieldValueSmall}>{formatDate(proposal.created_at)}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>En réponse à l'appel d'offres N° :</Text>
          <Text style={styles.fieldValue}>{project.tender_number || ''}</Text>
        </View>

        {/* SECTION: INFORMATIONS DE L'ENTREPRISE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>INFORMATIONS DE L'ENTREPRISE SOUMISSIONNAIRE</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Raison sociale :</Text>
            <Text style={styles.fieldValue}>{professional?.company_name || professional?.full_name || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Représentant :</Text>
            <Text style={styles.fieldValue}>{professional?.full_name || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Téléphone :</Text>
            <Text style={styles.fieldValueSmall}>{professional?.phone || ''}</Text>
            <Text style={styles.fieldLabel}>Courriel :</Text>
            <Text style={styles.fieldValue}>{professional?.email || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>N° de licence :</Text>
            <Text style={styles.fieldValueMedium}>{proposal.rbq_license_number || professional?.rbq_license || ''}</Text>
            <Text style={styles.fieldLabel}>Valide jusqu'au :</Text>
            <Text style={styles.fieldValue}>{formatDate(proposal.valid_until)}</Text>
          </View>
        </View>

        {/* SECTION: INFORMATIONS DU CLIENT */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>INFORMATIONS DU DONNEUR D'OUVRAGE</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom / Raison sociale :</Text>
            <Text style={styles.fieldValue}>{client?.company_name || client?.full_name || ''}</Text>
          </View>
        </View>

        {/* SECTION: OBJET DE LA SOUMISSION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>OBJET DE LA SOUMISSION</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Projet :</Text>
            <Text style={styles.fieldValue}>{project.title || ''}</Text>
          </View>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionHeaderText}>Description des travaux proposés</Text>
          </View>
          <Text style={styles.paragraph}>
            {proposal.detailed_description || proposal.message || ''}
          </Text>
        </View>

        {/* MÉTHODOLOGIE */}
        {proposal.work_methodology && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>MÉTHODOLOGIE DE TRAVAIL</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.paragraph}>{proposal.work_methodology}</Text>
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {professional?.company_name || professional?.full_name} - Document confidentiel
          </Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>

      {/* PAGE 2: Équipe, calendrier et budget */}
      <Page size="A4" style={styles.page}>
        
        {/* COMPOSITION DE L'ÉQUIPE */}
        {proposal.team_composition && Array.isArray(proposal.team_composition) && proposal.team_composition.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>COMPOSITION DE L'ÉQUIPE</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Nom</Text>
                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Fonction / Rôle</Text>
                <Text style={styles.tableCellHeaderLast}>Expérience</Text>
              </View>
              {proposal.team_composition.map((member, index) => (
                <View key={index} style={index === proposal.team_composition.length - 1 ? styles.tableRowLast : styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{member.name}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{member.role}</Text>
                  <Text style={styles.tableCellLast}>{member.experience}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* CALENDRIER DES TRAVAUX */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>CALENDRIER DES TRAVAUX</Text>
        </View>
        {proposal.timeline_details && Array.isArray(proposal.timeline_details) && proposal.timeline_details.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableCellHeader, { flex: 3 }]}>Phase / Étape</Text>
              <Text style={styles.tableCellHeader}>Durée</Text>
              <Text style={styles.tableCellHeaderLast}>Date prévue</Text>
            </View>
            {proposal.timeline_details.map((phase, index) => (
              <View key={index} style={index === proposal.timeline_details.length - 1 ? styles.tableRowLast : styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{phase.name || phase.phase}</Text>
                <Text style={styles.tableCell}>{phase.duration}</Text>
                <Text style={styles.tableCellLast}>
                  {phase.date ? formatDate(phase.date) : 'À confirmer'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.sectionContent}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Durée estimée des travaux :</Text>
              <Text style={styles.fieldValue}>{proposal.estimated_duration_days} jours</Text>
            </View>
          </View>
        )}

        {/* DÉCOMPOSITION BUDGÉTAIRE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>DÉCOMPOSITION BUDGÉTAIRE</Text>
        </View>
        
        {proposal.budget_breakdown && Object.keys(proposal.budget_breakdown).length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableCellHeader, { flex: 3 }]}>Poste de dépense</Text>
              <Text style={styles.tableCellHeaderLast}>Montant</Text>
            </View>
            {Object.entries(proposal.budget_breakdown).map(([key, value], index) => (
              <View key={key} style={index === Object.entries(proposal.budget_breakdown).length - 1 ? styles.tableRowLast : styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{key}</Text>
                <Text style={[styles.tableCellLast, { textAlign: 'right' }]}>{formatCurrency(value)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ENCADRÉ PRIX TOTAL */}
        <View style={styles.priceBox}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Sous-total avant taxes :</Text>
            <Text style={styles.priceValue}>{formatCurrency(proposal.estimated_budget)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>TPS (5%) :</Text>
            <Text style={styles.priceValue}>{formatCurrency(proposal.estimated_budget * 0.05)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>TVQ (9.975%) :</Text>
            <Text style={styles.priceValue}>{formatCurrency(proposal.estimated_budget * 0.09975)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>PRIX TOTAL :</Text>
            <Text style={styles.totalValue}>{formatCurrency(proposal.estimated_budget * 1.14975)}</Text>
          </View>
        </View>

        {/* ÉQUIPEMENT */}
        {proposal.equipment_list && Array.isArray(proposal.equipment_list) && proposal.equipment_list.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>ÉQUIPEMENT ET OUTILLAGE</Text>
            </View>
            <View style={styles.sectionContent}>
              {proposal.equipment_list.map((equipment, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>
                    {typeof equipment === 'string' ? equipment : equipment.name || equipment.description}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {professional?.company_name || professional?.full_name} - Document confidentiel
          </Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>

      {/* PAGE 3: Garanties, assurances et signature */}
      <Page size="A4" style={styles.page}>
        
        {/* GARANTIES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>GARANTIES OFFERTES</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Durée de la garantie :</Text>
            <Text style={styles.fieldValue}>{proposal.warranty_offered_months || 12} mois</Text>
          </View>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionHeaderText}>La garantie couvre</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text style={styles.checkboxLabel}>Les défauts de fabrication et d'installation</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text style={styles.checkboxLabel}>Les vices cachés découlant des travaux</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text style={styles.checkboxLabel}>La conformité aux normes et codes en vigueur</Text>
          </View>
        </View>

        {/* ASSURANCES ET LICENCES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>ASSURANCES ET LICENCES</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionHeaderText}>Déclarations du soumissionnaire</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text style={styles.checkboxLabel}>Je détiens une licence valide et en règle</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text style={styles.checkboxLabel}>Responsabilité civile générale : 2 000 000 $ minimum</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text style={styles.checkboxLabel}>CNESST / WSIB : Compte actif et en règle</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxLabel}>Autres assurances : ______________________</Text>
          </View>
        </View>

        {/* RÉFÉRENCES */}
        {proposal.references && Array.isArray(proposal.references) && proposal.references.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>RÉFÉRENCES DE PROJETS SIMILAIRES</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Projet</Text>
                <Text style={styles.tableCellHeader}>Client</Text>
                <Text style={styles.tableCellHeader}>Année</Text>
                <Text style={styles.tableCellHeaderLast}>Valeur</Text>
              </View>
              {proposal.references.map((ref, index) => (
                <View key={index} style={index === proposal.references.length - 1 ? styles.tableRowLast : styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{ref.project_name || `Projet ${index + 1}`}</Text>
                  <Text style={styles.tableCell}>{ref.client_name}</Text>
                  <Text style={styles.tableCell}>{ref.year || '-'}</Text>
                  <Text style={styles.tableCellLast}>{ref.value ? formatCurrency(ref.value) : '-'}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* CONDITIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>CONDITIONS ET DÉCLARATIONS</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>1.</Text>
            <Text style={styles.listText}>
              Cette soumission est valide pour une période de 90 jours à compter de la date de signature.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>2.</Text>
            <Text style={styles.listText}>
              Les prix sont exprimés en dollars canadiens.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>3.</Text>
            <Text style={styles.listText}>
              Je certifie que les renseignements fournis sont véridiques et complets.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>4.</Text>
            <Text style={styles.listText}>
              Les travaux seront effectués conformément aux normes et codes en vigueur.
            </Text>
          </View>
        </View>

        {/* SIGNATURE */}
        <View style={styles.signatureSection}>
          <Text style={[styles.paragraph, { fontWeight: 700 }]}>
            En signant cette soumission, je m'engage à respecter les termes et conditions énoncés ci-dessus.
          </Text>
          
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>Signature du représentant autorisé</Text>
              </View>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>Date : {formatDate(proposal.created_at)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom en lettres moulées :</Text>
            <Text style={styles.fieldValue}>{professional?.full_name || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Titre / Fonction :</Text>
            <Text style={styles.fieldValue}>Représentant autorisé</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {professional?.company_name || professional?.full_name} - Document confidentiel
          </Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default ProposalPDF;
