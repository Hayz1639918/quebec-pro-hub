import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  FileText,
  ChevronRight,
  Inbox,
  Loader2,
  HardHat,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createCheckoutSession, isStripeConfigured } from "@/services/stripe-service";

type PaymentStatus = "pending" | "in_escrow" | "released" | "disputed" | "cancelled";
type PaymentMethod = "card" | "transfer" | "crypto" | "cheque" | "cash";
type PaymentHandling = "platform" | "offline";

interface ClientPaymentRow {
  id: string;
  contract_id: string | null;
  contractor_id: string;
  milestone_id: string | null;
  project_title: string;
  milestone: string;
  amount: number;
  net_amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  released_at: string | null;
  created_at: string;
}

interface EnrichedPayment extends ClientPaymentRow {
  professional_name: string;
  payment_handling: PaymentHandling;
  invoice_number: string | null;
}

const statusConfig: Record<PaymentStatus, { label: string; tone: string; icon: React.ElementType }> = {
  pending:   { label: "À payer",    tone: "bg-warning-light text-warning border-warning/30",        icon: Clock },
  in_escrow: { label: "En escrow",  tone: "bg-primary/10 text-primary border-primary/30",            icon: Shield },
  released:  { label: "Payé",       tone: "bg-success-light text-success border-success/30",        icon: CheckCircle2 },
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

const handlingMeta: Record<PaymentHandling, { label: string; tone: string }> = {
  platform: { label: "Via plateforme",  tone: "bg-primary/10 text-primary border-primary/30" },
  offline:  { label: "Hors plateforme", tone: "bg-muted text-foreground border-border" },
};

const ClientPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<EnrichedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?mode=login"); return; }
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();
      if (prof?.user_type !== "client") { navigate("/"); return; }
      await fetchPayments(session.user.id);
      setLoading(false);
    })();
  }, [navigate]);

  const fetchPayments = async (uid: string) => {
    const { data: rows, error } = await supabase
      .from("contractor_payments")
      .select("*")
      .eq("client_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger vos paiements" });
      return;
    }

    const raw = (rows || []) as unknown as ClientPaymentRow[];
    const contractIds = [...new Set(raw.map(p => p.contract_id).filter(Boolean))] as string[];
    const contractorIds = [...new Set(raw.map(p => p.contractor_id))];

    const [contractsRes, profilesRes, invoicesRes] = await Promise.all([
      contractIds.length
        ? supabase.from("contracts").select("id, payment_handling").in("id", contractIds)
        : Promise.resolve({ data: [] as { id: string; payment_handling: string }[] }),
      supabase.from("profiles").select("id, full_name, company_name").in("id", contractorIds),
      supabase.from("invoices").select("milestone_id, invoice_number").eq("client_id", uid),
    ]);

    const contractMap = new Map(
      (contractsRes.data || []).map(c => [c.id, (c.payment_handling as PaymentHandling) || "platform"])
    );
    const profileMap = new Map(
      (profilesRes.data || []).map(p => [p.id, p.company_name || p.full_name || "Entrepreneur"])
    );
    const invoiceMap = new Map(
      (invoicesRes.data || []).map(i => [i.milestone_id, i.invoice_number])
    );

    setPayments(raw.map(p => ({
      ...p,
      professional_name: profileMap.get(p.contractor_id) || "Entrepreneur",
      payment_handling: p.contract_id ? (contractMap.get(p.contract_id) || "platform") : "platform",
      invoice_number: p.milestone_id ? (invoiceMap.get(p.milestone_id) ?? null) : null,
    })));
  };

  const totalPaid = payments
    .filter(p => p.status === "released")
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalDue = payments
    .filter(p => ["pending", "in_escrow"].includes(p.status))
    .reduce((s, p) => s + Number(p.amount), 0);
  const pendingCount = payments.filter(p => ["pending", "in_escrow"].includes(p.status)).length;

  const handlePayOnline = async (payment: EnrichedPayment) => {
    if (!payment.contract_id) {
      toast({ variant: "destructive", title: "Erreur", description: "Contrat introuvable pour ce paiement." });
      return;
    }
    if (!isStripeConfigured()) {
      toast({
        title: "Stripe bientôt disponible",
        description: "Le paiement en ligne sécurisé sera activé dès réception des clés Stripe.",
      });
      return;
    }
    setPayingId(payment.id);
    try {
      await createCheckoutSession({
        milestoneId: payment.milestone_id || payment.id,
        contractId: payment.contract_id,
        amount: Number(payment.amount),
        description: `${payment.milestone} — ${payment.project_title}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Paiement indisponible";
      toast({ variant: "destructive", title: "Erreur", description: msg });
    } finally {
      setPayingId(null);
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
          <Skeleton className="h-28 mb-3" />
          <Skeleton className="h-28" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-5xl pt-24">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Tableau de bord
        </Button>

        <div className="mb-6">
          <p className="tech-label-blue mb-2">Espace client · Finances</p>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Banknote className="h-7 w-7 text-primary" />
            Mes paiements
          </h1>
          <p className="text-muted-foreground mt-1">
            Factures et versements liés à vos contrats de construction
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card className="card-accent border-warning/30 bg-warning-light/30">
            <CardContent className="p-4">
              <p className="tech-label mb-2">À régler</p>
              <p className="text-2xl font-bold">
                {totalDue.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{pendingCount} paiement(s) en attente</p>
            </CardContent>
          </Card>
          <Card className="card-accent border-success/30 bg-success-light/30">
            <CardContent className="p-4">
              <p className="tech-label mb-2">Total payé</p>
              <p className="text-2xl font-bold">
                {totalPaid.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {payments.filter(p => p.status === "released").length} versement(s) confirmé(s)
              </p>
            </CardContent>
          </Card>
          <Card className="card-accent">
            <CardContent className="p-4">
              <p className="tech-label mb-2">Jalons facturés</p>
              <p className="text-2xl font-bold">{payments.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Sur l'ensemble de vos projets</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tous">
          <TabsList className="mb-4">
            <TabsTrigger value="tous">Tous</TabsTrigger>
            <TabsTrigger value="a-payer">À payer</TabsTrigger>
            <TabsTrigger value="payes">Payés</TabsTrigger>
          </TabsList>

          {(["tous", "a-payer", "payes"] as const).map(tab => {
            const filtered = tab === "tous" ? payments
              : tab === "a-payer" ? payments.filter(p => ["pending", "in_escrow"].includes(p.status))
              : payments.filter(p => p.status === "released");

            return (
              <TabsContent key={tab} value={tab} className="space-y-3">
                {filtered.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                      <Inbox className="h-10 w-10 opacity-40" />
                      <div>
                        <p className="font-medium text-foreground">Aucun paiement</p>
                        <p className="text-sm">Les factures apparaîtront ici après validation d'un jalon.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filtered.map(payment => {
                    const StatusIcon = statusConfig[payment.status].icon;
                    const MethodIcon = methodMeta[payment.payment_method]?.icon ?? Building2;
                    const isPending = ["pending", "in_escrow"].includes(payment.status);
                    const isPlatform = payment.payment_handling === "platform";
                    const stripeReady = isStripeConfigured();

                    return (
                      <Card key={payment.id} className="card-accent hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold">{payment.milestone}</h3>
                                <Badge className={`${statusConfig[payment.status].tone} border`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[payment.status].label}
                                </Badge>
                                <Badge className={`${handlingMeta[payment.payment_handling].tone} border text-xs`}>
                                  {handlingMeta[payment.payment_handling].label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                                <HardHat className="h-3 w-3 shrink-0" />
                                {payment.professional_name}
                                <span className="text-border">·</span>
                                {payment.project_title}
                              </p>
                              {payment.invoice_number && (
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                  Facture {payment.invoice_number}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xl font-bold">
                                {Number(payment.amount).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(payment.created_at), "dd MMM yyyy", { locale: fr })}
                              </p>
                            </div>
                          </div>

                          {isPending && isPlatform && (
                            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-md text-xs text-primary flex items-start gap-2">
                              <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span>
                                Paiement sécurisé via la plateforme. Les fonds sont protégés jusqu'à validation du jalon par vous et l'entrepreneur.
                              </span>
                            </div>
                          )}

                          {isPending && !isPlatform && (
                            <div className="mt-3 p-3 bg-muted border border-border rounded-md text-xs text-muted-foreground flex items-start gap-2">
                              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                              <div>
                                <p className="font-medium text-foreground mb-1">Règlement hors plateforme</p>
                                <p>
                                  Réglez <strong>{payment.professional_name}</strong> directement par{" "}
                                  <strong>virement bancaire</strong>, <strong>chèque</strong> ou <strong>comptant</strong>.
                                  L'entrepreneur confirmera la réception dans son espace Paiements.
                                </p>
                              </div>
                            </div>
                          )}

                          {payment.status === "released" && (
                            <div className="mt-3 p-2 bg-success-light/50 border border-success/20 rounded text-xs text-success flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              Payé
                              {payment.released_at && (
                                <> le {format(new Date(payment.released_at), "dd MMM yyyy", { locale: fr })}</>
                              )}
                              {payment.payment_method && (
                                <> · {methodMeta[payment.payment_method]?.label ?? payment.payment_method}</>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {payment.status === "released" && (
                                <span className="flex items-center gap-1">
                                  <MethodIcon className="h-3 w-3" />
                                  {methodMeta[payment.payment_method]?.label ?? "—"}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {payment.contract_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => navigate(`/contracts?contract=${payment.contract_id}`)}
                                >
                                  <FileText className="h-3 w-3" />
                                  Contrat
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              )}
                              {isPending && isPlatform && (
                                stripeReady ? (
                                  <Button
                                    size="sm"
                                    className="gap-1 btn-blueprint"
                                    disabled={payingId === payment.id}
                                    onClick={() => handlePayOnline(payment)}
                                  >
                                    {payingId === payment.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CreditCard className="h-3 w-3" />
                                    )}
                                    Payer en ligne
                                  </Button>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span tabIndex={0}>
                                        <Button size="sm" className="gap-1" disabled>
                                          <CreditCard className="h-3 w-3" />
                                          Payer en ligne
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Stripe bientôt disponible</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ClientPayments;
