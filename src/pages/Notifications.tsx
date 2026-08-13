import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Bell, CheckCircle, FileText, MessageSquare, Settings2, Trash2 } from "lucide-react";

type NotificationMetadata = {
  proposal_id?: string;
  project_id?: string;
  conversation_id?: string;
  professional_id?: string;
  contract_id?: string;
};

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  metadata: NotificationMetadata | null;
};

type InAppPrefs = {
  push_messages: boolean;
  push_proposals: boolean;
  push_contracts: boolean;
  push_milestones: boolean;
  push_system: boolean;
  push_new_projects: boolean;
  push_payment_released: boolean;
};

const DEFAULT_PREFS: InAppPrefs = {
  push_messages: true,
  push_proposals: true,
  push_contracts: true,
  push_milestones: true,
  push_system: true,
  push_new_projects: true,
  push_payment_released: true,
};

const normalizeMetadata = (value: unknown): NotificationMetadata | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const metadata = value as Record<string, unknown>;
  const readString = (key: string) => typeof metadata[key] === "string" ? metadata[key] as string : undefined;
  return {
    proposal_id: readString("proposal_id"),
    project_id: readString("project_id"),
    conversation_id: readString("conversation_id"),
    professional_id: readString("professional_id"),
    contract_id: readString("contract_id"),
  };
};

