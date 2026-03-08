import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { pdf } from "@react-pdf/renderer";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
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
  Calendar,
  Printer,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InvoicePDF, type InvoiceData } from "@/components/InvoicePDF";

// US-063 — Factures auto-générées

interface Invoice extends InvoiceData {
  id: string;
  contractor_id: string;
  status: "paid" | "pending" | "overdue";
}

const statusConfig = {
  paid:    { label: "Payée",      color: "bg-green-100 text-green-700 border-green-200" },
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700 border-amber-200" },
  overdue: { label: "En retard",  color: "bg-red-100 text-red-700 border-red-200" },
};

const ProInvoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contractorName, setContractorName] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();
      if (profile?.full_name) setContractorName(profile.full_name);
      await fetchInvoices(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchInvoices = async (uid: string) => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("contractor_id", uid)
      .order("issued_at", { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les factures" });
      return;
    }
    setInvoices((data || []) as Invoice[]);
  };

  const filtered = invoices.filter(inv =>
    inv.project_title.toLowerCase().includes(search.toLowerCase()) ||
    inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = async (inv: Invoice) => {
    setDownloading(inv.id);
    try {
      const blob = await pdf(<InvoicePDF invoice={inv} contractorName={contractorName} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF generation failed", e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de générer le PDF" });
    } finally {
      setDownloading(null);
    }
  };

  const totalPaid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + Number(i.total), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

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
                {totalPaid.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
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
                {totalPending.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
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
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                {invoices.length === 0
                  ? "Aucune facture pour l'instant. Les factures sont générées automatiquement lors de la création d'un paiement."
                  : "Aucun résultat pour cette recherche."}
              </CardContent>
            </Card>
          )}
          {filtered.map(inv => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-primary">{inv.invoice_number}</span>
                      <Badge className={statusConfig[inv.status].color}>{statusConfig[inv.status].label}</Badge>
                    </div>
                    <p className="font-medium">{inv.milestone}</p>
                    <p className="text-sm text-muted-foreground">{inv.project_title} · {inv.client_name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Émise le {format(new Date(inv.issued_at), "dd MMM yyyy", { locale: fr })}
                      </span>
                      {inv.due_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Échéance : {format(new Date(inv.due_at), "dd MMM yyyy", { locale: fr })}
                        </span>
                      )}
                      {inv.paid_at && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Payée le {format(new Date(inv.paid_at), "dd MMM yyyy", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold">
                      {Number(inv.total).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                    </p>
                    <p className="text-xs text-muted-foreground">TPS/TVQ incl.</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setPreviewInvoice(inv)}>
                    <Eye className="h-3 w-3" />
                    Aperçu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleDownload(inv)}
                    disabled={downloading === inv.id}
                  >
                    {downloading === inv.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Download className="h-3 w-3" />}
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
                  {previewInvoice.invoice_number}
                </span>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => window.print()}>
                  <Printer className="h-3 w-3" />
                  Imprimer
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 p-2" id="invoice-print">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-primary">BâtirNet</h2>
                  <p className="text-sm text-muted-foreground">Plateforme de construction Québec</p>
                  {contractorName && <p className="text-sm font-medium mt-1">{contractorName}</p>}
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold">{previewInvoice.invoice_number}</p>
                  <Badge className={statusConfig[previewInvoice.status].color}>{statusConfig[previewInvoice.status].label}</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Facturé à</p>
                  <p className="font-semibold">{previewInvoice.client_name}</p>
                  {previewInvoice.client_address && (
                    <p className="text-sm text-muted-foreground">{previewInvoice.client_address}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-8">
                      <span className="text-muted-foreground">Date d'émission</span>
                      <span>{format(new Date(previewInvoice.issued_at), "dd MMM yyyy", { locale: fr })}</span>
                    </div>
                    {previewInvoice.due_at && (
                      <div className="flex justify-between gap-8">
                        <span className="text-muted-foreground">Échéance</span>
                        <span>{format(new Date(previewInvoice.due_at), "dd MMM yyyy", { locale: fr })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

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
                      <p className="text-sm text-muted-foreground">{previewInvoice.project_title}</p>
                    </div>
                    <p className="text-right font-medium">
                      {Number(previewInvoice.amount).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="space-y-2 min-w-48">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{Number(previewInvoice.amount).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TPS/TVQ (15%)</span>
                    <span>{Number(previewInvoice.tax).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{Number(previewInvoice.total).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</span>
                  </div>
                </div>
              </div>

              <Separator />
              <p className="text-xs text-center text-muted-foreground">
                BâtirNet — Plateforme de mise en relation pour entrepreneurs du bâtiment au Québec
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPreviewInvoice(null)}>Fermer</Button>
              <Button
                onClick={() => handleDownload(previewInvoice)}
                disabled={downloading === previewInvoice.id}
                className="gap-2"
              >
                {downloading === previewInvoice.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Download className="h-4 w-4" />}
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
