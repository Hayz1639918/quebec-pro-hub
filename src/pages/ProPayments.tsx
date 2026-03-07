import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  Bitcoin,
  CreditCard,
  Building2,
  Download,
  Flag,
  FileText,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";

// US-061, US-064 — Paiements & Contestation

type PaymentStatus = "pending" | "in_escrow" | "released" | "disputed" | "cancelled";
type PaymentMethod = "card" | "transfer" | "crypto";

interface Payment {
  id: string;
  projectTitle: string;
  clientName: string;
  milestone: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  requestedAt: Date;
  releasedAt?: Date;
  description: string;
}

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "p1",
    projectTitle: "Rénovation cuisine Tremblay",
    clientName: "Marie Tremblay",
    milestone: "Démolition et préparation — Jalon 1",
    amount: 4500,
    fee: 225,
    netAmount: 4275,
    status: "released",
    method: "transfer",
    requestedAt: subDays(new Date(), 15),
    releasedAt: subDays(new Date(), 13),
    description: "Premier jalon — démolition complète",
  },
  {
    id: "p2",
    projectTitle: "Rénovation cuisine Tremblay",
    clientName: "Marie Tremblay",
    milestone: "Installation cabinets — Jalon 2",
    amount: 6200,
    fee: 310,
    netAmount: 5890,
    status: "in_escrow",
    method: "card",
    requestedAt: subDays(new Date(), 3),
    description: "Installation armoires et comptoirs",
  },
  {
    id: "p3",
    projectTitle: "Toiture Gagnon",
    clientName: "Jean Gagnon",
    milestone: "Travaux complets — Paiement final",
    amount: 12000,
    fee: 600,
    netAmount: 11400,
    status: "pending",
    method: "transfer",
    requestedAt: subDays(new Date(), 1),
    description: "Remplacement complet de la toiture",
  },
  {
    id: "p4",
    projectTitle: "Extension maison Côté",
    clientName: "Sophie Côté",
    milestone: "Fondations — Jalon 1",
    amount: 8500,
    fee: 425,
    netAmount: 8075,
    status: "disputed",
    method: "transfer",
    requestedAt: subDays(new Date(), 10),
    description: "Coulage des fondations",
  },
];

