import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  MessageSquare,
  FileText,
  CheckCircle2,
  DollarSign,
  Gavel,
  Flag,
  ShieldAlert,
  Hammer,
  Star,
  Sparkles,
  Inbox,
  Check,
  UserPlus,
  Video,
  Reply,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

const typeIcon = (type: string) => {
  switch (type) {
    case "new_message":
    case "message":
      return MessageSquare;
    case "new_proposal":
    case "proposal":
    case "proposal_accepted":
      return FileText;
    case "contract_signed":
    case "contract_created":
    case "contract":
      return FileText;
    case "payment_pending":
    case "payment_received":
    case "payment_released":
    case "payment":
      return DollarSign;
    case "invoice_issued":
      return FileText;
    case "milestone_completed":
    case "milestone_approved":
    case "milestone_requested":
      return Hammer;
    case "review_posted":
    case "review_received":
      return Star;
    case "dispute_opened":
      return Gavel;
    case "dispute_resolved":
      return CheckCircle2;
    case "dispute_flagged":
      return Flag;
    case "verification":
      return ShieldAlert;
    case "invitation_received":
    case "invitation_accepted":
    case "invitation_declined":
      return UserPlus;
    case "meeting_reminder":
      return Video;
    case "review_reply":
      return Reply;
    case "system":
      return Sparkles;
    default:
      return Bell;
  }
};

const typeColor = (type: string) => {
  if (type.startsWith("payment") || type === "invoice_issued") return "text-success bg-success-light";
  if (type.startsWith("contract")) return "text-primary bg-primary/10";
  if (type.startsWith("proposal")) return "text-primary bg-primary/10";
  if (type.startsWith("message")) return "text-primary bg-primary/10";
  if (type.startsWith("milestone")) return "text-warning bg-warning-light";
  if (type.startsWith("review")) return "text-warning bg-warning-light";
  if (type.startsWith("dispute")) return "text-destructive bg-destructive/10";
  if (type.startsWith("invitation")) return "text-primary bg-primary/10";
  if (type === "meeting_reminder") return "text-primary bg-primary/10";
  return "text-muted-foreground bg-muted";
};

const groupByDate = (items: NotificationRow[]) => {
  const today: NotificationRow[] = [];
  const yesterday: NotificationRow[] = [];
  const earlier: NotificationRow[] = [];
  for (const n of items) {
    const d = new Date(n.created_at);
    if (isToday(d)) today.push(n);
    else if (isYesterday(d)) yesterday.push(n);
    else earlier.push(n);
  }
  return { today, yesterday, earlier };
};

export const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    })();
  }, []);

  const fetchNotifications = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) {
        if (error.code === "42P01") {
          setNotifications([]);
          return;
        }
        throw error;
      }
      setNotifications((data ?? []) as NotificationRow[]);
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications(userId);

    const channel = supabase
      .channel(`notif-bell:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationRow, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const updated = payload.new as NotificationRow;
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const deleted = payload.old as { id: string };
          setNotifications((prev) => prev.filter((n) => n.id !== deleted.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (id: string) => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
  };

  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);
  };

  const handleClick = async (n: NotificationRow) => {
    if (!n.is_read) await markAsRead(n.id);
    setOpen(false);
    if (n.action_url) {
      navigate(n.action_url);
    }
  };

  const formatTime = (date: string) =>
    formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: i18n.language === "fr" ? fr : enUS,
    });

  const renderGroup = (label: string, items: NotificationRow[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-0.5">
        <p className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {items.map((n) => {
          const Icon = typeIcon(n.type);
          return (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted/60 ${
                !n.is_read ? "bg-primary/[0.04]" : ""
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${typeColor(n.type)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-start gap-2">
                  <p className={`text-sm leading-tight ${!n.is_read ? "font-medium text-foreground" : "text-foreground/80"}`}>
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" aria-hidden />
                  )}
                </div>
                {n.message && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                )}
                <p className="text-[10px] text-muted-foreground/70">{formatTime(n.created_at)}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const groups = groupByDate(notifications);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-9 w-9 text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
          aria-label={t("notifications.title")}
        >
          <Bell className={`h-4 w-4 ${unreadCount > 0 ? "text-primary" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-primary rounded-full flex items-center justify-center pointer-events-none">
              <span className="text-[9px] font-bold text-primary-foreground leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 border-border shadow-lg"
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{t("notifications.title")}</p>
            {unreadCount > 0 && (
              <Badge variant="default" className="h-5 text-[10px] px-1.5">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="h-[420px]">
          {loading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3 p-2">
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{t("notifications.no_notifications")}</p>
              <p className="text-xs text-muted-foreground mt-1">Vous serez notifié dès qu'une activité vous concerne.</p>
            </div>
          ) : (
            <div className="pb-2">
              {renderGroup("Aujourd'hui", groups.today)}
              {renderGroup("Hier", groups.yesterday)}
              {renderGroup("Plus ancien", groups.earlier)}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-center text-xs h-9 rounded-none"
              onClick={() => { setOpen(false); navigate("/notifications"); }}
            >
              {t("notifications.view_all")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
