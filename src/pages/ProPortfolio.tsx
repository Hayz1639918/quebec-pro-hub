import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ImagePlus,
  Trash2,
  Edit,
  Calendar,
  Award,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PortfolioItem {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_date: string | null;
  category: string | null;
  created_at: string;
}

const CATEGORIES = [
  'Rénovation résidentielle',
  'Construction neuve',
  'Toiture',
  'Plomberie',
  'Électricité',
  'Paysagement',
  'Peinture',
  'Revêtement de sol',
  'Cuisine et salle de bain',
  'Isolation',
  'Menuiserie',
  'Autre',
];

const ProPortfolio = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    project_date: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }
      setUserId(session.user.id);

      const { data: prof } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (prof?.user_type !== 'professional') {
        navigate('/auth?mode=login', { replace: true });
        return;
      }

      await fetchPortfolio(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchPortfolio = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('professional_id', uid)
        .order('project_date', { ascending: false, nullsFirst: false });

      if (error) throw error;

      setPortfolioItems(data || []);
    } catch (e) {
      console.error('Error fetching portfolio:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger le portfolio',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Format invalide',
        description: 'Veuillez sélectionner une image',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 5 Mo',
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !userId) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (e) {
      console.error('Error uploading image:', e);
      throw e;
    }
  };

  const handleSubmit = async () => {
    if (!userId || !formData.title) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'Veuillez remplir au minimum le titre',
      });
      return;
    }

    try {
      setUploading(true);

      let imageUrl = editingItem?.image_url || null;

      // Upload new image if provided
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const itemData = {
        professional_id: userId,
        title: formData.title,
        description: formData.description || null,
        category: formData.category || null,
        project_date: formData.project_date || null,
        image_url: imageUrl,
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('portfolio_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: 'Modifié',
          description: 'Le projet a été mis à jour avec succès',
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('portfolio_items')
          .insert(itemData);

        if (error) throw error;

        toast({
          title: 'Ajouté',
          description: 'Le projet a été ajouté à votre portfolio',
        });
      }

      // Reset form and refresh
      setDialogOpen(false);
      resetForm();
      if (userId) await fetchPortfolio(userId);
    } catch (e) {
      console.error('Error saving portfolio item:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder le projet',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet de votre portfolio ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Supprimé',
        description: 'Le projet a été supprimé de votre portfolio',
      });

      if (userId) await fetchPortfolio(userId);
    } catch (e) {
      console.error('Error deleting portfolio item:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer le projet',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      project_date: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingItem(null);
  };

  const openEditDialog = (item: PortfolioItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      project_date: item.project_date || '',
    });
    setImagePreview(item.image_url);
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
          <div>Chargement...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mon Portfolio</h1>
              <p className="text-muted-foreground">
                Présentez vos réalisations et attirez plus de clients
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Ajouter un projet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Modifier le projet' : 'Ajouter un projet'}
                  </DialogTitle>
                  <DialogDescription>
                    Ajoutez une photo et les détails de votre réalisation
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <Label>Photo du projet *</Label>
                    <div className="mt-2">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Aperçu"
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-12 w-12 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Cliquez pour télécharger</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, JPEG (MAX. 5 Mo)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Titre du projet *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Rénovation complète de cuisine moderne"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez brièvement le projet..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  {/* Category & Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Catégorie</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
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
                    <div>
                      <Label htmlFor="project_date">Date du projet</Label>
                      <Input
                        id="project_date"
                        type="date"
                        value={formData.project_date}
                        onChange={(e) =>
                          setFormData({ ...formData, project_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit} disabled={uploading || !formData.title}>
                    {uploading ? 'Enregistrement...' : editingItem ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Portfolio Grid */}
        {portfolioItems.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Portfolio vide</h3>
              <p className="text-muted-foreground mb-6">
                Commencez à ajouter vos réalisations pour attirer plus de clients
              </p>
              <Button onClick={openNewDialog}>
                <ImagePlus className="h-4 w-4 mr-2" />
                Ajouter votre premier projet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="relative h-64 bg-muted">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.category && (
                      <Badge variant="secondary">
                        <Award className="h-3 w-3 mr-1" />
                        {item.category}
                      </Badge>
                    )}
                    {item.project_date && (
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(item.project_date), 'MMMM yyyy', { locale: fr })}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProPortfolio;

