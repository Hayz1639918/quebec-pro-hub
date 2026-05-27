import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  projectId: string;
  professionalId: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ projectId, professionalId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez sélectionner une note entre 1 et 5 étoiles.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from("reviews").insert({
        project_id: projectId,
        professional_id: professionalId,
        client_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Avis envoyé",
        description: "Merci pour votre évaluation !",
      });
      onSubmitted?.();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'envoyer l'avis.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-success text-lg font-semibold mb-2">
            ✓ Avis envoyé avec succès
          </div>
          <p className="text-muted-foreground text-sm">
            Merci d'avoir partagé votre expérience.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayRating = hoveredRating || rating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Évaluer le professionnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Note</Label>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Note sur 5 étoiles">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    star <= displayRating
                      ? "text-warning fill-current"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {rating}/5
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-comment">Commentaire (optionnel)</Label>
          <Textarea
            id="review-comment"
            placeholder="Partagez votre expérience avec ce professionnel..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full"
        >
          {submitting ? "Envoi en cours..." : "Envoyer l'avis"}
        </Button>
      </CardContent>
    </Card>
  );
}
