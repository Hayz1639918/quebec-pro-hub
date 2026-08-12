import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CalendarIcon,
  FileCheck,
  FileText,
  HardHat,
  Loader2,
  MapPin,
  Paperclip,
  Plus,
  Scale,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { geocodePostalCode } from "@/lib/geolocation";

const PROJECT_TYPES_BY_CATEGORY: Record<string, string[]> = {
  "Rénovation résidentielle": ["Rénovation complète", "Rénovation partielle", "Mise aux normes", "Modernisation", "Autre"],
  "Construction neuve": ["Maison unifamiliale", "Duplex/Triplex", "Condo", "Commercial", "Industriel", "Autre"],
  Toiture: ["Remplacement complet", "Réparation", "Inspection", "Entretien", "Autre"],
  Plomberie: ["Installation neuve", "Réparation", "Remplacement", "Débouchage", "Inspection", "Autre"],
  Électricité: ["Installation neuve", "Mise aux normes", "Réparation", "Ajout de prises/circuits", "Panneau électrique", "Autre"],
  Menuiserie: ["Armoires", "Portes/Fenêtres", "Escaliers", "Terrasse/Patio", "Finition intérieure", "Autre"],
  Maçonnerie: ["Construction", "Réparation", "Joints", "Cheminée", "Mur de soutènement", "Autre"],
  Peinture: ["Intérieur", "Extérieur", "Résidentiel", "Commercial", "Autre"],
  Isolation: ["Murs", "Toiture/Grenier", "Sous-sol", "Insonorisation", "Autre"],
  "Aménagement paysager": ["Conception", "Plantation", "Pavé uni", "Clôture", "Irrigation", "Autre"],
  "Cuisine et salle de bain": ["Rénovation complète", "Rénovation partielle", "Comptoirs", "Armoires", "Plomberie", "Autre"],
  "Extension et agrandissement": ["Agrandissement latéral", "Ajout d'étage", "Sous-sol", "Garage", "Véranda/Solarium", "Autre"],
  Autre: ["Travaux spécialisés", "Services multiples", "Autre"],
};

