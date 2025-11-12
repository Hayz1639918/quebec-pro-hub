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

// Styles professionnels
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 40,
    lineHeight: 1.5,
  },
  // En-tête
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #16a34a',
    paddingBottom: 10,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#15803d',
    marginBottom: 5,
  },
  proposalNumber: {
    fontSize: 14,
    fontWeight: 700,
    color: '#16a34a',
    marginBottom: 3,
  },
  headerInfo: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 2,
  },
  // Informations professionnelles
  companyHeader: {
    backgroundColor: '#dcfce7',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#15803d',
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 9,
    color: '#166534',
    marginBottom: 2,
  },
  // Sections
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#15803d',
    marginBottom: 8,
    borderBottom: '1 solid #86efac',
    paddingBottom: 4,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#16a34a',
    marginTop: 10,
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'justify',
  },
  // Tableaux
  table: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#dcfce7',
    borderBottom: '2 solid #16a34a',
    paddingVertical: 6,
    fontWeight: 700,
  },
  tableCol: {
    flex: 1,
    paddingHorizontal: 5,
  },
  tableColNarrow: {
    width: '20%',
    paddingHorizontal: 5,
  },
  tableColWide: {
    width: '40%',
    paddingHorizontal: 5,
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 700,
    color: '#15803d',
  },
  tableCell: {
    fontSize: 9,
  },
  // Listes
  list: {
    marginLeft: 15,
    marginTop: 5,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 15,
    fontSize: 10,
    color: '#16a34a',
  },
  listText: {
    flex: 1,
    fontSize: 10,
  },
  // Boîte de prix
  priceBox: {
    backgroundColor: '#dcfce7',
    border: '2 solid #16a34a',
    padding: 15,
    marginVertical: 15,
    borderRadius: 4,
  },
  priceTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#15803d',
    marginBottom: 10,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 700,
    color: '#15803d',
    textAlign: 'center',
    marginTop: 10,
  },
  // Signature
  signatureSection: {
    marginTop: 30,
    borderTop: '1 solid #d1d5db',
    paddingTop: 20,
  },
  signatureLine: {
    borderTop: '1 solid #6b7280',
    width: '60%',
    marginTop: 40,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  // Pied de page
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 8,
    borderTop: '1 solid #d1d5db',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 40,
    fontSize: 8,
    color: '#6b7280',
  },
  // Boîte importante
  importantBox: {
    backgroundColor: '#fef3c7',
    border: '1 solid #f59e0b',
    padding: 10,
    marginVertical: 10,
    borderRadius: 4,
  },
  importantTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#b45309',
    marginBottom: 5,
  },
  importantText: {
    fontSize: 9,
    color: '#78350f',
  },
});

interface ProposalPDFProps {
  proposal: any;
  project: any;
  professional: any;
  client: any;
}

