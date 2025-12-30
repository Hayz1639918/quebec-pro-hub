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
import { User, MapPin, Phone, Mail, Home, Loader2, CheckCircle2 } from "lucide-react";

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
      <main className="container mx-auto px-6 lg:px-8 pt-24 pb-12 flex-1">
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

          {/* Info box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-1">💡 Pourquoi remplir ces informations ?</h4>
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





