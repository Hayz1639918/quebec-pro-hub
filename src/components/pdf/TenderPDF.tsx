import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { PartyInfo, TenderProject } from '@/types/tender';

const DEFAULT_REQUIRED_DOCUMENTS = [
  'Formulaire de soumission dûment complété et signé',
  'Copie de la licence RBQ valide',
  "Certificats d'assurance en vigueur",
  'Devis détaillé et échéancier proposé',
];

const CERTIFICATION_LABELS: Record<string, string> = {
  rbq: 'Licence RBQ obligatoire',
  liability_insurance: 'Assurance responsabilité civile',
  apchq: 'Membre APCHQ',
  asp_construction: 'Formation ASP Construction',
};

const ENTREPRENEUR_LABELS: Record<string, string> = {
  individual: 'Travailleur autonome / individuel',
  company: 'Entreprise',
};

const PAYMENT_LABELS: Record<string, string> = {
  full: 'Paiement complet selon les modalités convenues au contrat',
  milestones: "Versements par jalons selon l'avancement convenu",
  negotiable: "Échéancier négociable avec l'entrepreneur retenu",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 28,
    paddingBottom: 44,
    paddingHorizontal: 32,
    lineHeight: 1.45,
    color: '#1f2937',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 16,
  },
  referenceBox: {
    border: '1 solid #9ca3af',
    backgroundColor: '#f9fafb',
    padding: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ffffff',
    backgroundColor: '#1f2937',
    paddingVertical: 5,
    paddingHorizontal: 7,
    marginTop: 10,
    marginBottom: 7,
  },
  subTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginTop: 6,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 9,
    marginBottom: 7,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 12,
  },
  listText: {
    flex: 1,
  },
  table: {
    border: '1 solid #d1d5db',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #d1d5db',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeader: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    fontWeight: 700,
    backgroundColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 32,
    right: 32,
    borderTop: '1 solid #d1d5db',
    paddingTop: 6,
    fontSize: 7,
    color: '#6b7280',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 18,
    right: 32,
    fontSize: 7,
    color: '#6b7280',
  },
  notice: {
    border: '1 solid #d1d5db',
    backgroundColor: '#f9fafb',
    padding: 8,
    marginTop: 8,
    fontSize: 8,
  },
});

interface TenderPDFProps {
  project: TenderProject;
  client: PartyInfo;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Non précisée';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non précisée';
  return format(date, 'dd MMMM yyyy', { locale: fr });
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return 'À discuter';
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
};

const locationText = (project: TenderProject) =>
  [project.city, project.region, project.postal_code].filter(Boolean).join(', ') || 'Non précisée';

const TenderFooter = () => (
  <>
    <Text style={styles.footer} fixed>
      BâtirNet — Appel d'offres généré à partir des informations du projet
    </Text>
    <Text
      style={styles.pageNumber}
      fixed
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
    />
  </>
);

