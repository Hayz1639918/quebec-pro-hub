import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Building2, Phone, Eye, EyeOff, CheckCircle2, XCircle, Briefcase, HardHat, AlertCircle, MailCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "@/components/Logo";
import { AppProfile, getPostAuthRoute } from "@/lib/auth-routing";

type UserType = "client" | "professional";
type ProfessionalType = "entrepreneur" | "trade_professional";
type CompanyType = "individuel" | "societe";
type OAuthProvider = "google" | "apple";

// Choix de type de compte fait sur l'onglet Inscription avant un départ vers
// Google/Apple : survit à la redirection OAuth puis est consommé (et effacé)
// au retour pour typer le profil créé par défaut en « client ».
const OAUTH_SIGNUP_KEY = "batirnet_oauth_signup_choice";
const TERMS_VERSION = "2026-08-11";
const PRIVACY_VERSION = "2026-08-11";

// Connexion Google/Apple : implémentée mais masquée pour l'instant (décision
// 2026-07-12 — fournisseurs non configurés côté Google/Apple). Pour réactiver :
// définir VITE_ENABLE_OAUTH=true (Vercel → Environment Variables) et configurer
// les fournisseurs dans Supabase (voir docs/authentication.md).
const OAUTH_PROVIDERS_ENABLED = import.meta.env.VITE_ENABLE_OAUTH === "true";

// Password strength validation
const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
};

// Basic email format check (RFC-lite) to avoid wasting Supabase's email quota
// on obvious typos before ever calling the API.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isValidEmail = (value: string) => EMAIL_RE.test(value.trim());

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * Traduit les erreurs d'authentification Supabase (codes/messages bruts, souvent
 * en anglais) en messages clairs et bilingues pour l'utilisateur. Gère notamment
 * le rate limiting (429) pour ne pas laisser un message cryptique bloquer les
 * personnes âgées ou peu à l'aise.
 */
function mapAuthError(error: unknown, t: TranslateFn): { title: string; description: string } {
  const err = error as { code?: string; status?: number; message?: string } | null;
  const code = err?.code ?? "";
  const status = err?.status ?? 0;
  const message = (err?.message ?? "").toLowerCase();

  const is = (needle: string) => code.includes(needle) || message.includes(needle);

  if (is("provider is not enabled") || is("unsupported provider")) {
    return {
      title: t("auth.messages.oauth_unavailable"),
      description: t("auth.messages.oauth_unavailable_description"),
    };
  }
  if (status === 429 || is("rate_limit") || is("rate limit") || is("too many") || is("security purposes")) {
    return {
      title: t("auth.messages.rate_limited"),
      description: t("auth.messages.rate_limited_description"),
    };
  }
  if (is("invalid_credentials") || is("invalid login")) {
    return {
      title: t("auth.messages.error"),
      description: t("auth.messages.invalid_credentials"),
    };
  }
  if (is("already") && (is("registered") || is("exists") || code.includes("user_already"))) {
    return {
      title: t("auth.messages.email_exists"),
      description: t("auth.messages.email_exists_description"),
    };
  }
  if (is("email_address_invalid") || is("invalid") && is("email")) {
    return {
      title: t("auth.messages.email_invalid"),
      description: t("auth.messages.email_invalid_description"),
    };
  }
  if (is("email_not_confirmed") || is("not confirmed")) {
    return {
      title: t("auth.messages.email_not_confirmed"),
      description: t("auth.messages.email_not_confirmed_description"),
    };
  }
  return {
    title: t("auth.messages.error"),
    description: err?.message || t("auth.messages.invalid_credentials"),
  };
}

function getPasswordStrength(password: string) {
  return {
    minLength: password.length >= PASSWORD_RULES.minLength,
    hasUppercase: PASSWORD_RULES.hasUppercase.test(password),
    hasNumber: PASSWORD_RULES.hasNumber.test(password),
    hasSpecial: PASSWORD_RULES.hasSpecial.test(password),
  };
}

