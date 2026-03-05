import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Building2, Phone, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import logo from "/logo-batirnet.png";

type UserType = "client" | "professional";

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

  // Helper function to redirect based on profile status
  const redirectBasedOnProfile = (profile: {
    user_type: string;
    profile_completed: boolean;
    is_rbq_verified: boolean;
  }) => {
    if (profile.user_type === 'client') {
      navigate("/dashboard");
    } else if (profile.user_type === 'professional') {
      if (!profile.profile_completed) {
        // Professional hasn't completed their profile yet
        navigate("/complete-profile");
      } else if (!profile.is_rbq_verified) {
        // Professional completed profile but waiting for RBQ validation
        navigate("/pending-verification");
      } else {
        // Professional is fully verified
        navigate("/pro/dashboard");
      }
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Fetch user profile to determine where to redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, profile_completed, is_rbq_verified')
          .eq('id', session.user.id)
          .single();

        if (!profile) return;

        redirectBasedOnProfile(profile as {
          user_type: string;
          profile_completed: boolean;
          is_rbq_verified: boolean;
        });
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
          .select('user_type, profile_completed, is_rbq_verified')
          .eq('id', session.user.id)
          .single();

        if (!profile) return;

        redirectBasedOnProfile(profile as {
          user_type: string;
          profile_completed: boolean;
          is_rbq_verified: boolean;
        });
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
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: userType === "professional" 
            ? `${window.location.origin}/complete-profile`
            : `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            user_type: userType,
            phone: phone || null,
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

        // Redirect based on user type
        setTimeout(() => {
          if (userType === "client") {
            navigate("/dashboard");
          } else {
            // Professional needs to complete profile
            navigate("/complete-profile");
          }
        }, 1500);
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
        .select('user_type, full_name, profile_completed, is_rbq_verified')
        .eq('id', authData.user.id)
        .single();
      
      const userProfile = profile as { 
        user_type: UserType; 
        full_name: string;
        profile_completed: boolean;
        is_rbq_verified: boolean;
      } | null;
      
      toast({
        title: t('auth.messages.login_success'),
        description: userProfile?.full_name 
          ? t('auth.messages.welcome', { name: userProfile.full_name })
          : t('auth.messages.welcome_default'),
      });
      
      // Redirect based on user type and profile status
      setTimeout(() => {
        if (!userProfile) {
          navigate("/");
          return;
        }
        
        if (userProfile.user_type === 'client') {
          navigate("/dashboard");
        } else if (userProfile.user_type === 'professional') {
          if (!userProfile.profile_completed) {
            // Professional hasn't completed their profile yet
            navigate("/complete-profile");
          } else if (!userProfile.is_rbq_verified) {
            // Professional completed profile but waiting for RBQ validation
            navigate("/pending-verification");
          } else {
            // Professional is fully verified
            navigate("/pro/dashboard");
          }
        } else {
          navigate("/");
        }
      }, 1000);
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
            // Sign Up Form with Tabs
            <Tabs value={userType} onValueChange={(value) => setUserType(value as UserType)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client">
                  <User className="mr-2 h-4 w-4" />
                  {t('auth.signup.client')}
                </TabsTrigger>
                <TabsTrigger value="professional">
                  <Building2 className="mr-2 h-4 w-4" />
                  {t('auth.signup.professional')}
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSignUp} className="mt-4">
                {/* Common Fields */}
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

                {/* Professional-specific fields - simplified for initial signup */}
                <TabsContent value="professional" className="mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">
                          {t('auth.complete_profile.professional_info')}
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Après confirmation de votre email, vous serez invité à compléter votre profil professionnel avec :
                        </p>
                        <ul className="text-sm text-blue-600 mt-2 space-y-1 list-disc list-inside">
                          <li>Nom de l'entreprise et numéro RBQ</li>
                          <li>Certification RBQ (document)</li>
                          <li>Services offerts et assurance</li>
                          <li>Localisation pour la carte</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="client" className="mt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('auth.signup.client_description')}
                  </p>
                </TabsContent>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? t('auth.signup.button_loading') : t('auth.signup.button')}
            </Button>
          </form>
            </Tabs>
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