const statusConfig: Record<PaymentStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: "En attente", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  in_escrow:  { label: "En escrow", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Shield },
  released:   { label: "Versé", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  disputed:   { label: "En litige", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
  cancelled:  { label: "Annulé", color: "bg-gray-100 text-gray-700 border-gray-200", icon: AlertTriangle },
};

const methodIcons: Record<PaymentMethod, React.ElementType> = {
  card: CreditCard,
  transfer: Building2,
  crypto: Bitcoin,
};

const ProPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputePayment, setDisputePayment] = useState<Payment | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const totalPaid = payments.filter(p => p.status === "released").reduce((s, p) => s + p.netAmount, 0);
  const totalPending = payments.filter(p => ["pending", "in_escrow"].includes(p.status)).reduce((s, p) => s + p.netAmount, 0);
  const totalFees = payments.reduce((s, p) => s + p.fee, 0);

  const handleDispute = async () => {
    if (!disputeReason || !disputeDetails) {
      toast({ variant: "destructive", title: "Champs requis", description: "Veuillez sélectionner une raison et décrire le problème." });
      return;
    }
    setSubmittingDispute(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmittingDispute(false);
    setDisputeOpen(false);
    setDisputeReason(""); setDisputeDetails("");
    toast({
      title: "Contestation soumise",
      description: "Notre équipe de médiation a été notifiée. Vous recevrez une réponse sous 48h.",
    });
  };

  const openDispute = (p: Payment) => {
    setDisputePayment(p);
    setDisputeOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/pro/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tableau de bord
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Mes paiements
            </h1>
            <p className="text-muted-foreground mt-1">Suivi de vos versements par jalons</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/pro/invoices")} className="gap-2">
            <FileText className="h-4 w-4" />
            Mes factures
          </Button>
        </div>

        {/* Revenue summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700">Total versé</p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {totalPaid.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">En attente / Escrow</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {totalPending.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Frais plateforme (5%)</p>
              </div>
              <p className="text-2xl font-bold text-muted-foreground">
                {totalFees.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tous">
          <TabsList className="mb-4">
            <TabsTrigger value="tous">Tous</TabsTrigger>
            <TabsTrigger value="en-attente">En attente</TabsTrigger>
            <TabsTrigger value="verses">Versés</TabsTrigger>
            <TabsTrigger value="litiges">Litiges</TabsTrigger>
          </TabsList>

          {(["tous", "en-attente", "verses", "litiges"] as const).map(tab => {
            const filtered = tab === "tous" ? payments
              : tab === "en-attente" ? payments.filter(p => ["pending", "in_escrow"].includes(p.status))
              : tab === "verses" ? payments.filter(p => p.status === "released")
              : payments.filter(p => p.status === "disputed");

            return (
              <TabsContent key={tab} value={tab}>
                <div className="space-y-3">
                  {filtered.length === 0 && (
                    <Card><CardContent className="py-10 text-center text-muted-foreground">Aucun paiement dans cette catégorie.</CardContent></Card>
                  )}
                  {filtered.map(payment => {
                    const StatusIcon = statusConfig[payment.status].icon;
                    const MethodIcon = methodIcons[payment.method];
                    return (
                      <Card key={payment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold">{payment.milestone}</h3>
                                <Badge className={statusConfig[payment.status].color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[payment.status].label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{payment.projectTitle} · {payment.clientName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{payment.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xl font-bold text-green-700">
                                {payment.netAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Brut: {payment.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                              </p>
                              <p className="text-xs text-red-500">Frais: −{payment.fee.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MethodIcon className="h-3 w-3" />
                                {payment.method === 'card' ? 'Carte' : payment.method === 'transfer' ? 'Virement' : 'Crypto'}
                              </span>
                              <span>{format(payment.requestedAt, 'dd MMM yyyy', { locale: fr })}</span>
                              {payment.releasedAt && (
                                <span className="text-green-600">Versé le {format(payment.releasedAt, 'dd MMM', { locale: fr })}</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {payment.status === "in_escrow" && (
                                <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => openDispute(payment)}>
                                  <Flag className="h-3 w-3" />
                                  Contester
                                </Button>
                              )}
                              {payment.status === "released" && (
                                <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate('/pro/invoices')}>
                                  <Download className="h-3 w-3" />
                                  Facture
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Escrow info */}
                          {payment.status === "in_escrow" && (
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-center gap-2">
                              <Shield className="h-3 w-3 shrink-0" />
                              Fonds sécurisés en escrow — En attente de validation par le client ({payment.clientName})
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Payment methods info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Méthodes de paiement acceptées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <CreditCard className="h-8 w-8 text-blue-600 shrink-0" />
                <div>
                  <p className="font-medium">Carte bancaire</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Building2 className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-medium">Virement bancaire</p>
                  <p className="text-xs text-muted-foreground">Interac, EFT, Wire</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Bitcoin className="h-8 w-8 text-amber-500 shrink-0" />
                <div>
                  <p className="font-medium">Crypto</p>
                  <p className="text-xs text-muted-foreground">Bitcoin, Ethereum, USDC</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Mettez à jour votre compte bancaire pour recevoir les virements</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/pro/bank-account')} className="gap-1">
                <ChevronRight className="h-3 w-3" />
                Compte bancaire
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* US-064 — Dispute dialog */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Flag className="h-5 w-5" />
              Contester un paiement
            </DialogTitle>
            <DialogDescription>
              {disputePayment && `Paiement : ${disputePayment.milestone} — ${disputePayment.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Raison de la contestation *</Label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_payment">Paiement non reçu</SelectItem>
                  <SelectItem value="partial">Paiement partiel</SelectItem>
                  <SelectItem value="wrong_amount">Montant incorrect</SelectItem>
                  <SelectItem value="milestone_rejected">Jalon rejeté injustement</SelectItem>
                  <SelectItem value="other">Autre raison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description détaillée *</Label>
              <Textarea
                value={disputeDetails}
                onChange={e => setDisputeDetails(e.target.value)}
                placeholder="Décrivez le problème en détail. Toute preuve (photos, messages) sera utile..."
                rows={4}
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Notre équipe de médiation examinera votre contestation sous 24-48h. Les fonds resteront bloqués en escrow pendant la résolution.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDispute} disabled={submittingDispute} className="gap-2">
              {submittingDispute ? 'Envoi...' : <><Flag className="h-4 w-4" /> Soumettre la contestation</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProPayments;
