import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Auth from "./Auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, MailCheck } from "lucide-react";

const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
};

function passwordChecks(password: string) {
  return {
    minLength: password.length >= PASSWORD_RULES.minLength,
    hasUppercase: PASSWORD_RULES.hasUppercase.test(password),
    hasNumber: PASSWORD_RULES.hasNumber.test(password),
    hasSpecial: PASSWORD_RULES.hasSpecial.test(password),
  };
}

function isPasswordValid(password: string) {
  return Object.values(passwordChecks(password)).every(Boolean);
}

function PasswordResetScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const acceptRecoverySession = (hasSession: boolean) => {
      if (cancelled || !hasSession) return;
      setSessionReady(true);
      setInvalidLink(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        acceptRecoverySession(true);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        acceptRecoverySession(true);
        return;
      }

      // Supabase peut mettre un court instant à échanger le jeton présent dans
      // l'URL du courriel contre une session locale. On laisse ce traitement
      // terminer avant de déclarer le lien invalide ou expiré.
      retryTimer = setTimeout(() => {
        void supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
          if (cancelled) return;
          if (retrySession) acceptRecoverySession(true);
          else setInvalidLink(true);
        });
      }, 1000);
    });

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      subscription.unsubscribe();
    };
  }, []);

  const checks = passwordChecks(newPassword);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!sessionReady) {
      setFormError("Le lien de réinitialisation n’est plus valide. Demandez un nouveau lien.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setFormError("Le mot de passe doit respecter les quatre règles de sécurité indiquées.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Le lien de récupération crée temporairement une session. On la ferme
      // après la modification afin que l'utilisateur se reconnecte normalement
      // avec son nouveau mot de passe.
      await supabase.auth.signOut();

      toast({
        title: "Mot de passe modifié",
        description: "Votre nouveau mot de passe est enregistré. Vous pouvez maintenant vous connecter.",
      });
      navigate("/auth", { replace: true });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Impossible de modifier le mot de passe. Demandez un nouveau lien et réessayez.";
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady && !invalidLink) {
    return (
      <main className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="font-medium">Validation du lien de réinitialisation…</p>
            <p className="text-sm text-muted-foreground">Cela ne prend normalement que quelques secondes.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (invalidLink) {
    return (
      <main className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center"><Logo size={44} /></div>
            <CardTitle>Lien expiré ou invalide</CardTitle>
            <CardDescription>
              Ce lien de réinitialisation ne peut plus être utilisé. Pour votre sécurité, demandez-en un nouveau depuis la page de connexion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/auth", { replace: true })}>
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-3 sm:p-4 py-6 sm:py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center"><Logo size={44} /></div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle>Nouveau mot de passe</CardTitle>
          <CardDescription>
            Choisissez un nouveau mot de passe pour votre compte BâtirNet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Impossible de continuer</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reset-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <ul className="space-y-1 pt-1 text-xs">
                  <li className={checks.minLength ? "text-green-600" : "text-muted-foreground"}><CheckCircle2 className="mr-1.5 inline h-3 w-3" />8 caractères minimum</li>
                  <li className={checks.hasUppercase ? "text-green-600" : "text-muted-foreground"}><CheckCircle2 className="mr-1.5 inline h-3 w-3" />Une lettre majuscule</li>
                  <li className={checks.hasNumber ? "text-green-600" : "text-muted-foreground"}><CheckCircle2 className="mr-1.5 inline h-3 w-3" />Un chiffre</li>
                  <li className={checks.hasSpecial ? "text-green-600" : "text-muted-foreground"}><CheckCircle2 className="mr-1.5 inline h-3 w-3" />Un caractère spécial</li>
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-password-confirm">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-password-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Les deux mots de passe ne correspondent pas.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

/**
 * Entrée unique de la route /auth.
 *
 * Les liens de récupération Supabase reviennent sur /auth?mode=reset. On rend
 * l'écran de changement de mot de passe AVANT de monter la page Auth normale,
 * ce qui empêche sa redirection automatique des utilisateurs connectés de
 * détourner la session de récupération vers le tableau de bord.
 *
 * L'envoi du courriel reste géré par Supabase Auth; lorsque le SMTP Auth du
 * projet est configuré avec Resend, le courriel de récupération passe donc par
 * le même système Resend que les autres courriels transactionnels.
 */
export default function AuthEntry() {
  const [searchParams] = useSearchParams();
  return searchParams.get("mode") === "reset" ? <PasswordResetScreen /> : <Auth />;
}
