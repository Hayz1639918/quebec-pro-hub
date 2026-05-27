import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Video,
  Calendar,
  Clock,
  User,
  Bell,
  ExternalLink,
  Plus,
  CheckCircle2,
  ClipboardList,
  Trash2,
  Link,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// US-057 — Gestion des réunions (lien manuel Zoom/Meet/Teams)

// Accept HTTPS URLs and recognize the most common video-conferencing providers.
// We intentionally allow arbitrary HTTPS URLs so users can paste links from
// Whereby, Jitsi, Webex, etc. We only reject obviously invalid input.
const KNOWN_MEETING_HOSTS = [
  'zoom.us',
  'us02web.zoom.us',
  'us04web.zoom.us',
  'us05web.zoom.us',
  'us06web.zoom.us',
  'meet.google.com',
  'teams.microsoft.com',
  'teams.live.com',
  'webex.com',
  'whereby.com',
  'meet.jit.si',
  'jitsi.org',
];

const validateMeetingUrl = (raw: string): { valid: boolean; reason?: string; known?: boolean } => {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: true };
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:') {
      return { valid: false, reason: 'Le lien doit commencer par https:// pour des raisons de sécurité.' };
    }
    const host = u.hostname.toLowerCase();
    const known = KNOWN_MEETING_HOSTS.some((h) => host === h || host.endsWith('.' + h));
    return { valid: true, known };
  } catch {
    return { valid: false, reason: 'URL invalide. Exemple : https://zoom.us/j/123456789' };
  }
};

interface Meeting {
  id: string;
  organizer_id: string;
  client_name: string;
  project_name: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  has_reminder: boolean;
  pre_questions: string | null;
  notes: string | null;
  created_at: string;
}

