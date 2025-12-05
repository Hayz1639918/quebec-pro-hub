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

interface TenderPDFProps {
  project: any;
  client: any;
}

export const TenderPDF: React.FC<TenderPDFProps> = ({ project, client }) => {
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
      {/* PAGE 1 */}
      <Page size="A4" style={styles.page}>
        {/* Titre */}
        <Text style={styles.mainTitle}>APPEL D'OFFRES</Text>
        <Text style={styles.subtitle}>Document de soumission</Text>

        {/* Instructions */}
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            Inscrire les informations pertinentes sur cette page et elles seront automatiquement affichées dans le formulaire. 
            Les soumissionnaires doivent prendre connaissance de l'ensemble des documents avant de soumettre leur offre.
          </Text>
        </View>

        {/* Champs d'en-tête */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>N° de dossier :</Text>
          <Text style={styles.fieldValueSmall}>{project.tender_number || ''}</Text>
          <Text style={styles.fieldLabel}>Date de publication :</Text>
          <Text style={styles.fieldValueSmall}>{formatDate(project.created_at)}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Date limite de soumission :</Text>
          <Text style={styles.fieldValue}>{formatDate(project.submission_deadline)}</Text>
        </View>

        {/* SECTION: INFORMATIONS DU DONNEUR D'OUVRAGE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>INFORMATIONS DU DONNEUR D'OUVRAGE</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom / Raison sociale :</Text>
            <Text style={styles.fieldValue}>{client?.company_name || client?.full_name || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Courriel :</Text>
            <Text style={styles.fieldValueSmall}>{client?.email || ''}</Text>
            <Text style={styles.fieldLabel}>Téléphone :</Text>
            <Text style={styles.fieldValue}>{client?.phone || ''}</Text>
          </View>
        </View>

        {/* SECTION: INFORMATIONS DU PROJET */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>INFORMATIONS DU PROJET</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Titre du projet :</Text>
            <Text style={styles.fieldValue}>{project.title || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Lieu des travaux :</Text>
            <Text style={styles.fieldValue}>{project.city ? `${project.city}, ${project.region}` : ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Catégorie :</Text>
            <Text style={styles.fieldValueSmall}>{project.category || ''}</Text>
            <Text style={styles.fieldLabel}>Type :</Text>
            <Text style={styles.fieldValue}>{project.project_type || ''}</Text>
          </View>
        </View>

        {/* SECTION: BUDGET ET ÉCHÉANCIER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>BUDGET ET ÉCHÉANCIER</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Budget estimatif :</Text>
            <Text style={styles.fieldValueSmall}>{formatCurrency(project.budget_min)}</Text>
            <Text style={styles.fieldLabel}>à</Text>
            <Text style={styles.fieldValue}>{formatCurrency(project.budget_max)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Date de début prévue :</Text>
            <Text style={styles.fieldValueSmall}>{formatDate(project.project_start_date)}</Text>
            <Text style={styles.fieldLabel}>Date de fin prévue :</Text>
            <Text style={styles.fieldValue}>{formatDate(project.project_end_date)}</Text>
          </View>
        </View>

        {/* SECTION: DATES IMPORTANTES */}
        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>DATES IMPORTANTES</Text>
          {project.site_visit_date && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Visite de chantier :</Text>
              <Text style={styles.fieldValue}>{formatDate(project.site_visit_date)}</Text>
            </View>
          )}
          {project.questions_deadline && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Date limite pour questions :</Text>
              <Text style={styles.fieldValue}>{formatDate(project.questions_deadline)}</Text>
            </View>
          )}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Date limite de soumission :</Text>
            <Text style={styles.fieldValue}>{formatDate(project.submission_deadline)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BâtirNet - Plateforme de mise en relation professionnelle
          </Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>

      {/* PAGE 2: Description détaillée */}
      <Page size="A4" style={styles.page}>
        
        {/* DESCRIPTION DÉTAILLÉE DES TRAVAUX */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>DESCRIPTION DÉTAILLÉE DES TRAVAUX</Text>
        </View>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>{project.description}</Text>
          {project.work_description_detailed && (
            <>
              <View style={styles.subsectionHeader}>
                <Text style={styles.subsectionHeaderText}>Spécifications supplémentaires</Text>
              </View>
              <Text style={styles.paragraph}>{project.work_description_detailed}</Text>
            </>
          )}
        </View>

        {/* SPÉCIFICATIONS TECHNIQUES */}
        {project.technical_specifications && Array.isArray(project.technical_specifications) && project.technical_specifications.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>SPÉCIFICATIONS TECHNIQUES</Text>
            </View>
            <View style={styles.sectionContent}>
              {project.technical_specifications.map((spec: any, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>
                    {typeof spec === 'string' ? spec : spec.description || spec.name}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* JALONS DU PROJET */}
        {project.milestones && Array.isArray(project.milestones) && project.milestones.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>JALONS DU PROJET</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableCellHeader}>Jalon</Text>
                <Text style={styles.tableCellHeader}>Date prévue</Text>
                <Text style={styles.tableCellHeaderLast}>Livrables</Text>
              </View>
              {project.milestones.map((milestone: any, index: number) => (
                <View key={index} style={index === project.milestones.length - 1 ? styles.tableRowLast : styles.tableRow}>
                  <Text style={styles.tableCell}>{milestone.name || milestone.title}</Text>
                  <Text style={styles.tableCell}>
                    {milestone.date ? formatDate(milestone.date) : 'À déterminer'}
                  </Text>
                  <Text style={styles.tableCellLast}>
                    {milestone.deliverables || 'N/A'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* EXIGENCES D'ASSURANCE ET LICENCE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>EXIGENCES D'ASSURANCE ET LICENCE</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionHeaderText}>Assurances requises</Text>
          </View>
          {project.insurance_requirements && Object.keys(project.insurance_requirements).length > 0 ? (
            <>
              {project.insurance_requirements.liability && (
                <View style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>
                    Responsabilité civile générale : {formatCurrency(project.insurance_requirements.liability)}
                  </Text>
                </View>
              )}
              {project.insurance_requirements.professional && (
                <View style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>
                    Responsabilité professionnelle : {formatCurrency(project.insurance_requirements.professional)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.paragraph}>
              Les soumissionnaires doivent détenir les assurances requises conformément aux lois en vigueur.
            </Text>
          )}

          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionHeaderText}>Licences requises</Text>
          </View>
          <Text style={styles.paragraph}>
            Le soumissionnaire doit détenir une licence valide et en règle pour la catégorie de travaux demandée.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BâtirNet - Plateforme de mise en relation professionnelle
          </Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>

      {/* PAGE 3: Critères et modalités */}
      <Page size="A4" style={styles.page}>
        
        {/* CRITÈRES D'ÉVALUATION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>CRITÈRES D'ÉVALUATION</Text>
        </View>
        {project.evaluation_criteria && Object.keys(project.evaluation_criteria).length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableCellHeader, { flex: 3 }]}>Critère</Text>
              <Text style={styles.tableCellHeaderLast}>Pondération</Text>
            </View>
            {Object.entries(project.evaluation_criteria).map(([key, value]: [string, any], index: number) => (
              <View key={key} style={index === Object.entries(project.evaluation_criteria).length - 1 ? styles.tableRowLast : styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{key}</Text>
                <Text style={styles.tableCellLast}>{value}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableCellHeader, { flex: 3 }]}>Critère</Text>
              <Text style={styles.tableCellHeaderLast}>Pondération</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Prix proposé</Text>
              <Text style={styles.tableCellLast}>40%</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Expérience et références</Text>
              <Text style={styles.tableCellLast}>30%</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Méthodologie et échéancier</Text>
              <Text style={styles.tableCellLast}>20%</Text>
            </View>
            <View style={styles.tableRowLast}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Garanties et assurances</Text>
              <Text style={styles.tableCellLast}>10%</Text>
            </View>
          </View>
        )}

        {/* MODALITÉS DE SOUMISSION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>MODALITÉS DE SOUMISSION</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionHeaderText}>Documents requis</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxLabel}>Formulaire de soumission dûment complété et signé</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxLabel}>Copie de la licence valide</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxLabel}>Certificats d'assurance en vigueur</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxLabel}>Devis détaillé et échéancier proposé</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxLabel}>Minimum trois (3) références de projets similaires</Text>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxLabel}>Liste des sous-traitants (si applicable)</Text>
          </View>
        </View>

        {/* CONDITIONS GÉNÉRALES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>CONDITIONS GÉNÉRALES</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>1.</Text>
            <Text style={styles.listText}>
              Le donneur d'ouvrage se réserve le droit d'accepter ou de refuser toute soumission sans obligation de justifier sa décision.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>2.</Text>
            <Text style={styles.listText}>
              La soumission la plus basse ne sera pas nécessairement retenue.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>3.</Text>
            <Text style={styles.listText}>
              Les soumissions devront demeurer valides pour une période minimale de quatre-vingt-dix (90) jours.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>4.</Text>
            <Text style={styles.listText}>
              Les travaux devront être effectués conformément aux normes et codes en vigueur.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>5.</Text>
            <Text style={styles.listText}>
              L'entrepreneur retenu devra fournir une garantie de {project.warranty_period_months || 12} mois sur les travaux.
            </Text>
          </View>
        </View>

        {/* PERSONNE-RESSOURCE */}
        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>PERSONNE-RESSOURCE</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom :</Text>
            <Text style={styles.fieldValue}>{client?.full_name || client?.company_name || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Courriel :</Text>
            <Text style={styles.fieldValueSmall}>{client?.email || ''}</Text>
            <Text style={styles.fieldLabel}>Tél. :</Text>
            <Text style={styles.fieldValue}>{client?.phone || ''}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BâtirNet - Plateforme de mise en relation professionnelle
          </Text>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default TenderPDF;
