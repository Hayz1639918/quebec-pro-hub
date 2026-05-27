import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Phone, Mail, Home, Loader2, CheckCircle2, Lock, Eye, EyeOff, Shield, XCircle, Lightbulb } from "lucide-react";

// Password validation helpers
const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
};
function getPasswordStrength(pw: string) {
  return {
    minLength: pw.length >= PASSWORD_RULES.minLength,
    hasUppercase: PASSWORD_RULES.hasUppercase.test(pw),
    hasNumber: PASSWORD_RULES.hasNumber.test(pw),
    hasSpecial: PASSWORD_RULES.hasSpecial.test(pw),
  };
}
function isPasswordValid(pw: string) {
  const s = getPasswordStrength(pw);
  return s.minLength && s.hasUppercase && s.hasNumber && s.hasSpecial;
}

type ClientProfileFields = {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  user_type?: string;
};

const ClientProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ClientProfileFields>({});
  const [saved, setSaved] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }
      setUserId(session.user.id);
      await fetchProfile(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (error) return console.error(error);
    if (data?.user_type !== 'client') {
      navigate("/pro/profile");
      return;
    }
    setProfile(data);
  };

  const saveProfile = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name || null,
          phone: profile.phone || null,
          address: profile.address || null,
          city: profile.city || null,
          region: profile.region || null,
          postal_code: profile.postal_code || null,
        })
        .eq('id', userId);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: 'Profil enregistré', description: 'Vos informations ont été mises à jour.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder le profil.' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!profile.email) return;
    if (!currentPassword) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez entrer votre mot de passe actuel.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    if (!isPasswordValid(newPassword)) {
      toast({ variant: 'destructive', title: 'Mot de passe trop faible', description: 'Le mot de passe doit contenir 8+ caractères, une majuscule, un chiffre et un caractère spécial.' });
      return;
    }
    setSavingPw(true);
    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email as string,
        password: currentPassword,
      });
      if (signInError) {
        toast({ variant: 'destructive', title: 'Mot de passe actuel incorrect', description: 'Veuillez vérifier votre mot de passe actuel.' });
        return;
      }
      // Update to new password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été mis à jour avec succès.' });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de changer le mot de passe.' });
    } finally {
      setSavingPw(false);
    }
  };

  // Calculate profile completeness
  const getCompleteness = () => {
    const fields = [profile.full_name, profile.phone, profile.address, profile.city, profile.postal_code];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const completeness = getCompleteness();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Mon profil</h1>
            <p className="text-muted-foreground">
              Ces informations seront utilisées pour pré-remplir vos contrats et documents
            </p>
          </div>

          {/* Completeness indicator */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profil complété</span>
                <span className="text-sm text-muted-foreground">{completeness}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${completeness === 100 ? 'bg-green-500' : 'bg-primary'}`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              {completeness < 100 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Complétez votre profil pour que vos contrats soient automatiquement remplis
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Ces informations apparaîtront dans vos contrats et documents officiels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identity */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nom complet
                  </Label>
                  <Input 
                    value={profile.full_name || ''} 
                    onChange={e => setProfile({ ...profile, full_name: e.target.value })} 
                    placeholder="Jean Tremblay"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Téléphone
                    </Label>
                    <Input 
                      value={profile.phone || ''} 
                      onChange={e => setProfile({ ...profile, phone: e.target.value })} 
                      placeholder="(514) 123-4567"
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Courriel
                    </Label>
                    <Input 
                      value={profile.email || ''} 
                      disabled
                      className="bg-slate-100"
                    />
                    <p className="text-xs text-muted-foreground">Le courriel ne peut pas être modifié ici</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Adresse
                </h4>
                
                <div className="space-y-2">
                  <Label>Adresse (numéro et rue)</Label>
                  <Input 
                    value={profile.address || ''} 
                    onChange={e => setProfile({ ...profile, address: e.target.value })} 
                    placeholder="123 rue Exemple, app. 4"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input 
                      value={profile.city || ''} 
                      onChange={e => setProfile({ ...profile, city: e.target.value })} 
                      placeholder="Montréal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Région / Province</Label>
                    <Input 
                      value={profile.region || ''} 
                      onChange={e => setProfile({ ...profile, region: e.target.value })} 
                      placeholder="Québec"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Code postal
                    </Label>
                    <Input 
                      value={profile.postal_code || ''} 
                      onChange={e => setProfile({ ...profile, postal_code: e.target.value.toUpperCase() })} 
                      placeholder="H2X 1Y4"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={saveProfile} disabled={saving} className="min-w-32">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Enregistré
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-primary" />
                Sécurité du compte
              </CardTitle>
              <CardDescription>Modifiez votre mot de passe de connexion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Mot de passe actuel
                </Label>
                <div className="relative">
                  <Input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 car., majuscule, chiffre, spécial"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Strength indicator */}
                {newPassword.length > 0 && (
                  <ul className="space-y-1 mt-1">
                    {[
                      { key: 'minLength', label: '8 caractères minimum' },
                      { key: 'hasUppercase', label: 'Une lettre majuscule' },
                      { key: 'hasNumber', label: 'Un chiffre' },
                      { key: 'hasSpecial', label: 'Un caractère spécial (!@#$...)' },
                    ].map(({ key, label: ruleLabel }) => {
                      const ok = getPasswordStrength(newPassword)[key as keyof ReturnType<typeof getPasswordStrength>];
                      return (
                        <li key={key} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {ok ? <CheckCircle2 className="h-3 w-3 flex-shrink-0" /> : <XCircle className="h-3 w-3 flex-shrink-0" />}
                          {ruleLabel}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Confirm new password */}
              <div className="space-y-2">
                <Label>Confirmer le nouveau mot de passe</Label>
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le nouveau mot de passe"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button
                  onClick={changePassword}
                  disabled={savingPw || !currentPassword || !newPassword || !confirmPassword}
                  variant="outline"
                  className="min-w-40"
                >
                  {savingPw ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Modification...</>
                  ) : (
                    'Changer le mot de passe'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-1.5"><Lightbulb className="h-4 w-4" />Pourquoi remplir ces informations ?</h4>
            <p className="text-sm text-blue-800">
              Vos informations seront automatiquement insérées dans les contrats que vous recevrez des entrepreneurs.
              Plus votre profil est complet, moins vous aurez de champs à remplir lors de la signature.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientProfile;







