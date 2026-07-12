import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Clock, DollarSign, Shield } from "lucide-react";
import OnlinePaymentComingSoonBadge from "@/components/payments/OnlinePaymentComingSoonBadge";

// US-051 — Configuration des informations bancaires
// L'intégration bancaire (Stripe Connect ou équivalent) est en cours de développement.

const ProBankAccount = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container max-w-2xl py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" onClick={() => navigate("/pro/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Informations bancaires
            </h1>
            <p className="text-muted-foreground text-sm">Configuration du compte de versement</p>
          </div>
        </div>

        {/* Coming soon */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap text-amber-800">
              <Clock className="h-5 w-5" />
              Fonctionnalité en cours de développement
              <OnlinePaymentComingSoonBadge />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-amber-900">
            <p>
              La configuration des coordonnées bancaires directes sera disponible prochainement.
              Notre équipe travaille à l'intégration d'un système de versement sécurisé conforme
              aux exigences réglementaires canadiennes.
            </p>
            <p className="text-sm">
              En attendant, tous vos paiements sont versés manuellement par notre équipe dans un
              délai de <strong>2 à 5 jours ouvrables</strong> suivant la validation d'un jalon par le client.
            </p>
          </CardContent>
        </Card>

        {/* Current process info */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-sm">5% de frais</p>
              <p className="text-xs text-muted-foreground">sur chaque versement</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-sm">2–5 jours ouvrables</p>
              <p className="text-xs text-muted-foreground">délai de versement</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-sm">Compte en fidéicommis</p>
              <p className="text-xs text-muted-foreground">fonds sécurisés jusqu'à validation</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => navigate("/pro/payments")} className="gap-2">
            <DollarSign className="h-4 w-4" />
            Voir mes paiements
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProBankAccount;
