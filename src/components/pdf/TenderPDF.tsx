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

// Styles professionnels et épurés
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    lineHeight: 1.5,
    backgroundColor: '#ffffff',
  },
  // En-tête
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: '#2563eb',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  // Titre principal
  mainTitle: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 5,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 25,
    color: '#6b7280',
  },
  // Sections
  sectionHeader: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 4,
  },
  sectionHeaderText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  // Champs
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#374151',
    width: 140,
  },
  fieldValue: {
    flex: 1,
    fontSize: 10,
    color: '#1f2937',
  },
  // Description
  descriptionBox: {
    backgroundColor: '#f9fafb',
    border: '1 solid #e5e7eb',
    borderRadius: 4,
    padding: 12,
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.6,
  },
  // Budget
  budgetBox: {
    backgroundColor: '#ecfdf5',
    border: '1 solid #a7f3d0',
    borderRadius: 4,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  budgetItem: {
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#059669',
  },
  // Info box
  infoBox: {
    backgroundColor: '#eff6ff',
    border: '1 solid #bfdbfe',
    borderRadius: 4,
    padding: 12,
    marginTop: 15,
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 9,
    color: '#3b82f6',
  },
  // Pied de page
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 8,
    color: '#9ca3af',
  },
  // Date encadrée
  dateHighlight: {
    backgroundColor: '#fef3c7',
    border: '1 solid #fcd34d',
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 9,
    color: '#92400e',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#b45309',
  },
});

interface TenderPDFProps {
  project: any;
  client: any;
}

export const TenderPDF: React.FC<TenderPDFProps> = ({ project, client }) => {
  const formatDate = (date: string | null) => {
    if (!date) return 'Non spécifiée';
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return 'Non spécifiée';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'À discuter';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLocation = () => {
    const parts = [];
    if (project.city) parts.push(project.city);
    if (project.region) parts.push(project.region);
    if (project.postal_code) parts.push(project.postal_code);
    return parts.length > 0 ? parts.join(', ') : 'Non spécifiée';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.logo}>BâtirNet</Text>
          <Text style={styles.headerSubtitle}>Plateforme de mise en relation professionnelle</Text>
        </View>

        {/* Titre */}
        <Text style={styles.mainTitle}>APPEL D'OFFRES</Text>
        <Text style={styles.subtitle}>Document de présentation du projet</Text>

        {/* SECTION: INFORMATIONS DU CLIENT */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Donneur d'ouvrage</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom / Entreprise :</Text>
            <Text style={styles.fieldValue}>{client?.company_name || client?.full_name || 'Non spécifié'}</Text>
          </View>
          {client?.email && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Courriel :</Text>
              <Text style={styles.fieldValue}>{client.email}</Text>
            </View>
          )}
          {client?.phone && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Téléphone :</Text>
              <Text style={styles.fieldValue}>{client.phone}</Text>
            </View>
          )}
        </View>

        {/* SECTION: DÉTAILS DU PROJET */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Détails du projet</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Titre du projet :</Text>
            <Text style={styles.fieldValue}>{project.title || 'Sans titre'}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Catégorie :</Text>
            <Text style={styles.fieldValue}>{project.category || 'Non spécifiée'}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Localisation :</Text>
            <Text style={styles.fieldValue}>{getLocation()}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Date de publication :</Text>
            <Text style={styles.fieldValue}>{formatDate(project.created_at)}</Text>
          </View>
        </View>

        {/* Date limite */}
        {project.deadline && (
          <View style={styles.dateHighlight}>
            <Text style={styles.dateLabel}>DATE LIMITE SOUHAITÉE</Text>
            <Text style={styles.dateValue}>{formatDate(project.deadline)}</Text>
          </View>
        )}

        {/* SECTION: BUDGET */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Budget estimatif</Text>
        </View>
        <View style={styles.budgetBox}>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>MINIMUM</Text>
            <Text style={styles.budgetValue}>{formatCurrency(project.budget_min)}</Text>
          </View>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>MAXIMUM</Text>
            <Text style={styles.budgetValue}>{formatCurrency(project.budget_max)}</Text>
          </View>
        </View>

        {/* SECTION: DESCRIPTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Description des travaux</Text>
        </View>
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>
            {project.description || 'Aucune description fournie.'}
          </Text>
        </View>

        {/* Note d'information */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 Comment soumettre votre offre ?</Text>
          <Text style={styles.infoText}>
            Pour soumettre votre proposition, connectez-vous sur BâtirNet et accédez à ce projet 
            depuis la marketplace. Vous pourrez y envoyer votre devis détaillé et contacter 
            directement le client via la messagerie intégrée.
          </Text>
        </View>

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Document généré sur BâtirNet - {formatDate(new Date().toISOString())}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} / ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
};

export default TenderPDF;
