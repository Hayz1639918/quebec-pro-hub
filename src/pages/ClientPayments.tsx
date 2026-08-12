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
  ChevronRight,
  Inbox,
  Loader2,
  HardHat,
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
};

interface ClientPayment {
  id: string;
  contract_id: string | null;
  contractor_id: string;
  project_title: string;
  milestone: string;
  amount: number;
  status: PaymentStatus;
  payment_method: string | null;
  released_at: string | null;
  created_at: string;
  metadata: PaymentMetadata | null;
  professional_name: string;
}

const methodLabels: Record<DirectMethod, string> = {
  transfer: "Virement bancaire",
  cheque: "Chèque",
  cash: "Comptant",
};

const ClientPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ClientPayment | null>(null);
  const [sendMethod, setSendMethod] = useState<DirectMethod>("transfer");
  const [sendNote, setSendNote] = useState("");
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

    if (profile?.user_type !== "client") {
      navigate("/");
      return;
    }

    await fetchPayments(session.user.id);
    setLoading(false);
  };

  const fetchPayments = async (userId: string) => {
    const { data: rows, error } = await supabase
      .from("contractor_payments")
      .select("id, contract_id, contractor_id, project_title, milestone, amount, status, payment_method, released_at, created_at, metadata")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos paiements.",
      });
      return;
    }

    const contractorIds = [...new Set((rows || []).map((row) => row.contractor_id))];
    const { data: pros } = contractorIds.length
      ? await supabase
          .from("public_professional_profiles")
          .select("id, full_name, company_name")
          .in("id", contractorIds)
      : { data: [] as Array<{ id: string; full_name: string; company_name: string | null }> };

    const names = new Map(
      (pros || []).map((pro) => [pro.id, pro.company_name || pro.full_name || "Entrepreneur"]),
    );

    setPayments(
      (rows || []).map((row) => ({
        ...row,
        amount: Number(row.amount),
        status: row.status as PaymentStatus,
        metadata: (row.metadata || {}) as PaymentMetadata,
        professional_name: names.get(row.contractor_id) || "Entrepreneur",
      })),
    );
  };

  const openSendDialog = (payment: ClientPayment) => {
    const metadata = payment.metadata || {};
    setSelectedPayment(payment);
    setSendMethod(metadata.payment_sent_method || "transfer");
    setSendNote(metadata.payment_sent_note || "");
    setSendOpen(true);
  };

  const markAsSent = async () => {
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      const rpcClient = supabase as unknown as {
        rpc: (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ error: { message?: string } | null }>;
      };
      const { error } = await rpcClient.rpc("mark_offline_payment_sent", {
        payment_id: selectedPayment.id,
        method: sendMethod,
        note: sendNote.trim() || null,
      });
      if (error) throw new Error(error.message || "Impossible d'enregistrer l'envoi");

      const sentAt = new Date().toISOString();
      setPayments((current) =>
        current.map((payment) =>
          payment.id === selectedPayment.id
            ? {
                ...payment,
                metadata: {
                  ...(payment.metadata || {}),
                  payment_sent_by_client: true,
                  payment_sent_at: sentAt,
                  payment_sent_method: sendMethod,
                  payment_sent_note: sendNote.trim() || null,
                },
              }
            : payment,
        ),
      );
      setSendOpen(false);
      toast({
        title: "Paiement marqué comme envoyé",
        description: "L'entrepreneur doit maintenant confirmer qu'il l'a reçu.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer l'envoi";
      toast({ variant: "destructive", title: "Erreur", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const totalReceived = useMemo(
    () => payments.filter((payment) => payment.status === "released").reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );
  const totalPending = useMemo(
    () => payments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );
  const sentWaitingCount = useMemo(
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

  const getFiltered = (tab: "all" | "pending" | "sent" | "received") => {
    if (tab === "pending") return payments.filter((p) => p.status === "pending" && !p.metadata?.payment_sent_by_client);
    if (tab === "sent") return payments.filter((p) => p.status === "pending" && p.metadata?.payment_sent_by_client);
    if (tab === "received") return payments.filter((p) => p.status === "released");
    return payments;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-5xl pt-24 flex-1">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Tableau de bord
        </Button>

        <div className="mb-6">
          <p className="tech-label-blue mb-2">Espace client · Suivi</p>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Banknote className="h-7 w-7 text-primary" />
            Mes paiements
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez les règlements effectués directement avec vos entrepreneurs.
          </p>
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">BâtirNet ne traite pas les fonds.</p>
              <p className="text-muted-foreground mt-1">
                Payez l'entrepreneur directement par virement, chèque ou comptant. Ensuite, marquez le paiement comme envoyé; l'entrepreneur confirmera sa réception dans BâtirNet.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">À régler / confirmer</p>
              <p className="text-2xl font-bold">
                {totalPending.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Envoyés, en attente</p>
              <p className="text-2xl font-bold">{sentWaitingCount}</p>
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
            <TabsTrigger value="pending">À régler</TabsTrigger>
            <TabsTrigger value="sent">Envoyés</TabsTrigger>
            <TabsTrigger value="received">Reçus</TabsTrigger>
          </TabsList>

          {(["all", "pending", "sent", "received"] as const).map((tab) => (
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
                                  <Send className="h-3 w-3 mr-1" /> Envoyé
                                </Badge>
                              ) : problematic ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> À vérifier
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" /> À régler
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                              <HardHat className="h-3 w-3" />
                              {payment.professional_name}
                              <span>·</span>
                              {payment.project_title}
                            </p>
                            {sent && payment.metadata?.payment_sent_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Envoyé le {format(new Date(payment.metadata.payment_sent_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                {payment.metadata.payment_sent_method ? ` · ${methodLabels[payment.metadata.payment_sent_method]}` : ""}
                              </p>
                            )}
                            {sent && payment.metadata?.payment_sent_note && (
                              <p className="text-xs text-muted-foreground mt-1">Note : {payment.metadata.payment_sent_note}</p>
                            )}
                            {received && payment.released_at && (
                              <p className="text-xs text-success mt-2">
                                Réception confirmée le {format(new Date(payment.released_at), "dd MMM yyyy", { locale: fr })}
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/contracts?contract=${payment.contract_id}`)}
                            >
                              <FileText className="h-3 w-3 mr-1" /> Contrat <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                          {payment.status === "pending" && (
                            <Button size="sm" onClick={() => openSendDialog(payment)}>
                              <Send className="h-3 w-3 mr-1" />
                              {sent ? "Modifier l'envoi" : "Marquer comme envoyé"}
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

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Marquer le paiement comme envoyé</DialogTitle>
            <DialogDescription>
              {selectedPayment && `${selectedPayment.milestone} — ${selectedPayment.amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
              Cette action enregistre uniquement votre déclaration dans BâtirNet. Elle n'effectue aucun transfert bancaire.
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-method">Méthode utilisée</Label>
              <Select value={sendMethod} onValueChange={(value) => setSendMethod(value as DirectMethod)}>
                <SelectTrigger id="send-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Virement bancaire</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="cash">Comptant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-note">Note facultative</Label>
              <Textarea
                id="send-note"
                value={sendNote}
                onChange={(event) => setSendNote(event.target.value)}
                maxLength={500}
                placeholder="Ex. Virement envoyé le 11 août, référence 1234"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Annuler</Button>
            <Button onClick={markAsSent} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Confirmer l'envoi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ClientPayments;
