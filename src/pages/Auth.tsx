import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Building2, Phone, Eye, EyeOff, CheckCircle2, XCircle, Briefcase, HardHat } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo from "/logo-batirnet.png";
import { AppProfile, getPostAuthRoute } from "@/lib/auth-routing";

type UserType = "client" | "professional";
type ProfessionalType = "entrepreneur" | "trade_professional";
type CompanyType = "individuel" | "societe";

// Password strength validation
const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
};

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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
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

  const redirectBasedOnProfile = (profile: AppProfile | null | undefined) => {
    navigate(getPostAuthRoute(profile));
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Fetch user profile to determine where to redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, profile_completed, is_rbq_verified, professional_type')
          .eq('id', session.user.id)
          .single();

        if (!profile) return;

        redirectBasedOnProfile(profile as AppProfile);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked password reset link — show the new-password form
        setIsPasswordRecovery(true);
        setIsLogin(false);
        setForgotPassword(false);
        return;
      }
      if (session && event === 'SIGNED_IN' && !isPasswordRecovery) {
        // Fetch user profile to determine where to redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, profile_completed, is_rbq_verified, professional_type')
          .eq('id', session.user.id)
          .single();

        if (!profile) return;

        redirectBasedOnProfile(profile as AppProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isPasswordRecovery]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
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
      const msg = error instanceof Error ? error.message : "Erreur lors de l'envoi.";
      toast({ variant: "destructive", title: "Erreur", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Erreur", description: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (!isPasswordValid(newPassword)) {
      toast({ variant: "destructive", title: "Mot de passe invalide", description: "Le mot de passe doit contenir 8+ caractères, une majuscule, un chiffre et un caractère spécial." });
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
    setLoading(true);

    try {
      // Basic validation - professional details will be collected after email confirmation
      if (!email || !password || !fullName) {
        toast({
          variant: "destructive",
          title: t('auth.messages.missing_fields'),
          description: t('auth.messages.missing_fields_description'),
        });
        setLoading(false);
        return;
      }

      // Professionnel métier — spécialité obligatoire
      if (userType === "professional" && professionalType === "trade_professional") {
        if (!tradeSpecialty) {
          toast({ variant: "destructive", title: "Corps de métier requis", description: "Sélectionnez votre spécialité." });
          setLoading(false);
          return;
        }
      }

      // Password complexity validation
      if (!isPasswordValid(password)) {
        toast({
          variant: "destructive",
          title: "Mot de passe trop faible",
          description: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.",
        });
        setLoading(false);
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

      // Check if email confirmation is required
      const needsEmailConfirmation = !authData.session;

      if (needsEmailConfirmation) {
        // Email confirmation is required (production mode)
        toast({
          title: t('auth.messages.success'),
          description: userType === "professional"
            ? "Un email de confirmation vous a été envoyé. Après confirmation, vous pourrez compléter votre profil professionnel."
            : "Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception.",
        });
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
          is_rbq_verified: false,
          professional_type: userType === "professional" ? professionalType : null,
        });

        navigate(nextRoute);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('auth.messages.signup_error');
      toast({
        variant: "destructive",
        title: t('auth.messages.error'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      if (!authData.user) throw new Error(t('auth.messages.no_user_logged'));
      
      // Fetch user profile to determine where to redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name, profile_completed, is_rbq_verified, professional_type')
        .eq('id', authData.user.id)
        .single();

      const userProfile = profile as (AppProfile & {
        full_name: string;
      }) | null;

      toast({
        title: t('auth.messages.login_success'),
        description: userProfile?.full_name
          ? t('auth.messages.welcome', { name: userProfile.full_name })
          : t('auth.messages.welcome_default'),
      });

      redirectBasedOnProfile(userProfile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('auth.messages.invalid_credentials');
      toast({
        variant: "destructive",
        title: t('auth.messages.error'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-3 sm:p-4 py-6 sm:py-8 pt-safe pb-safe">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="space-y-2 sm:space-y-3 md:space-y-4 text-center px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="BâtirNet Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 rounded-lg object-cover"
            />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl">
              {isPasswordRecovery
                ? "Nouveau mot de passe"
                : forgotPassword
                ? "Mot de passe oublié"
                : isLogin ? t('auth.login.title') : t('auth.signup.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isPasswordRecovery
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

          {/* Password Recovery Form */}
          {isPasswordRecovery ? (
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
                    onClick={() => { setForgotPassword(true); setForgotEmail(email); }}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
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
                      <p className="font-medium">Après confirmation de votre courriel :</p>
                      <p>• Vous serez invité à uploader votre <strong>licence RBQ</strong> et votre <strong>assurance responsabilité civile</strong>.</p>
                      <p>• Vos documents seront vérifiés sous 24-48h avant activation de votre compte.</p>
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
                      Corps de métier *
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
                      {tradeSpecialty === 'electricien' && "Licence délivrée par la CMEQ (Corporation des maîtres électriciens du Québec)"}
                      {tradeSpecialty === 'plombier' && "Licence délivrée par la CMMTQ (Corporation des maîtres mécaniciens en tuyauterie du Québec)"}
                      {tradeSpecialty && tradeSpecialty !== 'electricien' && tradeSpecialty !== 'plombier' && "Carte de compétence CCQ obligatoire pour tous les travailleurs de la construction au Québec"}
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
                      <p className="font-medium">Après confirmation de votre courriel :</p>
                      <p>• Vous serez invité à uploader votre <strong>carte de compétence CCQ</strong> pour compléter votre profil.</p>
                      {tradeSpecialty === 'electricien' && <p>• Les électriciens sont réglementés par la <strong>CMEQ</strong>.</p>}
                      {tradeSpecialty === 'plombier' && <p>• Les plombiers/mécaniciens sont réglementés par la <strong>CMMTQ</strong>.</p>}
                      <p>• Vos documents seront examinés sous 24-48h.</p>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.signup.button_loading') : t('auth.signup.button')}
              </Button>
            </form>
          )}

          {!forgotPassword && !isPasswordRecovery && (
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
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
    </div>
  );
};

export default Auth;
