import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation } from "@/types/messaging";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface MessagesListProps {
  userId: string;
  selectedConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export const MessagesList = ({
  userId,
  selectedConversationId,
  onSelectConversation,
}: MessagesListProps) => {
  const { t, i18n } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (userId) {
      fetchConversations();
      const cleanup = subscribeToConversations();
      return cleanup;
    }
  }, [userId]);

  // ✅ Phase 2: Monitor active channels (prevent subscription leaks)
  useEffect(() => {
    const channels = supabase.getChannels();
    const messagingChannels = channels.filter(
      (ch) => ch.topic.includes('conversations') || ch.topic.includes('messages')
    );
    
    // Warn if too many channels (potential leak)
    if (messagingChannels.length > 10) {
      console.warn(
        `⚠️ Too many messaging channels active: ${messagingChannels.length}. Potential memory leak!`
      );
    }
    
    // Log for monitoring
  }, [userId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);

      // Fetch conversations
      const { data: conversationsData, error: convsError } = await supabase
        .from('conversations_with_details')
        .select('*')
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (convsError) {
        // If view doesn't exist yet, silently fail
        if (convsError.code === '42P01' || convsError.message.includes('does not exist')) {
          console.warn('Conversations table not yet created. Please apply migration 007_add_messaging_and_notifications.sql');
          setConversations([]);
          return;
        }
        throw convsError;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        return;
      }

      // ✅ OPTIMIZATION: Fetch ALL unread counts in ONE query using IN clause
      const conversationIds = conversationsData.map(c => c.id);
      
      const { data: unreadMessages, error: unreadError } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (unreadError) throw unreadError;

      // Count unread messages per conversation
      const unreadCounts = (unreadMessages || []).reduce((acc, msg) => {
        acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Map conversations with computed fields (no async needed!)
      const conversationsWithOther = conversationsData.map((conv) => {
        const isParticipant1 = conv.participant_1_id === userId;
        
        return {
          ...conv,
          other_participant_id: isParticipant1 ? conv.participant_2_id : conv.participant_1_id,
          other_participant_name: isParticipant1 ? conv.participant_2_name : conv.participant_1_name,
          other_participant_avatar: isParticipant1 ? conv.participant_2_avatar : conv.participant_1_avatar,
          other_participant_type: isParticipant1 ? conv.participant_2_type : conv.participant_1_type,
          unread_count: unreadCounts[conv.id] || 0,
        };
      });

      setConversations(conversationsWithOther);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    // ✅ Phase 2: Improved subscription with proper cleanup
    const channelName = `conversations_${userId}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1_id=eq.${userId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_2_id=eq.${userId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    // Return cleanup function that properly removes channel
    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_participant_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const locale = i18n.language === 'fr' ? fr : enUS;
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale });
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('messaging.search_conversations')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">
              {searchTerm ? t('messaging.no_conversations_found') : t('messaging.no_conversations')}
            </p>
            <p className="text-sm">
              {t('messaging.start_conversation_hint')}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                className={`w-full justify-start p-4 h-auto hover:bg-accent ${
                  selectedConversationId === conversation.id ? 'bg-accent' : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start gap-3 w-full">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={conversation.other_participant_avatar || undefined} />
                    <AvatarFallback>
                      {getInitials(conversation.other_participant_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">
                        {conversation.other_participant_name || t('common.unknown')}
                      </p>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message_preview || t('messaging.no_messages_yet')}
                      </p>
                      {conversation.unread_count !== undefined && conversation.unread_count > 0 && (
                        <Badge variant="default" className="ml-auto flex-shrink-0">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

