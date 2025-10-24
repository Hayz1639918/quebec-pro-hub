import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageSquare, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message } from "@/types/messaging";
import { formatDistanceToNow, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface ChatWindowProps {
  userId: string;
  conversation: Conversation | null;
}

export const ChatWindow = ({ userId, conversation }: ChatWindowProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      markConversationAsRead();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversation) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('messaging.error_loading_messages'),
      });
    } finally {
      setLoading(false);
    }
  };

  const markConversationAsRead = async () => {
    if (!conversation) return;

    try {
      const { error } = await supabase.rpc('mark_conversation_as_read', {
        conv_id: conversation.id,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!conversation) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          // Ajouter le message seulement s'il n'existe pas déjà (éviter les doublons)
          setMessages((prev) => {
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });
          
          // Mark as read if it's not from current user
          if (newMsg.receiver_id === userId) {
            markMessageAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase.rpc('mark_message_as_read', {
        message_id: messageId,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversation) return;

    try {
      setSending(true);

      const receiverId = conversation.other_participant_id;
      if (!receiverId) throw new Error('Receiver ID not found');

      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: userId,
        receiver_id: receiverId,
        content: newMessage.trim(),
      }).select().single();

      if (error) throw error;

      // Ajouter le message immédiatement à la liste (optimistic update)
      if (data) {
        setMessages((prev) => {
          // Vérifier que le message n'est pas déjà dans la liste (éviter les doublons avec Realtime)
          const exists = prev.some(msg => msg.id === data.id);
          if (exists) return prev;
          return [...prev, data as Message];
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('messaging.error_sending_message'),
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    const locale = i18n.language === 'fr' ? fr : enUS;

    // If less than 24 hours, show relative time
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale });
    }

    // Otherwise show full date and time
    return format(date, 'PPp', { locale });
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!conversation) {
    return (
      <Card className="flex flex-col items-center justify-center h-full bg-muted/30">
        <MessageSquare className="h-20 w-20 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">{t('messaging.select_conversation')}</h3>
        <p className="text-muted-foreground">{t('messaging.select_conversation_hint')}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.other_participant_avatar || undefined} />
            <AvatarFallback>
              {getInitials(conversation.other_participant_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{conversation.other_participant_name}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {conversation.other_participant_type === 'professional'
                ? t('common.professional')
                : t('common.client')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">{t('messaging.no_messages_yet')}</p>
            <p className="text-sm">{t('messaging.start_conversation')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === userId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                      {isOwnMessage && message.is_read && (
                        <span className="ml-2">✓✓</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            placeholder={t('messaging.type_message')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

