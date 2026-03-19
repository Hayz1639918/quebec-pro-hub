// CompleteProfileTrade — Onboarding professionnel de métier après confirmation email
// Redirected from Auth.tsx when professional_type === 'trade_professional'

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { HardHat, MapPin, Upload, CheckCircle2, Loader2, X, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { geocodePostalCode } from "@/lib/geolocation";
import logo from "/logo-batirnet.png";

const TRADE_LABELS: Record<string, string> = {
  electricien: "Électricien",
  plombier: "Plombier / Mécanicien en tuyauterie",
  charpentier: "Charpentier-menuisier",
  macon: "Maçon / Briqueteur",
  peintre: "Peintre en bâtiment",
  carreleur: "Carreleur / Poseur de revêtements",
  couvreur: "Couvreur",
  ferblantier: "Ferblantier",
  calorifugeur: "Calorifugeur",
  excavation: "Opérateur d'excavation / Terrassier",
  soudeur: "Soudeur",
  autre: "Autre corps de métier CCQ",
};

const REGIONS = [
  "Montréal", "Québec", "Laval", "Gatineau", "Longueuil", "Sherbrooke",
  "Saguenay", "Trois-Rivières", "Terrebonne", "Saint-Jean-sur-Richelieu", "Autre",
];

const PREDEFINED_SERVICES = [
  "Rénovation résidentielle", "Construction neuve", "Électricité",
  "Plomberie", "Menuiserie", "Maçonnerie", "Peinture", "Toiture",
  "Isolation", "Carrelage", "Soudure", "Excavation", "Autre",
];

const CompleteProfileTrade = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [tradeSpecialty, setTradeSpecialty] = useState<string>("");

  // Documents
  const [docCCQ, setDocCCQ] = useState<File | null>(null);
  const [docAssurance, setDocAssurance] = useState<File | null>(null);

  // Profile fields
  const [bio, setBio] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState("");

  // Location
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, profile_completed, professional_type, trade_specialty")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.user_type !== "professional") {
        navigate("/");
        return;
      }
      if (profile.profile_completed) {
        navigate("/pro/dashboard");
        return;
      }
      if (profile.professional_type !== "trade_professional") {
        // Entrepreneur who ended up here — redirect to correct page
        navigate("/complete-profile-entrepreneur");
        return;
      }

      setUserId(session.user.id);
      setTradeSpecialty(profile.trade_specialty || "");
      setCheckingAuth(false);
    })();
  }, [navigate]);

  const handlePostalCodeBlur = async () => {
    if (!postalCode || postalCode.length < 3) return;
    setGeocoding(true);
    try {
      const result = await geocodePostalCode(postalCode);
      if (result) {
        setLatitude(result.lat);
        setLongitude(result.lng);
        if (!city && result.city) setCity(result.city);
      }
    } catch { /* ignore */ } finally {
      setGeocoding(false);
    }
  };

  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    if (!userId) return null;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const filePath = `${userId}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("certifications")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return supabase.storage.from("certifications").getPublicUrl(filePath).data.publicUrl;
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const addCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (!trimmed || selectedServices.includes(trimmed)) return;
    setSelectedServices(prev => [...prev, trimmed]);
    setCustomServiceInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!docCCQ) {
      toast({ variant: "destructive", title: "Carte de compétence CCQ obligatoire", description: "Veuillez uploader votre carte de compétence CCQ." });
      return;
    }

    setLoading(true);
    try {
      const ccqUrl = await uploadFile(docCCQ, "ccq");
      const assuranceUrl = docAssurance ? await uploadFile(docAssurance, "assurance") : null;

      const finalRegion = region === "Autre" ? customRegion : region;
      const { error } = await supabase.from("profiles").update({
        professional_type: "trade_professional",
        trade_specialty: tradeSpecialty || null,
        rbq_certification_url: ccqUrl,
        insurance_info: assuranceUrl || null,
        bio: bio.trim() || null,
        services_offered: selectedServices.length > 0 ? JSON.stringify(selectedServices) : null,
        city: city.trim() || null,
        region: finalRegion || null,
        postal_code: postalCode.trim() || null,
        latitude,
        longitude,
        profile_completed: true,
      }).eq("id", userId);

      if (error) throw error;

      toast({ title: "Profil soumis !", description: "Votre dossier est en attente de validation sous 24-48h." });
      navigate("/pending-verification");
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder votre profil." });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="BatirNet" className="h-10" />
          <div className="text-center">
            <h1 className="text-2xl font-bold">Complétez votre profil de métier</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ces informations permettent aux clients et entrepreneurs de vous trouver.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Corps de métier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardHat className="h-4 w-4 text-amber-600" />
                Corps de métier
              </CardTitle>
              <CardDescription>
                {tradeSpecialty
                  ? `Votre spécialité : ${TRADE_LABELS[tradeSpecialty] ?? tradeSpecialty}`
                  : "Spécialité non renseignée"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Description / présentation</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Présentez-vous : années d'expérience, types de chantiers, certifications…"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents obligatoires */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents de vérification</CardTitle>
              <CardDescription>Formats acceptés : PDF, JPG, PNG. Examinés sous 24-48h.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Carte CCQ — obligatoire */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  {tradeSpecialty === "electricien"
                    ? "Carte de compétence / apprenti CMEQ"
                    : tradeSpecialty === "plombier"
                    ? "Carte de compétence / apprenti CMMTQ"
                    : "Carte de compétence CCQ"}
                  <span className="text-red-500 text-xs font-medium ml-1">* obligatoire</span>
                </Label>
                <label
                  htmlFor="doc-ccq"
                  className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    docCCQ ? "border-green-400 bg-green-50" : "border-amber-400 hover:border-amber-500 hover:bg-amber-50/30"
                  }`}
                >
                  <Upload className={`h-4 w-4 ${docCCQ ? "text-green-600" : "text-amber-600"}`} />
                  <span className="text-sm text-muted-foreground truncate">
                    {docCCQ ? docCCQ.name : "Cliquez pour choisir un fichier"}
                  </span>
                  {docCCQ && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto shrink-0" />}
                </label>
                <input
                  id="doc-ccq"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setDocCCQ(e.target.files?.[0] ?? null)}
                />
              </div>

              {/* Assurance — optionnelle */}
              <div className="space-y-1">
                <Label>Assurance responsabilité civile <span className="text-muted-foreground">(recommandé)</span></Label>
                <label
                  htmlFor="doc-assurance"
                  className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    docAssurance ? "border-green-400 bg-green-50" : "border-border hover:border-amber-400/50 hover:bg-amber-50/30"
                  }`}
                >
                  <Upload className={`h-4 w-4 ${docAssurance ? "text-green-600" : "text-muted-foreground"}`} />
                  <span className="text-sm text-muted-foreground truncate">
                    {docAssurance ? docAssurance.name : "Cliquez pour choisir un fichier"}
                  </span>
                  {docAssurance && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto shrink-0" />}
                </label>
                <input
                  id="doc-assurance"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setDocAssurance(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 space-y-1">
                <p className="font-medium">Exigences légales au Québec :</p>
                <p>• La carte de compétence CCQ est obligatoire pour tout travailleur de la construction.</p>
                {tradeSpecialty === "electricien" && <p>• Les électriciens sont réglementés par la CMEQ.</p>}
                {tradeSpecialty === "plombier" && <p>• Les plombiers sont réglementés par la CMMTQ.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Services offerts</CardTitle>
              <CardDescription>Sélectionnez les types de travaux que vous réalisez.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_SERVICES.map(service => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedServices.includes(service)
                        ? "bg-amber-600 text-white border-amber-600"
                        : "border-border hover:border-amber-400 hover:text-amber-600"
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
              {selectedServices.filter(s => !PREDEFINED_SERVICES.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedServices.filter(s => !PREDEFINED_SERVICES.includes(s)).map(s => (
                    <Badge key={s} variant="secondary" className="gap-1">
                      {s}
                      <button type="button" onClick={() => toggleService(s)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Autre service…"
                  value={customServiceInput}
                  onChange={(e) => setCustomServiceInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomService(); }}}
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomService}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal">Code postal</Label>
                  <Input
                    id="postal"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                    onBlur={handlePostalCodeBlur}
                    placeholder="H1A 1A1"
                    maxLength={7}
                  />
                  {geocoding && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Géocodage…</p>}
                  {latitude && !geocoding && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Position détectée</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Montréal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Région</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {region === "Autre" && (
                  <Input
                    value={customRegion}
                    onChange={(e) => setCustomRegion(e.target.value)}
                    placeholder="Précisez votre région"
                    className="mt-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement…</> : "Soumettre mon profil"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileTrade;