export const ProposalPDF: React.FC<ProposalPDFProps> = ({ 
  proposal, 
  project, 
  professional,
  client 
}) => {
  const formatDate = (date: string | null) => {
    if (!date) return 'Non spécifiée';
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Non spécifié';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <Document>
      {/* PAGE 1: Page de garde et proposition */}
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.proposalTitle}>SOUMISSION</Text>
          <Text style={styles.proposalNumber}>
            {proposal.proposal_number || 'N° à générer'}
          </Text>
          <Text style={styles.headerInfo}>
            Date de soumission : {formatDate(proposal.created_at)}
          </Text>
          {proposal.valid_until && (
            <Text style={styles.headerInfo}>
              Valide jusqu'au : {formatDate(proposal.valid_until)}
            </Text>
          )}
        </View>

        {/* Informations du professionnel */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>
            {professional?.company_name || professional?.full_name}
          </Text>
          {professional?.phone && (
            <Text style={styles.companyInfo}>📞 {professional.phone}</Text>
          )}
          {professional?.email && (
            <Text style={styles.companyInfo}>✉️ {professional.email}</Text>
          )}
          {proposal.rbq_license_number && (
            <Text style={styles.companyInfo}>
              🏗️ Licence RBQ : {proposal.rbq_license_number}
            </Text>
          )}
        </View>

        {/* Destinataire */}
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Destinataire</Text>
          <Text style={styles.paragraph}>
            {client?.company_name || client?.full_name}
          </Text>
        </View>

        {/* Objet de la soumission */}
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Objet</Text>
          <Text style={styles.paragraph}>
            Soumission en réponse à l'appel d'offres :{' '}
            <Text style={{ fontWeight: 700 }}>{project.tender_number}</Text>
          </Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: 700 }}>Projet : </Text>
            {project.title}
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. INTRODUCTION</Text>
          <Text style={styles.paragraph}>
            Madame, Monsieur,
          </Text>
          <Text style={styles.paragraph}>
            Nous avons le plaisir de vous soumettre la présente offre de service concernant le projet mentionné en objet.
            Nous avons pris connaissance de tous les documents de l'appel d'offres et nous confirmons notre capacité
            à réaliser les travaux selon les exigences spécifiées.
          </Text>
        </View>

        {/* Description de la proposition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. PORTÉE DES TRAVAUX</Text>
          {proposal.detailed_description ? (
            <Text style={styles.paragraph}>{proposal.detailed_description}</Text>
          ) : (
            <Text style={styles.paragraph}>{proposal.message}</Text>
          )}
        </View>

        {/* Méthodologie */}
        {proposal.work_methodology && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. MÉTHODOLOGIE</Text>
            <Text style={styles.paragraph}>{proposal.work_methodology}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          {professional?.company_name || professional?.full_name} - Soumission confidentielle
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} sur ${totalPages}`
        )} fixed />
      </Page>

      {/* PAGE 2: Équipe, calendrier et prix */}
      <Page size="A4" style={styles.page}>
        {/* Composition de l'équipe */}
        {proposal.team_composition && Array.isArray(proposal.team_composition) && proposal.team_composition.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. COMPOSITION DE L'ÉQUIPE</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCol, { flex: 2 }]}>
                  <Text style={styles.tableCellHeader}>Nom</Text>
                </View>
                <View style={[styles.tableCol, { flex: 2 }]}>
                  <Text style={styles.tableCellHeader}>Rôle</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCellHeader}>Expérience</Text>
                </View>
              </View>
              {proposal.team_composition.map((member: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCol, { flex: 2 }]}>
                    <Text style={styles.tableCell}>{member.name}</Text>
                  </View>
                  <View style={[styles.tableCol, { flex: 2 }]}>
                    <Text style={styles.tableCell}>{member.role}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{member.experience}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Calendrier détaillé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. CALENDRIER DES TRAVAUX</Text>
          {proposal.timeline_details && Array.isArray(proposal.timeline_details) && proposal.timeline_details.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCol, { flex: 3 }]}>
                  <Text style={styles.tableCellHeader}>Phase</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCellHeader}>Durée</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCellHeader}>Date</Text>
                </View>
              </View>
              {proposal.timeline_details.map((phase: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCol, { flex: 3 }]}>
                    <Text style={styles.tableCell}>{phase.name || phase.phase}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{phase.duration}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {phase.date ? formatDate(phase.date) : 'TBD'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableColNarrow}>
                  <Text style={styles.tableCell}>Durée estimée :</Text>
                </View>
                <View style={[styles.tableColWide, { flex: 2 }]}>
                  <Text style={styles.tableCell}>
                    {proposal.estimated_duration_days} jours
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Décomposition budgétaire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. DÉCOMPOSITION BUDGÉTAIRE</Text>
          {proposal.budget_breakdown && Object.keys(proposal.budget_breakdown).length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCol, { flex: 3 }]}>
                  <Text style={styles.tableCellHeader}>Poste</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCellHeader}>Montant</Text>
                </View>
              </View>
              {Object.entries(proposal.budget_breakdown).map(([key, value]: [string, any]) => (
                <View key={key} style={styles.tableRow}>
                  <View style={[styles.tableCol, { flex: 3 }]}>
                    <Text style={styles.tableCell}>{key}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{formatCurrency(value)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Boîte de prix total */}
          <View style={styles.priceBox}>
            <Text style={styles.priceTitle}>PRIX TOTAL DE LA SOUMISSION</Text>
            <Text style={styles.totalPrice}>
              {formatCurrency(proposal.estimated_budget)}
            </Text>
            <Text style={[styles.paragraph, { textAlign: 'center', marginTop: 5, fontSize: 8 }]}>
              (Taxes en sus)
            </Text>
          </View>
        </View>

        {/* Équipement */}
        {proposal.equipment_list && Array.isArray(proposal.equipment_list) && proposal.equipment_list.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. ÉQUIPEMENT ET OUTILLAGE</Text>
            <View style={styles.list}>
              {proposal.equipment_list.map((equipment: any, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>
                    {typeof equipment === 'string' ? equipment : equipment.name || equipment.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          {professional?.company_name || professional?.full_name} - Soumission confidentielle
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} sur ${totalPages}`
        )} fixed />
      </Page>

      {/* PAGE 3: Garanties, assurances et conditions */}
      <Page size="A4" style={styles.page}>
        {/* Garanties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. GARANTIES</Text>
          <Text style={styles.paragraph}>
            Nous offrons une garantie de {proposal.warranty_offered_months || 12} mois sur l'ensemble
            des travaux réalisés, couvrant les défauts de matériaux et de main-d'œuvre.
          </Text>
          <Text style={styles.paragraph}>
            Cette garantie prend effet à la date de réception finale des travaux et couvre :
          </Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Les défauts de fabrication et d'installation</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Les vices cachés découlant de nos travaux</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>La conformité aux codes et normes en vigueur</Text>
            </View>
          </View>
        </View>

        {/* Assurances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. ASSURANCES ET LICENCES</Text>
          <Text style={styles.subsectionTitle}>9.1 Licence RBQ</Text>
          <Text style={styles.paragraph}>
            Numéro de licence : {proposal.rbq_license_number || professional?.rbq_license || 'À fournir'}
          </Text>
          <Text style={styles.paragraph}>
            Statut : Valide et en règle
          </Text>

          <Text style={styles.subsectionTitle}>9.2 Assurances</Text>
          <Text style={styles.paragraph}>
            Nous détenons les assurances suivantes :
          </Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Responsabilité civile générale : 2 000 000 $ minimum
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                CNESST : Compte actif et en règle
              </Text>
            </View>
          </View>
          {proposal.insurance_proof_url && (
            <Text style={styles.paragraph}>
              Les certificats d'assurance sont disponibles sur demande.
            </Text>
          )}
        </View>

        {/* Références */}
        {proposal.references && Array.isArray(proposal.references) && proposal.references.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. RÉFÉRENCES</Text>
            {proposal.references.map((ref: any, index: number) => (
              <View key={index} style={[styles.paragraph, { marginBottom: 10 }]}>
                <Text style={{ fontWeight: 700 }}>
                  {ref.project_name || `Référence ${index + 1}`}
                </Text>
                <Text>Client : {ref.client_name}</Text>
                {ref.contact_phone && <Text>Téléphone : {ref.contact_phone}</Text>}
                {ref.year && <Text>Année : {ref.year}</Text>}
                {ref.value && <Text>Valeur : {formatCurrency(ref.value)}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. CONDITIONS GÉNÉRALES</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Cette soumission est valide pour une période de 90 jours.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Les prix sont exprimés en dollars canadiens, taxes en sus.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Les modalités de paiement suivront {proposal.payment_terms_accepted ? 'celles de l\'appel d\'offres' : 'notre politique standard'}.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Toute modification aux travaux fera l'objet d'un avenant au contrat.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Les travaux seront effectués conformément aux normes et codes en vigueur au Québec.
              </Text>
            </View>
          </View>
        </View>

        {/* Conclusion */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Nous espérons que cette soumission répondra à vos attentes et nous restons à votre disposition
            pour toute information complémentaire.
          </Text>
          <Text style={styles.paragraph}>
            Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>
              {professional?.full_name}
            </Text>
            <Text style={styles.signatureLabel}>
              {professional?.company_name}
            </Text>
            <Text style={[styles.signatureLabel, { marginTop: 5 }]}>
              Date : {formatDate(proposal.created_at)}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {professional?.company_name || professional?.full_name} - Soumission confidentielle
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} sur ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default ProposalPDF;

