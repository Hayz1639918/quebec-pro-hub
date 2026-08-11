import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/services/profile-service";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, MessageSquare, FileText, CheckCircle, X, Trash2, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  metadata?: {
    proposal_id?: string;
    project_id?: string;
    conversation_id?: string;
    professional_id?: string;
  } | null;
}

const normalizeMetadata = (value: unknown): Notification['metadata'] => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const metadata = value as Record<string, unknown>;
  const readString = (key: string) => typeof metadata[key] === 'string' ? metadata[key] as string : undefined;
  return {
    proposal_id: readString('proposal_id'),
    project_id: readString('project_id'),
    conversation_id: readString('conversation_id'),
    professional_id: readString('professional_id'),
  };
};

const Notifications = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Notification preferences (US-042)
  type NotifPrefs = {
    email_messages: boolean;
    email_proposals: boolean;
    email_contracts: boolean;
    email_payments: boolean;
    email_reviews: boolean;
    push_messages: boolean;
    push_proposals: boolean;
    push_contracts: boolean;
    push_milestones: boolean;
    push_system: boolean;
    push_new_projects: boolean;
    push_payment_released: boolean;
    push_subscription_reminder: boolean;
  };
  const DEFAULT_PREFS: NotifPrefs = {
    email_messages: true,
    email_proposals: true,
    email_contracts: true,
    email_payments: true,
    email_reviews: true,
    push_messages: true,
    push_proposals: true,
    push_contracts: true,
    push_milestones: true,
    push_system: false,
    push_new_projects: true,
    push_payment_released: true,
    push_subscription_reminder: true,
  };
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Function to translate notification titles based on type
  const getTranslatedTitle = (notification: Notification): string => {
    // Map notification types to translation keys
    const typeMap: Record<string, string> = {
      'message': 'notifications.types.new_message',
      'new_message': 'notifications.types.new_message',
      'proposal': 'notifications.types.new_proposal',
      'new_proposal': 'notifications.types.new_proposal',
      'proposal_accepted': 'notifications.types.proposal_accepted',
      'proposal_rejected': 'notifications.types.proposal_rejected',
      'contract': 'notifications.types.contract_signed',
      'contract_signed': 'notifications.types.contract_signed',
      'contract_created': 'notifications.types.contract_created',
      'payment': 'notifications.types.payment_received',
      'payment_received': 'notifications.types.payment_received',
      'review': 'notifications.types.review_posted',
      'review_received': 'notifications.types.review_received',
      'milestone_completed': 'notifications.types.milestone_completed',
      'project_update': 'notifications.types.project_update',
      'system': 'notifications.types.system_announcement',
    };
    
    // If we have a translation key for this type, use it
    if (typeMap[notification.type]) {
      return t(typeMap[notification.type]);
    }
    
    // Otherwise, fall back to the stored title
    return notification.title;
  };

  // Function to translate notification messages
  const getTranslatedMessage = (notification: Notification): string => {
    const metadata = notification.metadata;
    
    // Try to build a translated message based on type
    switch (notification.type) {
      case 'proposal':
      case 'new_proposal':
        if (metadata?.project_id) {
          return t('notifications.messages.new_proposal_for_project');
        }
        break;
      case 'proposal_accepted':
        return t('notifications.messages.proposal_accepted');
      case 'proposal_rejected':
        return t('notifications.messages.proposal_rejected');
      case 'message':
      case 'new_message':
        return t('notifications.messages.new_message_received');
      case 'contract':
      case 'contract_signed':
        return t('notifications.messages.contract_signed');
      case 'contract_created':
        return t('notifications.messages.contract_created');
    }
    
    // Fall back to stored message
    return notification.message;
  };

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      await Promise.all([
        fetchNotifications(session.user.id),
        fetchPrefs(session.user.id),
      ]);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrefs = async (uid: string) => {
    const profile = await getMyProfile();
    const data = profile?.id === uid ? profile : null;
    if (data?.notification_preferences && typeof data.notification_preferences === 'object') {
      setPrefs(prev => ({ ...prev, ...(data.notification_preferences as Partial<NotifPrefs>) }));
    }
  };

  const savePrefs = async () => {
    if (!userId) return;
    setSavingPrefs(true);
    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: prefs })
      .eq('id', userId);
    setSavingPrefs(false);
    if (!error) {
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Try action_url first
    if (notification.action_url) {
      navigate(notification.action_url);
      return;
    }
    
    // Build navigation URL based on type and metadata
    const metadata = notification.metadata;
    if (metadata) {
      switch (notification.type) {
        case 'proposal':
          if (metadata.proposal_id) {
            navigate(`/proposal/${metadata.proposal_id}?showPDF=true`);
          } else if (metadata.project_id) {
            navigate(`/tender/${metadata.project_id}`);
          }
          break;
        case 'message':
          if (metadata.conversation_id) {
            navigate(`/messages?conversation=${metadata.conversation_id}`);
          } else {
            navigate('/messages');
          }
          break;
        case 'contract':
          navigate('/contracts');
          break;
        case 'payment':
          navigate('/dashboard');
          break;
        case 'review':
          navigate('/pro/reviews');
          break;
        default:
          navigate('/dashboard');
      }
    } else {
      // Fallback based on type
      switch (notification.type) {
        case 'message':
          navigate('/messages');
          break;
        case 'proposal':
          navigate('/dashboard');
          break;
        case 'contract':
          navigate('/contracts');
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      case 'contract':
        return <FileText className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{t('navigation.notifications')}</h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground mt-1">
                {unreadCount} {unreadCount === 1 ? t('notifications.new_notification') : t('notifications.new_notifications')}
              </p>
            )}
          </div>

          <Tabs defaultValue="notifications">
            <TabsList className="mb-6">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-1 text-xs">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Préférences
              </TabsTrigger>
            </TabsList>

            {/* Notifications list tab */}
            <TabsContent value="notifications">
              <div className="flex justify-end mb-4">
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead} variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('notifications.mark_all_read')}
                  </Button>
                )}
              </div>

              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">{t('notifications.no_notifications')}</h3>
                    <p className="text-muted-foreground">{t('notifications.no_notifications_yet')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-colors hover:bg-accent/5 ${
                        !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full ${
                            !notification.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{getTranslatedTitle(notification)}</h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!notification.is_read && (
                                  <Badge variant="default" className="text-xs">{t('notifications.new')}</Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{getTranslatedMessage(notification)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(notification.created_at), 'PPp', {
                                locale: i18n.language === 'fr' ? fr : enUS,
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Preferences tab (US-042) */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Préférences de notifications</CardTitle>
                  <CardDescription>
                    Choisissez les événements pour lesquels vous souhaitez être notifié et par quel canal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Email notifications */}
                  <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
                      Notifications par courriel
                    </h3>
                    <div className="space-y-4">
                      {[
                        { key: "email_messages", label: "Nouveaux messages", desc: "Quand un entrepreneur vous envoie un message" },
                        { key: "email_proposals", label: "Nouvelles soumissions", desc: "Quand un entrepreneur soumet une proposition pour votre projet" },
                        { key: "email_contracts", label: "Contrats", desc: "Création, signature et mises à jour de contrats" },
                        { key: "email_payments", label: "Paiements", desc: "Confirmations de paiement et jalons complétés" },
                        { key: "email_reviews", label: "Avis et évaluations", desc: "Quand un avis est laissé sur votre profil" },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                          <Switch
                            checked={prefs[key as keyof NotifPrefs]}
                            onCheckedChange={(v) => setPrefs(p => ({ ...p, [key]: v }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Push notifications */}
                  <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
                      Notifications push (dans l'application)
                    </h3>
                    <div className="space-y-4">
                      {[
                        { key: "push_messages", label: "Messages en temps réel", desc: "Alertes instantanées pour les nouveaux messages" },
                        { key: "push_proposals", label: "Nouvelles soumissions", desc: "Alerte dès qu'une soumission est déposée" },
                        { key: "push_contracts", label: "Activité sur les contrats", desc: "Signature, modification et expiration" },
                        { key: "push_milestones", label: "Jalons et progression", desc: "Quand un entrepreneur met à jour l'avancement" },
                        { key: "push_system", label: "Annonces système", desc: "Mises à jour importantes de la plateforme" },
                        { key: "push_new_projects", label: "Nouveaux projets correspondants (Entrepreneur)", desc: "Alerte dès qu'un projet correspond à vos services et votre région" },
                        { key: "push_payment_released", label: "Paiement débloqué (Entrepreneur)", desc: "Quand un client valide et libère un paiement de jalon" },
                        { key: "push_subscription_reminder", label: "Rappel d'abonnement (Entrepreneur)", desc: "7 jours et 1 jour avant l'expiration de votre abonnement Premium" },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                          <Switch
                            checked={prefs[key as keyof NotifPrefs]}
                            onCheckedChange={(v) => setPrefs(p => ({ ...p, [key]: v }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {prefsSaved && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Préférences sauvegardées
                      </p>
                    )}
                    <Button onClick={savePrefs} disabled={savingPrefs} className="ml-auto">
                      {savingPrefs ? "Sauvegarde..." : "Sauvegarder les préférences"}
                    </Button>
                  </div>
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
