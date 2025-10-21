import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  Star, 
  Award, 
  Trash2, 
  Eye,
  CheckCircle2,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FavoriteProfessional {
  id: string; // favorite id
  professional_id: string;
  full_name: string;
  company_name: string;
  rbq_number: string;
  services_offered: string | null;
  city: string | null;
  region: string | null;
  years_experience: number | null;
  average_rating: number;
  total_reviews: number;
  total_projects: number;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  availability_status: 'available' | 'busy' | 'unavailable' | null;
  response_time_hours: number | null;
  activity_score: number | null;
  notes: string | null;
  priority: number;
  created_at: string;
}

interface FavoritesListProps {
  favorites: FavoriteProfessional[];
  loading: boolean;
  onRemove: (favoriteId: string) => void;
  onCompare: (selectedIds: string[]) => void;
}

const FavoritesList = ({ favorites, loading, onRemove, onCompare }: FavoritesListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [favoriteToDelete, setFavoriteToDelete] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const handleSelectForComparison = (professionalId: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(professionalId)) {
        return prev.filter(id => id !== professionalId);
      } else if (prev.length < 4) {
        return [...prev, professionalId];
      } else {
        toast({
          title: "Limite atteinte",
          description: "Vous pouvez comparer jusqu'à 4 professionnels à la fois",
        });
        return prev;
      }
    });
  };

  const handleCompare = () => {
    if (selectedForComparison.length < 2) {
      toast({
        title: "Sélection insuffisante",
        description: "Sélectionnez au moins 2 professionnels pour comparer",
      });
      return;
    }
    onCompare(selectedForComparison);
  };

  const confirmDelete = (favoriteId: string) => {
    setFavoriteToDelete(favoriteId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (favoriteToDelete) {
      onRemove(favoriteToDelete);
      setDeleteDialogOpen(false);
      setFavoriteToDelete(null);
    }
  };

  const handleSaveNotes = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .update({ notes: notesValue })
        .eq('id', favoriteId);

      if (error) throw error;

      toast({
        title: "Notes enregistrées",
        description: "Vos notes ont été mises à jour avec succès",
      });

      setEditingNotes(null);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
      });
    }
  };

  const getServiceBadges = (services: string | null) => {
    if (!services) return [];
    return services
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Chargement...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Aucun favori</h3>
        <p className="text-muted-foreground mb-6">
          Ajoutez des professionnels à votre shortlist pour les comparer facilement
        </p>
        <Button onClick={() => navigate("/professionals")}>
          Découvrir des professionnels
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compare Button */}
      {selectedForComparison.length >= 2 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {selectedForComparison.length} professionnel{selectedForComparison.length > 1 ? 's' : ''} sélectionné{selectedForComparison.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  Comparez côte-à-côte leurs profils, tarifs et disponibilités
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedForComparison([])}>
                  Annuler
                </Button>
                <Button onClick={handleCompare}>
                  Comparer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Favorites Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {favorites.map((fav) => (
          <Card 
            key={fav.id} 
            className={`hover:shadow-lg transition-shadow ${
              selectedForComparison.includes(fav.professional_id) ? 'border-primary border-2' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {fav.company_name}
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {fav.full_name}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => navigate(`/professionals/${fav.professional_id}`)}
                    title="Voir le profil"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => confirmDelete(fav.id)}
                    title="Retirer des favoris"
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* RBQ */}
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">RBQ:</span>
                <span className="font-mono font-semibold">{fav.rbq_number}</span>
              </div>

              {/* Location */}
              {(fav.city || fav.region) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{[fav.city, fav.region].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {/* Experience */}
              {fav.years_experience && (
                <div className="text-sm">
                  <span className="font-medium">{fav.years_experience} ans</span>
                  <span className="text-muted-foreground"> d'expérience</span>
                </div>
              )}

              <Separator />

              {/* Budget */}
              {(fav.hourly_rate_min || fav.hourly_rate_max) && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    {fav.hourly_rate_min && fav.hourly_rate_max
                      ? `${fav.hourly_rate_min} - ${fav.hourly_rate_max} $/h`
                      : fav.hourly_rate_min
                      ? `À partir de ${fav.hourly_rate_min} $/h`
                      : `Jusqu'à ${fav.hourly_rate_max} $/h`}
                  </span>
                </div>
              )}

              {/* Availability */}
              {fav.availability_status && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className={
                    fav.availability_status === 'available' 
                      ? 'text-green-600 font-medium' 
                      : fav.availability_status === 'busy'
                      ? 'text-orange-600'
                      : 'text-red-600'
                  }>
                    {fav.availability_status === 'available' 
                      ? 'Disponible' 
                      : fav.availability_status === 'busy'
                      ? 'Occupé'
                      : 'Non disponible'}
                  </span>
                </div>
              )}

              {/* Response Time */}
              {fav.response_time_hours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Répond en ~{fav.response_time_hours}h
                  </span>
                </div>
              )}

              <Separator />

              {/* Services */}
              {fav.services_offered && (
                <div>
                  <p className="text-sm font-medium mb-2">Services offerts:</p>
                  <div className="flex flex-wrap gap-2">
                    {getServiceBadges(fav.services_offered).map((service, index) => (
                      <Badge key={index} variant="secondary">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= fav.average_rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-sm font-medium">{fav.average_rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({fav.total_reviews} avis)
                </span>
              </div>

              {/* Notes */}
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Vos notes:</p>
                {editingNotes === fav.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Ajoutez vos notes sur ce professionnel..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveNotes(fav.id)}>
                        Enregistrer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-sm text-muted-foreground cursor-pointer hover:text-foreground p-2 border rounded min-h-[60px]"
                    onClick={() => {
                      setEditingNotes(fav.id);
                      setNotesValue(fav.notes || '');
                    }}
                  >
                    {fav.notes || 'Cliquez pour ajouter des notes...'}
                  </div>
                )}
              </div>

              {/* Compare Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedForComparison.includes(fav.professional_id)}
                    onChange={() => handleSelectForComparison(fav.professional_id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Sélectionner pour comparer</span>
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer des favoris ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce professionnel sera retiré de votre shortlist. Vous pourrez toujours le rajouter plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FavoritesList;