const ProMeetings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("upcoming");

  // New meeting form
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState("60");
  const [newMeetingUrl, setNewMeetingUrl] = useState("");
  const [newPreQuestions, setNewPreQuestions] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
      await fetchMeetings(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchMeetings = async (uid: string) => {
    const { data, error } = await supabase
      .from("pro_meetings")
      .select("*")
      .eq("organizer_id", uid)
      .order("scheduled_at", { ascending: true });
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les réunions" });
      return;
    }
    setMeetings((data || []) as Meeting[]);
  };

  const upcoming = meetings.filter(m => m.status === "upcoming");
  const completed = meetings.filter(m => m.status === "completed");
  const filtered = filter === "all" ? meetings : filter === "upcoming" ? upcoming : completed;

  const toggleReminder = async (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;
    const newVal = !meeting.has_reminder;
    const { error } = await supabase
      .from("pro_meetings")
      .update({ has_reminder: newVal })
      .eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le rappel" });
      return;
    }
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, has_reminder: newVal } : m));
    toast({
      title: newVal ? "Rappels activés" : "Rappels désactivés",
      description: newVal
        ? "Vous recevrez automatiquement un rappel 24h puis 1h avant la réunion."
        : "Aucun rappel ne sera envoyé.",
    });
  };

  const handleSchedule = async () => {
    if (!newTitle || !newClient || !newDate || !newTime || !userId) {
      toast({ variant: "destructive", title: "Champs requis", description: "Remplissez tous les champs obligatoires." });
      return;
    }

    // Validate the meeting URL if provided
    const urlCheck = validateMeetingUrl(newMeetingUrl);
    if (!urlCheck.valid) {
      toast({ variant: "destructive", title: "Lien de réunion invalide", description: urlCheck.reason });
      return;
    }

    const scheduledAt = new Date(`${newDate}T${newTime}`).toISOString();
    if (new Date(scheduledAt).getTime() < Date.now() - 60_000) {
      toast({
        variant: "destructive",
        title: "Date passée",
        description: "La réunion doit être planifiée dans le futur.",
      });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("pro_meetings")
      .insert({
        organizer_id: userId,
        client_name: newClient,
        project_name: newProject || null,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(newDuration),
        meeting_url: newMeetingUrl.trim() || null,
        pre_questions: newPreQuestions.trim() || null,
        has_reminder: true,
        status: "upcoming",
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de créer la réunion" });
      return;
    }
    setMeetings(prev => [data as Meeting, ...prev].sort((a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    ));
    setScheduleOpen(false);
    setNewTitle(""); setNewClient(""); setNewProject(""); setNewDate(""); setNewTime("");
    setNewMeetingUrl(""); setNewPreQuestions("");
    toast({ title: "Réunion planifiée", description: `Réunion avec ${newClient} créée avec succès.` });
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("pro_meetings")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'annuler la réunion" });
      return;
    }
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: "cancelled" } : m));
    setDetailMeeting(null);
    toast({ title: "Réunion annulée", description: "La réunion a été annulée." });
  };

  const getStatusBadge = (status: Meeting["status"]) => {
    switch (status) {
      case "upcoming": return <Badge className="bg-blue-100 text-blue-700 border-blue-200">À venir</Badge>;
      case "ongoing": return <Badge className="bg-green-100 text-green-700 border-green-200">En cours</Badge>;
      case "completed": return <Badge variant="secondary">Terminée</Badge>;
      case "cancelled": return <Badge variant="destructive">Annulée</Badge>;
    }
  };

  const isSoon = (dateStr: string) => {
    const diff = (new Date(dateStr).getTime() - Date.now()) / 1000 / 60;
    return diff > 0 && diff <= 60;
  };

  const isToday = (dateStr: string) => {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/pro/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tableau de bord
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="h-6 w-6 text-blue-600" />
              Réunions
            </h1>
            <p className="text-muted-foreground mt-1">
              {upcoming.length} réunion{upcoming.length !== 1 ? "s" : ""} à venir
            </p>
          </div>
          <Button onClick={() => setScheduleOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Planifier une réunion
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground">À venir</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Terminées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {meetings.filter(m => m.has_reminder && m.status === "upcoming").length}
              </p>
              <p className="text-xs text-muted-foreground">Rappels actifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {([["all", "Toutes"], ["upcoming", "À venir"], ["completed", "Terminées"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filter === val ? "bg-primary text-white" : "border hover:border-primary hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Meeting list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucune réunion dans cette catégorie.
              </CardContent>
            </Card>
          )}
          {filtered.map(meeting => (
            <Card
              key={meeting.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                isSoon(meeting.scheduled_at) ? "border-green-400 bg-green-50/30" : ""
              } ${isToday(meeting.scheduled_at) ? "border-blue-400" : ""}`}
              onClick={() => setDetailMeeting(meeting)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate">{meeting.client_name} — {meeting.project_name || "Projet"}</h3>
                      {getStatusBadge(meeting.status)}
                      {isSoon(meeting.scheduled_at) && (
                        <Badge className="bg-green-500 text-white animate-pulse">Bientôt!</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {meeting.client_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(meeting.scheduled_at), "dd MMM yyyy 'à' HH'h'mm", { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {meeting.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {meeting.status === "upcoming" && (
                      <>
                        {meeting.meeting_url && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                            onClick={e => { e.stopPropagation(); window.open(meeting.meeting_url!, "_blank"); }}
                          >
                            <Video className="h-3 w-3" />
                            Rejoindre
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); toggleReminder(meeting.id); }}
                          className={`flex items-center gap-1 text-xs ${meeting.has_reminder ? "text-amber-600" : "text-muted-foreground"}`}
                        >
                          <Bell className="h-3 w-3" />
                          {meeting.has_reminder ? "Rappel ON" : "Rappel OFF"}
                        </button>
                      </>
                    )}
                    {meeting.status === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail dialog */}
      {detailMeeting && (
        <Dialog open={!!detailMeeting} onOpenChange={() => setDetailMeeting(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-600" />
                {detailMeeting.client_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Client</p>
                  <p className="font-medium">{detailMeeting.client_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Projet</p>
                  <p className="font-medium">{detailMeeting.project_name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date & heure</p>
                  <p className="font-medium">{format(new Date(detailMeeting.scheduled_at), "dd MMM yyyy 'à' HH'h'mm", { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Durée</p>
                  <p className="font-medium">{detailMeeting.duration_minutes} minutes</p>
                </div>
              </div>

              {detailMeeting.pre_questions && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      Questionnaire pré-réunion
                    </p>
                    <p className="text-sm text-muted-foreground bg-gray-50 rounded p-2">{detailMeeting.pre_questions}</p>
                  </div>
                </>
              )}

              {detailMeeting.notes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground bg-gray-50 rounded p-2">{detailMeeting.notes}</p>
                </div>
              )}

              {detailMeeting.status === "upcoming" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Lien de réunion</p>
                    {detailMeeting.meeting_url ? (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <span className="flex-1 truncate text-blue-700">{detailMeeting.meeting_url}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 shrink-0"
                          onClick={() => window.open(detailMeeting.meeting_url!, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ouvrir
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Aucun lien défini</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className={`h-4 w-4 ${detailMeeting.has_reminder ? "text-amber-500" : "text-muted-foreground"}`} />
                    <span className="text-muted-foreground">
                      Rappel : {detailMeeting.has_reminder ? <strong className="text-amber-600">1h avant</strong> : <span>désactivé</span>}
                    </span>
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="gap-2">
              {detailMeeting.status === "upcoming" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancel(detailMeeting.id)}
                  className="gap-1.5 mr-auto"
                >
                  <Trash2 className="h-3 w-3" />
                  Annuler la réunion
                </Button>
              )}
              {detailMeeting.meeting_url && detailMeeting.status === "upcoming" && (
                <Button
                  onClick={() => window.open(detailMeeting.meeting_url!, "_blank")}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Video className="h-4 w-4" />
                  Rejoindre
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetailMeeting(null)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Schedule meeting dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Planifier une réunion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Titre de la réunion *</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Présentation de l'approche" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nom du client *</Label>
                <Input value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="Marie Tremblay" />
              </div>
              <div className="space-y-2">
                <Label>Projet concerné</Label>
                <Input value={newProject} onChange={e => setNewProject(e.target.value)} placeholder="Rénovation cuisine" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Heure *</Label>
                <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Durée</Label>
              <div className="flex gap-2">
                {[30, 45, 60, 90].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setNewDuration(String(d))}
                    className={`flex-1 py-2 rounded border text-sm transition-colors ${newDuration === String(d) ? "bg-primary text-white border-primary" : "hover:border-primary"}`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Link className="h-4 w-4 text-muted-foreground" />
                Lien de réunion (Zoom, Google Meet, Teams…)
              </Label>
              <Input
                value={newMeetingUrl}
                onChange={e => setNewMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/... ou https://meet.google.com/..."
                type="url"
                className={(() => {
                  const check = validateMeetingUrl(newMeetingUrl);
                  if (!check.valid) return 'border-red-500 focus-visible:ring-red-500';
                  return '';
                })()}
              />
              {(() => {
                const check = validateMeetingUrl(newMeetingUrl);
                if (!check.valid && newMeetingUrl.trim()) {
                  return <p className="text-xs text-red-600">{check.reason}</p>;
                }
                if (check.valid && newMeetingUrl.trim() && !check.known) {
                  return (
                    <p className="text-xs text-amber-600">
                      Domaine non reconnu — vérifiez qu'il s'agit bien d'un lien de visioconférence.
                    </p>
                  );
                }
                if (check.valid && newMeetingUrl.trim() && check.known) {
                  return <p className="text-xs text-green-600">Lien valide.</p>;
                }
                return null;
              })()}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Bell className="h-3 w-3" />
                Rappels automatiques 24h et 1h avant la réunion.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Questionnaire pré-réunion (optionnel)
              </Label>
              <Textarea
                value={newPreQuestions}
                onChange={e => setNewPreQuestions(e.target.value)}
                placeholder="Questions à préparer avant la réunion..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Annuler</Button>
            <Button onClick={handleSchedule} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              Créer la réunion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProMeetings;
