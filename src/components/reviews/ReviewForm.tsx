import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
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

type CriterionKey = "quality" | "punctuality" | "communication" | "value";

const CRITERIA: { key: CriterionKey; label: string; hint: string }[] = [
  { key: "quality", label: "Qualité du travail", hint: "Finitions, conformité, solidité" },
  { key: "punctuality", label: "Ponctualité & délais", hint: "Respect du calendrier convenu" },
  { key: "communication", label: "Communication & professionnalisme", hint: "Disponibilité, clarté, courtoisie" },
  { key: "value", label: "Rapport qualité-prix", hint: "Valeur reçue pour le montant payé" },
];

function StarRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div
        className="flex items-center gap-0.5 shrink-0"
        role="radiogroup"
        aria-label={`${label} : note sur 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
            className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= display ? "text-warning fill-current" : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewForm({ projectId, professionalId, onSubmitted }: ReviewFormProps) {
  const [ratings, setRatings] = useState<Record<CriterionKey, number>>({
    quality: 0,
    punctuality: 0,
    communication: 0,
    value: 0,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const setCriterion = (key: CriterionKey, v: number) =>
    setRatings((prev) => ({ ...prev, [key]: v }));

  const scored = CRITERIA.map((c) => ratings[c.key]).filter((v) => v > 0);
  const overall = scored.length > 0
    ? Math.round(scored.reduce((s, v) => s + v, 0) / scored.length)
    : 0;
  const allRated = CRITERIA.every((c) => ratings[c.key] > 0);

  const handleSubmit = async () => {
    if (!allRated) {
      toast({
        title: "Notes incomplètes",
        description: "Veuillez noter chacun des quatre critères.",
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
        rating: overall,
        quality_rating: ratings.quality,
        punctuality_rating: ratings.punctuality,
        communication_rating: ratings.communication,
        value_rating: ratings.value,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Avis envoyé",
        description: "Merci pour votre évaluation détaillée !",
      });
      onSubmitted?.();
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'envoyer l'avis.",
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
          <div className="text-success text-lg font-semibold mb-2 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Avis envoyé avec succès
          </div>
          <p className="text-muted-foreground text-sm">
            Merci d'avoir partagé votre expérience.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Évaluer le professionnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="divide-y">
          {CRITERIA.map((c) => (
            <StarRow
              key={c.key}
              label={c.label}
              hint={c.hint}
              value={ratings[c.key]}
              onChange={(v) => setCriterion(c.key, v)}
            />
          ))}
        </div>

        {overall > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
            <Star className="h-5 w-5 text-warning fill-current" />
            <span className="text-sm">
              Note globale : <span className="font-semibold">{overall}/5</span>
              <span className="text-muted-foreground"> (moyenne des critères)</span>
            </span>
          </div>
        )}

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
          disabled={submitting || !allRated}
          className="w-full"
        >
          {submitting ? "Envoi en cours..." : "Envoyer l'avis"}
        </Button>
      </CardContent>
    </Card>
  );
}
