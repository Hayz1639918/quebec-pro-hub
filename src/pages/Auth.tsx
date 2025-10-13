import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Chrome, User, Building2, Phone, FileText, Upload, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import logo from "@/assets/logo-batirnet.jpeg";

type UserType = "client" | "professional";

const Auth = () => {
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

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, JPG, PNG)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Format de fichier invalide",
          description: "Veuillez télécharger un fichier PDF, JPG ou PNG",
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 5 Mo",
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
        title: "Erreur lors du téléchargement",
        description: "Impossible de télécharger la certification RBQ",
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
            title: "Champs requis manquants",
            description: "Veuillez remplir tous les champs obligatoires",
          });
          setLoading(false);
          return;
        }
        if (!rbqFile) {
          toast({
            variant: "destructive",
            title: "Certification RBQ requise",
            description: "Veuillez télécharger votre certification RBQ",
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
      if (!authData.user) throw new Error("Aucun utilisateur créé");

      // Upload RBQ certification for professionals
      let rbqCertificationUrl = null;
      if (userType === "professional" && rbqFile) {
        rbqCertificationUrl = await uploadRBQCertification(authData.user.id);
      }

      // Save user profile to database
      const profileData = {
        id: authData.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
        user_type: userType,
        ...(userType === "professional" ? {
          company_name: companyName,
          rbq_number: rbqNumber,
          rbq_certification_url: rbqCertificationUrl,
          services_offered: servicesOffered || null,
          insurance_info: insuranceInfo || null,
        } : {}),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // If profile creation fails, we should inform the user
        throw new Error('Impossible de créer le profil utilisateur');
      }

      toast({
        title: "Inscription réussie ! 🎉",
        description: userType === "professional" 
          ? "Votre compte professionnel a été créé. Nous vérifierons votre certification RBQ sous peu."
          : "Votre compte a été créé avec succès !",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription";
      toast({
        variant: "destructive",
        title: "Erreur",
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur BâtirNet !",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Email ou mot de passe incorrect";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Impossible de se connecter avec Google";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img 
              src={logo} 
              alt="BâtirNet Logo" 
              className="h-16 w-16 rounded-lg object-cover"
            />
          </div>
          <div>
            <CardTitle className="text-2xl">
              {isLogin ? "Connexion" : "Inscription"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Connectez-vous à votre compte BâtirNet" 
                : "Créez votre compte BâtirNet"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLogin && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              type="button"
            >
              <Chrome className="mr-2 h-5 w-5" />
              Continuer avec Google
            </Button>
          )}

          {!isLogin && (
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                OU
              </span>
            </div>
          )}

          {isLogin ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
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
                {loading ? "Chargement..." : "Se connecter"}
              </Button>
            </form>
          ) : (
            // Sign Up Form with Tabs
            <Tabs value={userType} onValueChange={(value) => setUserType(value as UserType)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client">
                  <User className="mr-2 h-4 w-4" />
                  Client
                </TabsTrigger>
                <TabsTrigger value="professional">
                  <Building2 className="mr-2 h-4 w-4" />
                  Professionnel
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSignUp} className="mt-4">
                {/* Common Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Adresse email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="nom@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Minimum 6 caractères"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullname">Nom complet *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullname"
                        type="text"
                        placeholder="Jean Dupont"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(514) 123-4567"
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
                    <Label htmlFor="company">Nom de l'entreprise *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        type="text"
                        placeholder="Construction ABC Inc."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="pl-10"
                        required={userType === "professional"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rbq">Numéro RBQ *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rbq"
                        type="text"
                        placeholder="1234-5678-01"
                        value={rbqNumber}
                        onChange={(e) => setRbqNumber(e.target.value)}
                        className="pl-10"
                        required={userType === "professional"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rbq-file">Certification RBQ *</Label>
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
                                Cliquez pour changer
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                Télécharger la certification RBQ
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PDF, JPG ou PNG (max 5 Mo)
                              </p>
                            </>
                          )}
                        </div>
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="services">Services offerts</Label>
                    <Textarea
                      id="services"
                      placeholder="Ex: Rénovation résidentielle, construction neuve, toiture..."
                      value={servicesOffered}
                      onChange={(e) => setServicesOffered(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance">Informations sur l'assurance</Label>
                    <Textarea
                      id="insurance"
                      placeholder="Nom de l'assureur, numéro de police..."
                      value={insuranceInfo}
                      onChange={(e) => setInsuranceInfo(e.target.value)}
                      rows={2}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="client" className="mt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    En tant que client, vous pourrez créer des projets, demander des devis 
                    et collaborer avec des entrepreneurs qualifiés.
                  </p>
                </TabsContent>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? "Création du compte..." : "Créer mon compte"}
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
                ? "Pas encore de compte ? S'inscrire" 
                : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
