// ProEntrepreneurProfile — Profil général de l'entrepreneur
// US-049 : Configuration du profil complet (photo, bio, services, zones, langues, disponibilités)
// US-050 : Lier LinkedIn et ajouter des certifications générales

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Linkedin, Award, Globe, MapPin, Plus, X, CheckCircle2 } from "lucide-react";

const LANGUAGES = ["Français", "English", "Español", "Português", "Arabe", "Mandarin", "Italien"];

const SERVICE_ZONES = [
  "Montréal", "Laval", "Québec", "Longueuil", "Sherbrooke", "Gatineau",
  "Saguenay", "Lévis", "Trois-Rivières", "Terrebonne", "Repentigny", "Saint-Jean-sur-Richelieu",
];

interface Certification {
  name: string;
  issuer: string;
  year: string;
}

const ProEntrepreneurProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // US-050 — LinkedIn
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // US-050 — Certifications générales (différent des certifications CCQ/métier de US-109)
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [newCert, setNewCert] = useState<Certification>({ name: "", issuer: "", year: "" });

  // US-049 — Langues parlées
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // US-049 — Zones de service
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

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase.from("profiles").select("linkedin_url, certifications, languages, service_zones, user_type").eq("id", uid).single();
    if (error) return console.error(error);
    if (data?.user_type !== "professional") {
      navigate("/");
      return;
    }
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
          linkedin_url: linkedinUrl || null,
          certifications: certifications.length > 0 ? JSON.stringify(certifications) : null,
          languages: selectedLanguages.length > 0 ? JSON.stringify(selectedLanguages) : null,
          service_zones: selectedZones.length > 0 ? JSON.stringify(selectedZones) : null,
        })
        .eq("id", userId);
      if (error) throw error;
      toast({ title: "Profil entrepreneur enregistré", description: "Vos informations ont été mises à jour." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder le profil." });
    } finally {
      setSaving(false);
    }
  };

  const addCertification = () => {
    if (!newCert.name.trim()) return;
    setCertifications(prev => [...prev, newCert]);
    setNewCert({ name: "", issuer: "", year: "" });
  };

  const removeCertification = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleZone = (zone: string) => {
    setSelectedZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  };

  if (loading || !userId) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profil entrepreneur</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            LinkedIn, certifications générales, langues parlées et zones de service couvertes.
          </p>
        </div>

        <div className="space-y-6">

          {/* US-050 — LinkedIn */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-blue-600" />
                LinkedIn
              </CardTitle>
              <CardDescription>Liez votre profil LinkedIn pour renforcer votre crédibilité (US-050)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>URL du profil LinkedIn</Label>
                <Input
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/votre-profil"
                />
              </div>
              {linkedinUrl && (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Profil LinkedIn lié — badge vérifié visible sur votre profil public
                </div>
              )}
            </CardContent>
          </Card>

          {/* US-050 — Certifications générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Certifications et accréditations
              </CardTitle>
              <CardDescription>
                Certifications générales de votre entreprise (ex: ISO, APCHQ, ASP Construction).
                Les licences RBQ et certifications CCQ sont gérées dans le profil métier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {certifications.length > 0 && (
                <div className="space-y-2">
                  {certifications.map((cert, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 border rounded-lg bg-amber-50/50">
                      <Award className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{cert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cert.issuer}{cert.year ? ` · ${cert.year}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCertification(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Nom de la certification"
                  value={newCert.name}
                  onChange={e => setNewCert({ ...newCert, name: e.target.value })}
                />
                <Input
                  placeholder="Organisme émetteur"
                  value={newCert.issuer}
                  onChange={e => setNewCert({ ...newCert, issuer: e.target.value })}
                />
                <Input
                  placeholder="Année"
                  value={newCert.year}
                  onChange={e => setNewCert({ ...newCert, year: e.target.value })}
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCertification}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une certification
              </Button>
            </CardContent>
          </Card>

          {/* US-049 — Langues et zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Langues et zones de service
              </CardTitle>
              <CardDescription>Langues de travail et régions du Québec couvertes (US-049)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Langues parlées</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedLanguages.includes(lang)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary hover:text-primary"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Zones de service
                  {selectedZones.length > 0 && (
                    <Badge variant="secondary">{selectedZones.length} zone{selectedZones.length > 1 ? "s" : ""}</Badge>
                  )}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_ZONES.map(zone => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => toggleZone(zone)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedZones.includes(zone)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-border hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/pro/dashboard")}>
              Retour au tableau de bord
            </Button>
            <Button onClick={saveProfile} disabled={saving} className="min-w-[180px]">
              {saving ? "Enregistrement..." : "Enregistrer le profil entrepreneur"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProEntrepreneurProfile;
