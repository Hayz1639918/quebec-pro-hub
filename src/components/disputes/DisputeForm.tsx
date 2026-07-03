import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DisputeFormProps {
  contractId: string;
  userId: string;
  onSubmitted?: () => void;
}

type DisputeCategory = "quality" | "delay" | "payment" | "communication" | "other";

const CATEGORY_LABELS: Record<DisputeCategory, string> = {
  quality: "Qualité des travaux",
  delay: "Retard / Délais",
  payment: "Paiement",
  communication: "Communication",
  other: "Autre",
};

export const DisputeForm = ({ contractId, userId, onSubmitted }: DisputeFormProps) => {
  const { toast } = useToast();
  const [category, setCategory] = useState<DisputeCategory | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid = category !== "" && description.trim().length >= 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("disputes").insert({
        contract_id: contractId,
        opened_by: userId,
        category,
        description: description.trim(),
        attachments: [],
      });

      if (error) throw error;

      toast({
        title: "Litige signalé",
        description: "Votre signalement a été enregistré. Un administrateur examinera votre demande.",
      });

      setCategory("");
      setDescription("");
      onSubmitted?.();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible de soumettre le litige.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Signaler un litige
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dispute-category">Catégorie *</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as DisputeCategory)}
            >
              <SelectTrigger id="dispute-category">
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute-description">
              Description détaillée * <span className="text-muted-foreground text-xs">(min. 50 caractères)</span>
            </Label>
            <Textarea
              id="dispute-description"
              placeholder="Décrivez le problème en détail : que s'est-il passé, quand, et quel impact cela a eu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.trim().length}/50 caractères minimum
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Pièces jointes</Label>
            <p className="text-sm text-muted-foreground">
              Vous pourrez ajouter des pièces jointes (photos, documents) une fois le litige créé.
            </p>
          </div>

          <Button
            type="submit"
            variant="destructive"
            disabled={!isValid || submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Soumettre le litige
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
