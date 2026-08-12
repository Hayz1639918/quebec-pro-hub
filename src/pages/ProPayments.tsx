import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  FileText,
  Inbox,
  Loader2,
  Info,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type PaymentStatus =
  | "pending"
  | "in_escrow"
  | "processing"
  | "succeeded"
  | "released"
  | "failed"
  | "refunded"
  | "disputed"
  | "cancelled";
type DirectMethod = "transfer" | "cheque" | "cash";

type PaymentMetadata = {
  payment_sent_by_client?: boolean;
  payment_sent_at?: string;
  payment_sent_method?: DirectMethod;
  payment_sent_note?: string | null;
  settled_offline?: boolean;
  settlement_note?: string | null;
};

interface Payment {
  id: string;
  contract_id: string | null;
  project_title: string;
  client_name: string;
  milestone: string;
  amount: number;
  net_amount: number;
  status: PaymentStatus;
  payment_method: string | null;
  released_at: string | null;
  created_at: string;
  metadata: PaymentMetadata | null;
}

const methodLabels: Record<DirectMethod, string> = {
  transfer: "Virement bancaire",
  cheque: "Chèque",
  cash: "Comptant",
};

const ProPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiveMethod, setReceiveMethod] = useState<DirectMethod>("transfer");
  const [receiveNote, setReceiveNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?mode=login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", session.user.id)
      .single();

    if (profile?.user_type !== "professional") {
      navigate("/");
      return;
    }

    await fetchPayments(session.user.id);
    setLoading(false);
  };

  const fetchPayments = async (userId: string) => {
    const { data, error } = await supabase
      .from("contractor_payments")
      .select("id, contract_id, project_title, client_name, milestone, amount, net_amount, status, payment_method, released_at, created_at, metadata")
      .eq("contractor_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger vos paiements." });
      return;
    }

    setPayments(
      (data || []).map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
        net_amount: Number(payment.net_amount),
        status: payment.status as PaymentStatus,
        metadata: (payment.metadata || {}) as PaymentMetadata,
      })),
    );
  };

  const openReceiveDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setReceiveMethod(payment.metadata?.payment_sent_method || "transfer");
    setReceiveNote("");
    setReceiveOpen(true);
  };

  const markAsReceived = async () => {
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      const rpcClient = supabase as unknown as {
        rpc: (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ error: { message?: string } | null }>;
      };
      const { error } = await rpcClient.rpc("settle_offline_payment", {
        payment_id: selectedPayment.id,
        method: receiveMethod,
        note: receiveNote.trim() || null,
      });
      if (error) throw new Error(error.message || "Impossible de confirmer la réception");

      const receivedAt = new Date().toISOString();
      setPayments((current) =>
        current.map((payment) =>
          payment.id === selectedPayment.id
            ? {
                ...payment,
                status: "released",
                payment_method: receiveMethod,
                released_at: receivedAt,
                metadata: {
                  ...(payment.metadata || {}),
                  settled_offline: true,
                  settlement_note: receiveNote.trim() || null,
                },
              }
            : payment,
        ),
      );
      setReceiveOpen(false);
      toast({
        title: "Réception confirmée",
        description: "BâtirNet a enregistré que vous avez reçu ce paiement directement du client.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de confirmer la réception";
      toast({ variant: "destructive", title: "Erreur", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const totalReceived = useMemo(
    () => payments.filter((payment) => payment.status === "released").reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );
  const totalWaiting = useMemo(
    () => payments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );
  const clientSentCount = useMemo(
    () => payments.filter((payment) => payment.status === "pending" && payment.metadata?.payment_sent_by_client).length,
    [payments],
  );

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
          <Skeleton className="h-32 mb-3" />
          <Skeleton className="h-32" />
        </main>
        <Footer />
      </div>
    );
  }

  const getFiltered = (tab: "all" | "waiting" | "sent" | "received") => {
    if (tab === "waiting") return payments.filter((p) => p.status === "pending" && !p.metadata?.payment_sent_by_client);
    if (tab === "sent") return payments.filter((p) => p.status === "pending" && p.metadata?.payment_sent_by_client);
    if (tab === "received") return payments.filter((p) => p.status === "released");
    return payments;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-5xl pt-24 flex-1">
        <Button variant="ghost" onClick={() => navigate("/pro/dashboard")} className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Tableau de bord
        </Button>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Banknote className="h-7 w-7 text-primary" />
              Paiements
            </h1>
            <p className="text-muted-foreground mt-1">Suivi des règlements reçus directement de vos clients.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/pro/invoices")}>
            <FileText className="h-4 w-4 mr-2" /> Mes factures
          </Button>
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Les paiements se font directement entre vous et le client.</p>
              <p className="text-muted-foreground mt-1">
                BâtirNet ne reçoit, ne protège et ne libère aucun fonds. Quand le client indique qu'un paiement est envoyé, vérifiez votre compte ou le moyen convenu, puis marquez-le comme reçu.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">À recevoir / confirmer</p>
              <p className="text-2xl font-bold">
                {totalWaiting.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Clients indiquent envoyé</p>
              <p className="text-2xl font-bold">{clientSentCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Réception confirmée</p>
              <p className="text-2xl font-bold">
                {totalReceived.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="waiting">À recevoir</TabsTrigger>
            <TabsTrigger value="sent">Client a envoyé</TabsTrigger>
            <TabsTrigger value="received">Reçus</TabsTrigger>
          </TabsList>

          {(["all", "waiting", "sent", "received"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {getFiltered(tab).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Inbox className="h-10 w-10 opacity-40 mx-auto mb-3" />
                    <p className="font-medium text-foreground">Aucun paiement dans cette catégorie</p>
                  </CardContent>
                </Card>
              ) : (
                getFiltered(tab).map((payment) => {
                  const sent = Boolean(payment.metadata?.payment_sent_by_client);
                  const received = payment.status === "released";
                  const problematic = ["disputed", "failed", "refunded", "cancelled"].includes(payment.status);
                  return (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{payment.milestone}</h3>
                              {received ? (
                                <Badge className="bg-success-light text-success border border-success/30">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Reçu
                                </Badge>
                              ) : sent ? (
                                <Badge variant="outline" className="border-primary/30 text-primary">
                                  <Send className="h-3 w-3 mr-1" /> Client indique envoyé
                                </Badge>
                              ) : problematic ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> À vérifier
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" /> En attente
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {payment.project_title} · {payment.client_name}
                            </p>
                            {sent && payment.metadata?.payment_sent_at && (
                              <div className="mt-3 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                                <p className="font-medium text-foreground flex items-center gap-1">
                                  <Send className="h-3 w-3" /> Déclaré envoyé par le client
                                </p>
                                <p className="mt-1">
                                  {format(new Date(payment.metadata.payment_sent_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                  {payment.metadata.payment_sent_method ? ` · ${methodLabels[payment.metadata.payment_sent_method]}` : ""}
                                </p>
                                {payment.metadata.payment_sent_note && <p className="mt-1">Note : {payment.metadata.payment_sent_note}</p>}
                              </div>
                            )}
                            {received && payment.released_at && (
                              <p className="text-xs text-success mt-2">
                                Vous avez confirmé la réception le {format(new Date(payment.released_at), "dd MMM yyyy", { locale: fr })}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">
                              {payment.amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 flex-wrap">
                          {payment.contract_id && (
                            <Button size="sm" variant="outline" onClick={() => navigate(`/contracts?contract=${payment.contract_id}`)}>
                              <FileText className="h-3 w-3 mr-1" /> Contrat
                            </Button>
                          )}
                          {payment.status === "pending" && (
                            <Button size="sm" onClick={() => openReceiveDialog(payment)}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Marquer comme reçu
                            </Button>
                          )}
                          {received && (
                            <Button size="sm" variant="outline" onClick={() => navigate("/pro/invoices")}>
                              <FileText className="h-3 w-3 mr-1" /> Facture
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmer la réception</DialogTitle>
            <DialogDescription>
              {selectedPayment && `${selectedPayment.milestone} — ${selectedPayment.amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
              Confirmez seulement après avoir vérifié que le paiement vous est réellement parvenu. BâtirNet enregistre votre confirmation, mais ne vérifie pas le transfert bancaire.
            </div>
            <div className="space-y-2">
              <Label htmlFor="receive-method">Méthode reçue</Label>
              <Select value={receiveMethod} onValueChange={(value) => setReceiveMethod(value as DirectMethod)}>
                <SelectTrigger id="receive-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Virement bancaire</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="cash">Comptant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receive-note">Note facultative</Label>
              <Textarea
                id="receive-note"
                value={receiveNote}
                onChange={(event) => setReceiveNote(event.target.value)}
                maxLength={500}
                placeholder="Ex. Virement reçu, référence 1234"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>Annuler</Button>
            <Button onClick={markAsReceived} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirmer la réception
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProPayments;
