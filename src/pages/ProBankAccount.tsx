import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Banknote, CheckCircle2, Info, Send } from "lucide-react";

const ProBankAccount = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container max-w-2xl py-8 px-4 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" onClick={() => navigate("/pro/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Banknote className="h-6 w-6 text-primary" /> Règlements directs
            </h1>
            <p className="text-muted-foreground text-sm">Aucun compte de versement à configurer dans BâtirNet</p>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Paiement direct entre client et entrepreneur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>BâtirNet ne reçoit, ne conserve et ne verse pas l'argent de vos contrats.</p>
            <p className="text-muted-foreground">
              Convenez directement avec le client du moyen de règlement, puis utilisez BâtirNet uniquement pour suivre l'état du paiement.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6 flex items-start gap-3">
              <Send className="h-6 w-6 text-primary shrink-0" />
              <div>
                <p className="font-semibold">1. Le client marque « envoyé »</p>
                <p className="text-sm text-muted-foreground mt-1">Après son règlement direct, le client enregistre l'envoi dans BâtirNet.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
              <div>
                <p className="font-semibold">2. Vous marquez « reçu »</p>
                <p className="text-sm text-muted-foreground mt-1">Après vérification de la réception réelle, vous la confirmez dans BâtirNet.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 rounded-lg border p-4 text-sm text-muted-foreground">
          Le statut affiché est un suivi déclaratif du projet et ne remplace pas une preuve de paiement.
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate("/pro/payments")} className="gap-2">
            <Banknote className="h-4 w-4" /> Voir le suivi de mes paiements
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProBankAccount;