export const TenderPDF: React.FC<TenderPDFProps> = ({ project, client }) => {
  const requiredDocuments = project.required_documents?.length
    ? project.required_documents
    : DEFAULT_REQUIRED_DOCUMENTS;
  const certifications = project.required_certifications || [];
  const evaluationCriteria = Object.entries(project.evaluation_criteria || {});

  return (
    <Document title={`Appel d'offres - ${project.title}`} author="BâtirNet">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>APPEL D'OFFRES</Text>
        <Text style={styles.subtitle}>{project.title}</Text>

        <View style={styles.referenceBox}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Numéro d'appel d'offres</Text>
              <Text style={styles.value}>{project.tender_number || project.id}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Date de publication</Text>
              <Text style={styles.value}>{formatDate(project.created_at)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Date limite de soumission</Text>
              <Text style={styles.value}>{formatDate(project.submission_deadline)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Catégorie / type</Text>
              <Text style={styles.value}>
                {[project.category, project.project_type].filter(Boolean).join(' — ') || 'Non précisé'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>DONNEUR D'OUVRAGE</Text>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Nom / raison sociale</Text>
            <Text style={styles.value}>{client.company_name || client.full_name || 'Client BâtirNet'}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Personne-ressource</Text>
            <Text style={styles.value}>{client.full_name || client.company_name || 'Client BâtirNet'}</Text>
          </View>
        </View>
        {(client.email || client.phone) && (
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Courriel</Text>
              <Text style={styles.value}>{client.email || 'Non communiqué'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Téléphone</Text>
              <Text style={styles.value}>{client.phone || 'Non communiqué'}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>INFORMATIONS DU PROJET</Text>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Lieu des travaux</Text>
            <Text style={styles.value}>{locationText(project)}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Budget estimatif</Text>
            <Text style={styles.value}>
              {formatCurrency(project.budget_min)} à {formatCurrency(project.budget_max)}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Début souhaité</Text>
            <Text style={styles.value}>{formatDate(project.project_start_date)}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Fin souhaitée</Text>
            <Text style={styles.value}>{formatDate(project.project_end_date)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>DATES IMPORTANTES</Text>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Visite de chantier</Text>
            <Text style={styles.value}>{formatDate(project.site_visit_date)}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Date limite pour questions</Text>
            <Text style={styles.value}>{formatDate(project.questions_deadline)}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Date limite de soumission</Text>
            <Text style={styles.value}>{formatDate(project.submission_deadline)}</Text>
          </View>
        </View>

        <TenderFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>DESCRIPTION DES TRAVAUX</Text>
        <Text style={styles.paragraph}>{project.description || 'Aucune description fournie.'}</Text>
        {project.work_description_detailed && (
          <>
            <Text style={styles.subTitle}>Description détaillée</Text>
            <Text style={styles.paragraph}>{project.work_description_detailed}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>SPÉCIFICATIONS TECHNIQUES</Text>
        {project.technical_specifications?.length ? (
          project.technical_specifications.map((spec, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {typeof spec === 'string' ? spec : spec.description || spec.name || 'Spécification'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.paragraph}>Aucune spécification technique supplémentaire n'a été fournie.</Text>
        )}

        {project.milestones?.length ? (
          <>
            <Text style={styles.sectionTitle}>JALONS DU PROJET</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Jalon</Text>
                <Text style={styles.tableHeader}>Date prévue</Text>
                <Text style={styles.tableHeader}>Livrables</Text>
              </View>
              {project.milestones.map((milestone, index) => (
                <View
                  key={index}
                  style={index === project.milestones!.length - 1 ? styles.tableRowLast : styles.tableRow}
                >
                  <Text style={styles.tableCell}>{milestone.name || milestone.title || 'Jalon'}</Text>
                  <Text style={styles.tableCell}>{formatDate(milestone.date)}</Text>
                  <Text style={styles.tableCell}>{milestone.deliverables || milestone.description || 'À préciser'}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>EXIGENCES DU SOUMISSIONNAIRE</Text>
        <Text style={styles.subTitle}>Type d'entrepreneur recherché</Text>
        <Text style={styles.paragraph}>
          {project.preferred_entrepreneur_type
            ? ENTREPRENEUR_LABELS[project.preferred_entrepreneur_type] || project.preferred_entrepreneur_type
            : 'Aucune préférence particulière'}
        </Text>

        <Text style={styles.subTitle}>Certifications et accréditations</Text>
        {certifications.length ? (
          certifications.map((certification) => (
            <View key={certification} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {CERTIFICATION_LABELS[certification] || certification}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.paragraph}>Aucune certification additionnelle sélectionnée.</Text>
        )}

        <Text style={styles.subTitle}>Assurances</Text>
        {project.insurance_requirements && Object.keys(project.insurance_requirements).length ? (
          <>
            {project.insurance_requirements.liability !== undefined && (
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>
                  Responsabilité civile : {formatCurrency(project.insurance_requirements.liability)}
                </Text>
              </View>
            )}
            {project.insurance_requirements.professional !== undefined && (
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>
                  Responsabilité professionnelle : {formatCurrency(project.insurance_requirements.professional)}
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.paragraph}>Selon les exigences légales applicables au projet.</Text>
        )}

        {project.licensing_requirements && Object.keys(project.licensing_requirements).length > 0 && (
          <>
            <Text style={styles.subTitle}>Licences spécifiques</Text>
            {Object.entries(project.licensing_requirements).map(([key, value]) => (
              <View key={key} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{value}</Text>
              </View>
            ))}
          </>
        )}

        <TenderFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>CRITÈRES D'ÉVALUATION</Text>
        {evaluationCriteria.length ? (
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, { flex: 3 }]}>Critère</Text>
              <Text style={styles.tableHeader}>Pondération</Text>
            </View>
            {evaluationCriteria.map(([criterion, weight], index) => (
              <View
                key={criterion}
                style={index === evaluationCriteria.length - 1 ? styles.tableRowLast : styles.tableRow}
              >
                <Text style={[styles.tableCell, { flex: 3 }]}>{criterion}</Text>
                <Text style={styles.tableCell}>{String(weight)}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.paragraph}>Les offres seront analysées selon leur adéquation globale avec le projet.</Text>
        )}

        <Text style={styles.sectionTitle}>DOCUMENTS REQUIS AVEC LA SOUMISSION</Text>
        {requiredDocuments.map((document) => (
          <View key={document} style={styles.listItem}>
            <Text style={styles.bullet}>□</Text>
            <Text style={styles.listText}>{document}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>MODALITÉS FINANCIÈRES</Text>
        <Text style={styles.subTitle}>Mode de paiement souhaité</Text>
        <Text style={styles.paragraph}>
          {project.payment_mode
            ? PAYMENT_LABELS[project.payment_mode] || project.payment_mode
            : 'À définir entre les parties'}
        </Text>
        <Text style={styles.paragraph}>
          BâtirNet ne reçoit ni ne conserve les fonds. Le règlement est effectué directement entre le client et l'entrepreneur selon les modalités convenues au contrat.
        </Text>

        <Text style={styles.sectionTitle}>CONDITIONS GÉNÉRALES</Text>
        {[
          "Le donneur d'ouvrage se réserve le droit d'accepter ou de refuser une soumission selon les besoins du projet.",
          "La soumission la plus basse n'est pas automatiquement retenue; l'ensemble des critères d'évaluation peut être considéré.",
          'Les travaux doivent respecter les lois, règlements, codes et normes applicables.',
          `La garantie demandée sur les travaux est de ${project.warranty_period_months || 12} mois, sauf entente contractuelle différente.`,
        ].map((condition, index) => (
          <View key={condition} style={styles.listItem}>
            <Text style={styles.bullet}>{index + 1}.</Text>
            <Text style={styles.listText}>{condition}</Text>
          </View>
        ))}

        <View style={styles.notice}>
          <Text>
            Pour soumettre une offre, l'entrepreneur doit utiliser le parcours de soumission BâtirNet associé à ce projet. Les informations finales du contrat sont confirmées par les deux parties avant le début des travaux.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>PERSONNE-RESSOURCE</Text>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>{client.full_name || client.company_name || 'Client BâtirNet'}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Coordonnées</Text>
            <Text style={styles.value}>
              {[client.email, client.phone].filter(Boolean).join(' — ') || 'Communiquer par BâtirNet'}
            </Text>
          </View>
        </View>

        <TenderFooter />
      </Page>
    </Document>
  );
};

export default TenderPDF;