function isPasswordValid(password: string) {
  const s = getPasswordStrength(password);
  return s.minLength && s.hasUppercase && s.hasNumber && s.hasSpecial;
}

// Reusable password input with show/hide and strength indicator
function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder = "••••••••",
  showStrength = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  showStrength?: boolean;
}) {
  const strength = getPasswordStrength(value);
  const rules = [
    { key: "minLength", label: "8 caractères minimum" },
    { key: "hasUppercase", label: "Une lettre majuscule" },
    { key: "hasNumber", label: "Un chiffre" },
    { key: "hasSpecial", label: "Un caractère spécial (!@#$...)" },
  ] as const;

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <ul className="space-y-1 mt-1">
          {rules.map(({ key, label: ruleLabel }) => (
            <li key={key} className={`flex items-center gap-1.5 text-xs ${strength[key] ? 'text-green-600' : 'text-muted-foreground'}`}>
              {strength[key]
                ? <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                : <XCircle className="h-3 w-3 flex-shrink-0" />}
              {ruleLabel}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const Auth = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [userType, setUserType] = useState<UserType>("client");
  const [professionalType, setProfessionalType] = useState<ProfessionalType>("entrepreneur");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Défi 2FA : id du facteur TOTP à valider avant d'entrer dans l'application.
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  // US-047: company type
  const [companyType, setCompanyType] = useState<CompanyType>("individuel");
  // Trade professional specific
  const [tradeSpecialty, setTradeSpecialty] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Erreur affichée directement dans le formulaire (plus claire qu'un toast fugace).
  const [formError, setFormError] = useState<{ title: string; description: string } | null>(null);
  // Grande fenêtre de confirmation après inscription réussie.
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  /** Affiche une erreur inline dans le formulaire + un toast, et arrête le chargement. */
  const showError = (title: string, description: string) => {
    setFormError({ title, description });
    toast({ variant: "destructive", title, description });
    setLoading(false);
  };

  const redirectBasedOnProfile = (profile: AppProfile | null | undefined) => {
    navigate(getPostAuthRoute(profile));
  };

  /**
   * Résolution partagée après connexion (mot de passe OU retour OAuth) :
   * exige d'abord le code 2FA si un facteur TOTP vérifié existe, consomme le
   * choix de type de compte fait avant un départ OAuth depuis l'onglet
   * Inscription (conversion du profil « client » créé par défaut par le
   * trigger), puis redirige selon le profil.
   * Retourne true si un défi 2FA est requis (aucune redirection faite).
   */
  const resolvePostAuth = async (uid: string): Promise<boolean> => {
    // 2FA : si le compte a un facteur TOTP vérifié et que la session est
    // encore au niveau aal1, on exige le code avant toute redirection.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = (factors?.totp ?? []).find((f) => f.status === "verified");
      if (totp) {
        setMfaFactorId(totp.id);
        return true;
      }
    }

    const pendingRaw = localStorage.getItem(OAUTH_SIGNUP_KEY);
    localStorage.removeItem(OAUTH_SIGNUP_KEY);

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, profile_completed, professional_type')
      .eq('id', uid)
      .single();

    if (!profile) return false;

    // Conversion uniquement pour un profil encore vierge (créé par défaut en
    // « client » par le trigger) — jamais pour un compte déjà complété.
    if (pendingRaw && profile.user_type === 'client' && !profile.profile_completed) {
      try {
        const pending = JSON.parse(pendingRaw) as {
          userType?: string;
          professionalType?: string;
          tradeSpecialty?: string | null;
          termsVersion?: string;
          privacyVersion?: string;
          termsAcceptedAt?: string;
        };
        if (pending.termsVersion && pending.privacyVersion && pending.termsAcceptedAt) {
          await supabase.auth.updateUser({
            data: {
              terms_version: pending.termsVersion,
              privacy_version: pending.privacyVersion,
              terms_accepted_at: pending.termsAcceptedAt,
            },
          });
        }
        if (pending.userType === 'professional') {
          const professional_type =
            pending.professionalType === 'trade_professional' ? 'trade_professional' : 'entrepreneur';
          const { error } = await supabase
            .from('profiles')
            .update({
              user_type: 'professional',
              professional_type,
              ...(pending.tradeSpecialty ? { trade_specialty: pending.tradeSpecialty } : {}),
            })
            .eq('id', uid);
          if (!error) {
            redirectBasedOnProfile({
              user_type: 'professional',
              profile_completed: false,
              professional_type,
            });
            return false;
          }
        }
      } catch {
        // Choix illisible : on retombe sur la redirection normale.
      }
    }

    redirectBasedOnProfile(profile as AppProfile);
    return false;
  };

  /** Valide le code TOTP saisi lors du défi 2FA à la connexion. */
  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId || mfaCode.trim().length < 6) return;
    setFormError(null);
    setLoading(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode.trim(),
      });
      if (verifyError) throw verifyError;

      setMfaFactorId(null);
      setMfaCode("");
      toast({
        title: t('auth.messages.login_success'),
        description: t('auth.messages.welcome_default'),
      });
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await resolvePostAuth(session.user.id);
    } catch {
      showError(t('auth.messages.mfa_invalid'), t('auth.messages.mfa_invalid_description'));
    } finally {
      setLoading(false);
    }
  };

  /** Abandonne le défi 2FA : déconnexion propre et retour au formulaire. */
  const cancelMfa = async () => {
    setMfaFactorId(null);
    setMfaCode("");
    setFormError(null);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await resolvePostAuth(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked password reset link — show the new-password form
        setIsPasswordRecovery(true);
        setIsLogin(false);
        setForgotPassword(false);
        return;
      }
      if (session && event === 'SIGNED_IN' && !isPasswordRecovery) {
        // Defer Supabase calls out of the auth callback: awaiting a query here
        // can deadlock the Supabase auth lock and hang the whole app.
        const uid = session.user.id;
        setTimeout(() => {
          void resolvePostAuth(uid);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, isPasswordRecovery]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!isValidEmail(forgotEmail)) {
        showError(t("auth.messages.email_invalid"), t("auth.messages.email_invalid_description"));
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) throw error;
      toast({
        title: "Email envoyé",
        description: "Un lien de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception.",
      });
      setForgotPassword(false);
      setIsLogin(true);
    } catch (error) {
      const { title, description } = mapAuthError(error, t);
      showError(title, description);
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError("Les mots de passe ne correspondent pas", "Assurez-vous de saisir exactement le même mot de passe dans les deux champs.");
      return;
    }
    if (!isPasswordValid(newPassword)) {
      showError(t("auth.messages.password_weak"), t("auth.messages.password_weak_description"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Mot de passe mis à jour", description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe." });
      setIsPasswordRecovery(false);
      setIsLogin(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur lors de la mise à jour.";
      toast({ variant: "destructive", title: "Erreur", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      // Basic validation - professional details will be collected after email confirmation
      if (!email || !password || !fullName) {
        showError(t('auth.messages.missing_fields'), t('auth.messages.missing_fields_description'));
        return;
      }

      if (!acceptedTerms) {
        showError(
          "Acceptation requise",
          "Veuillez accepter les conditions d’utilisation et la politique de confidentialité pour créer un compte.",
        );
        return;
      }

      // Validate email format BEFORE calling Supabase, so a typo never burns the
      // limited email-send quota (which otherwise locks the user's IP for ~1h).
      if (!isValidEmail(email)) {
        showError(t('auth.messages.email_invalid'), t('auth.messages.email_invalid_description'));
        return;
      }

      // Password complexity validation
      if (!isPasswordValid(password)) {
        showError(t('auth.messages.password_weak'), t('auth.messages.password_weak_description'));
        return;
      }

      // Create user account - the database trigger will create the base profile
      // Professional details (RBQ, location) will be added after email confirmation
      // Professionals are redirected to home page and can click "Compléter mon profil" in menu
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: userType === "professional"
            ? `${window.location.origin}/`
            : `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            user_type: userType,
            phone: phone || null,
            terms_version: TERMS_VERSION,
            privacy_version: PRIVACY_VERSION,
            terms_accepted_at: new Date().toISOString(),
            ...(userType === "professional" && {
              company_type: companyType === "individuel" ? "sole_proprietor" : "corporation",
              professional_type: professionalType,
              ...(professionalType === "trade_professional" && tradeSpecialty && {
                trade_specialty: tradeSpecialty,
              }),
            }),
          }
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error(t('auth.messages.no_user_created'));

      // Supabase renvoie un user SANS erreur mais avec identities=[] lorsque le
      // courriel est déjà utilisé (protection anti-énumération). On le détecte
      // pour afficher une vraie erreur « compte déjà existant » au lieu d'ouvrir
      // la fenêtre de confirmation (qui ferait croire à tort à un nouveau compte).
      const identities = (authData.user as { identities?: unknown[] }).identities;
      if (Array.isArray(identities) && identities.length === 0) {
        showError(t('auth.messages.email_exists'), t('auth.messages.email_exists_description'));
        return;
      }

      // Check if email confirmation is required
      const needsEmailConfirmation = !authData.session;

      if (needsEmailConfirmation) {
        // Email confirmation required (production) : grande fenêtre centrée
        // pour que l'utilisateur comprenne clairement l'étape suivante.
        setConfirmationEmail(email);
        setConfirmationOpen(true);
      } else {
        // No email confirmation needed (local dev mode) - update profile with phone
        if (phone) {
          await supabase
            .from('profiles')
            .update({ phone })
            .eq('id', authData.user.id);
        }

        toast({
          title: t('auth.messages.success'),
          description: userType === "professional" 
            ? t('auth.messages.success_pro')
            : t('auth.messages.success_client'),
        });

        const nextRoute = getPostAuthRoute({
          user_type: userType,
          profile_completed: false,
          professional_type: userType === "professional" ? professionalType : null,
        });

        navigate(nextRoute);
      }

    } catch (error) {
      const { title, description } = mapAuthError(error, t);
      showError(title, description);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion / inscription via Google ou Apple (US-002).
   * Sur l'onglet Inscription, le type de compte choisi est mémorisé le temps
   * de l'aller-retour OAuth puis appliqué au profil dans resolvePostAuth().
   */
  const handleOAuth = async (provider: OAuthProvider) => {
    setFormError(null);
    try {
      if (!isLogin && !acceptedTerms) {
        showError(
          "Acceptation requise",
          "Veuillez accepter les conditions d’utilisation et la politique de confidentialité pour créer un compte.",
        );
        return;
      }
      if (!isLogin) {
        localStorage.setItem(
          OAUTH_SIGNUP_KEY,
          JSON.stringify({
            userType,
            professionalType,
            tradeSpecialty: professionalType === "trade_professional" ? tradeSpecialty || null : null,
            termsVersion: TERMS_VERSION,
            privacyVersion: PRIVACY_VERSION,
            termsAcceptedAt: new Date().toISOString(),
          })
        );
      } else {
        // Onglet Connexion (ou inscription client) : purge tout choix périmé
        // d'une tentative OAuth abandonnée pour ne jamais convertir à tort.
        localStorage.removeItem(OAUTH_SIGNUP_KEY);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
    } catch (error) {
      localStorage.removeItem(OAUTH_SIGNUP_KEY);
      const { title, description } = mapAuthError(error, t);
      showError(title, description);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isValidEmail(email)) {
      showError(t('auth.messages.email_invalid'), t('auth.messages.email_invalid_description'));
      return;
    }
    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      if (!authData.user) throw new Error(t('auth.messages.no_user_logged'));

      // resolvePostAuth gère le défi 2FA éventuel puis la redirection.
      const requiresMfa = await resolvePostAuth(authData.user.id);
      if (!requiresMfa) {
        toast({
          title: t('auth.messages.login_success'),
          description: t('auth.messages.welcome_default'),
        });
      }
    } catch (error) {
      const { title, description } = mapAuthError(error, t);
      showError(title, description);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-3 sm:p-4 py-6 sm:py-8 pt-safe pb-safe">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="space-y-2 sm:space-y-3 md:space-y-4 text-center px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="flex justify-center">
            <Logo size={44} />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl" role="heading" aria-level={1}>
              {mfaFactorId
                ? t('auth.mfa.title')
                : isPasswordRecovery
                ? "Nouveau mot de passe"
                : forgotPassword
                ? "Mot de passe oublié"
                : isLogin ? t('auth.login.title') : t('auth.signup.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {mfaFactorId
                ? t('auth.mfa.subtitle')
                : isPasswordRecovery
                ? "Choisissez un nouveau mot de passe sécurisé"
                : forgotPassword
                ? "Entrez votre email pour recevoir un lien de réinitialisation"
                : isLogin
                ? t('auth.subtitle_login')
                : t('auth.subtitle_signup')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">

          {/* Erreur affichée directement dans le formulaire, claire et persistante */}
          {formError && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{formError.title}</AlertTitle>
              <AlertDescription>{formError.description}</AlertDescription>
            </Alert>
          )}

          {/* Défi 2FA à la connexion */}
          {mfaFactorId ? (
            <form onSubmit={handleVerifyMfa} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-code">{t('auth.mfa.code_label')}</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center font-mono tracking-[0.5em] text-lg"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || mfaCode.length < 6}>
                {loading ? t('auth.mfa.button_loading') : t('auth.mfa.button')}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={cancelMfa}
                  className="text-sm text-primary hover:underline"
                >
                  {t('auth.mfa.cancel')}
                </button>
              </div>
            </form>

          /* Password Recovery Form */
          ) : isPasswordRecovery ? (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <PasswordField
                id="new-password"
                label="Nouveau mot de passe"
                value={newPassword}
                onChange={setNewPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
                showStrength
              />
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Répétez le nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mise à jour..." : "Enregistrer le nouveau mot de passe"}
              </Button>
            </form>

          /* Forgot Password Form */
          ) : forgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Retour à la connexion
                </button>
              </div>
            </form>

          ) : isLogin ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.login.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.login.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.login.password')}</Label>
                  <button
                    type="button"
                    onClick={() => { setFormError(null); setForgotPassword(true); setForgotEmail(email); }}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('auth.login.forgot')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.login.password_placeholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.login.button_loading') : t('auth.login.button')}
              </Button>
            </form>
          ) : (
            // Sign Up Form — 3 account types
            <form onSubmit={handleSignUp} className="space-y-5">
              {/* Account type selector */}
              <div className="space-y-2">
                <Label>Type de compte *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Client */}
                  <button
                    type="button"
                    onClick={() => setUserType("client")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors text-center ${
                      userType === "client"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <User className={`h-5 w-5 ${userType === "client" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium leading-tight">Propriétaire</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Client / particulier</span>
                  </button>

                  {/* Entrepreneur */}
                  <button
                    type="button"
                    onClick={() => { setUserType("professional"); setProfessionalType("entrepreneur"); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors text-center ${
                      userType === "professional" && professionalType === "entrepreneur"
                        ? "border-blue-600 bg-blue-50"
                        : "border-border hover:border-blue-300"
                    }`}
                  >
                    <Building2 className={`h-5 w-5 ${userType === "professional" && professionalType === "entrepreneur" ? "text-blue-600" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium leading-tight">Entrepreneur</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Entrepreneur général</span>
                  </button>

                  {/* Professionnel métier */}
                  <button
                    type="button"
                    onClick={() => { setUserType("professional"); setProfessionalType("trade_professional"); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors text-center ${
                      userType === "professional" && professionalType === "trade_professional"
                        ? "border-amber-600 bg-amber-50"
                        : "border-border hover:border-amber-300"
                    }`}
                  >
                    <HardHat className={`h-5 w-5 ${userType === "professional" && professionalType === "trade_professional" ? "text-amber-600" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium leading-tight">Pro métier</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Électricien, plombier…</span>
                  </button>
                </div>
              </div>

              {/* Common fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.signup.email')} {t('auth.signup.required')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={t('auth.signup.email_placeholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.signup.password')} {t('auth.signup.required')}</Label>
                  <PasswordField
                    id="signup-password"
                    label=""
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggleShow={() => setShowPassword(!showPassword)}
                    placeholder="Min. 8 car., majuscule, chiffre, spécial"
                    showStrength
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullname">{t('auth.signup.full_name')} {t('auth.signup.required')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullname"
                      type="text"
                      placeholder={t('auth.signup.full_name_placeholder')}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('auth.signup.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t('auth.signup.phone_placeholder')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Entrepreneur-specific fields — exigences légales RBQ Québec */}
              {userType === "professional" && professionalType === "entrepreneur" && (
                <div className="space-y-4">

                  {/* Type d'entreprise */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Type d'entreprise *
                    </Label>
                    <RadioGroup value={companyType} onValueChange={(v) => setCompanyType(v as CompanyType)} className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="individuel" id="ent-individuel" />
                        <Label htmlFor="ent-individuel" className="font-normal cursor-pointer">Travailleur autonome</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="societe" id="ent-societe" />
                        <Label htmlFor="ent-societe" className="font-normal cursor-pointer">Société / Compagnie</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-700 space-y-1">
                      <p className="font-medium">Aucun document requis pour vous inscrire.</p>
                      <p>Vous pourrez ajouter votre <strong>licence RBQ</strong> et votre assurance plus tard depuis votre profil pour demander le badge « Profil approuvé ».</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Professionnel métier-specific fields — exigences légales Québec */}
              {userType === "professional" && professionalType === "trade_professional" && (
                <div className="space-y-4">
                  {/* Spécialité */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <HardHat className="h-4 w-4 text-amber-600" />
                      Corps de métier
                    </Label>
                    <Select value={tradeSpecialty} onValueChange={setTradeSpecialty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre spécialité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electricien">Électricien (licence CMEQ)</SelectItem>
                        <SelectItem value="plombier">Plombier / Mécanicien en tuyauterie (licence CMMTQ)</SelectItem>
                        <SelectItem value="charpentier">Charpentier-menuisier</SelectItem>
                        <SelectItem value="macon">Maçon / Briqueteur</SelectItem>
                        <SelectItem value="peintre">Peintre en bâtiment</SelectItem>
                        <SelectItem value="carreleur">Carreleur / Poseur de revêtements</SelectItem>
                        <SelectItem value="couvreur">Couvreur</SelectItem>
                        <SelectItem value="ferblantier">Ferblantier</SelectItem>
                        <SelectItem value="calorifugeur">Calorifugeur</SelectItem>
                        <SelectItem value="excavation">Opérateur d'excavation / Terrassier</SelectItem>
                        <SelectItem value="soudeur">Soudeur</SelectItem>
                        <SelectItem value="autre">Autre corps de métier CCQ</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Indiquez votre corps de métier principal. Vous pourrez préciser vos certifications (CCQ, CMEQ, CMMTQ…) plus tard dans votre profil.
                    </p>
                  </div>

                  {/* Statut */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Statut *
                    </Label>
                    <RadioGroup
                      value={companyType}
                      onValueChange={(v) => setCompanyType(v as CompanyType)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="individuel" id="trade-individuel" />
                        <Label htmlFor="trade-individuel" className="font-normal cursor-pointer">Travailleur autonome</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="societe" id="trade-societe" />
                        <Label htmlFor="trade-societe" className="font-normal cursor-pointer">Maître (entreprise)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <HardHat className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-700 space-y-1">
                      <p className="font-medium">Aucun document requis pour vous inscrire.</p>
                      <p>Vous pourrez ajouter votre <strong>carte de compétence CCQ</strong> plus tard depuis votre profil pour demander le badge « Profil approuvé ».</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Client description */}
              {userType === "client" && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {t('auth.signup.client_description')}
                </p>
              )}

              <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                <Checkbox
                  id="accept-legal"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  aria-required="true"
                />
                <Label htmlFor="accept-legal" className="text-sm font-normal leading-relaxed cursor-pointer">
                  J’accepte les{' '}
                  <a href="/terms-of-service" target="_blank" rel="noreferrer" className="text-primary underline">
                    conditions d’utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-primary underline">
                    politique de confidentialité
                  </a>.
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
                {loading ? t('auth.signup.button_loading') : t('auth.signup.button')}
              </Button>
            </form>
          )}

          {!forgotPassword && !isPasswordRecovery && !mfaFactorId && OAUTH_PROVIDERS_ENABLED && (
            <>
              {/* Connexion via fournisseurs OAuth (US-002) */}
              <div className="relative" role="separator" aria-label={t('auth.oauth.or')}>
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">{t('auth.oauth.or')}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOAuth("google")}
                  disabled={loading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
                    <path fill="#FBBC05" d="M5.27 14.29A7.13 7.13 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
                  </svg>
                  {t('auth.oauth.google')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOAuth("apple")}
                  disabled={loading}
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M16.36 12.79c-.03-2.53 2.07-3.74 2.16-3.8-1.18-1.72-3.01-1.96-3.66-1.99-1.56-.16-3.04.92-3.83.92-.79 0-2.01-.9-3.3-.87-1.7.03-3.26.99-4.13 2.5-1.76 3.06-.45 7.59 1.27 10.07.84 1.21 1.84 2.58 3.16 2.53 1.27-.05 1.75-.82 3.28-.82 1.53 0 1.96.82 3.3.79 1.36-.02 2.22-1.24 3.06-2.46.96-1.41 1.36-2.78 1.38-2.85-.03-.01-2.65-1.02-2.69-4.02zM13.84 5.35c.7-.85 1.17-2.02 1.04-3.2-1 .04-2.23.67-2.95 1.51-.65.75-1.21 1.95-1.06 3.1 1.12.09 2.27-.57 2.97-1.41z" />
                  </svg>
                  {t('auth.oauth.apple')}
                </Button>
              </div>
            </>
          )}

          {!forgotPassword && !isPasswordRecovery && !mfaFactorId && (
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => { setFormError(null); setIsLogin(!isLogin); }}
                className="text-primary hover:underline"
              >
                {isLogin
                  ? t('auth.login.no_account')
                  : t('auth.signup.already_account')}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grande fenêtre de confirmation après inscription — l'utilisateur voit
          clairement qu'il doit aller confirmer son courriel. */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center gap-4 py-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light text-success">
              <MailCheck className="h-8 w-8" />
            </span>
            <h2 className="text-xl font-bold text-foreground">
              {t("auth.confirmation.title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("auth.confirmation.sent_to")}
            </p>
            <p className="text-sm font-semibold text-foreground break-all">{confirmationEmail}</p>
            <div className="w-full rounded-lg border border-border bg-secondary/40 p-4 text-left text-sm text-muted-foreground space-y-2">
              <p className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
                {t("auth.confirmation.step_open")}
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
                {t("auth.confirmation.step_click")}
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
                {t("auth.confirmation.step_spam")}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setConfirmationOpen(false);
                setIsLogin(true);
              }}
            >
              {t("auth.confirmation.got_it")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Auth;
