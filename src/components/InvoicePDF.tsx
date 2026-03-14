import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Invoice data shape (subset of what ProInvoices uses)
export interface InvoiceData {
  invoice_number: string;
  client_name: string;
  client_address?: string | null;
  project_title: string;
  milestone: string;
  amount: number;
  tax: number;
  total: number;
  payment_method?: string | null;
  issued_at: string;
  due_at?: string | null;
  paid_at?: string | null;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 48,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  brand: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
  },
  brandSub: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: "#6b7280",
  },
  value: {
    fontFamily: "Helvetica-Bold",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginVertical: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "6 8",
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "6 8",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  col60: { width: "60%" },
  col20: { width: "20%", textAlign: "right" },
  colHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 8,
  },
  totalLabel: {
    width: 120,
    textAlign: "right",
    color: "#6b7280",
  },
  totalValue: {
    width: 80,
    textAlign: "right",
  },
  grandTotal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#16a34a",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#9ca3af",
    fontSize: 8,
  },
});

const fmt = (n: number) =>
  n.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-CA", { day: "2-digit", month: "long", year: "numeric" });
};

interface Props {
  invoice: InvoiceData;
  contractorName?: string;
}

export const InvoicePDF = ({ invoice, contractorName = "Entrepreneur" }: Props) => (
  <Document title={`Facture ${invoice.invoice_number}`}>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>BâtirNet</Text>
          <Text style={styles.brandSub}>Plateforme de construction Québec</Text>
          <Text style={[styles.brandSub, { marginTop: 8 }]}>{contractorName}</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>FACTURE</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          <Text style={[styles.invoiceNumber, { marginTop: 4 }]}>
            Émise le : {fmtDate(invoice.issued_at)}
          </Text>
          {invoice.due_at && (
            <Text style={styles.invoiceNumber}>Échéance : {fmtDate(invoice.due_at)}</Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Client info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facturer à</Text>
        <Text style={styles.value}>{invoice.client_name}</Text>
        {invoice.client_address && (
          <Text style={styles.label}>{invoice.client_address}</Text>
        )}
      </View>

      {/* Project info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Projet</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Projet :</Text>
          <Text style={styles.value}>{invoice.project_title}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Jalon :</Text>
          <Text>{invoice.milestone}</Text>
        </View>
        {invoice.payment_method && (
          <View style={styles.row}>
            <Text style={styles.label}>Mode de paiement :</Text>
            <Text>{invoice.payment_method === "card" ? "Carte bancaire" : invoice.payment_method === "transfer" ? "Virement" : "Crypto"}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* Line items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détail</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.col60, styles.colHeader]}>Description</Text>
          <Text style={[styles.col20, styles.colHeader]}>Montant</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col60}>{invoice.milestone}</Text>
          <Text style={styles.col20}>{fmt(invoice.amount)}</Text>
        </View>
      </View>

      {/* Totals */}
      <View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Sous-total</Text>
          <Text style={styles.totalValue}>{fmt(invoice.amount)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TPS + TVQ (15%)</Text>
          <Text style={styles.totalValue}>{fmt(invoice.tax)}</Text>
        </View>
        <View style={[styles.divider, { marginVertical: 8 }]} />
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, styles.grandTotal]}>TOTAL</Text>
          <Text style={[styles.totalValue, styles.grandTotal]}>{fmt(invoice.total)}</Text>
        </View>
        {invoice.paid_at && (
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={[styles.totalLabel, { color: "#16a34a" }]}>Payé le</Text>
            <Text style={[styles.totalValue, { color: "#16a34a" }]}>{fmtDate(invoice.paid_at)}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>BâtirNet — plateforme.batirnet.ca</Text>
        <Text>Merci pour votre confiance</Text>
        <Text>{invoice.invoice_number}</Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePDF;
