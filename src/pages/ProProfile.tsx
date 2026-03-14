// ProProfile — Profil professionnel complet
// Intègre Epic 30 (US-106 à US-111) : Profil Métier et Spécialisation

import { useEffect, useState, lazy, Suspense } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, User, Briefcase, Shield, Award, TrendingUp, DollarSign, Settings } from "lucide-react";
import { geocodePostalCode } from "@/lib/geolocation";

// Lazy-load Epic 30 components to avoid large initial bundle
const TradeSelection = lazy(() => import("@/components/pro/TradeSelection"));
const RBQLicenseManager = lazy(() => import("@/components/pro/RBQLicenseManager"));
const InsuranceCertificateManager = lazy(() => import("@/components/pro/InsuranceCertificateManager"));
const CertificationsManager = lazy(() => import("@/components/pro/CertificationsManager"));
const ExperienceStats = lazy(() => import("@/components/pro/ExperienceStats"));
const RateGrid = lazy(() => import("@/components/pro/RateGrid"));

type Availability = "available" | "busy" | "unavailable";

interface ProProfileFields {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
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
}

const SectionLoader = () => (
  <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
    Chargement...
  </div>
);

const ProProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProProfileFields>({});
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [activeTab, setActiveTab] = useState("infos");

  // US-049/US-050 — LinkedIn, certifications, langues
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [certifications, setCertifications] = useState<{ name: string; issuer: string; year: string }[]>([]);
  const [newCert, setNewCert] = useState({ name: "", issuer: "", year: "" });
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const LANGUAGES = ["Français", "English", "Español", "Português", "Arabe", "Mandarin", "Italien"];
  const SERVICE_ZONES = [
    "Montréal", "Laval", "Québec", "Longueuil", "Sherbrooke", "Gatineau",
    "Saguenay", "Lévis", "Trois-Rivières", "Terrebonne", "Repentigny", "Saint-Jean-sur-Richelieu",
  ];
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

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

  // Auto-geocode when postal code changes
  useEffect(() => {
    const postalCode = profile.postal_code;
    if (!postalCode || postalCode.length < 6) {
      setLatitude(null);
      setLongitude(null);
      return;
    }
    const timer = setTimeout(async () => {
      setGeocoding(true);
      try {
        const coords = await geocodePostalCode(postalCode);
        if (coords) {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          toast({ title: "📍 Localisation détectée", description: "Votre profil sera visible sur la carte" });
        } else {
          setLatitude(null);
          setLongitude(null);
        }
      } catch {
        setLatitude(null);
        setLongitude(null);
      } finally {
        setGeocoding(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [profile.postal_code, toast]);

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (error) return console.error(error);
    if (data?.user_type !== "professional") {
      navigate("/");
      return;
    }
    setProfile(data);
    if (data.latitude) setLatitude(data.latitude);
    if (data.longitude) setLongitude(data.longitude);
    // US-050 — LinkedIn + certifications + langues + zones
    if (data.linkedin_url) setLinkedinUrl(data.linkedin_url);
    if (data.certifications) {
      try { setCertifications(JSON.parse(data.certifications)); } catch { /* ignore */ }
    }
    if (data.languages) {
      try { setSelectedLanguages(JSON.parse(data.languages)); } catch { /* ignore */ }
    }
    if (data.service_zones) {
      try { setSelectedZones(JSON.parse(data.service_zones)); } catch { /* ignore */ }
    }
  };

  const saveProfile = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name || null,
          phone: profile.phone || null,
          address: profile.address || null,
          services_offered: selectedServices.length > 0 ? selectedServices.join(', ') : null,
          city: profile.city || null,
          region: profile.region || null,
          postal_code: profile.postal_code || null,
          website_url: profile.website_url || null,
          bio: profile.bio || null,
          latitude,
          longitude,
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
          linkedin_url: linkedinUrl || null,
          certifications: certifications.length > 0 ? JSON.stringify(certifications) : null,
          languages: selectedLanguages.length > 0 ? JSON.stringify(selectedLanguages) : null,
          service_zones: selectedZones.length > 0 ? JSON.stringify(selectedZones) : null,
        })
        .eq("id", userId);
      if (error) throw error;
      toast({ title: "Profil enregistré", description: "Vos informations ont été mises à jour." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder le profil." });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !userId) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mon profil professionnel</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérez vos informations, licences, assurances, certifications et grille tarifaire.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab list — wraps on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex h-auto gap-1 bg-muted/50 p-1 rounded-lg min-w-full sm:min-w-0">
              <TabsTrigger value="infos" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>Informations</span>
              </TabsTrigger>
              <TabsTrigger value="metiers" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span>Métiers</span>
              </TabsTrigger>
              <TabsTrigger value="licences" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Licences &amp; Assurances</span>
                <span className="sm:hidden">Licences</span>
              </TabsTrigger>
              <TabsTrigger value="certifications" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Award className="h-3.5 w-3.5 shrink-0" />
                <span>Certifications</span>
              </TabsTrigger>
              <TabsTrigger value="experience" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span>Expérience</span>
              </TabsTrigger>
              <TabsTrigger value="tarifs" className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                <span>Tarifs</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Tab: Informations générales ── */}
          <TabsContent value="infos" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Informations générales
                </CardTitle>
                <CardDescription>
                  Coordonnées, services, localisation et disponibilité.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom complet</Label>
                      <Input
                        value={profile.full_name || ""}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Votre nom complet"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input
                        value={profile.phone || ""}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="(514) 123-4567"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Adresse (pour les documents officiels)</Label>
                      <Input
                        value={profile.address || ""}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="123 rue Exemple, Montréal, QC"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Site web</Label>
                      <Input
                        value={profile.website_url || ""}
                        onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                        placeholder="https://votresite.ca"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bio / Présentation</Label>
                      <Textarea
                        rows={3}
                        value={profile.bio || ""}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="Décrivez votre expertise en quelques mots..."
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Services & Location */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Services et localisation
                  </h4>
                  <div className="space-y-2">
                    <Label>Services offerts (résumé libre)</Label>
                    <Textarea
                      value={profile.services_offered || ""}
                      onChange={(e) => setProfile({ ...profile, services_offered: e.target.value })}
                      rows={3}
                      placeholder="ex : Plomberie résidentielle, installation chauffe-eau, urgences..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input
                        value={profile.city || ""}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Région</Label>
                      <Input
                        value={profile.region || ""}
                        onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Code postal
                        {geocoding && <span className="text-xs text-muted-foreground">🔄</span>}
                        {!geocoding && latitude && longitude && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Localisé
                          </span>
                        )}
                      </Label>
                      <Input
                        value={profile.postal_code || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, postal_code: e.target.value.toUpperCase() })
                        }
                        maxLength={7}
                        placeholder="H2X 1Y1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Availability */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Disponibilité et préférences
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select
                        value={profile.availability_status || "available"}
                        onValueChange={(v) =>
                          setProfile({ ...profile, availability_status: v as Availability })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">
                            <span className="flex items-center gap-2">
                              <Badge className="h-2 w-2 p-0 rounded-full bg-green-500" />
                              Disponible
                            </span>
                          </SelectItem>
                          <SelectItem value="busy">
                            <span className="flex items-center gap-2">
                              <Badge className="h-2 w-2 p-0 rounded-full bg-amber-500" />
                              Occupé
                            </span>
                          </SelectItem>
                          <SelectItem value="unavailable">
                            <span className="flex items-center gap-2">
                              <Badge className="h-2 w-2 p-0 rounded-full bg-red-500" />
                              Indisponible
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Disponible à partir du</Label>
                      <Input
                        type="date"
                        value={profile.available_from || ""}
                        onChange={(e) => setProfile({ ...profile, available_from: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Temps de réponse (heures)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={profile.response_time_hours || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, response_time_hours: e.target.value })
                        }
                        placeholder="ex : 24"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Accepte petits projets</Label>
                      <Select
                        value={(profile.accepts_small_projects ?? true) ? "true" : "false"}
                        onValueChange={(v) =>
                          setProfile({ ...profile, accepts_small_projects: v === "true" })
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Oui</SelectItem>
                          <SelectItem value="false">Non</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget minimum (CAD)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={profile.minimum_project_budget || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, minimum_project_budget: e.target.value })
                        }
                        placeholder="ex : 500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rayon de déplacement (km)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={profile.travel_distance_km || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, travel_distance_km: e.target.value })
                        }
                        placeholder="ex : 50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={saveProfile} disabled={saving} className="min-w-[180px]">
                    {saving ? "Enregistrement..." : "Enregistrer les informations"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Métiers (US-106) ── */}
          <TabsContent value="metiers" className="mt-0">
            <Suspense fallback={<SectionLoader />}>
              <TradeSelection professionalId={userId} />
            </Suspense>
          </TabsContent>

          {/* ── Tab: Licences & Assurances (US-107 + US-108) ── */}
          <TabsContent value="licences" className="space-y-6 mt-0">
            <Suspense fallback={<SectionLoader />}>
              <RBQLicenseManager professionalId={userId} />
              <InsuranceCertificateManager professionalId={userId} />
            </Suspense>
          </TabsContent>

          {/* ── Tab: Certifications (US-109) ── */}
          <TabsContent value="certifications" className="mt-0">
            <Suspense fallback={<SectionLoader />}>
              <CertificationsManager professionalId={userId} />
            </Suspense>
          </TabsContent>

          {/* ── Tab: Expérience (US-110) ── */}
          <TabsContent value="experience" className="mt-0">
            <Suspense fallback={<SectionLoader />}>
              <ExperienceStats professionalId={userId} />
            </Suspense>
          </TabsContent>

          {/* ── Tab: Tarifs (US-111) ── */}
          <TabsContent value="tarifs" className="mt-0">
            <Suspense fallback={<SectionLoader />}>
              <RateGrid professionalId={userId} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProProfile;
