import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  CreditCard,
  Building2,
  Download,
  Flag,
  FileText,
  ChevronRight,
  Inbox,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type PaymentStatus = "pending" | "in_escrow" | "released" | "disputed" | "cancelled";
type PaymentMethod = "card" | "transfer" | "crypto" | "cheque" | "cash";
type OfflineMethod = "transfer" | "cheque" | "cash";
type DisputeReason = "non_payment" | "partial" | "wrong_amount" | "milestone_rejected" | "other";

interface Payment {
  id: string;
  contract_id: string | null;
  contractor_id: string;
  project_title: string;
  client_name: string;
  milestone: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  dispute_reason: string | null;
  dispute_details: string | null;
  released_at: string | null;
  created_at: string;
}

const statusConfig: Record<PaymentStatus, { label: string; tone: string; icon: React.ElementType }> = {
  pending:   { label: "En attente", tone: "bg-warning-light text-warning border-warning/30",        icon: Clock },
  in_escrow: { label: "En escrow",  tone: "bg-primary/10 text-primary border-primary/30",            icon: Shield },
  released:  { label: "Versé",      tone: "bg-success-light text-success border-success/30",        icon: CheckCircle2 },
  disputed:  { label: "En litige",  tone: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
  cancelled: { label: "Annulé",     tone: "bg-muted text-muted-foreground border-border",            icon: AlertTriangle },
};

const methodMeta: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  card:     { label: "Carte",    icon: CreditCard },
  transfer: { label: "Virement", icon: Building2 },
  crypto:   { label: "Crypto",   icon: Banknote },
  cheque:   { label: "Chèque",   icon: FileText },
  cash:     { label: "Comptant", icon: Banknote },
};

const offlineMethodOptions: { value: OfflineMethod; label: string }[] = [
  { value: "transfer", label: "Virement bancaire" },
  { value: "cheque",   label: "Chèque" },
  { value: "cash",     label: "Comptant" },
];

// Maps a payment dispute reason to a dispute category (matches enum in 065)
const reasonToCategory: Record<DisputeReason, "payment" | "quality" | "delay" | "communication" | "other"> = {
  non_payment: "payment",
  partial: "payment",
  wrong_amount: "payment",
  milestone_rejected: "quality",
  other: "other",
};

const ProPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputePayment, setDisputePayment] = useState<Payment | null>(null);
  const [disputeReason, setDisputeReason] = useState<DisputeReason | "">("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settlePayment, setSettlePayment] = useState<Payment | null>(null);
  const [settleMethod, setSettleMethod] = useState<OfflineMethod>("transfer");
  const [settleNote, setSettleNote] = useState("");
  const [submittingSettle, setSubmittingSettle] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      await fetchPayments(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchPayments = async (uid: string) => {
    const { data, error } = await supabase
      .from("contractor_payments")
      .select("*")
      .eq("contractor_id", uid)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les paiements" });
      return;
    }
    setPayments((data || []) as unknown as Payment[]);
  };

  const totalPaid    = payments.filter(p => p.status === "released").reduce((s, p) => s + Number(p.net_amount), 0);
  const totalPending = payments.filter(p => ["pending", "in_escrow"].includes(p.status)).reduce((s, p) => s + Number(p.net_amount), 0);
  const totalAll     = payments.reduce((s, p) => s + Number(p.amount), 0);

  const handleDispute = async () => {
    if (!disputeReason || disputeDetails.trim().length < 20 || !disputePayment) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Sélectionnez une raison et décrivez le problème (20 caractères minimum).",
      });
      return;
    }
    if (!disputePayment.contract_id) {
      toast({
        variant: "destructive",
        title: "Contrat manquant",
        description: "Ce paiement n'est rattaché à aucun contrat — contactez le support.",
      });
      return;
    }
    setSubmittingDispute(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");

      const { error: disputeError } = await supabase.from("disputes").insert({
        contract_id: disputePayment.contract_id,
        opened_by: session.user.id,
        category: reasonToCategory[disputeReason],
        description: `[Paiement ${disputePayment.milestone}] ${disputeDetails.trim()}`,
      });
      if (disputeError) throw disputeError;

      const { error: paymentError } = await supabase
        .from("contractor_payments")
        .update({
          status: "disputed",
          dispute_reason: disputeReason,
          dispute_details: disputeDetails.trim(),
        })
        .eq("id", disputePayment.id);
      if (paymentError) throw paymentError;

      setPayments(prev => prev.map(p =>
        p.id === disputePayment.id
          ? { ...p, status: "disputed", dispute_reason: disputeReason, dispute_details: disputeDetails.trim() }
          : p
      ));
      setDisputeOpen(false);
      setDisputeReason("");
      setDisputeDetails("");
      toast({
        title: "Contestation enregistrée",
        description: "Notre équipe de médiation a été notifiée. Réponse sous 24–48h.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de soumettre la contestation";
      toast({ variant: "destructive", title: "Erreur", description: msg });
    } finally {
      setSubmittingDispute(false);
    }
  };

  const openDispute = (p: Payment) => {
    setDisputePayment(p);
    setDisputeOpen(true);
  };

  const openSettle = (p: Payment) => {
    setSettlePayment(p);
    setSettleMethod("transfer");
    setSettleNote("");
    setSettleOpen(true);
  };

  // Règlement hors plateforme : le client a payé directement (virement, chèque,
  // comptant). On enregistre le règlement sans passer par Stripe. Le trigger
  // 078 marque la facture liée comme payée.
  const handleSettleOffline = async () => {
    if (!settlePayment) return;
    setSubmittingSettle(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("contractor_payments")
        .update({
          status: "released",
          payment_method: settleMethod,
          released_at: nowIso,
          metadata: {
            settled_offline: true,
            settlement_note: settleNote.trim() || null,
            settled_at: nowIso,
          },
        })
        .eq("id", settlePayment.id);
      if (error) throw error;

      setPayments(prev => prev.map(p =>
        p.id === settlePayment.id
          ? { ...p, status: "released", payment_method: settleMethod, released_at: nowIso }
          : p
      ));
      setSettleOpen(false);
      toast({
        title: "Paiement enregistré",
        description: `Règlement « ${methodMeta[settleMethod].label} » enregistré hors plateforme. La facture est marquée payée.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible d'enregistrer le règlement";
      toast({ variant: "destructive", title: "Erreur", description: msg });
    } finally {
      setSubmittingSettle(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-5xl pt-24">
          <Skeleton className="h-9 w-64 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-12 mb-3" />
          <Skeleton className="h-28 mb-3" />
          <Skeleton className="h-28 mb-3" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-5xl pt-24">
        <Button variant="ghost" onClick={() => navigate("/pro/dashboard")} className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Tableau de bord
        </Button>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Banknote className="h-7 w-7 text-success" />
              Paiements
            </h1>
            <p className="text-muted-foreground mt-1">Suivi de vos versements et factures</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/pro/invoices")} className="gap-2">
            <FileText className="h-4 w-4" />
            Mes factures
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card className="border-success/30 bg-success-light/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wide text-success">Total versé</p>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <p className="text-2xl font-bold">
                {totalPaid.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {payments.filter(p => p.status === "released").length} versement(s)
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">En attente</p>
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">
                {totalPending.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fonds sécurisés en escrow
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total facturé</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">
                {totalAll.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sur {payments.length} jalon(s)
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
              <TabsContent key={tab} value={tab} className="space-y-3">
                {filtered.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                      <Inbox className="h-10 w-10 opacity-40" />
                      <div>
                        <p className="font-medium text-foreground">Aucun paiement</p>
                        <p className="text-sm">Cette catégorie est vide pour le moment.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filtered.map(payment => {
                    const StatusIcon = statusConfig[payment.status].icon;
                    const MethodIcon = methodMeta[payment.payment_method]?.icon ?? Building2;
                    return (
                      <Card key={payment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold">{payment.milestone}</h3>
                                <Badge className={`${statusConfig[payment.status].tone} border`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[payment.status].label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {payment.project_title} · {payment.client_name}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xl font-bold text-success">
                                {Number(payment.net_amount).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                              </p>
                              {Number(payment.fee) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Brut {Number(payment.amount).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MethodIcon className="h-3 w-3" />
                                {methodMeta[payment.payment_method]?.label ?? "—"}
                              </span>
                              <span>{format(new Date(payment.created_at), "dd MMM yyyy", { locale: fr })}</span>
                              {payment.released_at && (
                                <span className="text-success">
                                  Versé le {format(new Date(payment.released_at), "dd MMM", { locale: fr })}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {payment.status === "pending" && (
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => openSettle(payment)}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Marquer comme reçu
                                </Button>
                              )}
                              {payment.status === "in_escrow" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                                  onClick={() => openDispute(payment)}
                                >
                                  <Flag className="h-3 w-3" />
                                  Contester
                                </Button>
                              )}
                              {payment.status === "released" && (
                                <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/pro/invoices")}>
                                  <Download className="h-3 w-3" />
                                  Facture
                                </Button>
                              )}
                            </div>
                          </div>

                          {payment.status === "in_escrow" && (
                            <div className="mt-3 p-2 bg-primary/5 border border-primary/20 rounded text-xs text-primary flex items-center gap-2">
                              <Shield className="h-3 w-3 shrink-0" />
                              Fonds sécurisés en escrow — en attente de validation par {payment.client_name}
                            </div>
                          )}

                          {payment.status === "pending" && (
                            <div className="mt-3 p-2 bg-muted border border-border rounded text-xs text-muted-foreground flex items-center gap-2">
                              <Banknote className="h-3 w-3 shrink-0" />
                              Réglé directement avec le client (virement, chèque, comptant) ? Cliquez « Marquer comme reçu ».
                            </div>
                          )}

                          {payment.status === "disputed" && payment.dispute_details && (
                            <div className="mt-3 p-2 bg-destructive/5 border border-destructive/20 rounded text-xs text-destructive">
                              <p className="font-medium">Litige en cours</p>
                              <p className="text-destructive/80 mt-0.5">{payment.dispute_details}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Settings link */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Compte bancaire
            </CardTitle>
            <CardDescription>
              Configurez votre compte pour recevoir les virements une fois Stripe activé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate("/pro/bank-account")} className="gap-2">
              Gérer mon compte bancaire
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag className="h-5 w-5" />
              Contester un paiement
            </DialogTitle>
            <DialogDescription>
              {disputePayment && `Jalon « ${disputePayment.milestone} » — ${Number(disputePayment.amount).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Raison de la contestation *</Label>
              <Select value={disputeReason} onValueChange={(v) => setDisputeReason(v as DisputeReason)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_payment">Paiement non reçu</SelectItem>
                  <SelectItem value="partial">Paiement partiel</SelectItem>
                  <SelectItem value="wrong_amount">Montant incorrect</SelectItem>
                  <SelectItem value="milestone_rejected">Jalon rejeté injustement</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description détaillée * <span className="text-xs text-muted-foreground">(20 caractères minimum)</span></Label>
              <Textarea
                value={disputeDetails}
                onChange={e => setDisputeDetails(e.target.value)}
                placeholder="Décrivez le problème en détail, dates, échanges, preuves..."
                rows={4}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{disputeDetails.length} / 2000</p>
            </div>
            <div className="p-3 bg-warning-light border border-warning/30 rounded text-xs text-warning flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Notre équipe de médiation examinera votre contestation sous 24–48h. Les fonds restent bloqués pendant la résolution.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDispute} disabled={submittingDispute} className="gap-2">
              {submittingDispute ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
              Soumettre la contestation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Marquer comme reçu (hors plateforme)
            </DialogTitle>
            <DialogDescription>
              {settlePayment && `Jalon « ${settlePayment.milestone} » — ${Number(settlePayment.amount).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted border border-border rounded text-xs text-muted-foreground">
              Utilisez ceci si le client vous a payé directement, sans passer par
              Stripe. BâtirNet enregistre le règlement et marque la facture comme payée.
            </div>
            <div className="space-y-2">
              <Label>Mode de règlement *</Label>
              <Select value={settleMethod} onValueChange={(v) => setSettleMethod(v as OfflineMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {offlineMethodOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (facultatif) <span className="text-xs text-muted-foreground">— n° de chèque, référence virement…</span></Label>
              <Textarea
                value={settleNote}
                onChange={e => setSettleNote(e.target.value)}
                placeholder="Ex. Chèque n°142, encaissé le 12 juin"
                rows={2}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleOpen(false)}>Annuler</Button>
            <Button onClick={handleSettleOffline} disabled={submittingSettle} className="gap-2">
              {submittingSettle ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmer le règlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProPayments;
