import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { geocodePostalCode } from "@/lib/geolocation";

const NewProject = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const CATEGORIES = [
    t('professionals.filters.services.residential_renovation'),
    t('professionals.filters.services.new_construction'),
    t('professionals.filters.services.roofing'),
    t('professionals.filters.services.plumbing'),
    t('professionals.filters.services.electricity'),
    t('professionals.filters.services.carpentry'),
    t('professionals.filters.services.masonry'),
    t('professionals.filters.services.painting'),
    t('professionals.filters.services.insulation'),
    t('professionals.filters.services.landscaping'),
    t('projects.filters.kitchen_bathroom'),
    t('projects.filters.extension'),
  ];

  const REGIONS = [
    t('professionals.filters.regions.montreal'),
    t('professionals.filters.regions.quebec'),
    t('professionals.filters.regions.laval'),
    t('professionals.filters.regions.gatineau'),
    t('professionals.filters.regions.longueuil'),
    t('professionals.filters.regions.sherbrooke'),
    t('professionals.filters.regions.saguenay'),
    t('professionals.filters.regions.trois_rivieres'),
    t('professionals.filters.regions.terrebonne'),
    t('professionals.filters.regions.saint_jean'),
  ];
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [files, setFiles] = useState<File[]>([]);
  
  // Geolocation
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  // Auto-geocode when postal code changes
  useEffect(() => {
    const geocodeWithDelay = async () => {
      if (postalCode.length >= 6) { // Canadian postal code without space
        setGeocoding(true);
        try {
          const coords = await geocodePostalCode(postalCode);
          if (coords) {
            setLatitude(coords.latitude);
            setLongitude(coords.longitude);
            toast({
              title: "📍 Localisation détectée",
              description: "Votre projet sera visible sur la carte",
            });
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
      } else {
        setLatitude(null);
        setLongitude(null);
      }
    };

    // Debounce geocoding (wait 500ms after user stops typing)
    const timer = setTimeout(() => {
      geocodeWithDelay();
    }, 500);

    return () => clearTimeout(timer);
  }, [postalCode, toast]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        variant: "destructive",
        title: t('new_project.messages.login_required'),
        description: t('new_project.messages.login_required_desc'),
      });
      navigate("/auth?mode=login");
      return;
    }

    // Check if user is a client
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    if (profile?.user_type !== 'client') {
      toast({
        variant: "destructive",
        title: t('new_project.messages.access_denied'),
        description: t('new_project.messages.clients_only'),
      });
      navigate("/dashboard");
      return;
    }

    setUserId(session.user.id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types and sizes
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: t('new_project.messages.invalid_format'),
          description: t('new_project.messages.invalid_format_desc', { filename: file.name }),
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: t('new_project.messages.file_too_large'),
          description: t('new_project.messages.file_too_large_desc', { filename: file.name }),
        });
        return false;
      }
      
      return true;
    });

    setFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadProjectImages = async (projectId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('projects')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('projects')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('new_project.messages.not_logged_in'),
      });
      return;
    }

    // Validation
    if (!title || !description || !category) {
      toast({
        variant: "destructive",
        title: t('new_project.messages.required_fields'),
        description: t('new_project.messages.fill_required_fields'),
      });
      return;
    }

    if (budgetMin && budgetMax && parseFloat(budgetMax) < parseFloat(budgetMin)) {
      toast({
        variant: "destructive",
        title: t('new_project.messages.invalid_budget'),
        description: t('new_project.messages.invalid_budget_desc'),
      });
      return;
    }

    setLoading(true);

    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: userId,
          title,
          description,
          category,
          budget_min: budgetMin ? parseFloat(budgetMin) : null,
          budget_max: budgetMax ? parseFloat(budgetMax) : null,
          city: city || null,
          region: region || null,
          postal_code: postalCode || null,
          deadline: deadline ? format(deadline, 'yyyy-MM-dd') : null,
          status: 'open',
          latitude: latitude,
          longitude: longitude,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Upload images if any
      if (files.length > 0 && project) {
        const imageUrls = await uploadProjectImages(project.id);
        
        // Save image references
        for (let i = 0; i < imageUrls.length; i++) {
          await supabase
            .from('project_images')
            .insert({
              project_id: project.id,
              image_url: imageUrls[i],
              display_order: i,
            });
        }
      }

      toast({
        title: t('new_project.messages.success_title'),
        description: t('new_project.messages.success_desc'),
      });

      navigate("/dashboard");
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage = error instanceof Error ? error.message : t('new_project.messages.creation_error');
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navigation />
      
      <div className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-6 lg:px-8 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('new_project.title')}</h1>
            <p className="text-muted-foreground">
              {t('new_project.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>{t('new_project.form.project_info')}</CardTitle>
                <CardDescription>
                  {t('new_project.form.required_fields_note')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">{t('new_project.form.title')} *</Label>
                  <Input
                    id="title"
                    placeholder={t('new_project.form.title_placeholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">{t('new_project.form.category')} *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('new_project.form.category_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t('new_project.form.description')} *</Label>
                  <Textarea
                    id="description"
                    placeholder={t('new_project.form.description_placeholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('new_project.form.description_help')}
                  </p>
                </div>

                {/* Budget */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">{t('new_project.form.budget_min')}</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      placeholder={t('new_project.form.budget_min_placeholder')}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">{t('new_project.form.budget_max')}</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      placeholder={t('new_project.form.budget_max_placeholder')}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('new_project.form.city')}</Label>
                    <Input
                      id="city"
                      placeholder={t('new_project.form.city_placeholder')}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">{t('new_project.form.region')}</Label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('new_project.form.region_placeholder')} />
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
                    {t('new_project.form.postal_code')}
                    {geocoding && (
                      <span className="text-xs text-muted-foreground">
                        🔄 Géolocalisation en cours...
                      </span>
                    )}
                    {!geocoding && latitude && longitude && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Position détectée
                      </span>
                    )}
                  </Label>
                  <Input
                    id="postalCode"
                    placeholder={t('new_project.form.postal_code_placeholder')}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                    maxLength={7}
                  />
                  {latitude && longitude && (
                    <p className="text-xs text-muted-foreground">
                      📍 Coordonnées: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°W
                    </p>
                  )}
                </div>

                {/* Deadline */}
                <div className="space-y-2">
                  <Label>{t('new_project.form.deadline')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP", { locale: fr }) : t('new_project.form.select_date')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>{t('new_project.form.files')}</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">
                        {t('new_project.form.click_to_upload')}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {t('new_project.form.file_requirements')}
                      </span>
                    </Label>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? t('new_project.form.creating') : t('new_project.form.submit')}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NewProject;

