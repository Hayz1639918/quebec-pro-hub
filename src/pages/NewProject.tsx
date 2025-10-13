import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORIES = [
  "Rénovation résidentielle",
  "Construction neuve",
  "Toiture",
  "Plomberie",
  "Électricité",
  "Menuiserie",
  "Maçonnerie",
  "Peinture",
  "Isolation",
  "Aménagement paysager",
  "Cuisine et salle de bain",
  "Extension et agrandissement",
];

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

const NewProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        variant: "destructive",
        title: "Connexion requise",
        description: "Vous devez être connecté pour créer un projet",
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
        title: "Accès refusé",
        description: "Seuls les clients peuvent créer des projets",
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
          title: "Format invalide",
          description: `${file.name} n'est pas un format accepté`,
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse 5 Mo`,
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
        title: "Erreur",
        description: "Utilisateur non connecté",
      });
      return;
    }

    // Validation
    if (!title || !description || !category) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
      });
      return;
    }

    if (budgetMin && budgetMax && parseFloat(budgetMax) < parseFloat(budgetMin)) {
      toast({
        variant: "destructive",
        title: "Budget invalide",
        description: "Le budget maximum doit être supérieur au minimum",
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
        title: "Projet créé ! 🎉",
        description: "Votre projet a été publié avec succès",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création du projet";
      toast({
        variant: "destructive",
        title: "Erreur",
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
            <h1 className="text-3xl font-bold mb-2">Créer un nouveau projet</h1>
            <p className="text-muted-foreground">
              Décrivez votre projet pour recevoir des propositions de professionnels qualifiés
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Informations du projet</CardTitle>
                <CardDescription>
                  Les champs marqués d'un * sont obligatoires
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du projet *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Rénovation complète de cuisine"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
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
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre projet en détail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Plus votre description est détaillée, meilleures seront les propositions
                  </p>
                </div>

                {/* Budget */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Budget minimum ($)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      placeholder="Ex: 10000"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Budget maximum ($)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      placeholder="Ex: 25000"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      placeholder="Ex: Montréal"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Région</Label>
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
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    placeholder="Ex: H1A 1A1"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    maxLength={7}
                  />
                </div>

                {/* Deadline */}
                <div className="space-y-2">
                  <Label>Échéance souhaitée</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP", { locale: fr }) : "Sélectionnez une date"}
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
                  <Label>Photos ou documents (optionnel)</Label>
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
                        Cliquez pour télécharger
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Images (JPG, PNG) ou PDF • Max 5 fichiers • 5 Mo max chacun
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
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Création..." : "Publier le projet"}
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

