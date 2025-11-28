import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, MessageSquare, FileText, CheckCircle, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import Navigation from "@/components/Navigation";

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

const Notifications = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to translate notification titles based on type
  const getTranslatedTitle = (notification: Notification): string => {
    // Map notification types to translation keys
    const typeMap: Record<string, string> = {
      'message': 'notifications.types.new_message',
      'proposal': 'notifications.types.new_proposal',
      'contract': 'notifications.types.contract_signed',
      'payment': 'notifications.types.payment_received',
      'review': 'notifications.types.review_posted',
    };
    
    // If we have a translation key for this type, use it
    if (typeMap[notification.type]) {
      return t(typeMap[notification.type]);
    }
    
    // Otherwise, fall back to the stored title
    return notification.title;
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
      await fetchNotifications(session.user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate("/auth");
    } finally {
      setLoading(false);
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
      setNotifications(data || []);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {t('navigation.notifications')}
            </h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground mt-1">
                {unreadCount} {unreadCount === 1 ? t('notifications.new_notification') : t('notifications.new_notifications')}
              </p>
            )}
          </div>
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
              <p className="text-muted-foreground">
                {t('notifications.no_notifications_yet')}
              </p>
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
                        <h4 className="font-semibold text-sm">
                          {getTranslatedTitle(notification)}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <Badge variant="default" className="text-xs">
                              {t('notifications.new')}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
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
        </div>
      </div>
    </>
  );
};

export default Notifications;

