import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet,
  Font,
  Image
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Register fonts for better rendering
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

// Styles professionnels québécois
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
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  tenderTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e40af',
    marginBottom: 5,
  },
  tenderNumber: {
    fontSize: 14,
    fontWeight: 700,
    color: '#2563eb',
    marginBottom: 3,
  },
  headerInfo: {
    fontSize: 9,
    color: '#4b5563',
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
    color: '#1e40af',
    marginBottom: 8,
    borderBottom: '1 solid #93c5fd',
    paddingBottom: 4,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#2563eb',
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
    backgroundColor: '#dbeafe',
    borderBottom: '2 solid #2563eb',
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
    color: '#1e40af',
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
    color: '#2563eb',
  },
  listText: {
    flex: 1,
    fontSize: 10,
  },
  // Informations importantes
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
  // Badges
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '3 8',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 700,
    display: 'inline-block',
    marginRight: 5,
  },
});

interface TenderPDFProps {
  project: any;
  client: any;
}

export const TenderPDF: React.FC<TenderPDFProps> = ({ project, client }) => {
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
      {/* PAGE 1: Page de garde */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.tenderTitle}>APPEL D'OFFRES</Text>
          <Text style={styles.tenderNumber}>
            {project.tender_number || 'N° à générer'}
          </Text>
          <Text style={styles.headerInfo}>
            Date de publication : {formatDate(project.created_at)}
          </Text>
          <Text style={styles.headerInfo}>
            Date limite de soumission : {formatDate(project.submission_deadline)}
          </Text>
        </View>

        {/* Informations du client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. DONNEUR D'OUVRAGE</Text>
          <Text style={styles.paragraph}>
            {client?.company_name || client?.full_name}
          </Text>
          {client?.email && (
            <Text style={styles.paragraph}>Courriel : {client.email}</Text>
          )}
          {client?.phone && (
            <Text style={styles.paragraph}>Téléphone : {client.phone}</Text>
          )}
        </View>

        {/* Titre et description du projet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. OBJET DE L'APPEL D'OFFRES</Text>
          <Text style={[styles.paragraph, { fontWeight: 700, fontSize: 12 }]}>
            {project.title}
          </Text>
          <Text style={styles.paragraph}>{project.description}</Text>
          
          {project.work_description_detailed && (
            <>
              <Text style={styles.subsectionTitle}>Description détaillée</Text>
              <Text style={styles.paragraph}>
                {project.work_description_detailed}
              </Text>
            </>
          )}
        </View>

        {/* Renseignements généraux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. RENSEIGNEMENTS GÉNÉRAUX</Text>
          
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColNarrow}>
                <Text style={styles.tableCell}>Catégorie :</Text>
              </View>
              <View style={[styles.tableColWide, { flex: 2 }]}>
                <Text style={styles.tableCell}>{project.category}</Text>
              </View>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.tableColNarrow}>
                <Text style={styles.tableCell}>Type de travaux :</Text>
              </View>
              <View style={[styles.tableColWide, { flex: 2 }]}>
                <Text style={styles.tableCell}>
                  {project.project_type || 'Non spécifié'}
                </Text>
              </View>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.tableColNarrow}>
                <Text style={styles.tableCell}>Lieu des travaux :</Text>
              </View>
              <View style={[styles.tableColWide, { flex: 2 }]}>
                <Text style={styles.tableCell}>
                  {project.city}, {project.region}
                </Text>
              </View>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.tableColNarrow}>
                <Text style={styles.tableCell}>Budget estimatif :</Text>
              </View>
              <View style={[styles.tableColWide, { flex: 2 }]}>
                <Text style={styles.tableCell}>
                  {formatCurrency(project.budget_min)} à {formatCurrency(project.budget_max)}
                </Text>
              </View>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.tableColNarrow}>
                <Text style={styles.tableCell}>Début prévue :</Text>
              </View>
              <View style={[styles.tableColWide, { flex: 2 }]}>
                <Text style={styles.tableCell}>
                  {formatDate(project.project_start_date)}
                </Text>
              </View>
            </View>
            
            <View style={styles.tableRow}>
              <View style={styles.tableColNarrow}>
                <Text style={styles.tableCell}>Fin prévue :</Text>
              </View>
              <View style={[styles.tableColWide, { flex: 2 }]}>
                <Text style={styles.tableCell}>
                  {formatDate(project.project_end_date)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dates importantes */}
        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>📅 DATES IMPORTANTES</Text>
          {project.site_visit_date && (
            <Text style={styles.importantText}>
              • Visite de chantier : {formatDate(project.site_visit_date)}
            </Text>
          )}
          {project.questions_deadline && (
            <Text style={styles.importantText}>
              • Date limite pour questions : {formatDate(project.questions_deadline)}
            </Text>
          )}
          <Text style={styles.importantText}>
            • Date limite de soumission : {formatDate(project.submission_deadline)}
          </Text>
        </View>

        <Text style={styles.footer}>
          BâtirNet - Plateforme de mise en relation - www.batirnet.ca
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} sur ${totalPages}`
        )} fixed />
      </Page>

      {/* PAGE 2: Spécifications techniques et exigences */}
      <Page size="A4" style={styles.page}>
        {/* Spécifications techniques */}
        {project.technical_specifications && Array.isArray(project.technical_specifications) && project.technical_specifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. SPÉCIFICATIONS TECHNIQUES</Text>
            {project.technical_specifications.map((spec: any, index: number) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>
                  {typeof spec === 'string' ? spec : spec.description || spec.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Jalons et échéancier */}
        {project.milestones && Array.isArray(project.milestones) && project.milestones.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. JALONS DU PROJET</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCol, { flex: 2 }]}>
                  <Text style={styles.tableCellHeader}>Jalon</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCellHeader}>Date prévue</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCellHeader}>Livrables</Text>
                </View>
              </View>
              {project.milestones.map((milestone: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCol, { flex: 2 }]}>
                    <Text style={styles.tableCell}>{milestone.name || milestone.title}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {milestone.date ? formatDate(milestone.date) : 'À déterminer'}
                    </Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {milestone.deliverables || 'N/A'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exigences d'assurance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. EXIGENCES D'ASSURANCE ET DE LICENCE</Text>
          
          <Text style={styles.subsectionTitle}>6.1 Assurances requises</Text>
          {project.insurance_requirements && Object.keys(project.insurance_requirements).length > 0 ? (
            <View style={styles.list}>
              {project.insurance_requirements.liability && (
                <View style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>
                    Responsabilité civile générale : {formatCurrency(project.insurance_requirements.liability)}
                  </Text>
                </View>
              )}
              {project.insurance_requirements.professional && (
                <View style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>
                    Responsabilité professionnelle : {formatCurrency(project.insurance_requirements.professional)}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.paragraph}>
              Les soumissionnaires doivent détenir les assurances requises conformément aux lois du Québec.
            </Text>
          )}

          <Text style={styles.subsectionTitle}>6.2 Licences RBQ requises</Text>
          {project.licensing_requirements && Object.keys(project.licensing_requirements).length > 0 ? (
            <View style={styles.list}>
              {Object.entries(project.licensing_requirements).map(([key, value]: [string, any]) => (
                <View key={key} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.paragraph}>
              Le soumissionnaire doit détenir une licence RBQ valide et en règle pour la catégorie de travaux demandée.
            </Text>
          )}
        </View>

        {/* Critères d'évaluation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. CRITÈRES D'ÉVALUATION</Text>
          {project.evaluation_criteria && Object.keys(project.evaluation_criteria).length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCol, { flex: 2 }]}>
                  <Text style={styles.tableCellHeader}>Critère</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCellHeader}>Pondération</Text>
                </View>
              </View>
              {Object.entries(project.evaluation_criteria).map(([key, value]: [string, any]) => (
                <View key={key} style={styles.tableRow}>
                  <View style={[styles.tableCol, { flex: 2 }]}>
                    <Text style={styles.tableCell}>{key}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{value}%</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.list}>
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>Prix proposé : 40%</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>Expérience et références : 30%</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>Méthodologie et échéancier : 20%</Text>
              </View>
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>Garanties et assurances : 10%</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          BâtirNet - Plateforme de mise en relation - www.batirnet.ca
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} sur ${totalPages}`
        )} fixed />
      </Page>

      {/* PAGE 3: Modalités de soumission */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. MODALITÉS DE SOUMISSION</Text>
          
          <Text style={styles.subsectionTitle}>8.1 Documents requis</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>1.</Text>
              <Text style={styles.listText}>
                Formulaire de soumission dûment complété et signé
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>2.</Text>
              <Text style={styles.listText}>
                Copie de la licence RBQ valide
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>3.</Text>
              <Text style={styles.listText}>
                Certificats d'assurance en vigueur
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>4.</Text>
              <Text style={styles.listText}>
                Devis détaillé et échéancier proposé
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>5.</Text>
              <Text style={styles.listText}>
                Minimum trois (3) références de projets similaires
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>6.</Text>
              <Text style={styles.listText}>
                Liste des sous-traitants (si applicable)
              </Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>8.2 Mode de transmission</Text>
          <Text style={styles.paragraph}>
            Les soumissions doivent être transmises par voie électronique via la plateforme BâtirNet avant la date et l'heure limite indiquées.
          </Text>

          <Text style={styles.subsectionTitle}>8.3 Validité de la soumission</Text>
          <Text style={styles.paragraph}>
            Les soumissions devront demeurer valides pour une période minimale de quatre-vingt-dix (90) jours suivant la date limite de dépôt.
          </Text>
        </View>

        {/* Conditions de paiement */}
        {project.payment_terms && Object.keys(project.payment_terms).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. CONDITIONS DE PAIEMENT</Text>
            <Text style={styles.paragraph}>
              {project.payment_terms.description || 'Selon les modalités standards de l\'industrie'}
            </Text>
            {project.payment_terms.schedule && (
              <View style={styles.list}>
                {Object.entries(project.payment_terms.schedule).map(([key, value]: [string, any]) => (
                  <View key={key} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{key} : {value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Garantie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. GARANTIE ET RESPONSABILITÉS</Text>
          <Text style={styles.paragraph}>
            L'entrepreneur retenu devra fournir une garantie de {project.warranty_period_months || 12} mois sur l'ensemble des travaux réalisés, couvrant les défauts de matériaux et de main-d'œuvre.
          </Text>
        </View>

        {/* Conditions générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. CONDITIONS GÉNÉRALES</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Le donneur d'ouvrage se réserve le droit d'accepter ou de refuser toute soumission, et ce, sans obligation de justifier sa décision.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                La soumission la plus basse ne sera pas nécessairement retenue.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Les frais de préparation et de soumission sont à la charge du soumissionnaire.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Toute modification à l'appel d'offres sera communiquée à tous les soumissionnaires inscrits.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Les travaux devront être effectués conformément aux normes et codes en vigueur au Québec.
              </Text>
            </View>
          </View>
        </View>

        {/* Contact pour questions */}
        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>📞 PERSONNE-RESSOURCE</Text>
          <Text style={styles.importantText}>
            Pour toute question concernant cet appel d'offres, veuillez contacter :
          </Text>
          <Text style={styles.importantText}>
            {client?.full_name || client?.company_name}
          </Text>
          {client?.email && (
            <Text style={styles.importantText}>Courriel : {client.email}</Text>
          )}
          {client?.phone && (
            <Text style={styles.importantText}>Téléphone : {client.phone}</Text>
          )}
        </View>

        <Text style={styles.footer}>
          BâtirNet - Plateforme de mise en relation - www.batirnet.ca
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} sur ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default TenderPDF;

