import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  User,
  Video,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type MeetingStatus = "scheduled" | "cancelled" | "completed";

type Meeting = {
  id: string;
  conversation_id: string;
  organizer_id: string;
  participant_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  status: MeetingStatus;
  notes: string | null;
  created_at: string | null;
  counterpart_name: string;
};

type Filter = "all" | "upcoming" | "completed" | "cancelled";

const ProMeetings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");

  const fetchMeetings = async (uid: string) => {
    setLoadError(false);
    const { data, error } = await supabase
      .from("meetings")
      .select("id,conversation_id,organizer_id,participant_id,title,scheduled_at,duration_minutes,meeting_url,status,notes,created_at")
      .or(`organizer_id.eq.${uid},participant_id.eq.${uid}`)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;

    const rows = data || [];
    const counterpartIds = Array.from(new Set(rows.map((meeting) =>
      meeting.organizer_id === uid ? meeting.participant_id : meeting.organizer_id,
    )));

    const profileNames = new Map<string, string>();
    if (counterpartIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name,company_name")
        .in("id", counterpartIds);

      if (profileError) throw profileError;
      (profiles || []).forEach((profile) => {
        profileNames.set(profile.id, profile.company_name || profile.full_name || "Participant");
      });
    }

    setMeetings(rows.map((meeting) => {
      const counterpartId = meeting.organizer_id === uid ? meeting.participant_id : meeting.organizer_id;
      return {
        ...meeting,
        status: meeting.status as MeetingStatus,
        counterpart_name: profileNames.get(counterpartId) || "Participant",
      };
    }));
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) {
          navigate("/auth?mode=login", { replace: true });
          return;
        }

        setUserId(session.user.id);
        await fetchMeetings(session.user.id);
      } catch (error) {
        console.error("Unable to load meetings", error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`meetings-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings" },
        () => void fetchMeetings(userId).catch((error) => console.error("Unable to refresh meetings", error)),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const upcoming = useMemo(
    () => meetings.filter((meeting) => meeting.status === "scheduled" && new Date(meeting.scheduled_at).getTime() >= Date.now()),
    [meetings],
  );
  const completed = useMemo(() => meetings.filter((meeting) => meeting.status === "completed"), [meetings]);
  const cancelled = useMemo(() => meetings.filter((meeting) => meeting.status === "cancelled"), [meetings]);

  const filtered = useMemo(() => {
    if (filter === "upcoming") return upcoming;
    if (filter === "completed") return completed;
    if (filter === "cancelled") return cancelled;
    return meetings;
  }, [filter, meetings, upcoming, completed, cancelled]);

  const updateStatus = async (meeting: Meeting, status: Extract<MeetingStatus, "cancelled" | "completed">) => {
    if (!userId || meeting.organizer_id !== userId || savingId) return;
    setSavingId(meeting.id);
    try {
      const { data, error } = await supabase
        .from("meetings")
        .update({ status })
        .eq("id", meeting.id)
        .eq("organizer_id", userId)
        .eq("status", "scheduled")
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("La réunion n’est plus modifiable.");

      setMeetings((previous) => previous.map((item) => item.id === meeting.id ? { ...item, status } : item));
      setDetailMeeting((current) => current?.id === meeting.id ? { ...current, status } : current);
      toast({
        title: status === "cancelled" ? "Réunion annulée" : "Réunion terminée",
        description: status === "cancelled"
          ? "Le statut a été mis à jour dans le même rendez-vous que celui de la messagerie."
          : "La réunion est maintenant marquée comme terminée.",
      });
    } catch (error) {
      console.error("Unable to update meeting", error);
      toast({
        variant: "destructive",
        title: "Impossible de modifier la réunion",
        description: "Aucune modification n’a été enregistrée. Réessayez.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const getStatusBadge = (meeting: Meeting) => {
    if (meeting.status === "completed") return <Badge variant="secondary">Terminée</Badge>;
    if (meeting.status === "cancelled") return <Badge variant="destructive">Annulée</Badge>;
    if (new Date(meeting.scheduled_at).getTime() < Date.now()) return <Badge variant="outline">Passée</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200">À venir</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center pt-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
      <Navigation />
      <main className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        <Button variant="ghost" onClick={() => navigate("/pro/dashboard")} className="gap-2 mb-5">
          <ArrowLeft className="h-4 w-4" /> Tableau de bord
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="tech-label-blue mb-2">Communication · Réunions</p>
            <h1 className="font-ui text-3xl font-bold text-primary">Réunions</h1>
            <p className="text-muted-foreground mt-2">
              Les rendez-vous affichés ici sont exactement ceux planifiés dans vos conversations BâtirNet.
            </p>
          </div>
          <Button onClick={() => navigate("/messages")} className="gap-2 shrink-0">
            <MessageSquare className="h-4 w-4" /> Planifier depuis la messagerie
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{upcoming.length}</p><p className="text-xs text-muted-foreground">À venir</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{completed.length}</p><p className="text-xs text-muted-foreground">Terminées</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{meetings.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {([[
            "all", "Toutes",
          ], ["upcoming", "À venir"], ["completed", "Terminées"], ["cancelled", "Annulées"]] as const).map(([value, label]) => (
            <Button key={value} variant={filter === value ? "default" : "outline"} size="sm" onClick={() => setFilter(value)}>
              {label}
            </Button>
          ))}
        </div>

        {loadError ? (
          <Card className="border-amber-200 bg-amber-50/70">
            <CardContent className="py-10 text-center">
              <AlertCircle className="h-9 w-9 mx-auto text-amber-600 mb-3" />
              <h2 className="font-semibold">Impossible de charger les réunions.</h2>
              <p className="text-sm text-muted-foreground mt-1">La messagerie reste accessible et aucune réunion n’a été modifiée.</p>
              <Button
                variant="outline"
                className="mt-4 bg-white"
                onClick={() => {
                  if (!userId) return;
                  setLoading(true);
                  void fetchMeetings(userId)
                    .catch((error) => {
                      console.error("Unable to reload meetings", error);
                      setLoadError(true);
                    })
                    .finally(() => setLoading(false));
                }}
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h2 className="font-semibold">Aucune réunion dans cette catégorie.</h2>
              <p className="text-sm text-muted-foreground mt-1">Planifiez un rendez-vous directement depuis une conversation avec un client.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailMeeting(meeting)}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-primary truncate">{meeting.title}</h3>
                        {getStatusBadge(meeting)}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{meeting.counterpart_name}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(meeting.scheduled_at), "dd MMM yyyy 'à' HH'h'mm", { locale: fr })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{meeting.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); navigate(`/messages?conversation=${meeting.conversation_id}`); }}>
                        <MessageSquare className="h-4 w-4 mr-1.5" /> Conversation
                      </Button>
                      {meeting.meeting_url && meeting.status === "scheduled" && (
                        <Button size="sm" onClick={(event) => { event.stopPropagation(); window.open(meeting.meeting_url!, "_blank", "noopener,noreferrer"); }}>
                          <Video className="h-4 w-4 mr-1.5" /> Rejoindre
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={Boolean(detailMeeting)} onOpenChange={(open) => { if (!open) setDetailMeeting(null); }}>
        {detailMeeting && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-primary" />{detailMeeting.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Avec</p><p className="font-medium">{detailMeeting.counterpart_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Statut</p><div className="mt-1">{getStatusBadge(detailMeeting)}</div></div>
                <div><p className="text-xs text-muted-foreground">Date et heure</p><p className="font-medium">{format(new Date(detailMeeting.scheduled_at), "dd MMM yyyy 'à' HH'h'mm", { locale: fr })}</p></div>
                <div><p className="text-xs text-muted-foreground">Durée</p><p className="font-medium">{detailMeeting.duration_minutes} minutes</p></div>
              </div>
              {detailMeeting.notes && <div><p className="text-xs text-muted-foreground">Notes</p><p className="mt-1 rounded-lg bg-muted p-3 whitespace-pre-wrap">{detailMeeting.notes}</p></div>}
              {detailMeeting.meeting_url && (
                <div>
                  <p className="text-xs text-muted-foreground">Lien de réunion</p>
                  <Button variant="outline" className="mt-1 w-full justify-between" onClick={() => window.open(detailMeeting.meeting_url!, "_blank", "noopener,noreferrer") }>
                    <span className="truncate">{detailMeeting.meeting_url}</span><ExternalLink className="h-4 w-4 ml-2 shrink-0" />
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex gap-2">
                {userId === detailMeeting.organizer_id && detailMeeting.status === "scheduled" && (
                  <>
                    <Button variant="destructive" size="sm" disabled={savingId === detailMeeting.id} onClick={() => void updateStatus(detailMeeting, "cancelled")}>
                      {savingId === detailMeeting.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1.5" />Annuler</>}
                    </Button>
                    <Button variant="outline" size="sm" disabled={savingId === detailMeeting.id} onClick={() => void updateStatus(detailMeeting, "completed")}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />Terminée
                    </Button>
                  </>
                )}
              </div>
              <Button onClick={() => navigate(`/messages?conversation=${detailMeeting.conversation_id}`)}>
                <MessageSquare className="h-4 w-4 mr-1.5" /> Ouvrir la conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProMeetings;