const DEFAULT_REQUIRED_DOCUMENTS = [
  { id: "submission_form", label: "Formulaire de soumission dûment complété et signé", checked: true },
  { id: "license_copy", label: "Copie de la licence RBQ valide", checked: true },
  { id: "insurance_cert", label: "Certificats d'assurance en vigueur", checked: true },
  { id: "detailed_quote", label: "Devis détaillé et échéancier proposé", checked: true },
  { id: "references", label: "Minimum trois (3) références de projets similaires", checked: false },
  { id: "subcontractors_list", label: "Liste des sous-traitants (si applicable)", checked: false },
];

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
    t("professionals.filters.services.residential_renovation"),
    t("professionals.filters.services.new_construction"),
    t("professionals.filters.services.roofing"),
    t("professionals.filters.services.plumbing"),
    t("professionals.filters.services.electricity"),
    t("professionals.filters.services.carpentry"),
    t("professionals.filters.services.masonry"),
    t("professionals.filters.services.painting"),
    t("professionals.filters.services.insulation"),
    t("professionals.filters.services.landscaping"),
    t("projects.filters.kitchen_bathroom"),
    t("projects.filters.extension"),
    "Autre",
  ];

  const REGIONS = [
    t("professionals.filters.regions.montreal"),
    t("professionals.filters.regions.quebec"),
    t("professionals.filters.regions.laval"),
    t("professionals.filters.regions.gatineau"),
    t("professionals.filters.regions.longueuil"),
    t("professionals.filters.regions.sherbrooke"),
    t("professionals.filters.regions.saguenay"),
    t("professionals.filters.regions.trois_rivieres"),
    t("professionals.filters.regions.terrebonne"),
    t("professionals.filters.regions.saint_jean"),
    "Autre",
  ];

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [projectType, setProjectType] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [projectStartDate, setProjectStartDate] = useState<Date>();
  const [projectEndDate, setProjectEndDate] = useState<Date>();
  const [submissionDeadline, setSubmissionDeadline] = useState<Date>();
  const [siteVisitDate, setSiteVisitDate] = useState<Date>();
  const [questionsDeadline, setQuestionsDeadline] = useState<Date>();
  const [workDescriptionDetailed, setWorkDescriptionDetailed] = useState("");
  const [technicalSpecs, setTechnicalSpecs] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState("");
  const [requiredDocuments, setRequiredDocuments] = useState(DEFAULT_REQUIRED_DOCUMENTS);
  const [evaluationCriteria, setEvaluationCriteria] = useState(DEFAULT_EVALUATION_CRITERIA);
  const [insuranceLiability, setInsuranceLiability] = useState("");
  const [insuranceProfessional, setInsuranceProfessional] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [entrepreneurType, setEntrepreneurType] = useState<"individual" | "company" | "any">("any");
  const [requiredCertifications, setRequiredCertifications] = useState({
    rbq: false,
    liability_insurance: false,
    apchq: false,
    asp_construction: false,
  });
  const [paymentMode, setPaymentMode] = useState<"full" | "milestones" | "negotiable">("negotiable");
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100000]);
  const [useBudgetSlider, setUseBudgetSlider] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const availableProjectTypes = category ? PROJECT_TYPES_BY_CATEGORY[category] || ["Autre"] : [];

  useEffect(() => {
    void checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProjectType("");
  }, [category]);

  useEffect(() => {
    const geocodeWithDelay = async () => {
      if (postalCode.length < 6) {
        setLatitude(null);
        setLongitude(null);
        return;
      }

      setGeocoding(true);
      try {
        const coords = await geocodePostalCode(postalCode, city || undefined);
        if (coords) {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          toast({ title: "Localisation détectée", description: "Votre projet sera visible sur la carte" });
        } else {
          setLatitude(null);
          setLongitude(null);
          toast({ title: "Localisation approximative", description: "Code postal non trouvé, position approximative utilisée" });
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setLatitude(null);
        setLongitude(null);
      } finally {
        setGeocoding(false);
      }
    };

    const timer = window.setTimeout(() => void geocodeWithDelay(), 500);
    return () => window.clearTimeout(timer);
  }, [postalCode, city, toast]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ variant: "destructive", title: t("new_project.messages.login_required"), description: t("new_project.messages.login_required_desc") });
      navigate("/auth?mode=login");
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single();
    if (profile?.user_type !== "client") {
      toast({ variant: "destructive", title: t("new_project.messages.access_denied"), description: t("new_project.messages.clients_only") });
      navigate("/dashboard");
      return;
    }
    setUserId(session.user.id);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter((file) => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast({ variant: "destructive", title: t("new_project.messages.invalid_format"), description: t("new_project.messages.invalid_format_desc", { filename: file.name }) });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: t("new_project.messages.file_too_large"), description: t("new_project.messages.file_too_large_desc", { filename: file.name }) });
        return false;
      }
      return true;
    });
    setFiles((current) => [...current, ...validFiles].slice(0, 5));
  };

  const uploadProjectImages = async (projectId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      try {
        const extension: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/jpg": "jpg",
          "image/png": "png",
          "application/pdf": "pdf",
        };
        const fileName = `${projectId}/${crypto.randomUUID()}.${extension[file.type]}`;
        const { error } = await supabase.storage.from("projects").upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("projects").getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) {
      toast({ variant: "destructive", title: t("common.error"), description: t("new_project.messages.not_logged_in") });
      return;
    }
    if (!title || !description || !category) {
      toast({ variant: "destructive", title: t("new_project.messages.required_fields"), description: t("new_project.messages.fill_required_fields") });
      return;
    }
    if (budgetMin && budgetMax && Number(budgetMax) < Number(budgetMin)) {
      toast({ variant: "destructive", title: t("new_project.messages.invalid_budget"), description: t("new_project.messages.invalid_budget_desc") });
      return;
    }

    setLoading(true);
    try {
      const evaluationCriteriaObject = Object.fromEntries(evaluationCriteria.map((criterion) => [criterion.label, criterion.weight]));
      const insuranceRequirements: Record<string, number> = {};
      if (insuranceLiability) insuranceRequirements.liability = Number(insuranceLiability);
      if (insuranceProfessional) insuranceRequirements.professional = Number(insuranceProfessional);

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          client_id: userId,
          title,
          description,
          category: category === "Autre" ? customCategory.trim() || "Autre" : category,
          project_type: projectType || null,
          budget_min: budgetMin ? Number(budgetMin) : null,
          budget_max: budgetMax ? Number(budgetMax) : null,
          city: city || null,
          region: region === "Autre" ? customRegion.trim() || null : region || null,
          postal_code: postalCode || null,
          latitude,
          longitude,
          project_start_date: projectStartDate ? format(projectStartDate, "yyyy-MM-dd") : null,
          project_end_date: projectEndDate ? format(projectEndDate, "yyyy-MM-dd") : null,
          submission_deadline: submissionDeadline ? submissionDeadline.toISOString() : null,
          site_visit_date: siteVisitDate ? siteVisitDate.toISOString() : null,
          questions_deadline: questionsDeadline ? questionsDeadline.toISOString() : null,
          work_description_detailed: workDescriptionDetailed || null,
          technical_specifications: technicalSpecs.length > 0 ? technicalSpecs : null,
          evaluation_criteria: evaluationCriteriaObject,
          insurance_requirements: Object.keys(insuranceRequirements).length > 0 ? insuranceRequirements : null,
          preferred_entrepreneur_type: entrepreneurType !== "any" ? entrepreneurType : null,
          required_certifications: Object.entries(requiredCertifications).filter(([, enabled]) => enabled).map(([key]) => key),
          payment_mode: paymentMode,
          payment_handling_preference: "offline",
          status: "open",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      if (project && files.length > 0) {
        const imageUrls = await uploadProjectImages(project.id);
        await Promise.all(
          imageUrls.map((imageUrl, displayOrder) =>
            supabase.from("project_images").insert({ project_id: project.id, image_url: imageUrl, display_order: displayOrder }),
          ),
        );
      }

      toast({ title: t("new_project.messages.success_title"), description: t("new_project.messages.success_desc") });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating project:", error);
      toast({ variant: "destructive", title: t("common.error"), description: error instanceof Error ? error.message : t("new_project.messages.creation_error") });
    } finally {
      setLoading(false);
    }
  };

  const DatePickerField = ({ label, value, onChange, placeholder = "Sélectionnez une date", minDate }: {
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
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP", { locale: fr }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus disabled={(date) => minDate ? date < minDate : date < new Date()} />
        </PopoverContent>
      </Popover>
    </div>
  );

  const totalCriteriaWeight = evaluationCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navigation />
      <div className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t("new_project.title")}</h1>
            <p className="text-muted-foreground">{t("new_project.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Informations de base</CardTitle>
                <CardDescription>Décrivez votre projet de manière générale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("new_project.form.title")} *</Label>
                  <Input id="title" placeholder={t("new_project.form.title_placeholder")} value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("new_project.form.category")} *</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger aria-label={t("new_project.form.category")}><SelectValue placeholder={t("new_project.form.category_placeholder")} /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type de travaux</Label>
                    <Select value={projectType} onValueChange={setProjectType} disabled={!category}>
                      <SelectTrigger aria-label="Type de travaux"><SelectValue placeholder={category ? "Sélectionnez le type" : "Choisissez d'abord une catégorie"} /></SelectTrigger>
                      <SelectContent>{availableProjectTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {category === "Autre" && (
                  <div className="space-y-2">
                    <Label htmlFor="customCategory">Précisez la catégorie *</Label>
                    <Input id="customCategory" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">{t("new_project.form.description")} *</Label>
                  <Textarea id="description" placeholder={t("new_project.form.description_placeholder")} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Budget et échéancier de paiement</CardTitle>
                <CardDescription>Définissez le budget et la façon de répartir les versements. Le règlement lui-même se fait directement avec l'entrepreneur.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="budgetMin">{t("new_project.form.budget_min")}</Label><Input id="budgetMin" type="number" min="0" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="budgetMax">{t("new_project.form.budget_max")}</Label><Input id="budgetMax" type="number" min="0" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} /></div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id="useBudgetSlider" checked={useBudgetSlider} onCheckedChange={(value) => {
                      setUseBudgetSlider(Boolean(value));
                      if (value) {
                        const min = Number(budgetMin) || 0;
                        const max = Number(budgetMax) || 100000;
                        setBudgetRange([min, Math.max(min, max)]);
                      }
                    }} />
                    <Label htmlFor="useBudgetSlider" className="font-normal cursor-pointer text-sm text-muted-foreground">Utiliser le curseur de budget</Label>
                  </div>
                  {useBudgetSlider && (
                    <div className="space-y-2 px-1">
                      <div className="flex justify-between text-sm font-medium"><span>{budgetRange[0].toLocaleString("fr-CA")} $</span><span>{budgetRange[1].toLocaleString("fr-CA")} $</span></div>
                      <Slider value={budgetRange} onValueChange={(value) => {
                        setBudgetRange(value as [number, number]);
                        setBudgetMin(String(value[0]));
                        setBudgetMax(String(value[1]));
                      }} min={0} max={500000} step={1000} />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Échéancier de paiement préféré</Label>
                  <RadioGroup value={paymentMode} onValueChange={(value) => setPaymentMode(value as typeof paymentMode)} className="space-y-2">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg"><RadioGroupItem value="full" id="pm-full" /><Label htmlFor="pm-full" className="cursor-pointer font-normal flex-1"><span className="font-medium">Paiement complet</span><span className="block text-xs text-muted-foreground">Un seul règlement selon les modalités convenues au contrat</span></Label></div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg"><RadioGroupItem value="milestones" id="pm-milestones" /><Label htmlFor="pm-milestones" className="cursor-pointer font-normal flex-1"><span className="font-medium">Versements par jalons</span><span className="block text-xs text-muted-foreground">Montants échelonnés selon l'avancement convenu</span></Label></div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg"><RadioGroupItem value="negotiable" id="pm-negotiable" /><Label htmlFor="pm-negotiable" className="cursor-pointer font-normal flex-1"><span className="font-medium">Négociable</span><span className="block text-xs text-muted-foreground">Échéancier à définir avec l'entrepreneur retenu</span></Label></div>
                  </RadioGroup>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Règlement direct entre client et entrepreneur</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      BâtirNet ne reçoit ni ne conserve l'argent. Les parties utilisent le moyen convenu (virement, chèque ou comptant), puis la plateforme sert uniquement à suivre si le paiement a été envoyé et reçu.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Localisation</CardTitle><CardDescription>Où se situe le projet ?</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="city">{t("new_project.form.city")}</Label><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>{t("new_project.form.region")}</Label>
                    <Select value={region} onValueChange={setRegion}><SelectTrigger aria-label={t("new_project.form.region")}><SelectValue placeholder={t("new_project.form.region_placeholder")} /></SelectTrigger><SelectContent>{REGIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
                    {region === "Autre" && <Input value={customRegion} onChange={(e) => setCustomRegion(e.target.value)} placeholder="Précisez la région..." />}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="flex items-center gap-2">
                    {t("new_project.form.postal_code")}
                    {geocoding && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Géolocalisation en cours...</span>}
                  </Label>
                  <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value.toUpperCase())} maxLength={7} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Dates importantes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4"><DatePickerField label="Date de début souhaitée" value={projectStartDate} onChange={setProjectStartDate} /><DatePickerField label="Date de fin souhaitée" value={projectEndDate} onChange={setProjectEndDate} minDate={projectStartDate} /></div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4"><DatePickerField label="Date limite de soumission" value={submissionDeadline} onChange={setSubmissionDeadline} /><DatePickerField label="Date limite pour questions" value={questionsDeadline} onChange={setQuestionsDeadline} placeholder="(Optionnel)" /></div>
                <DatePickerField label="Date de visite de chantier" value={siteVisitDate} onChange={setSiteVisitDate} placeholder="(Optionnel)" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />Critères d'évaluation</CardTitle><CardDescription>Total : {totalCriteriaWeight}%</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {evaluationCriteria.map((criterion) => (
                  <div key={criterion.id} className="space-y-2">
                    <div className="flex justify-between"><Label>{criterion.label}</Label><span className="text-sm font-medium text-primary">{criterion.weight}%</span></div>
                    <Slider value={[criterion.weight]} onValueChange={(value) => setEvaluationCriteria((current) => current.map((item) => item.id === criterion.id ? { ...item, weight: value[0] } : item))} max={100} step={5} />
                  </div>
                ))}
                {totalCriteriaWeight !== 100 && <p className="text-sm text-amber-600 flex gap-2"><AlertTriangle className="h-4 w-4" />Le total devrait être de 100%.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><HardHat className="h-5 w-5" />Préférences d'entrepreneur</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Type d'entrepreneur</Label>
                  <RadioGroup value={entrepreneurType} onValueChange={(value) => setEntrepreneurType(value as typeof entrepreneurType)} className="space-y-2">
                    {[{ value: "any", label: "Indifférent" }, { value: "individual", label: "Travailleur autonome / Individuel" }, { value: "company", label: "Entreprise" }].map((option) => (
                      <div key={option.value} className="flex items-center gap-3 p-3 border rounded-lg"><RadioGroupItem value={option.value} id={`et-${option.value}`} /><Label htmlFor={`et-${option.value}`} className="cursor-pointer font-normal">{option.label}</Label></div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label>Certifications et accréditations requises</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[{ id: "rbq", label: "Licence RBQ obligatoire" }, { id: "liability_insurance", label: "Assurance responsabilité civile" }, { id: "apchq", label: "Membre APCHQ" }, { id: "asp_construction", label: "Formation ASP Construction" }].map((option) => (
                      <div key={option.id} className="flex items-center gap-3 p-3 border rounded-lg"><Checkbox id={`cert-${option.id}`} checked={requiredCertifications[option.id as keyof typeof requiredCertifications]} onCheckedChange={(value) => setRequiredCertifications((current) => ({ ...current, [option.id]: Boolean(value) }))} /><Label htmlFor={`cert-${option.id}`} className="cursor-pointer font-normal">{option.label}</Label></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary" />Documents requis</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {requiredDocuments.map((document) => <div key={document.id} className="flex items-center gap-3"><Checkbox id={document.id} checked={document.checked} onCheckedChange={() => setRequiredDocuments((current) => current.map((item) => item.id === document.id ? { ...item, checked: !item.checked } : item))} /><Label htmlFor={document.id} className="font-normal cursor-pointer">{document.label}</Label></div>)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Exigences d'assurance</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="insuranceLiability">Responsabilité civile ($)</Label><Input id="insuranceLiability" type="number" min="0" value={insuranceLiability} onChange={(e) => setInsuranceLiability(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="insuranceProfessional">Responsabilité professionnelle ($)</Label><Input id="insuranceProfessional" type="number" min="0" value={insuranceProfessional} onChange={(e) => setInsuranceProfessional(e.target.value)} /></div>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible>
              <AccordionItem value="advanced" className="border rounded-lg">
                <AccordionTrigger className="px-6 hover:no-underline"><div className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /><span className="font-semibold">Options avancées</span><span className="text-sm text-muted-foreground font-normal">(optionnel)</span></div></AccordionTrigger>
                <AccordionContent className="px-6 pb-6 space-y-6">
                  <div className="space-y-2"><Label htmlFor="workDescriptionDetailed">Description détaillée des travaux</Label><Textarea id="workDescriptionDetailed" value={workDescriptionDetailed} onChange={(e) => setWorkDescriptionDetailed(e.target.value)} rows={6} /></div>
                  <div className="space-y-3">
                    <Label>Spécifications techniques</Label>
                    <div className="flex gap-2"><Input value={newSpec} onChange={(e) => setNewSpec(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newSpec.trim()) { setTechnicalSpecs((current) => [...current, newSpec.trim()]); setNewSpec(""); } } }} /><Button type="button" variant="outline" onClick={() => { if (newSpec.trim()) { setTechnicalSpecs((current) => [...current, newSpec.trim()]); setNewSpec(""); } }}><Plus className="h-4 w-4" /></Button></div>
                    {technicalSpecs.map((spec, index) => <div key={`${spec}-${index}`} className="flex items-center justify-between p-2 bg-muted rounded"><span className="text-sm">• {spec}</span><Button type="button" variant="ghost" size="sm" onClick={() => setTechnicalSpecs((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Paperclip className="h-5 w-5 text-primary" />Documents et photos</CardTitle></CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" id="file-upload" />
                  <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center"><Upload className="h-8 w-8 text-muted-foreground mb-2" /><span className="text-sm font-medium">{t("new_project.form.click_to_upload")}</span><span className="text-xs text-muted-foreground mt-1">{t("new_project.form.file_requirements")}</span></Label>
                </div>
                {files.length > 0 && <div className="space-y-2 mt-4">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-muted rounded"><span className="text-sm truncate flex-1">{file.name}</span><Button type="button" variant="ghost" size="sm" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X className="h-4 w-4" /></Button></div>)}</div>}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} disabled={loading} className="flex-1">{t("common.cancel")}</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? t("new_project.form.creating") : t("new_project.form.submit")}</Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NewProject;
