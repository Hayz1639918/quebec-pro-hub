import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReviewForm from "@/components/reviews/ReviewForm";

interface ProjectCompleteButtonProps {
  projectId: string;
  professionalId: string;
  professionalName: string;
  onCompleted?: () => void;
}

export default function ProjectCompleteButton({
  projectId,
  professionalId,
  professionalName,
  onCompleted,
}: ProjectCompleteButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setCompleting(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Projet terminé",
        description: "Le projet a été marqué comme complété.",
      });

      setConfirmOpen(false);
      setReviewOpen(true);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de mettre à jour le statut du projet.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const handleReviewDone = () => {
    setReviewOpen(false);
    onCompleted?.();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-success border-success/50 hover:bg-success-light"
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Marquer comme terminé
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la fin du projet</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir marquer ce projet comme terminé ?
              Cette action indique que tous les travaux ont été complétés
              à votre satisfaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={completing}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {completing ? "En cours..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={reviewOpen} onOpenChange={(open) => {
        if (!open) handleReviewDone();
      }}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Évaluer {professionalName}</DialogTitle>
            <DialogDescription>
              Le projet est maintenant terminé. Partagez votre expérience
              avec ce professionnel pour aider d'autres clients.
            </DialogDescription>
          </DialogHeader>
          <ReviewForm
            projectId={projectId}
            professionalId={professionalId}
            onSubmitted={handleReviewDone}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
