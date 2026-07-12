import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";

type TotpFactor = {
  id: string;
  status: "verified" | "unverified";
  friendly_name?: string | null;
};

type EnrollmentData = {
  factorId: string;
  qrCodeSvg: string;
  secret: string;
};

/**
 * US roadmap « sécurité 2FA » — Activation/désactivation de l'authentification
 * à deux facteurs TOTP (application d'authentification : Google Authenticator,
 * 1Password, Authy…) via Supabase MFA. Utilisée dans les pages de profil
 * client et professionnel. Le défi 2FA à la connexion est géré dans Auth.tsx.
 */
const TwoFactorSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verifiedFactor, setVerifiedFactor] = useState<TotpFactor | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [code, setCode] = useState("");
  const [working, setWorking] = useState(false);

  const refreshFactors = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setVerifiedFactor(null);
      return;
    }
    const totp = (data?.totp ?? []) as TotpFactor[];
    setVerifiedFactor(totp.find((f) => f.status === "verified") ?? null);
  }, []);

  useEffect(() => {
    (async () => {
      await refreshFactors();
      setLoading(false);
    })();
  }, [refreshFactors]);

  const startEnrollment = async () => {
    setWorking(true);
    try {
      // Purge les facteurs restés « unverified » (tentatives abandonnées),
      // sinon l'enrôlement échoue pour cause de nom déjà utilisé.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const stale = ((existing?.totp ?? []) as TotpFactor[]).filter((f) => f.status !== "verified");
      for (const f of stale) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "BâtirNet",
      });
      if (error) throw error;

      setEnrollment({
        factorId: data.id,
        qrCodeSvg: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setCode("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ variant: "destructive", title: "Activation impossible", description: msg });
    } finally {
      setWorking(false);
    }
  };

  const confirmEnrollment = async () => {
    if (!enrollment || code.trim().length < 6) return;
    setWorking(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollment.factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      setEnrollment(null);
      setCode("");
      await refreshFactors();
      toast({
        title: "2FA activée",
        description: "Un code de votre application d'authentification sera demandé à chaque connexion.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Vérifiez le code à 6 chiffres affiché dans votre application, puis réessayez.",
      });
    } finally {
      setWorking(false);
    }
  };

  const cancelEnrollment = async () => {
    if (!enrollment) return;
    setWorking(true);
    await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    setEnrollment(null);
    setCode("");
    setWorking(false);
  };

  const disable2FA = async () => {
    if (!verifiedFactor) return;
    if (!window.confirm("Désactiver la vérification en deux étapes ? Votre compte sera moins protégé.")) {
      return;
    }
    setWorking(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id });
      if (error) throw error;
      await refreshFactors();
      toast({ title: "2FA désactivée", description: "La vérification en deux étapes a été retirée de votre compte." });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      toast({
        variant: "destructive",
        title: "Désactivation impossible",
        description: msg.toLowerCase().includes("aal2")
          ? "Par sécurité, reconnectez-vous (avec votre code 2FA) puis réessayez."
          : msg || "Réessayez plus tard.",
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Vérification en deux étapes (2FA)
          {!loading && (
            verifiedFactor ? (
              <Badge className="bg-success-light text-success border border-success/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Activée
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Désactivée</Badge>
            )
          )}
        </CardTitle>
        <CardDescription>
          Protégez votre compte avec un code généré par une application d'authentification
          (Google Authenticator, 1Password, Authy…).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-10 w-48" />
        ) : verifiedFactor ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Smartphone className="h-4 w-4 shrink-0" />
              Un code est demandé à chaque connexion.
            </p>
            <Button variant="outline" onClick={disable2FA} disabled={working} className="gap-2">
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
              Désactiver
            </Button>
          </div>
        ) : enrollment ? (
          <div className="space-y-4">
            <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
              <li>Scannez ce code QR avec votre application d'authentification.</li>
              <li>Entrez le code à 6 chiffres affiché par l'application.</li>
            </ol>
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              <div className="bg-white border border-border rounded-lg p-2 shrink-0">
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(enrollment.qrCodeSvg)}`}
                  alt="Code QR d'activation de la vérification en deux étapes"
                  className="h-40 w-40"
                />
              </div>
              <div className="space-y-3 flex-1 w-full">
                <p className="text-xs text-muted-foreground break-all">
                  Saisie manuelle impossible de scanner ? Clé secrète :{" "}
                  <code className="font-mono bg-muted px-1 py-0.5 rounded">{enrollment.secret}</code>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="totp-code">Code de vérification</Label>
                  <Input
                    id="totp-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="max-w-[10rem] font-mono tracking-widest"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={confirmEnrollment} disabled={working || code.length < 6} className="gap-2">
                    {working && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirmer l'activation
                  </Button>
                  <Button variant="ghost" onClick={cancelEnrollment} disabled={working}>
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Recommandé : même si votre mot de passe est compromis, personne ne pourra
              accéder à votre compte sans votre téléphone.
            </p>
            <Button onClick={startEnrollment} disabled={working} className="gap-2">
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Activer la 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSettings;
