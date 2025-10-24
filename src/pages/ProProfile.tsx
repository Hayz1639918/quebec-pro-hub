import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Availability = 'available' | 'busy' | 'unavailable';

interface PortfolioItem {
  id?: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  project_date?: string | null;
  category?: string | null;
}

const ProProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  type ProProfileFields = {
    services_offered?: string | null;
    city?: string | null;
    region?: string | null;
    postal_code?: string | null;
    website_url?: string | null;
    bio?: string | null;
    hourly_rate_min?: number | string | null;
    hourly_rate_max?: number | string | null;
    daily_rate_min?: number | string | null;
    daily_rate_max?: number | string | null;
    availability_status?: Availability | null;
    available_from?: string | null;
    response_time_hours?: number | string | null;
    accepts_small_projects?: boolean | null;
    minimum_project_budget?: number | string | null;
    travel_distance_km?: number | string | null;
    user_type?: string;
  };
  const [profile, setProfile] = useState<ProProfileFields>({});
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [newItem, setNewItem] = useState<PortfolioItem>({ title: "", description: "", image_url: "", project_date: "", category: "" });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }
      setUserId(session.user.id);
      await fetchProfile(session.user.id);
      await fetchPortfolio(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (error) return console.error(error);
    if (data?.user_type !== 'professional') {
      navigate("/");
      return;
    }
    setProfile(data);
  };

  const fetchPortfolio = async (uid: string) => {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('professional_id', uid)
      .order('project_date', { ascending: false });
    if (!error) setPortfolio(data || []);
  };

  const saveProfile = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          services_offered: profile.services_offered || null,
          city: profile.city || null,
          region: profile.region || null,
          postal_code: profile.postal_code || null,
          website_url: profile.website_url || null,
          bio: profile.bio || null,
          hourly_rate_min: profile.hourly_rate_min ? Number(profile.hourly_rate_min) : null,
          hourly_rate_max: profile.hourly_rate_max ? Number(profile.hourly_rate_max) : null,
          daily_rate_min: profile.daily_rate_min ? Number(profile.daily_rate_min) : null,
          daily_rate_max: profile.daily_rate_max ? Number(profile.daily_rate_max) : null,
          availability_status: (profile.availability_status || null) as Availability | null,
          available_from: profile.available_from || null,
          response_time_hours: profile.response_time_hours ? Number(profile.response_time_hours) : null,
          accepts_small_projects: profile.accepts_small_projects ?? null,
          minimum_project_budget: profile.minimum_project_budget ? Number(profile.minimum_project_budget) : null,
          travel_distance_km: profile.travel_distance_km ? Number(profile.travel_distance_km) : null,
        })
        .eq('id', userId);
      if (error) throw error;
      toast({ title: 'Profil enregistré', description: 'Vos informations ont été mises à jour.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder le profil.' });
    } finally {
      setSaving(false);
    }
  };

  const addPortfolioItem = async () => {
    if (!userId || !newItem.title) return;
    const { error } = await supabase.from('portfolio_items').insert({
      professional_id: userId,
      title: newItem.title,
      description: newItem.description || null,
      image_url: newItem.image_url || null,
      project_date: newItem.project_date || null,
      category: newItem.category || null,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'ajouter l'élément." });
    } else {
      setNewItem({ title: "", description: "", image_url: "", project_date: "", category: "" });
      await fetchPortfolio(userId);
      toast({ title: 'Élément ajouté', description: 'Portfolio mis à jour.' });
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="container mx-auto px-6 lg:px-8 pt-24 pb-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil professionnel</CardTitle>
              <CardDescription>Renseignez vos services, zones et tarifs indicatifs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Services offerts (séparés par des virgules)</Label>
                <Textarea value={profile.services_offered || ''} onChange={e => setProfile({ ...profile, services_offered: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Ville</Label><Input value={profile.city || ''} onChange={e => setProfile({ ...profile, city: e.target.value })} /></div>
                <div className="space-y-2"><Label>Région</Label><Input value={profile.region || ''} onChange={e => setProfile({ ...profile, region: e.target.value })} /></div>
                <div className="space-y-2"><Label>Code postal</Label><Input value={profile.postal_code || ''} onChange={e => setProfile({ ...profile, postal_code: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Taux horaire min (CAD)</Label><Input type="number" value={profile.hourly_rate_min || ''} onChange={e => setProfile({ ...profile, hourly_rate_min: e.target.value })} /></div>
                <div className="space-y-2"><Label>Taux horaire max (CAD)</Label><Input type="number" value={profile.hourly_rate_max || ''} onChange={e => setProfile({ ...profile, hourly_rate_max: e.target.value })} /></div>
                <div className="space-y-2"><Label>Taux journalier min (CAD)</Label><Input type="number" value={profile.daily_rate_min || ''} onChange={e => setProfile({ ...profile, daily_rate_min: e.target.value })} /></div>
                <div className="space-y-2"><Label>Taux journalier max (CAD)</Label><Input type="number" value={profile.daily_rate_max || ''} onChange={e => setProfile({ ...profile, daily_rate_max: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Disponibilité</Label>
                  <Select value={profile.availability_status || 'available'} onValueChange={(v) => setProfile({ ...profile, availability_status: v })}>
                    <SelectTrigger><SelectValue placeholder="Disponibilité" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="busy">Occupé</SelectItem>
                      <SelectItem value="unavailable">Indisponible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Dispo. à partir du</Label><Input type="date" value={profile.available_from || ''} onChange={e => setProfile({ ...profile, available_from: e.target.value })} /></div>
                <div className="space-y-2"><Label>Temps de réponse (h)</Label><Input type="number" value={profile.response_time_hours || ''} onChange={e => setProfile({ ...profile, response_time_hours: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Accepte petits projets</Label><Select value={(profile.accepts_small_projects ?? true) ? 'true' : 'false'} onValueChange={v => setProfile({ ...profile, accepts_small_projects: v === 'true' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='true'>Oui</SelectItem><SelectItem value='false'>Non</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Budget min projet (CAD)</Label><Input type="number" value={profile.minimum_project_budget || ''} onChange={e => setProfile({ ...profile, minimum_project_budget: e.target.value })} /></div>
                <div className="space-y-2"><Label>Distance de déplacement (km)</Label><Input type="number" value={profile.travel_distance_km || ''} onChange={e => setProfile({ ...profile, travel_distance_km: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Site web</Label><Input value={profile.website_url || ''} onChange={e => setProfile({ ...profile, website_url: e.target.value })} /></div>
                <div className="space-y-2"><Label>Bio</Label><Textarea rows={3} value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} /></div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer le profil'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>Ajoutez des réalisations (image URL pour commencer)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Titre</Label><Input value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>Catégorie</Label><Input value={newItem.category || ''} onChange={e => setNewItem({ ...newItem, category: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Image URL</Label><Input value={newItem.image_url || ''} onChange={e => setNewItem({ ...newItem, image_url: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea rows={2} value={newItem.description || ''} onChange={e => setNewItem({ ...newItem, description: e.target.value })} /></div>
                <div className="space-y-2"><Label>Date du projet</Label><Input type="date" value={newItem.project_date || ''} onChange={e => setNewItem({ ...newItem, project_date: e.target.value })} /></div>
              </div>
              <div className="flex justify-end"><Button onClick={addPortfolioItem}>Ajouter au portfolio</Button></div>
              <div className="space-y-3">
                {portfolio.map(item => (
                  <div key={item.id} className="border rounded p-3">
                    <div className="font-medium">{item.title}</div>
                    {item.image_url && <div className="text-sm text-muted-foreground break-all">{item.image_url}</div>}
                    {item.description && <div className="text-sm">{item.description}</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProProfile;
