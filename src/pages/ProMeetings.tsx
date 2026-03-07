import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle,
  ClipboardList,
  Trash2,
} from "lucide-react";
import { format, addDays, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

// US-057 — Gestion des réunions Zoom

interface Meeting {
  id: string;
  title: string;
  clientName: string;
  projectTitle: string;
  date: Date;
  duration: number; // minutes
  zoomLink: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  hasReminder: boolean;
  preQuestions?: string;
  notes?: string;
}

const MOCK_MEETINGS: Meeting[] = [
  {
    id: "m1",
    title: "Présentation de l'approche — Rénovation cuisine",
    clientName: "Marie Tremblay",
    projectTitle: "Rénovation cuisine moderne",
    date: addDays(new Date(), 2),
    duration: 60,
    zoomLink: "https://zoom.us/j/123456789",
    status: "upcoming",
    hasReminder: true,
    preQuestions: "Quels sont les matériaux préférés ? Budget flexible ?",
  },
  {
    id: "m2",
    title: "Suivi de chantier — Toiture résidentielle",
    clientName: "Jean Gagnon",
    projectTitle: "Remplacement toiture complète",
    date: addDays(new Date(), 5),
    duration: 30,
    zoomLink: "https://zoom.us/j/987654321",
    status: "upcoming",
    hasReminder: false,
    preQuestions: "",
  },
  {
    id: "m3",
    title: "Bilan de projet — Extension maison",
    clientName: "Sophie Côté",
    projectTitle: "Extension maison familiale",
    date: addDays(new Date(), -3),
    duration: 45,
    zoomLink: "https://zoom.us/j/111222333",
    status: "completed",
    hasReminder: false,
    notes: "Client satisfait. Demande un devis pour la finition.",
  },
];

const ProMeetings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
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
  const [newPreQuestions, setNewPreQuestions] = useState("");

  const upcoming = meetings.filter(m => m.status === "upcoming");
  const completed = meetings.filter(m => m.status === "completed");

  const filtered = filter === "all" ? meetings : filter === "upcoming" ? upcoming : completed;

  const toggleReminder = (id: string) => {
    setMeetings(prev => prev.map(m =>
      m.id === id ? { ...m, hasReminder: !m.hasReminder } : m
    ));
    const m = meetings.find(m => m.id === id);
    toast({
      title: m?.hasReminder ? "Rappel désactivé" : "Rappel activé",
      description: m?.hasReminder
        ? "Vous ne recevrez plus de rappel pour cette réunion."
        : "Vous recevrez un rappel 1h avant la réunion.",
    });
  };

  const handleSchedule = () => {
    if (!newTitle || !newClient || !newDate || !newTime) {
      toast({ variant: "destructive", title: "Champs requis", description: "Remplissez tous les champs obligatoires." });
      return;
    }
    const meetingDate = new Date(`${newDate}T${newTime}`);
    const newMeeting: Meeting = {
      id: `m${Date.now()}`,
      title: newTitle,
      clientName: newClient,
      projectTitle: newProject || "Projet non spécifié",
      date: meetingDate,
      duration: parseInt(newDuration),
      zoomLink: `https://zoom.us/j/${Math.floor(Math.random() * 900000000) + 100000000}`,
      status: "upcoming",
      hasReminder: true,
      preQuestions: newPreQuestions,
    };
    setMeetings(prev => [newMeeting, ...prev]);
    setScheduleOpen(false);
    setNewTitle(""); setNewClient(""); setNewProject(""); setNewDate(""); setNewTime(""); setNewPreQuestions("");
    toast({
      title: "✅ Réunion planifiée",
      description: `Un lien Zoom a été créé et envoyé à ${newClient}.`,
    });
  };

  const handleDelete = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    setDetailMeeting(null);
    toast({ title: "Réunion annulée", description: "La réunion a été supprimée et le client notifié." });
  };

  const getStatusBadge = (status: Meeting["status"]) => {
    switch (status) {
      case "upcoming": return <Badge className="bg-blue-100 text-blue-700 border-blue-200">À venir</Badge>;
      case "ongoing": return <Badge className="bg-green-100 text-green-700 border-green-200">En cours</Badge>;
      case "completed": return <Badge variant="secondary">Terminée</Badge>;
      case "cancelled": return <Badge variant="destructive">Annulée</Badge>;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSoon = (date: Date) => {
    const diff = (date.getTime() - Date.now()) / 1000 / 60; // minutes
    return diff > 0 && diff <= 60;
  };

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
              Réunions Zoom
            </h1>
            <p className="text-muted-foreground mt-1">
              {upcoming.length} réunion{upcoming.length !== 1 ? 's' : ''} à venir
            </p>
          </div>
          <Button onClick={() => setScheduleOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Planifier une réunion
          </Button>
        </div>

        {/* Stats row */}
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
                {meetings.filter(m => m.hasReminder && m.status === "upcoming").length}
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
                isSoon(meeting.date) ? 'border-green-400 bg-green-50/30' : ''
              } ${isToday(meeting.date) ? 'border-blue-400' : ''}`}
              onClick={() => setDetailMeeting(meeting)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate">{meeting.title}</h3>
                      {getStatusBadge(meeting.status)}
                      {isSoon(meeting.date) && (
                        <Badge className="bg-green-500 text-white animate-pulse">Bientôt!</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {meeting.clientName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(meeting.date, "dd MMM yyyy 'à' HH'h'mm", { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {meeting.duration} min
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{meeting.projectTitle}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {meeting.status === "upcoming" && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                          onClick={e => { e.stopPropagation(); window.open(meeting.zoomLink, '_blank'); }}
                        >
                          <Video className="h-3 w-3" />
                          Rejoindre
                        </Button>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); toggleReminder(meeting.id); }}
                          className={`flex items-center gap-1 text-xs ${meeting.hasReminder ? 'text-amber-600' : 'text-muted-foreground'}`}
                        >
                          <Bell className="h-3 w-3" />
                          {meeting.hasReminder ? 'Rappel ON' : 'Rappel OFF'}
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
                {detailMeeting.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Client</p>
                  <p className="font-medium">{detailMeeting.clientName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Projet</p>
                  <p className="font-medium">{detailMeeting.projectTitle}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date & heure</p>
                  <p className="font-medium">{format(detailMeeting.date, "dd MMM yyyy 'à' HH'h'mm", { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Durée</p>
                  <p className="font-medium">{detailMeeting.duration} minutes</p>
                </div>
              </div>

              {detailMeeting.preQuestions && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      Questionnaire pré-réunion
                    </p>
                    <p className="text-sm text-muted-foreground bg-gray-50 rounded p-2">{detailMeeting.preQuestions}</p>
                  </div>
                </>
              )}

              {detailMeeting.notes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Notes de réunion</p>
                  <p className="text-sm text-muted-foreground bg-gray-50 rounded p-2">{detailMeeting.notes}</p>
                </div>
              )}

              {detailMeeting.status === "upcoming" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Lien Zoom</p>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <span className="flex-1 truncate text-blue-700">{detailMeeting.zoomLink}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 shrink-0"
                        onClick={() => window.open(detailMeeting.zoomLink, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ouvrir
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className={`h-4 w-4 ${detailMeeting.hasReminder ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <span className="text-muted-foreground">
                      Rappel automatique : {detailMeeting.hasReminder ? <strong className="text-amber-600">1h avant</strong> : <span>désactivé</span>}
                    </span>
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="gap-2">
              {detailMeeting.status === "upcoming" && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(detailMeeting.id)}
                    className="gap-1.5 mr-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                    Annuler la réunion
                  </Button>
                  <Button
                    onClick={() => window.open(detailMeeting.zoomLink, '_blank')}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Video className="h-4 w-4" />
                    Rejoindre Zoom
                  </Button>
                </>
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
              Planifier une réunion Zoom
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
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
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
                    className={`flex-1 py-2 rounded border text-sm transition-colors ${newDuration === String(d) ? 'bg-primary text-white border-primary' : 'hover:border-primary'}`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Questionnaire pré-réunion (optionnel)
              </Label>
              <Textarea
                value={newPreQuestions}
                onChange={e => setNewPreQuestions(e.target.value)}
                placeholder="Questions à envoyer au client avant la réunion..."
                rows={3}
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              Un lien Zoom sera généré automatiquement et envoyé au client par email. Un rappel automatique sera activé 1h avant.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Annuler</Button>
            <Button onClick={handleSchedule} className="gap-2">
              <Video className="h-4 w-4" />
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
