import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Building2, Phone, FileText, Upload, CheckCircle2, MapPin, Mail, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { geocodePostalCode } from "@/lib/geolocation";
import logo from "/logo-batirnet.png";

type UserType = "client" | "professional";

const CompleteProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userType, setUserType] = useState<UserType>("client");
  const [rbqFile, setRbqFile] = useState<File | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Professional-specific fields
  const [companyName, setCompanyName] = useState("");
  const [rbqNumber, setRbqNumber] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [insuranceInfo, setInsuranceInfo] = useState("");
  
  // Location fields for professionals
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

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No session, redirect to auth
        navigate("/auth");
        return;
      }

      // Check if user already has a complete profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, user_type')
        .eq('id', session.user.id)
        .single();

      if (profile && profile.full_name) {
        // Profile already complete, redirect appropriately
        if (profile.user_type === 'client') {
          navigate("/dashboard");
        } else {
          navigate("/pro-dashboard");
        }
        return;
      }

      // User needs to complete profile
      setUserId(session.user.id);
      setUserEmail(session.user.email || "");
      
      // Pre-fill name from Google metadata if available
      const googleName = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || 
                        "";
      setFullName(googleName);
      
      setCheckingSession(false);
    };

    checkSession();
  }, [navigate]);

  // Auto-geocode when postal code changes (for professionals)
  useEffect(() => {
    if (userType !== "professional" || !postalCode || postalCode.length < 6) {
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
  }, [postalCode, city, userType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, JPG, PNG)
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

  const uploadRBQCertification = async (userId: string): Promise<string | null> => {
    if (!rbqFile) return null;

    try {
      const fileExt = rbqFile.name.split('.').pop();
      const fileName = `${userId}-rbq-${Date.now()}.${fileExt}`;
      const filePath = `rbq-certifications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certifications')
        .upload(filePath, rbqFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('certifications')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading RBQ certification:', error);
      toast({
        variant: "destructive",
        title: t('auth.messages.upload_error'),
        description: t('auth.messages.upload_error_description'),
      });
      return null;
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        variant: "destructive",
        title: t('auth.messages.error'),
        description: "Session invalide. Veuillez vous reconnecter.",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Validate required fields
      if (!fullName.trim()) {
        toast({
          variant: "destructive",
          title: t('auth.messages.missing_fields'),
          description: "Le nom complet est requis.",
        });
        setLoading(false);
        return;
      }

      // Validate professional-specific fields
      if (userType === "professional") {
        if (!companyName || !rbqNumber) {
          toast({
            variant: "destructive",
            title: t('auth.messages.missing_fields'),
            description: t('auth.messages.missing_fields_description'),
          });
          setLoading(false);
          return;
        }
        if (!rbqFile) {
          toast({
            variant: "destructive",
            title: t('auth.messages.rbq_required'),
            description: t('auth.messages.rbq_required_description'),
          });
          setLoading(false);
          return;
        }
        // Validate location fields for map visibility
        if (!city || !region || !postalCode) {
          toast({
            variant: "destructive",
            title: "Localisation requise",
            description: "Veuillez renseigner votre ville, région et code postal pour apparaître sur la carte",
          });
          setLoading(false);
          return;
        }
      }

      // Upload RBQ certification for professionals
      let rbqCertificationUrl = null;
      if (userType === "professional" && rbqFile) {
        rbqCertificationUrl = await uploadRBQCertification(userId);
      }

      // Check if profile exists (it might have been auto-created)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      const profileData = {
        id: userId,
        email: userEmail,
        full_name: fullName,
        phone: phone || null,
        user_type: userType,
        company_name: userType === "professional" ? companyName : null,
        rbq_number: userType === "professional" ? rbqNumber : null,
        rbq_certification_url: userType === "professional" ? rbqCertificationUrl : null,
        services_offered: userType === "professional" ? (servicesOffered || null) : null,
        insurance_info: userType === "professional" ? (insuranceInfo || null) : null,
        city: userType === "professional" ? (city || null) : null,
        region: userType === "professional" ? (region || null) : null,
        postal_code: userType === "professional" ? (postalCode || null) : null,
        latitude: userType === "professional" ? latitude : null,
        longitude: userType === "professional" ? longitude : null,
      };

      let profileError;
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId);
        profileError = error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('profiles')
          .insert(profileData);
        profileError = error;
      }

      if (profileError) {
        console.error('Error saving profile:', profileError);
        throw new Error(t('auth.messages.profile_error'));
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
          navigate("/pro-dashboard");
        }
      }, 1000);

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

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Vérification de la session...</p>
        </div>
      </div>
    );
  }

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
              {t('auth.complete_profile.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('auth.complete_profile.subtitle')}
            </CardDescription>
          </div>
          
          {/* Show connected email */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg py-2 px-3">
            <Mail className="h-4 w-4" />
            <span>Connecté avec: <strong>{userEmail}</strong></span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
          {/* User Type Selection */}
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

            <form onSubmit={handleCompleteProfile} className="mt-4">
              {/* Common Fields */}
              <div className="space-y-4">
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

              {/* Professional-specific fields */}
              <TabsContent value="professional" className="space-y-4 mt-4">
                <Separator />
                <p className="text-sm text-muted-foreground">
                  {t('auth.complete_profile.professional_info')}
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="company">{t('auth.signup.company_name')} {t('auth.signup.required')}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      type="text"
                      placeholder={t('auth.signup.company_placeholder')}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-10"
                      required={userType === "professional"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rbq">{t('auth.signup.rbq_number')} {t('auth.signup.required')}</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rbq"
                      type="text"
                      placeholder={t('auth.signup.rbq_number_placeholder')}
                      value={rbqNumber}
                      onChange={(e) => setRbqNumber(e.target.value)}
                      className="pl-10"
                      required={userType === "professional"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rbq-file">{t('auth.signup.rbq_certification')} {t('auth.signup.required')}</Label>
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

                {/* Location fields for map visibility */}
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t('auth.complete_profile.location_title')}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville {t('auth.signup.required')}</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Ex: Montréal"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required={userType === "professional"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Région {t('auth.signup.required')}</Label>
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
                    Code postal {t('auth.signup.required')}
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
                    required={userType === "professional"}
                  />
                  <p className="text-xs text-muted-foreground">
                    📍 Votre code postal permet aux clients de vous trouver sur la carte
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="client" className="mt-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <User className="mx-auto h-12 w-12 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('auth.signup.client_description')}
                  </p>
                </div>
              </TabsContent>

              <Button
                type="submit"
                className="w-full mt-6"
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;

