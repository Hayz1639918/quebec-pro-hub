import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Banknote, Loader2, Shield } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type PaymentHandling = "platform" | "offline";

type Proposal = {
  id: string;
  title: string;
  description: string | null;
  total_amount: number;
  currency: string;
  professional_id: string;
  project_id: string;
  created_at: string;
  payment_handling: PaymentHandling;
};

const handlingBadge = (handling: PaymentHandling) =>
  handling === "offline"
    ? { label: "Règlement direct", tone: "bg-muted text-foreground border-border", icon: Banknote }
    : { label: "Modalité historique", tone: "bg-amber-50 text-amber-700 border-amber-200", icon: Shield };

const ReviewContractProposals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchProposals = async (uid: string) => {
    setLoadError(false);
    const { data, error } = await supabase
      .from("contract_proposals")
      .select("id,title,description,total_amount,currency,professional_id,project_id,created_at,status,payment_handling")
      .eq("client_id", uid)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setItems((data || []) as Proposal[]);
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) {
          navigate("/auth?mode=login", { replace: true });
          return;
        }

        setUserId(session.user.id);
        await fetchProposals(session.user.id);
      } catch (error) {
        console.error("Unable to load contract proposals", error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const accept = async (id: string) => {
    if (actionId) return;
    setActionId(id);
    try {
      const { data: newId, error } = await supabase.rpc("accept_contract_proposal", { proposal_uuid: id });
      if (error) throw error;
      if (typeof newId !== "string" || !newId) throw new Error("Le contrat créé est introuvable.");

      toast({ title: "Proposition acceptée", description: "Le contrat a été créé et est prêt à être consulté." });
      navigate(`/contracts?contract=${encodeURIComponent(newId)}`);
    } catch (error) {
      console.error("Unable to accept contract proposal", error);
      toast({
        variant: "destructive",
        title: "Impossible d’accepter la proposition",
        description: "Aucune modification n’a été appliquée. Réessayez dans quelques instants.",
      });
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: string) => {
    if (!userId || actionId) return;
    setActionId(id);
    try {
      const { data, error } = await supabase
        .from("contract_proposals")
        .update({ status: "rejected" })
        .eq("id", id)
        .eq("client_id", userId)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("La proposition n’est plus disponible ou a déjà été traitée.");

      setItems((previous) => previous.filter((proposal) => proposal.id !== id));
      toast({ title: "Proposition rejetée", description: "La proposition a été retirée de vos éléments en attente." });
    } catch (error) {
      console.error("Unable to reject contract proposal", error);
      toast({
        variant: "destructive",
        title: "Impossible de rejeter la proposition",
        description: "La proposition est restée inchangée. Rechargez la page puis réessayez.",
      });
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center pt-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1 max-w-3xl">
        <p className="tech-label-blue mb-2">Contrats · Propositions</p>
        <Card className="card-accent">
          <CardHeader>
            <CardTitle>Propositions de contrat</CardTitle>
            <CardDescription>Examinez les modalités avant d’accepter ou de rejeter une proposition.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-amber-600 mb-3" />
                <p className="font-medium">Impossible de charger les propositions pour le moment.</p>
                <p className="text-sm text-muted-foreground mt-1">Aucune action n’a été effectuée sur vos contrats.</p>
                <Button
                  variant="outline"
                  className="mt-4 bg-white"
                  onClick={() => {
                    if (!userId) return;
                    setLoading(true);
                    void fetchProposals(userId)
                      .catch((error) => {
                        console.error("Unable to reload contract proposals", error);
                        setLoadError(true);
                      })
                      .finally(() => setLoading(false));
                  }}
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <>
                {items.map((proposal) => {
                  const handling = handlingBadge(proposal.payment_handling || "offline");
                  const HandlingIcon = handling.icon;
                  const isActing = actionId === proposal.id;
                  return (
                    <div key={proposal.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{proposal.title}</span>
                          <Badge className={`${handling.tone} border text-xs`}>
                            <HandlingIcon className="h-3 w-3 mr-1" />
                            {handling.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{proposal.description || "—"}</div>
                        <div className="text-sm font-semibold">
                          {proposal.total_amount?.toLocaleString("fr-CA")} {proposal.currency || "CAD"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Reçue le {format(new Date(proposal.created_at), "dd MMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2">
                          Le règlement se fait directement avec l’entrepreneur. BâtirNet suit uniquement l’état envoyé/reçu.
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="outline" disabled={Boolean(actionId)} onClick={() => void reject(proposal.id)}>
                          {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rejeter"}
                        </Button>
                        <Button disabled={Boolean(actionId)} onClick={() => void accept(proposal.id)}>
                          {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accepter"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-sm text-muted-foreground py-8 text-center">Aucune proposition en attente.</div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ReviewContractProposals;
