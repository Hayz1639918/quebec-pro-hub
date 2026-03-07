import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  FileText,
  Download,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  Printer,
} from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

// US-063 — Factures auto-générées

interface Invoice {
  id: string;
  invoiceNumber: string;
  projectTitle: string;
  clientName: string;
  clientAddress: string;
  milestone: string;
  amount: number;
  tax: number;
  total: number;
  status: "paid" | "pending" | "overdue";
  issuedAt: Date;
  dueAt: Date;
  paidAt?: Date;
  paymentMethod?: string;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv1",
    invoiceNumber: "FAC-2026-0042",
    projectTitle: "Rénovation cuisine Tremblay",
    clientName: "Marie Tremblay",
    clientAddress: "456 Rue Saint-Denis, Montréal, QC H2J 2L2",
    milestone: "Jalon 1 — Démolition et préparation",
    amount: 4500,
    tax: 675,
    total: 5175,
    status: "paid",
    issuedAt: subDays(new Date(), 15),
    dueAt: subDays(new Date(), 5),
    paidAt: subDays(new Date(), 13),
    paymentMethod: "Virement bancaire",
  },
  {
    id: "inv2",
    invoiceNumber: "FAC-2026-0043",
    projectTitle: "Rénovation cuisine Tremblay",
    clientName: "Marie Tremblay",
    clientAddress: "456 Rue Saint-Denis, Montréal, QC H2J 2L2",
    milestone: "Jalon 2 — Installation armoires",
    amount: 6200,
    tax: 930,
    total: 7130,
    status: "pending",
    issuedAt: subDays(new Date(), 3),
    dueAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: "inv3",
    invoiceNumber: "FAC-2026-0038",
    projectTitle: "Toiture Gagnon",
    clientName: "Jean Gagnon",
    clientAddress: "123 Boulevard Industriel, Laval, QC H7P 1H7",
    milestone: "Travaux complets — Paiement final",
    amount: 12000,
    tax: 1800,
    total: 13800,
    status: "pending",
    issuedAt: subDays(new Date(), 1),
    dueAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
  },
  {
    id: "inv4",
    invoiceNumber: "FAC-2025-0031",
    projectTitle: "Extension maison Côté",
    clientName: "Sophie Côté",
    clientAddress: "789 Avenue des Pins, Québec, QC G1R 2J5",
    milestone: "Fondations — Jalon 1",
    amount: 8500,
    tax: 1275,
    total: 9775,
    status: "paid",
    issuedAt: subMonths(new Date(), 2),
    dueAt: subMonths(new Date(), 1),
    paidAt: subMonths(new Date(), 2).setDate(subMonths(new Date(), 2).getDate() + 5) as unknown as Date,
    paymentMethod: "Carte bancaire",
  },
];

const statusConfig = {
  paid:    { label: "Payée",      color: "bg-green-100 text-green-700 border-green-200" },
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700 border-amber-200" },
  overdue: { label: "En retard",  color: "bg-red-100 text-red-700 border-red-200" },
};

const ProInvoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [search, setSearch] = useState("");
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const filtered = invoices.filter(inv =>
    inv.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (inv: Invoice) => {
    toast({ title: `Téléchargement : ${inv.invoiceNumber}`, description: "Génération du PDF en cours..." });
    // In production: call @react-pdf/renderer to generate PDF
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/pro/payments")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Paiements
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Mes factures
            </h1>
            <p className="text-muted-foreground mt-1">Factures générées automatiquement pour chaque jalon</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700">Total facturé & payé</p>
              </div>
              <p className="text-xl font-bold text-green-900">
                {totalPaid.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-700">En attente de paiement</p>
              </div>
              <p className="text-xl font-bold text-amber-900">
                {totalPending.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher par numéro, projet ou client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Invoice list */}
        <div className="space-y-3">
          {filtered.map(inv => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-primary">{inv.invoiceNumber}</span>
                      <Badge className={statusConfig[inv.status].color}>{statusConfig[inv.status].label}</Badge>
                    </div>
                    <p className="font-medium">{inv.milestone}</p>
                    <p className="text-sm text-muted-foreground">{inv.projectTitle} · {inv.clientName}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Émise le {format(inv.issuedAt, 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Échéance : {format(inv.dueAt, 'dd MMM yyyy', { locale: fr })}
                      </span>
                      {inv.paidAt && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Payée le {format(inv.paidAt, 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold">
                      {inv.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      TPS/TVQ incl.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setPreviewInvoice(inv)}>
                    <Eye className="h-3 w-3" />
                    Aperçu
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDownload(inv)}>
                    <Download className="h-3 w-3" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoice preview dialog */}
      {previewInvoice && (
        <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {previewInvoice.invoiceNumber}
                </span>
                <Button size="sm" variant="outline" className="gap-1" onClick={handlePrint}>
                  <Printer className="h-3 w-3" />
                  Imprimer
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-2" id="invoice-print">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-primary">BâtirNet</h2>
                  <p className="text-sm text-muted-foreground">Plateforme de construction Québec</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold">{previewInvoice.invoiceNumber}</p>
                  <Badge className={statusConfig[previewInvoice.status].color}>{statusConfig[previewInvoice.status].label}</Badge>
                </div>
              </div>

              <Separator />

              {/* Client info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Facturé à</p>
                  <p className="font-semibold">{previewInvoice.clientName}</p>
                  <p className="text-sm text-muted-foreground">{previewInvoice.clientAddress}</p>
                </div>
                <div className="text-right">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-8">
                      <span className="text-muted-foreground">Date d'émission</span>
                      <span>{format(previewInvoice.issuedAt, 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-muted-foreground">Échéance</span>
                      <span>{format(previewInvoice.dueAt, 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Line items */}
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-3">Détail des services</p>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-50 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <span className="col-span-2">Description</span>
                    <span className="text-right">Montant</span>
                  </div>
                  <div className="grid grid-cols-3 px-4 py-3 border-t">
                    <div className="col-span-2">
                      <p className="font-medium">{previewInvoice.milestone}</p>
                      <p className="text-sm text-muted-foreground">{previewInvoice.projectTitle}</p>
                    </div>
                    <p className="text-right font-medium">
                      {previewInvoice.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="space-y-2 min-w-48">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{previewInvoice.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TPS/TVQ (15%)</span>
                    <span>{previewInvoice.tax.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{previewInvoice.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  {previewInvoice.paymentMethod && (
                    <p className="text-xs text-green-600 text-right">Payé par {previewInvoice.paymentMethod}</p>
                  )}
                </div>
              </div>

              <Separator />

              <p className="text-xs text-center text-muted-foreground">
                BâtirNet — Plateforme de mise en relation pour entrepreneurs du bâtiment au Québec<br />
                Merci de votre confiance !
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPreviewInvoice(null)}>Fermer</Button>
              <Button onClick={() => handleDownload(previewInvoice)} className="gap-2">
                <Download className="h-4 w-4" />
                Télécharger PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
};

export default ProInvoices;
