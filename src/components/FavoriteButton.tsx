import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  professionalId: string;
  userId: string | null;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  showLabel?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

const FavoriteButton = ({ 
  professionalId, 
  userId, 
  size = "icon", 
  variant = "ghost",
  showLabel = false,
  onToggle 
}: FavoriteButtonProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      checkIfFavorite();
    }
  }, [userId, professionalId]);

  const checkIfFavorite = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('client_id', userId)
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter des favoris",
      });
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('client_id', userId)
          .eq('professional_id', professionalId);

        if (error) throw error;

        setIsFavorite(false);
        toast({
          title: "Retiré des favoris",
          description: "Le professionnel a été retiré de votre shortlist",
        });

        onToggle?.(false);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            client_id: userId,
            professional_id: professionalId,
          });

        if (error) throw error;

        setIsFavorite(true);
        toast({
          title: "Ajouté aux favoris ⭐",
          description: "Le professionnel a été ajouté à votre shortlist",
        });

        onToggle?.(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour des favoris",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={toggleFavorite}
      disabled={loading || !userId}
      className={isFavorite ? "text-red-500 hover:text-red-600" : ""}
      title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart 
        className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
      />
      {showLabel && (
        <span className="ml-2">
          {isFavorite ? "Dans les favoris" : "Ajouter aux favoris"}
        </span>
      )}
    </Button>
  );
};

export default FavoriteButton;

