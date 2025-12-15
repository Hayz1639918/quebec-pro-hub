import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Building2, Phone, FileText, Upload, CheckCircle2, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { geocodePostalCode } from "@/lib/geolocation";
import logo from "/logo-batirnet.png";

type UserType = "client" | "professional";
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

const Auth = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [userType, setUserType] = useState<UserType>("client");
  const [loading, setLoading] = useState(false);
  const [rbqFile, setRbqFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    // Check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Fetch user profile to determine where to redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
        
        if (profile && (profile as { user_type: UserType }).user_type === 'client') {
          navigate("/dashboard");
        } else if (profile) {
        navigate("/");
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        // Fetch user profile to determine where to redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
        
        if (profile && (profile as { user_type: UserType }).user_type === 'client') {
          navigate("/dashboard");
        } else if (profile) {
        navigate("/");
        }
      }
    });

    return () => subscription.unsubscribe();
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            user_type: userType,
          }
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error(t('auth.messages.no_user_created'));

      // Upload RBQ certification for professionals
      let rbqCertificationUrl = null;
      if (userType === "professional" && rbqFile) {
        rbqCertificationUrl = await uploadRBQCertification(authData.user.id);
      }

      // Save user profile to database
      const profileData: {
        id: string;
        email: string;
        full_name: string;
        phone: string | null;
        user_type: string;
        company_name: string | null;
        rbq_number: string | null;
        rbq_certification_url: string | null;
        services_offered: string | null;
        insurance_info: string | null;
        city: string | null;
        region: string | null;
        postal_code: string | null;
        latitude: number | null;
        longitude: number | null;
      } = {
        id: authData.user.id,
        email,
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

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // If profile creation fails, we should inform the user
        throw new Error(t('auth.messages.profile_error'));
      }

      toast({
        title: t('auth.messages.success'),
        description: userType === "professional" 
          ? t('auth.messages.success_pro')
          : t('auth.messages.success_client'),
      });

      // Redirect based on user type
      if (userType === "client") {
        // For clients, redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        // For professionals, redirect to home (they need RBQ verification first)
        setTimeout(() => {
          navigate("/");
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
        .select('user_type, full_name')
        .eq('id', authData.user.id)
        .single();
      
      const userProfile = profile as { user_type: UserType; full_name: string } | null;
      
      toast({
        title: t('auth.messages.login_success'),
        description: userProfile?.full_name 
          ? t('auth.messages.welcome', { name: userProfile.full_name })
          : t('auth.messages.welcome_default'),
      });
      
      // Redirect based on user type
      setTimeout(() => {
        if (userProfile && userProfile.user_type === 'client') {
          navigate("/dashboard");
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
              {isLogin ? t('auth.login.title') : t('auth.signup.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isLogin 
                ? t('auth.subtitle_login')
                : t('auth.subtitle_signup')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
          {isLogin ? (
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
              <Label htmlFor="password">{t('auth.login.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.login.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
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
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder={t('auth.signup.password_placeholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
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

                {/* Professional-specific fields */}
                <TabsContent value="professional" className="space-y-4 mt-4">
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
                      Localisation (pour apparaître sur la carte)
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
