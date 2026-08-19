import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { sanitizePdfText } from '@/lib/pdf-text';
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
  any: 'Aucune préférence particulière',
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
  title: { fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 9, textAlign: 'center', color: '#4b5563', marginBottom: 16 },
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
  row: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  column: { flex: 1 },
  label: { fontSize: 8, color: '#6b7280', marginBottom: 2 },
  value: { fontSize: 9 },
  paragraph: { fontSize: 9, marginBottom: 7 },
  subTitle: { fontSize: 9, fontWeight: 700, marginTop: 6, marginBottom: 4 },
  listItem: { flexDirection: 'row', marginBottom: 4 },
  marker: { width: 16 },
  listText: { flex: 1 },
  table: { border: '1 solid #d1d5db', marginBottom: 8 },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #d1d5db' },
  tableRowLast: { flexDirection: 'row' },
  tableHeader: { flex: 1, padding: 5, fontSize: 8, fontWeight: 700, backgroundColor: '#f3f4f6' },
  tableCell: { flex: 1, padding: 5, fontSize: 8 },
  notice: { border: '1 solid #d1d5db', backgroundColor: '#f9fafb', padding: 8, marginTop: 8, fontSize: 8 },
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
  pageNumber: { position: 'absolute', bottom: 18, right: 32, fontSize: 7, color: '#6b7280' },
});

interface TenderPDFProps {
  project: TenderProject;
  client: PartyInfo;
}

const text = (value: unknown, fallback = 'Non précisé') => {
  const safe = sanitizePdfText(value).trim();
  return safe || fallback;
};

const date = (value?: string | null) => {
  if (!value) return 'Non précisée';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Non précisée' : text(format(parsed, 'dd MMMM yyyy', { locale: fr }));
};

