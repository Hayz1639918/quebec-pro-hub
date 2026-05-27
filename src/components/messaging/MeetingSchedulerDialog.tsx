import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Video, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MeetingSchedulerDialogProps {
  conversationId: string;
  organizerId: string;
  participantId: string;
  participantName: string;
  onMeetingCreated?: () => void;
}

export function MeetingSchedulerDialog({
  conversationId,
  organizerId,
  participantId,
  participantName,
  onMeetingCreated,
}: MeetingSchedulerDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("Réunion de projet");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast({ variant: "destructive", title: "Champs requis", description: "Veuillez sélectionner une date et une heure." });
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`);
    if (scheduledAt <= new Date()) {
      toast({ variant: "destructive", title: "Date invalide", description: "La réunion doit être planifiée dans le futur." });
      return;
    }

    setLoading(true);
    try {
      // Insert meeting
      const { data: meeting, error } = await supabase
        .from("meetings")
        .insert({
          conversation_id: conversationId,
          organizer_id: organizerId,
          participant_id: participantId,
          title: title.trim() || "Réunion de projet",
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: parseInt(duration),
          notes: notes.trim() || null,
          meeting_url: meetingUrl.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Send a system message in chat
      const formattedDate = scheduledAt.toLocaleDateString("fr-CA", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      const formattedTime = scheduledAt.toLocaleTimeString("fr-CA", {
        hour: "2-digit", minute: "2-digit",
      });

      let msgContent = `**Réunion planifiée : ${title}**\nDate : ${formattedDate} à ${formattedTime}\nDurée : ${duration} min`;
      if (meetingUrl) msgContent += `\nLien : ${meetingUrl}`;
      if (notes) msgContent += `\nNotes : ${notes}`;

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: organizerId,
        receiver_id: participantId,
        content: msgContent,
      });

      // Notification to participant
      await supabase.from("notifications").insert({
        user_id: participantId,
        type: "meeting",
        title: "Réunion planifiée",
        message: `Une réunion "${title}" a été planifiée le ${formattedDate} à ${formattedTime}.`,
        action_url: `/messages?conversation=${conversationId}`,
        metadata: { conversation_id: conversationId, meeting_id: meeting.id },
      });

      toast({ title: "Réunion créée", description: `La réunion a été planifiée pour le ${formattedDate}.` });
      setOpen(false);
      onMeetingCreated?.();
      // Reset form
      setTitle("Réunion de projet");
      setDate("");
      setTime("");
      setDuration("60");
      setNotes("");
      setMeetingUrl("");
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de créer la réunion." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Planifier une réunion">
          <Video className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Planifier une réunion
          </DialogTitle>
          <DialogDescription>
            Planifiez une réunion virtuelle avec {participantName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1">
            <Label>Titre de la réunion</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex : Présentation du devis"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Heure
              </Label>
              <Input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <Label>Durée</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="90">1h30</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting URL */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              <Link className="h-3 w-3" /> Lien de réunion
              <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Input
              value={meetingUrl}
              onChange={e => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/... ou meet.google.com/..."
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Collez le lien Zoom, Google Meet, Teams, etc.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ordre du jour, documents à préparer..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Planifier la réunion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
