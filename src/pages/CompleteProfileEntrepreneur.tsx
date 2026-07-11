// CompleteProfileEntrepreneur — Onboarding entrepreneur après inscription
// Redirected to from Auth.tsx when professional_type === 'entrepreneur'

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, Plus, X, Loader2, CheckCircle2, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { geocodePostalCode } from "@/lib/geolocation";
import Logo from "@/components/Logo";

const PREDEFINED_SERVICES = [
  "Rénovation résidentielle", "Construction neuve", "Toiture", "Plomberie",
  "Électricité", "Menuiserie", "Maçonnerie", "Peinture", "Isolation",
  "Aménagement paysager", "Cuisine et salle de bain", "Extension et agrandissement",
  "Gestion de projet", "Autre",
];

const REGIONS = [
  "Montréal", "Québec", "Laval", "Gatineau", "Longueuil", "Sherbrooke",
  "Saguenay", "Trois-Rivières", "Terrebonne", "Saint-Jean-sur-Richelieu", "Autre",
];

const CompleteProfileEntrepreneur = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [rbqNumber, setRbqNumber] = useState("");
  const [bio, setBio] = useState("");

  // Documents
  const [docLicence, setDocLicence] = useState<File | null>(null);
  const [docAssurance, setDocAssurance] = useState<File | null>(null);
  const [docIdentity, setDocIdentity] = useState<File | null>(null);
  const [identityType, setIdentityType] = useState<string>("passport");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState("");

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
        .select("user_type, profile_completed, professional_type")
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
      setUserId(session.user.id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!companyName.trim()) {
      toast({ variant: "destructive", title: "Nom de l'entreprise requis" });
      return;
    }
    if (selectedServices.length === 0) {
      toast({ variant: "destructive", title: "Sélectionnez au moins un service" });
      return;
    }

    setLoading(true);
    try {
      // Documents RBQ / assurance / pièce d'identité sont OPTIONNELS : on ne
      // les téléverse que s'ils ont été fournis (ils ajoutent le badge « Vérifié »).
      const licenceUrl = docLicence ? await uploadFile(docLicence, "rbq") : null;
      const assuranceUrl = docAssurance ? await uploadFile(docAssurance, "assurance") : null;
      const identityUrl = docIdentity ? await uploadFile(docIdentity, "identity") : null;

      const finalRegion = region === "Autre" ? customRegion : region;
      const { error } = await supabase.from("profiles").update({
        company_name: companyName.trim(),
        rbq_number: rbqNumber.trim() || null,
        rbq_certification_url: licenceUrl,
        insurance_info: assuranceUrl,
        id_document_url: identityUrl,
        id_document_type: identityUrl ? identityType : null,
        bio: bio.trim() || null,
        services_offered: JSON.stringify(selectedServices),
        city: city.trim() || null,
        region: finalRegion || null,
        postal_code: postalCode.trim() || null,
        latitude: latitude,
        longitude: longitude,
        professional_type: "entrepreneur",
        profile_completed: true,
      } as Record<string, unknown>).eq("id", userId);

      if (error) throw error;

      const hasDocuments = licenceUrl || assuranceUrl || identityUrl;
      toast({
        title: "Profil entrepreneur créé !",
        description: hasDocuments
          ? "Vos documents seront vérifiés sous 24-48h pour obtenir le badge « Vérifié »."
          : "Vous pouvez ajouter votre licence RBQ et vos documents plus tard depuis votre profil.",
      });
      navigate("/pro/dashboard");
    } catch (e) {
      console.error(e);
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
          <Logo size={40} />
          <div className="text-center">
            <h1 className="text-2xl font-bold">Complétez votre profil entrepreneur</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ces informations permettent aux clients de vous trouver et vous contacter.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Entreprise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-blue-600" />
                Informations de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nom de l'entreprise *</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Construction ABC inc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rbq">Numéro de licence RBQ</Label>
                <Input
                  id="rbq"
                  value={rbqNumber}
                  onChange={(e) => setRbqNumber(e.target.value)}
                  placeholder="Ex: 8291-4521-01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Description de l'entreprise</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Présentez votre entreprise, votre expérience, vos spécialités…"
                  rows={3}
                />
              </div>

              {/* Documents obligatoires */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  Documents de vérification (optionnels)
                </Label>
                <p className="text-xs text-muted-foreground">Formats acceptés : PDF, JPG, PNG. Examinés sous 24-48h.</p>

                {/* Licence RBQ */}
                <div className="space-y-1">
                  <Label className="text-sm font-normal flex items-center gap-1">
                    Scan de la licence RBQ
                    <span className="text-muted-foreground text-xs font-medium ml-1">(optionnel)</span>
                  </Label>
                  <label
                    htmlFor="ent-doc-licence"
                    className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      docLicence ? "border-green-400 bg-green-50" : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <Upload className={`h-4 w-4 ${docLicence ? "text-green-600" : "text-muted-foreground"}`} />
                    <span className="text-sm text-muted-foreground truncate">{docLicence ? docLicence.name : "Cliquez pour choisir un fichier"}</span>
                    {docLicence && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto shrink-0" />}
                  </label>
                  <input id="ent-doc-licence" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setDocLicence(e.target.files?.[0] ?? null)} />
                </div>

                {/* Assurance */}
                <div className="space-y-1">
                  <Label className="text-sm font-normal flex items-center gap-1">
                    Certificat d'assurance responsabilité civile
                    <span className="text-muted-foreground text-xs font-medium ml-1">(optionnel)</span>
                  </Label>
                  <label
                    htmlFor="ent-doc-assurance"
                    className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      docAssurance ? "border-green-400 bg-green-50" : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <Upload className={`h-4 w-4 ${docAssurance ? "text-green-600" : "text-muted-foreground"}`} />
                    <span className="text-sm text-muted-foreground truncate">{docAssurance ? docAssurance.name : "Cliquez pour choisir un fichier"}</span>
                    {docAssurance && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto shrink-0" />}
                  </label>
                  <input id="ent-doc-assurance" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setDocAssurance(e.target.files?.[0] ?? null)} />
                </div>

                {/* Pièce d'identité */}
                <div className="space-y-2">
                  <Label className="text-sm font-normal flex items-center gap-1">
                    Pièce d'identité
                    <span className="text-muted-foreground text-xs font-medium ml-1">(optionnel)</span>
                  </Label>
                  <Select value={identityType} onValueChange={setIdentityType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type de pièce d'identité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passeport</SelectItem>
                      <SelectItem value="driver_license">Permis de conduire</SelectItem>
                      <SelectItem value="ramq">Carte RAMQ</SelectItem>
                      <SelectItem value="other">Autre pièce avec photo</SelectItem>
                    </SelectContent>
                  </Select>
                  <label
                    htmlFor="ent-doc-identity"
                    className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      docIdentity ? "border-green-400 bg-green-50" : "border-border hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <Upload className={`h-4 w-4 ${docIdentity ? "text-green-600" : "text-muted-foreground"}`} />
                    <span className="text-sm text-muted-foreground truncate">{docIdentity ? docIdentity.name : "Cliquez pour choisir un fichier"}</span>
                    {docIdentity && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto shrink-0" />}
                  </label>
                  <input id="ent-doc-identity" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setDocIdentity(e.target.files?.[0] ?? null)} />
                  <p className="text-xs text-muted-foreground">
                    Toute pièce officielle avec photo est acceptée. Votre document est confidentiel et examiné par notre équipe.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                  <p className="font-medium">Documents optionnels — pour obtenir le badge « Vérifié » :</p>
                  <p>• Ajouter votre licence RBQ rassure les clients pour les contrats de construction.</p>
                  <p>• Le certificat d'assurance responsabilité civile renforce la confiance.</p>
                  <p>• Vous pouvez compléter ces documents plus tard depuis votre profil.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Services offerts *</CardTitle>
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
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-border hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>

              {selectedServices.length > 0 && (
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
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement…</> : "Créer mon profil entrepreneur"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileEntrepreneur;