const money = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'À discuter';
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} $ CA`;
};

const Footer = () => (
  <>
    <Text style={styles.footer} fixed>BâtirNet - Appel d'offres généré à partir des informations du projet</Text>
    <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
  </>
);

const Field = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.column}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const List = ({ items, marker = '-' }: { items: string[]; marker?: string }) => (
  <>
    {items.map((item, index) => (
      <View key={`${index}-${item}`} style={styles.listItem}>
        <Text style={styles.marker}>{marker}</Text>
        <Text style={styles.listText}>{text(item)}</Text>
      </View>
    ))}
  </>
);

export const TenderPDF: React.FC<TenderPDFProps> = ({ project, client }) => {
  const requiredDocuments = project.required_documents?.length ? project.required_documents : DEFAULT_REQUIRED_DOCUMENTS;
  const certifications = (project.required_certifications || []).map((item) => CERTIFICATION_LABELS[item] || item);
  const location = [project.city, project.region, project.postal_code].map((item) => text(item, '')).filter(Boolean).join(', ') || 'Non précisée';
  const criteria = Object.entries(project.evaluation_criteria || {});

  return (
    <Document title={`Appel d'offres - ${text(project.title, 'Projet')}`} author="BâtirNet">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>APPEL D'OFFRES</Text>
        <Text style={styles.subtitle}>{text(project.title, 'Projet')}</Text>

        <Text style={styles.sectionTitle}>RÉFÉRENCE</Text>
        <View style={styles.row}>
          <Field label="Numéro d'appel d'offres" value={text(project.tender_number || project.id, project.id)} />
          <Field label="Date de publication" value={date(project.created_at)} />
        </View>
        <View style={styles.row}>
          <Field label="Date limite de soumission" value={date(project.submission_deadline)} />
          <Field label="Catégorie / type" value={text([project.category, project.project_type].filter(Boolean).join(' - '))} />
        </View>

        <Text style={styles.sectionTitle}>DONNEUR D'OUVRAGE</Text>
        <View style={styles.row}>
          <Field label="Nom / raison sociale" value={text(client.company_name || client.full_name, 'Client BâtirNet')} />
          <Field label="Personne-ressource" value={text(client.full_name || client.company_name, 'Client BâtirNet')} />
        </View>
        {(client.email || client.phone) && (
          <View style={styles.row}>
            <Field label="Courriel" value={text(client.email, 'Non communiqué')} />
            <Field label="Téléphone" value={text(client.phone, 'Non communiqué')} />
          </View>
        )}

        <Text style={styles.sectionTitle}>INFORMATIONS DU PROJET</Text>
        <View style={styles.row}>
          <Field label="Lieu des travaux" value={location} />
          <Field label="Budget estimatif" value={`${money(project.budget_min)} à ${money(project.budget_max)}`} />
        </View>
        <View style={styles.row}>
          <Field label="Début souhaité" value={date(project.project_start_date)} />
          <Field label="Fin souhaitée" value={date(project.project_end_date)} />
        </View>

        <Text style={styles.sectionTitle}>DATES IMPORTANTES</Text>
        <View style={styles.row}>
          <Field label="Visite de chantier" value={date(project.site_visit_date)} />
          <Field label="Date limite pour questions" value={date(project.questions_deadline)} />
        </View>
        <Field label="Date limite de soumission" value={date(project.submission_deadline)} />
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>DESCRIPTION DES TRAVAUX</Text>
        <Text style={styles.paragraph}>{text(project.description, 'Aucune description fournie.')}</Text>
        {project.work_description_detailed && (
          <>
            <Text style={styles.subTitle}>Description détaillée</Text>
            <Text style={styles.paragraph}>{text(project.work_description_detailed)}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>SPÉCIFICATIONS TECHNIQUES</Text>
        {project.technical_specifications?.length ? (
          <List items={project.technical_specifications.map((spec) => typeof spec === 'string' ? spec : spec.description || spec.name || 'Spécification')} />
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
                <View key={index} style={index === project.milestones!.length - 1 ? styles.tableRowLast : styles.tableRow}>
                  <Text style={styles.tableCell}>{text(milestone.name || milestone.title, 'Jalon')}</Text>
                  <Text style={styles.tableCell}>{date(milestone.date)}</Text>
                  <Text style={styles.tableCell}>{text(milestone.deliverables || milestone.description, 'À préciser')}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>EXIGENCES DU SOUMISSIONNAIRE</Text>
        <Text style={styles.subTitle}>Type d'entrepreneur recherché</Text>
        <Text style={styles.paragraph}>{text(project.preferred_entrepreneur_type ? ENTREPRENEUR_LABELS[project.preferred_entrepreneur_type] || project.preferred_entrepreneur_type : 'Aucune préférence particulière')}</Text>

        <Text style={styles.subTitle}>Certifications et accréditations</Text>
        {certifications.length ? <List items={certifications} /> : <Text style={styles.paragraph}>Aucune certification additionnelle sélectionnée.</Text>}

        <Text style={styles.subTitle}>Assurances</Text>
        {project.insurance_requirements && Object.keys(project.insurance_requirements).length ? (
          <List items={[
            project.insurance_requirements.liability !== undefined ? `Responsabilité civile : ${money(project.insurance_requirements.liability)}` : '',
            project.insurance_requirements.professional !== undefined ? `Responsabilité professionnelle : ${money(project.insurance_requirements.professional)}` : '',
          ].filter(Boolean)} />
        ) : (
          <Text style={styles.paragraph}>Selon les exigences légales applicables au projet.</Text>
        )}

        {project.licensing_requirements && Object.keys(project.licensing_requirements).length > 0 && (
          <>
            <Text style={styles.subTitle}>Licences spécifiques</Text>
            <List items={Object.values(project.licensing_requirements)} />
          </>
        )}
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>CRITÈRES D'ÉVALUATION</Text>
        {criteria.length ? (
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, { flex: 3 }]}>Critère</Text>
              <Text style={styles.tableHeader}>Pondération</Text>
            </View>
            {criteria.map(([criterion, weight], index) => (
              <View key={criterion} style={index === criteria.length - 1 ? styles.tableRowLast : styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{text(criterion)}</Text>
                <Text style={styles.tableCell}>{text(`${weight}%`)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.paragraph}>Les offres seront analysées selon leur adéquation globale avec le projet.</Text>
        )}

        <Text style={styles.sectionTitle}>DOCUMENTS REQUIS AVEC LA SOUMISSION</Text>
        <List items={requiredDocuments} marker="[ ]" />

        <Text style={styles.sectionTitle}>MODALITÉS FINANCIÈRES</Text>
        <Text style={styles.subTitle}>Mode de paiement souhaité</Text>
        <Text style={styles.paragraph}>{text(project.payment_mode ? PAYMENT_LABELS[project.payment_mode] || project.payment_mode : 'À définir entre les parties')}</Text>
        <Text style={styles.paragraph}>BâtirNet ne reçoit ni ne conserve les fonds. Le règlement est effectué directement entre le client et l'entrepreneur selon les modalités convenues au contrat.</Text>

        <Text style={styles.sectionTitle}>CONDITIONS GÉNÉRALES</Text>
        <List items={[
          "Le donneur d'ouvrage se réserve le droit d'accepter ou de refuser une soumission selon les besoins du projet.",
          "La soumission la plus basse n'est pas automatiquement retenue; l'ensemble des critères d'évaluation peut être considéré.",
          'Les travaux doivent respecter les lois, règlements, codes et normes applicables.',
          `La garantie demandée sur les travaux est de ${project.warranty_period_months || 12} mois, sauf entente contractuelle différente.`,
        ]} />

        <View style={styles.notice}>
          <Text>Pour soumettre une offre, l'entrepreneur doit utiliser le parcours de soumission BâtirNet associé à ce projet. Les informations finales du contrat sont confirmées par les deux parties avant le début des travaux.</Text>
        </View>

        <Text style={styles.sectionTitle}>PERSONNE-RESSOURCE</Text>
        <View style={styles.row}>
          <Field label="Nom" value={text(client.full_name || client.company_name, 'Client BâtirNet')} />
          <Field label="Coordonnées" value={text([client.email, client.phone].filter(Boolean).join(' - '), 'Communiquer par BâtirNet')} />
        </View>
        <Footer />
      </Page>
    </Document>
  );
};

export default TenderPDF;
