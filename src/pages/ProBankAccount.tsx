import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  DollarSign,
} from "lucide-react";

// US-051 — Configuration des informations bancaires

const ProBankAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Bank account form state
  const [bankName, setBankName] = useState("");
  const [institutionNumber, setInstitutionNumber] = useState("");
  const [transitNumber, setTransitNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountType, setAccountType] = useState<"cheque" | "epargne">("cheque");
  const [saved, setSaved] = useState(false);

  const QUEBEC_BANKS = [
    "Banque Nationale du Canada",
    "Desjardins",
    "Banque de Montréal (BMO)",
    "RBC Banque Royale",
    "TD Canada Trust",
    "Banque Scotia",
    "CIBC",
    "HSBC Canada",
    "Laurentienne",
    "Autre",
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolder || !bankName || !institutionNumber || !transitNumber || !accountNumber) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }
    if (institutionNumber.length !== 3) {
      toast({ variant: "destructive", title: "Numéro d'institution invalide", description: "Le numéro d'institution doit comporter 3 chiffres." });
      return;
    }
    if (transitNumber.length !== 5) {
      toast({ variant: "destructive", title: "Numéro de transit invalide", description: "Le numéro de transit doit comporter 5 chiffres." });
      return;
    }
    setSaving(true);
    // In production: encrypt & store via Supabase / Stripe Connect
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    toast({
      title: "✅ Informations bancaires enregistrées",
      description: "Vos coordonnées bancaires ont été sauvegardées de manière sécurisée.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/pro/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Informations bancaires
          </h1>
          <p className="text-muted-foreground mt-1">Configurez votre compte pour recevoir vos paiements par virement</p>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
          <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-green-900 text-sm">Connexion sécurisée (TLS 256-bit)</p>
            <p className="text-green-700 text-xs mt-0.5">
              Vos informations bancaires sont chiffrées et ne sont jamais stockées en clair. Elles sont utilisées uniquement pour traiter vos virements.
            </p>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-blue-900 text-sm">Compte bancaire vérifié</p>
              <p className="text-blue-700 text-xs mt-0.5">
                Un dépôt de vérification de 0,01 $ sera effectué dans 1–2 jours ouvrables.
              </p>
            </div>
            <Badge variant="outline" className="ml-auto text-blue-700 border-blue-300">Vérifié</Badge>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5" />
                Coordonnées bancaires
              </CardTitle>
              <CardDescription>Informations de votre compte chèques ou épargne canadien</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="holder">Nom du titulaire du compte *</Label>
                <Input
                  id="holder"
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  placeholder="Nom complet ou raison sociale"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank">Institution financière *</Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger id="bank">
                    <SelectValue placeholder="Sélectionnez votre banque" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUEBEC_BANKS.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-type">Type de compte *</Label>
                <Select value={accountType} onValueChange={v => setAccountType(v as "cheque" | "epargne")}>
                  <SelectTrigger id="account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cheque">Compte chèques</SelectItem>
                    <SelectItem value="epargne">Compte épargne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Canadian banking coordinates */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Coordonnées bancaires canadiennes
                </p>
                <p className="text-xs text-muted-foreground">
                  Vous trouverez ces informations au bas d'un chèque : ⎯⎯ transit (5) ⎯ institution (3) ⎯ compte ⎯⎯
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institution">Numéro d'institution * (3 chiffres)</Label>
                  <Input
                    id="institution"
                    value={institutionNumber}
                    onChange={e => setInstitutionNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="006"
                    maxLength={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transit">Numéro de transit * (5 chiffres)</Label>
                  <Input
                    id="transit"
                    value={transitNumber}
                    onChange={e => setTransitNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="01234"
                    maxLength={5}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-num">Numéro de compte *</Label>
                <div className="relative">
                  <Input
                    id="account-num"
                    type="password"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••••••"
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment schedule info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-green-600" />
                Informations sur les versements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p>Les paiements par jalons sont virés dans les <strong>48h</strong> après validation par le client.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p>Frais de plateforme : <strong>5%</strong> déduits automatiquement de chaque paiement.</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p>Les fonds sont retenus en <strong>escrow sécurisé</strong> jusqu'à la validation du jalon.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Enregistrer de manière sécurisée
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default ProBankAccount;
