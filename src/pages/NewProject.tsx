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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X, MapPin, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { geocodePostalCode } from "@/lib/geolocation";

// Types de travaux par catégorie
const PROJECT_TYPES_BY_CATEGORY: Record<string, string[]> = {
  "Rénovation résidentielle": ["Rénovation complète", "Rénovation partielle", "Mise aux normes", "Modernisation", "Autre"],
  "Construction neuve": ["Maison unifamiliale", "Duplex/Triplex", "Condo", "Commercial", "Industriel", "Autre"],
  "Toiture": ["Remplacement complet", "Réparation", "Inspection", "Entretien", "Autre"],
  "Plomberie": ["Installation neuve", "Réparation", "Remplacement", "Débouchage", "Inspection", "Autre"],
  "Électricité": ["Installation neuve", "Mise aux normes", "Réparation", "Ajout de prises/circuits", "Panneau électrique", "Autre"],
  "Menuiserie": ["Armoires", "Portes/Fenêtres", "Escaliers", "Terrasse/Patio", "Finition intérieure", "Autre"],
  "Maçonnerie": ["Construction", "Réparation", "Joints", "Cheminée", "Mur de soutènement", "Autre"],
  "Peinture": ["Intérieur", "Extérieur", "Résidentiel", "Commercial", "Autre"],
  "Isolation": ["Murs", "Toiture/Grenier", "Sous-sol", "Insonorisation", "Autre"],
  "Aménagement paysager": ["Conception", "Plantation", "Pavé uni", "Clôture", "Irrigation", "Autre"],
  "Cuisine et salle de bain": ["Rénovation complète", "Rénovation partielle", "Comptoirs", "Armoires", "Plomberie", "Autre"],
  "Extension et agrandissement": ["Agrandissement latéral", "Ajout d'étage", "Sous-sol", "Garage", "Véranda/Solarium", "Autre"],
};

// Documents requis par défaut
const DEFAULT_REQUIRED_DOCUMENTS = [
  { id: "submission_form", label: "Formulaire de soumission dûment complété et signé", checked: true },
  { id: "license_copy", label: "Copie de la licence RBQ valide", checked: true },
  { id: "insurance_cert", label: "Certificats d'assurance en vigueur", checked: true },
  { id: "detailed_quote", label: "Devis détaillé et échéancier proposé", checked: true },
  { id: "references", label: "Minimum trois (3) références de projets similaires", checked: false },
  { id: "subcontractors_list", label: "Liste des sous-traitants (si applicable)", checked: false },
];

