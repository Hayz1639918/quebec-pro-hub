import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, FileText, Upload, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { geocodePostalCode } from "@/lib/geolocation";
import logo from "/logo-batirnet.png";

const CompleteProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [rbqFile, setRbqFile] = useState<File | null>(null);
  
  // Professional-specific fields
  const [companyName, setCompanyName] = useState("");
  const [rbqNumber, setRbqNumber] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [insuranceInfo, setInsuranceInfo] = useState("");
  
  // Location fields
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const REGIONS = [
    "Montréal",
    "Québec",
    "Laval",
    "Gatineau",
    "Longueuil",
    "Sherbrooke",
    "Saguenay",
    "Trois-Rivières",
    "Terrebonne",
    "Saint-Jean-sur-Richelieu",
  ];

  // Check if user is authenticated and needs to complete profile
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No session, redirect to auth
        navigate("/auth");
        return;
      }

      // Check if user is a professional and profile is incomplete
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, profile_completed, company_name')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        // Profile doesn't exist yet (shouldn't happen with trigger)
        navigate("/auth");
        return;
      }

      if (profile.user_type === 'client' || profile.profile_completed) {
        // Client or already completed, redirect to appropriate dashboard
        navigate(profile.user_type === 'client' ? "/dashboard" : "/");
        return;
      }

      setUserId(session.user.id);
      setCheckingAuth(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Auto-geocode when postal code changes
  useEffect(() => {
    if (!postalCode || postalCode.length < 6) {
      setLatitude(null);
      setLongitude(null);
      return;
    }

    const geocodeWithDelay = async () => {
      setGeocoding(true);
      try {
        const coords = await geocodePostalCode(postalCode, city || undefined);
        if (coords) {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
        } else {
          setLatitude(null);
          setLongitude(null);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setLatitude(null);
        setLongitude(null);
      } finally {
        setGeocoding(false);
      }
    };

    const timer = setTimeout(() => {
      geocodeWithDelay();
    }, 500);

    return () => clearTimeout(timer);
  }, [postalCode, city]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: t('auth.messages.invalid_file_type'),
          description: t('auth.messages.invalid_file_type_description'),
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: t('auth.messages.file_too_large'),
          description: t('auth.messages.file_too_large_description'),
        });
        return;
      }
      setRbqFile(file);
    }
  };

  const uploadRBQCertification = async (): Promise<string | null> => {
    if (!rbqFile || !userId) return null;

    try {
      const fileExt = rbqFile.name.split('.').pop()?.toLowerCase();
      const fileName = `rbq-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      console.log('Uploading file:', { fileName, filePath, fileType: rbqFile.type });

      const { data, error: uploadError } = await supabase.storage
        .from('certifications')
        .upload(filePath, rbqFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('certifications')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading RBQ certification:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'upload",
        description: error?.message || "Erreur lors du téléchargement du fichier",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Session expirée. Veuillez vous reconnecter.",
      });
      navigate("/auth");
      return;
    }

    // Validate required fields
    if (!companyName || !rbqNumber) {
      toast({
        variant: "destructive",
        title: t('auth.messages.missing_fields'),
        description: t('auth.messages.missing_fields_description'),
      });
      return;
    }

    if (!rbqFile) {
      toast({
        variant: "destructive",
        title: t('auth.messages.rbq_required'),
        description: t('auth.messages.rbq_required_description'),
      });
      return;
    }

    if (!city || !region || !postalCode) {
      toast({
        variant: "destructive",
        title: "Localisation requise",
        description: "Veuillez renseigner votre ville, région et code postal",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload RBQ certification
      const rbqCertificationUrl = await uploadRBQCertification();

      // Update profile with professional details
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          company_name: companyName,
          rbq_number: rbqNumber,
          rbq_certification_url: rbqCertificationUrl,
          services_offered: servicesOffered || null,
          insurance_info: insuranceInfo || null,
          city: city,
          region: region,
          postal_code: postalCode,
          latitude: latitude,
          longitude: longitude,
          location_last_updated: new Date().toISOString(),
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error("Impossible de mettre à jour le profil");
      }

      toast({
        title: "Profil complété ! 🎉",
        description: "Votre profil professionnel est maintenant actif. Nous vérifierons votre certification RBQ sous peu.",
      });

      // Redirect to home
      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="space-y-3 text-center px-6 py-6">
          <div className="flex justify-center">
            <img 
              src={logo} 
              alt="BâtirNet Logo" 
              className="h-14 w-14 rounded-lg object-cover"
            />
          </div>
          <div>
            <CardTitle className="text-2xl">
              {t('auth.complete_profile.title')}
            </CardTitle>
            <CardDescription>
              {t('auth.complete_profile.subtitle')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">{t('auth.signup.company_name')} *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    type="text"
                    placeholder={t('auth.signup.company_placeholder')}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rbq">{t('auth.signup.rbq_number')} *</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rbq"
                    type="text"
                    placeholder={t('auth.signup.rbq_number_placeholder')}
                    value={rbqNumber}
                    onChange={(e) => setRbqNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rbq-file">{t('auth.signup.rbq_certification')} *</Label>
                <div className="relative">
                  <Input
                    id="rbq-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="rbq-file"
                    className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <div className="text-center space-y-2">
                      {rbqFile ? (
                        <>
                          <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
                          <p className="text-sm font-medium">{rbqFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('auth.signup.rbq_uploaded')}
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {t('auth.signup.rbq_upload')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('auth.signup.rbq_upload_hint')}
                          </p>
                        </>
                      )}
                    </div>
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="services">{t('auth.signup.services_offered')}</Label>
                <Textarea
                  id="services"
                  placeholder={t('auth.signup.services_placeholder')}
                  value={servicesOffered}
                  onChange={(e) => setServicesOffered(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance">{t('auth.signup.insurance_info')}</Label>
                <Textarea
                  id="insurance"
                  placeholder={t('auth.signup.insurance_placeholder')}
                  value={insuranceInfo}
                  onChange={(e) => setInsuranceInfo(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {t('auth.complete_profile.location_title')}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Ex: Montréal"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Région *</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((reg) => (
                        <SelectItem key={reg} value={reg}>
                          {reg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="flex items-center gap-2">
                  Code postal *
                  {geocoding && (
                    <span className="text-xs text-muted-foreground">
                      🔄 Géolocalisation en cours...
                    </span>
                  )}
                  {!geocoding && latitude && longitude && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Position détectée ✓
                    </span>
                  )}
                </Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="Ex: H2X 1Y4"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                  maxLength={7}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  📍 Votre code postal permet aux clients de vous trouver sur la carte
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.complete_profile.button_loading')}
                </>
              ) : (
                t('auth.complete_profile.button')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;