const Notifications = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [prefs, setPrefs] = useState<InAppPrefs>(DEFAULT_PREFS);
  const [existingPrefs, setExistingPrefs] = useState<Record<string, boolean>>({});
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fetchNotifications = async (uid: string) => {
    setLoadError(false);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setNotifications((data || []).map((notification) => ({
      id: notification.id,
      user_id: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      action_url: notification.action_url,
      is_read: notification.is_read ?? false,
      created_at: notification.created_at ?? new Date(0).toISOString(),
      metadata: normalizeMetadata(notification.metadata),
    })));
  };

  const fetchPrefs = async (uid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", uid)
      .maybeSingle();

    if (error) throw error;
    const raw = data?.notification_preferences;
    const stored: Record<string, boolean> = {};
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      Object.entries(raw).forEach(([key, value]) => {
        if (typeof value === "boolean") stored[key] = value;
      });
    }
    setExistingPrefs(stored);
    setPrefs((previous) => ({ ...previous, ...stored }));
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) {
          navigate("/auth", { replace: true });
          return;
        }

        setUserId(session.user.id);
        await Promise.all([fetchNotifications(session.user.id), fetchPrefs(session.user.id)]);
      } catch (error) {
        console.error("Unable to initialize notifications", error);
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

  const savePrefs = async () => {
    if (!userId || savingPrefs) return;
    setSavingPrefs(true);
    try {
      const nextPreferences = { ...existingPrefs, ...prefs };
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: nextPreferences })
        .eq("id", userId);
      if (error) throw error;
      setExistingPrefs(nextPreferences);
      toast({ title: "Préférences sauvegardées", description: "Les notifications dans BâtirNet respecteront maintenant ces réglages." });
    } catch (error) {
      console.error("Unable to save notification preferences", error);
      toast({ variant: "destructive", title: "Sauvegarde impossible", description: "Vos préférences n’ont pas été modifiées. Réessayez." });
    } finally {
      setSavingPrefs(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);
    if (error) throw error;
    setNotifications((previous) => previous.map((notification) => notification.id === notificationId ? { ...notification, is_read: true } : notification));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw error;
      setNotifications((previous) => previous.map((notification) => ({ ...notification, is_read: true })));
    } catch (error) {
      console.error("Unable to mark notifications as read", error);
      toast({ variant: "destructive", title: "Action impossible", description: "Les notifications n’ont pas toutes pu être marquées comme lues." });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
      if (error) throw error;
      setNotifications((previous) => previous.filter((notification) => notification.id !== notificationId));
    } catch (error) {
      console.error("Unable to delete notification", error);
      toast({ variant: "destructive", title: "Suppression impossible", description: "La notification est restée dans votre liste." });
    }
  };

  const fallbackDestination = (notification: Notification) => {
    const metadata = notification.metadata;
    if (notification.type.includes("message")) {
      return metadata?.conversation_id ? `/messages?conversation=${metadata.conversation_id}` : "/messages";
    }
    if (notification.type.includes("contract_proposal")) return "/proposals/review";
    if (notification.type.includes("contract") || notification.type.includes("signature")) {
      return metadata?.contract_id ? `/contracts?contract=${metadata.contract_id}` : "/contracts";
    }
    if (notification.type.includes("proposal") && metadata?.proposal_id) return `/proposal/${metadata.proposal_id}`;
    if (notification.type.includes("project") && metadata?.project_id) return `/project/${metadata.project_id}`;
    if (notification.type.includes("payment") || notification.type.includes("invoice")) return "/dashboard/payments";
    if (notification.type.includes("review")) return "/pro/reviews";
    return "/dashboard";
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) await markAsRead(notification.id);
    } catch (error) {
      console.error("Unable to mark notification as read", error);
    }
    navigate(notification.action_url || fallbackDestination(notification));
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes("message")) return <MessageSquare className="h-5 w-5" />;
    if (type.includes("contract") || type.includes("signature")) return <FileText className="h-5 w-5" />;
    return <Bell className="h-5 w-5" />;
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </>
    );
  }

  const preferenceRows: Array<{ key: keyof InAppPrefs; label: string; desc: string }> = [
    { key: "push_messages", label: "Nouveaux messages", desc: "Messages reçus dans vos conversations BâtirNet." },
    { key: "push_proposals", label: "Soumissions et propositions", desc: "Nouvelles soumissions, propositions et changements associés." },
    { key: "push_contracts", label: "Contrats et signatures", desc: "Création, signature et activité importante sur un contrat." },
    { key: "push_milestones", label: "Jalons et progression", desc: "Demandes, validations et changements liés aux jalons." },
    { key: "push_new_projects", label: "Projets et invitations", desc: "Nouveaux projets pertinents et invitations à participer." },
    { key: "push_payment_released", label: "Suivi des paiements", desc: "Mises à jour de suivi et factures. BâtirNet ne déplace pas l’argent." },
    { key: "push_system", label: "Informations système", desc: "Événements importants qui ne correspondent pas aux catégories ci-dessus." },
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-24 pb-12 px-4 bg-[#f7f9fc]">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{t("navigation.notifications")}</h1>
            <p className="text-muted-foreground mt-1">{unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Vous êtes à jour."}</p>
          </div>

          <Tabs defaultValue="notifications">
            <TabsList className="mb-6">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifications
                {unreadCount > 0 && <Badge className="ml-1 text-xs">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Préférences</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications">
              {loadError ? (
                <Card className="border-amber-200 bg-amber-50/70">
                  <CardContent className="py-10 text-center">
                    <AlertCircle className="h-9 w-9 mx-auto text-amber-600 mb-3" />
                    <h2 className="font-semibold">Impossible de charger vos notifications.</h2>
                    <p className="text-sm text-muted-foreground mt-1">Aucune notification n’a été supprimée ou modifiée.</p>
                    <Button
                      variant="outline"
                      className="mt-4 bg-white"
                      onClick={() => {
                        if (!userId) return;
                        setLoading(true);
                        void fetchNotifications(userId)
                          .catch((error) => {
                            console.error("Unable to reload notifications", error);
                            setLoadError(true);
                          })
                          .finally(() => setLoading(false));
                      }}
                    >
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {unreadCount > 0 && <div className="flex justify-end mb-4"><Button onClick={() => void markAllAsRead()} variant="outline" size="sm"><CheckCircle className="h-4 w-4 mr-2" />Tout marquer comme lu</Button></div>}
                  {notifications.length === 0 ? (
                    <Card><CardContent className="text-center py-12"><Bell className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" /><h3 className="font-semibold">Aucune notification</h3><p className="text-sm text-muted-foreground mt-1">Les événements utiles apparaîtront ici.</p></CardContent></Card>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <Card key={notification.id} className={`cursor-pointer transition-colors hover:bg-accent/5 ${!notification.is_read ? "bg-primary/5 border-primary/20" : ""}`} onClick={() => void handleNotificationClick(notification)}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-full ${!notification.is_read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{getNotificationIcon(notification.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div><h4 className="font-semibold text-sm">{notification.title}</h4><p className="text-sm text-muted-foreground mt-1">{notification.message}</p></div>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(event) => { event.stopPropagation(); void deleteNotification(notification.id); }}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">{format(new Date(notification.created_at), "PPp", { locale: i18n.language === "fr" ? fr : enUS })}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications dans BâtirNet</CardTitle>
                  <CardDescription>
                    Ces réglages contrôlent les notifications enregistrées et affichées dans BâtirNet. Ils n’activent pas de courriels ni de notifications système sur votre téléphone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {preferenceRows.map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between gap-6 py-2 border-b last:border-0">
                      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground mt-1">{desc}</p></div>
                      <Switch checked={prefs[key]} onCheckedChange={(value) => setPrefs((previous) => ({ ...previous, [key]: value }))} />
                    </div>
                  ))}
                  <div className="flex justify-end pt-2"><Button onClick={() => void savePrefs()} disabled={savingPrefs}>{savingPrefs ? "Sauvegarde..." : "Sauvegarder"}</Button></div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Notifications;
