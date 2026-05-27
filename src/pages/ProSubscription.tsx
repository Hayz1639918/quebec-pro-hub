import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  ArrowLeft,
  Crown,
  Sparkles,
  Loader2,
} from "lucide-react";

// US-067 — Abonnement
// Décision MVP : seul le plan Gratuit est actif. Premium sera disponible
// dès l'intégration du paiement Stripe.

const FREE_FEATURES = [
  "Profil public visible",
  "Accès à tous les projets",
  "Soumissions de propositions",
  "Messagerie avec les clients",
  "Signature électronique des contrats",
  "Gestion des jalons de paiement",
  "Avis et réputation",
];

const PREMIUM_PREVIEW = [
  "Soumissions illimitées",
  "Listing prioritaire dans les recherches",
  "Statistiques de profil avancées",
  "Badge Premium visible",
  "Alertes nouvelles opportunités",
  "Support prioritaire",
];

const ProSubscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();
      if (prof?.user_type !== "professional") {
        navigate("/");
        return;
      }
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <Crown className="h-7 w-7 text-warning" />
            Mon abonnement
          </h1>
          <p className="text-muted-foreground mt-2">
            Profitez de l'accès complet à BâtirNet pendant la phase de lancement.
          </p>
        </div>

        {/* Plan actuel - toujours Gratuit en MVP */}
        <Card className="mb-6 border-success/30 bg-success-light/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <div>
                  <CardTitle className="text-lg">Plan Gratuit — Accès complet</CardTitle>
                  <CardDescription>
                    Toutes les fonctionnalités essentielles sont activées sans frais.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-success">
                Actif
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Premium - aperçu, désactivé */}
        <Card className="opacity-90 border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-warning" />
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Plan Premium
                    <Badge variant="outline">Bientôt disponible</Badge>
                  </CardTitle>
                  <CardDescription>
                    Fonctionnalités avancées prévues pour la sortie du module de paiement.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREMIUM_PREVIEW.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-warning shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Separator />
            <div className="bg-muted/40 border border-border rounded-lg p-3 text-sm text-muted-foreground">
              Le plan Premium sera activé prochainement, avec paiement sécurisé via Stripe.
              Vous serez notifié dès qu'il sera disponible.
            </div>
            <Button disabled className="w-full" variant="outline">
              <Crown className="h-4 w-4 mr-2" />
              Premium — bientôt disponible
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ProSubscription;
