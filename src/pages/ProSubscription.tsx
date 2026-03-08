import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  X,
  TrendingUp,
  Star,
  Zap,
  Bell,
  ArrowLeft,
  Crown,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { addDays, differenceInDays, format } from "date-fns";
import { fr } from "date-fns/locale";

// US-067, US-068 — Abonnement avec comparaison de plans + rappels de renouvellement

type Plan = "free" | "premium";

const PLANS = {
  free: {
    name: "Plan Gratuit",
    price: "0 $",
    period: "/ mois",
    description: "Pour démarrer sur la plateforme",
    color: "border-border",
    features: [
      { text: "Profil public visible", included: true },
      { text: "Accès à tous les projets", included: true },
      { text: "3 soumissions / mois", included: true },
      { text: "Messagerie avec les clients", included: true },
      { text: "Soumissions illimitées", included: false },
      { text: "Listing prioritaire (1ère page)", included: false },
      { text: "Statistiques de profil avancées", included: false },
      { text: "Badge Premium visible", included: false },
      { text: "Alertes nouvelles opportunités", included: false },
      { text: "Support prioritaire", included: false },
    ],
  },
  premium: {
    name: "Plan Premium",
    price: "49 $",
    period: "/ mois",
    description: "Pour maximiser vos opportunités d'affaires",
    color: "border-primary ring-2 ring-primary/20",
    features: [
      { text: "Profil public visible", included: true },
      { text: "Accès à tous les projets", included: true },
      { text: "3 soumissions / mois", included: true },
      { text: "Messagerie avec les clients", included: true },
      { text: "Soumissions illimitées", included: true },
      { text: "Listing prioritaire (1ère page)", included: true },
      { text: "Statistiques de profil avancées", included: true },
      { text: "Badge Premium visible", included: true },
      { text: "Alertes nouvelles opportunités", included: true },
      { text: "Support prioritaire", included: true },
    ],
  },
};

const ProSubscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan>("free");
  const [saving, setSaving] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);

  // US-068 — Renewal date derived from subscriptions.ends_at
  const daysUntilRenewal = renewalDate ? differenceInDays(renewalDate, new Date()) : null;
  const isRenewalSoon = currentPlan === "premium" && daysUntilRenewal !== null && daysUntilRenewal <= 7;

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?mode=login"); return; }
      setUserId(session.user.id);
      const { data: prof } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single();
      if (prof?.user_type !== "professional") { navigate("/"); return; }
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.plan) setCurrentPlan(data.plan as Plan);
      if (data?.ends_at) setRenewalDate(new Date(data.ends_at));
    })();
  }, []);

  const choosePlan = async (plan: Plan) => {
    if (!userId) return;
    try {
      setSaving(true);
      const { error } = await supabase.from("subscriptions").insert({
        user_id: userId,
        plan,
        status: "active",
        features: plan === "premium" ? { visibility_boost: true, insights: true, unlimited_proposals: true } : {},
      });
      if (error) throw error;
      setCurrentPlan(plan);
      toast({
        title: plan === "premium" ? "🎉 Plan Premium activé !" : "Plan Gratuit activé",
        description: plan === "premium"
          ? "Votre visibilité est boostée et vos soumissions sont illimitées."
          : "Vous êtes passé au plan gratuit.",
      });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour l'abonnement" });
    } finally {
      setSaving(false);
    }
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

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Crown className="h-7 w-7 text-amber-500" />
            Mon abonnement
          </h1>
          <p className="text-muted-foreground mt-2">Choisissez le plan adapté à votre activité</p>
        </div>

        {/* US-068 — Renewal warning */}
        {isRenewalSoon && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-lg mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                Renouvellement dans {daysUntilRenewal} jour{(daysUntilRenewal ?? 0) > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-amber-700">
                Votre abonnement Premium expire le {renewalDate ? format(renewalDate, "dd MMMM yyyy", { locale: fr }) : "—"}.
                {autoRenew ? " Renouvellement automatique activé." : " Pensez à renouveler pour maintenir vos avantages."}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-amber-700">Renouvellement auto</span>
              <button
                type="button"
                onClick={() => {
                  setAutoRenew(!autoRenew);
                  toast({ title: autoRenew ? "Renouvellement auto désactivé" : "Renouvellement auto activé" });
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoRenew ? 'bg-amber-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${autoRenew ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Current plan banner */}
        <div className="flex items-center justify-between p-4 bg-white border rounded-lg mb-8">
          <div className="flex items-center gap-3">
            {currentPlan === "premium" ? (
              <Crown className="h-6 w-6 text-amber-500" />
            ) : (
              <Zap className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold">{PLANS[currentPlan].name}</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan === "premium"
                  ? renewalDate ? `Renouvellement le ${format(renewalDate, "dd MMM yyyy", { locale: fr })}` : "Abonnement actif"
                  : "Accès limité à 3 soumissions / mois"}
              </p>
            </div>
          </div>
          <Badge variant={currentPlan === "premium" ? "default" : "secondary"} className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Plan actuel
          </Badge>
        </div>

        {/* US-067 — Plan comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(["free", "premium"] as Plan[]).map(plan => {
            const p = PLANS[plan];
            const isActive = currentPlan === plan;
            return (
              <Card key={plan} className={`relative ${p.color} ${isActive ? "" : ""}`}>
                {plan === "premium" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white px-3 gap-1">
                      <Star className="h-3 w-3" />
                      Recommandé
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {plan === "premium" && <Crown className="h-5 w-5 text-amber-500" />}
                      {p.name}
                    </CardTitle>
                    {isActive && <Badge variant="outline" className="text-green-700 border-green-300">Actif</Badge>}
                  </div>
                  <CardDescription>{p.description}</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{p.price}</span>
                    <span className="text-muted-foreground text-sm">{p.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {p.features.map((feature, i) => (
                      <li key={i} className={`flex items-center gap-2 text-sm ${feature.included ? '' : 'text-muted-foreground'}`}>
                        {feature.included
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          : <X className="h-4 w-4 text-gray-300 shrink-0" />
                        }
                        {feature.text}
                      </li>
                    ))}
                  </ul>

                  <Separator />

                  {isActive ? (
                    <div className="text-center py-2">
                      <span className="text-sm font-medium text-green-700 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Votre plan actuel
                      </span>
                    </div>
                  ) : (
                    <Button
                      className={`w-full gap-2 ${plan === "premium" ? "bg-primary" : ""}`}
                      variant={plan === "free" ? "outline" : "default"}
                      onClick={() => choosePlan(plan)}
                      disabled={saving}
                    >
                      {plan === "premium" ? (
                        <><Crown className="h-4 w-4" /> Passer au Premium — 49 $ / mois</>
                      ) : (
                        "Revenir au plan gratuit"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Premium benefits highlight */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pourquoi passer au Premium ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">+300% de visibilité</p>
                  <p className="text-muted-foreground text-xs">Votre profil apparaît en priorité dans les recherches</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Soumissions illimitées</p>
                  <p className="text-muted-foreground text-xs">Répondez à autant d'appels d'offres que vous souhaitez</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Alertes en temps réel</p>
                  <p className="text-muted-foreground text-xs">Soyez le premier notifié des nouveaux projets correspondants</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* US-068 — Auto-renewal settings */}
        {currentPlan === "premium" && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Gestion du renouvellement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Renouvellement automatique</p>
                  <p className="text-xs text-muted-foreground">
                    {renewalDate
                      ? `Votre abonnement sera renouvelé le ${format(renewalDate, "dd MMM yyyy", { locale: fr })} à 49 $/mois`
                      : "Votre abonnement sera renouvelé automatiquement à 49 $/mois"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoRenew(!autoRenew)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRenew ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${autoRenew ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                Rappels automatiques : 7 jours avant + 1 jour avant l'expiration (email + notification push)
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProSubscription;