// Critères d'évaluation par défaut
const DEFAULT_EVALUATION_CRITERIA = [
  { id: "price", label: "Prix proposé", weight: 40 },
  { id: "experience", label: "Expérience et références", weight: 30 },
  { id: "methodology", label: "Méthodologie et échéancier", weight: 20 },
  { id: "guarantees", label: "Garanties et assurances", weight: 10 },
];

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
    "Autre",
  ];

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Informations de base
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [projectType, setProjectType] = useState("");
  
  // Budget
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  
  // Localisation
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
  // Dates
  const [projectStartDate, setProjectStartDate] = useState<Date>();
  const [projectEndDate, setProjectEndDate] = useState<Date>();
  const [submissionDeadline, setSubmissionDeadline] = useState<Date>();
  const [siteVisitDate, setSiteVisitDate] = useState<Date>();
  const [questionsDeadline, setQuestionsDeadline] = useState<Date>();
  
  // Description détaillée
  const [workDescriptionDetailed, setWorkDescriptionDetailed] = useState("");
  
  // Spécifications techniques
  const [technicalSpecs, setTechnicalSpecs] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState("");
  
  // Documents requis
  const [requiredDocuments, setRequiredDocuments] = useState(DEFAULT_REQUIRED_DOCUMENTS);
  
  // Critères d'évaluation
  const [evaluationCriteria, setEvaluationCriteria] = useState(DEFAULT_EVALUATION_CRITERIA);
  
  // Exigences d'assurance
  const [insuranceLiability, setInsuranceLiability] = useState("");
  const [insuranceProfessional, setInsuranceProfessional] = useState("");
  
  // Fichiers
  const [files, setFiles] = useState<File[]>([]);
  
  // Geolocation
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  // Types disponibles basés sur la catégorie
  const availableProjectTypes = category ? (PROJECT_TYPES_BY_CATEGORY[category] || ["Autre"]) : [];

  useEffect(() => {
    checkUser();
  }, []);

  // Reset project type when category changes
  useEffect(() => {
    setProjectType("");
  }, [category]);

  // Auto-geocode when postal code or city changes
  useEffect(() => {
    const geocodeWithDelay = async () => {
      if (postalCode.length >= 6) {
        setGeocoding(true);
        try {
          // Pass city for better geocoding accuracy
          const coords = await geocodePostalCode(postalCode, city || undefined);
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
            toast({
              title: "⚠️ Localisation approximative",
              description: "Code postal non trouvé, position approximative utilisée",
              variant: "default",
            });
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

    const timer = setTimeout(() => {
      geocodeWithDelay();
    }, 500);

    return () => clearTimeout(timer);
  }, [postalCode, city, toast]);

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
    
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024;
      
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

    setFiles(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTechnicalSpec = () => {
    if (newSpec.trim()) {
      setTechnicalSpecs(prev => [...prev, newSpec.trim()]);
      setNewSpec("");
    }
  };

  const removeTechnicalSpec = (index: number) => {
    setTechnicalSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRequiredDocument = (docId: string) => {
    setRequiredDocuments(prev => 
      prev.map(doc => doc.id === docId ? { ...doc, checked: !doc.checked } : doc)
    );
  };

  const updateCriteriaWeight = (criteriaId: string, newWeight: number) => {
    setEvaluationCriteria(prev => 
      prev.map(c => c.id === criteriaId ? { ...c, weight: newWeight } : c)
    );
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
      // Préparer les critères d'évaluation
      const evaluationCriteriaObj: Record<string, number> = {};
      evaluationCriteria.forEach(c => {
        evaluationCriteriaObj[c.label] = c.weight;
      });

      // Préparer les exigences d'assurance
      const insuranceRequirements: Record<string, number> = {};
      if (insuranceLiability) insuranceRequirements.liability = parseFloat(insuranceLiability);
      if (insuranceProfessional) insuranceRequirements.professional = parseFloat(insuranceProfessional);

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: userId,
          title,
          description,
          category,
          project_type: projectType || null,
          budget_min: budgetMin ? parseFloat(budgetMin) : null,
          budget_max: budgetMax ? parseFloat(budgetMax) : null,
          city: city || null,
          region: region === "Autre" ? (customRegion.trim() || null) : (region || null),
          postal_code: postalCode || null,
          latitude: latitude,
          longitude: longitude,
          // Dates
          project_start_date: projectStartDate ? format(projectStartDate, 'yyyy-MM-dd') : null,
          project_end_date: projectEndDate ? format(projectEndDate, 'yyyy-MM-dd') : null,
          submission_deadline: submissionDeadline ? submissionDeadline.toISOString() : null,
          site_visit_date: siteVisitDate ? siteVisitDate.toISOString() : null,
          questions_deadline: questionsDeadline ? questionsDeadline.toISOString() : null,
          // Description détaillée
          work_description_detailed: workDescriptionDetailed || null,
          // Spécifications techniques
          technical_specifications: technicalSpecs.length > 0 ? technicalSpecs : null,
          // Critères d'évaluation
          evaluation_criteria: Object.keys(evaluationCriteriaObj).length > 0 ? evaluationCriteriaObj : null,
          // Exigences d'assurance
          insurance_requirements: Object.keys(insuranceRequirements).length > 0 ? insuranceRequirements : null,
          status: 'open',
        })
        .select()
        .single();

      if (projectError) throw projectError;

      if (files.length > 0 && project) {
        const imageUrls = await uploadProjectImages(project.id);
        
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

  // Helper component for date picker
  const DatePickerField = ({ 
    label, 
    value, 
    onChange, 
    placeholder = "Sélectionnez une date",
    minDate
  }: { 
    label: string; 
    value: Date | undefined; 
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    minDate?: Date;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP", { locale: fr }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            disabled={(date) => minDate ? date < minDate : date < new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  // Calculer le total des critères
  const totalCriteriaWeight = evaluationCriteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navigation />
      
      <div className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('new_project.title')}</h1>
            <p className="text-muted-foreground">
              {t('new_project.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Informations de base</CardTitle>
                <CardDescription>
                  Décrivez votre projet de manière générale
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

                {/* Category & Type */}
                <div className="grid md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="projectType">Type de travaux</Label>
                    <Select 
                      value={projectType} 
                      onValueChange={setProjectType}
                      disabled={!category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={category ? "Sélectionnez le type" : "Choisissez d'abord une catégorie"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProjectTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t('new_project.form.description')} *</Label>
                  <Textarea
                    id="description"
                    placeholder={t('new_project.form.description_placeholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('new_project.form.description_help')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: Budget */}
            <Card>
              <CardHeader>
                <CardTitle>💰 Budget</CardTitle>
                <CardDescription>
                  Indiquez votre fourchette budgétaire
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* SECTION 3: Localisation */}
            <Card>
              <CardHeader>
                <CardTitle>📍 Localisation</CardTitle>
                <CardDescription>
                  Où se situe le projet ?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    {region === "Autre" && (
                      <Input
                        placeholder="Précisez la région..."
                        value={customRegion}
                        onChange={e => setCustomRegion(e.target.value)}
                        className="mt-2"
                      />
                    )}
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
                </div>
              </CardContent>
            </Card>

            {/* SECTION 4: Dates importantes */}
            <Card>
              <CardHeader>
                <CardTitle>📅 Dates importantes</CardTitle>
                <CardDescription>
                  Définissez l'échéancier de votre projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <DatePickerField
                    label="Date de début souhaitée"
                    value={projectStartDate}
                    onChange={setProjectStartDate}
                    placeholder="Quand voulez-vous commencer ?"
                  />
                  <DatePickerField
                    label="Date de fin souhaitée"
                    value={projectEndDate}
                    onChange={setProjectEndDate}
                    placeholder="Quand voulez-vous finir ?"
                    minDate={projectStartDate}
                  />
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <DatePickerField
                    label="Date limite de soumission"
                    value={submissionDeadline}
                    onChange={setSubmissionDeadline}
                    placeholder="Date limite pour les offres"
                  />
                  <DatePickerField
                    label="Date limite pour questions"
                    value={questionsDeadline}
                    onChange={setQuestionsDeadline}
                    placeholder="(Optionnel)"
                  />
                </div>

                <DatePickerField
                  label="Date de visite de chantier"
                  value={siteVisitDate}
                  onChange={setSiteVisitDate}
                  placeholder="(Optionnel) Visite du lieu"
                />
              </CardContent>
            </Card>

            {/* SECTION 5: Critères d'évaluation */}
            <Card>
              <CardHeader>
                <CardTitle>⚖️ Critères d'évaluation</CardTitle>
                <CardDescription>
                  Définissez l'importance de chaque critère pour évaluer les soumissions (total: {totalCriteriaWeight}%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {evaluationCriteria.map((criteria) => (
                  <div key={criteria.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{criteria.label}</Label>
                      <span className="text-sm font-medium text-primary">{criteria.weight}%</span>
                    </div>
                    <Slider
                      value={[criteria.weight]}
                      onValueChange={(value) => updateCriteriaWeight(criteria.id, value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
                {totalCriteriaWeight !== 100 && (
                  <p className="text-sm text-amber-600">
                    ⚠️ Le total des pondérations devrait être de 100% (actuellement {totalCriteriaWeight}%)
                  </p>
                )}
              </CardContent>
            </Card>

            {/* SECTION 6: Documents requis */}
            <Card>
              <CardHeader>
                <CardTitle>📄 Documents requis</CardTitle>
                <CardDescription>
                  Sélectionnez les documents que les soumissionnaires doivent fournir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {requiredDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={doc.id}
                      checked={doc.checked}
                      onCheckedChange={() => toggleRequiredDocument(doc.id)}
                    />
                    <Label htmlFor={doc.id} className="font-normal cursor-pointer">
                      {doc.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SECTION 7: Exigences d'assurance */}
            <Card>
              <CardHeader>
                <CardTitle>🛡️ Exigences d'assurance</CardTitle>
                <CardDescription>
                  Définissez les montants minimums d'assurance requis (optionnel)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insuranceLiability">Responsabilité civile ($)</Label>
                    <Input
                      id="insuranceLiability"
                      type="number"
                      placeholder="Ex: 2000000"
                      value={insuranceLiability}
                      onChange={(e) => setInsuranceLiability(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceProfessional">Responsabilité professionnelle ($)</Label>
                    <Input
                      id="insuranceProfessional"
                      type="number"
                      placeholder="Ex: 1000000"
                      value={insuranceProfessional}
                      onChange={(e) => setInsuranceProfessional(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 8: Détails avancés (Accordion) */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced" className="border rounded-lg">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>⚙️</span>
                    <span className="font-semibold">Options avancées</span>
                    <span className="text-sm text-muted-foreground font-normal">(optionnel)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6 pt-4">
                    {/* Description détaillée */}
                    <div className="space-y-2">
                      <Label htmlFor="workDescriptionDetailed">Description détaillée des travaux</Label>
                      <Textarea
                        id="workDescriptionDetailed"
                        placeholder="Décrivez en détail les travaux à réaliser, les matériaux souhaités, les contraintes particulières..."
                        value={workDescriptionDetailed}
                        onChange={(e) => setWorkDescriptionDetailed(e.target.value)}
                        rows={6}
                      />
                    </div>

                    {/* Spécifications techniques */}
                    <div className="space-y-3">
                      <Label>Spécifications techniques</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: Isolation R-40, Fenêtres Energy Star..."
                          value={newSpec}
                          onChange={(e) => setNewSpec(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTechnicalSpec();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addTechnicalSpec}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {technicalSpecs.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {technicalSpecs.map((spec, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <span className="text-sm">• {spec}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTechnicalSpec(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* SECTION 9: Fichiers */}
            <Card>
              <CardHeader>
                <CardTitle>📎 Documents et photos</CardTitle>
                <CardDescription>
                  Ajoutez des photos ou documents pour mieux illustrer votre projet
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
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
