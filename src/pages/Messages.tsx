import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessagesList } from "@/components/messaging/MessagesList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation } from "@/types/messaging";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";

const Messages = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    // Check if there's a conversation ID in the URL
    const conversationId = searchParams.get('conversation');
    if (conversationId && userId) {
      loadConversation(conversationId);
    }
  }, [searchParams, userId]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('conversations_with_details')
        .select('*')
        .eq('id', conversationId)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .single();

      if (error) throw error;

      if (data) {
        const isParticipant1 = data.participant_1_id === userId;
        const conversationWithOther: Conversation = {
          ...data,
          other_participant_id: isParticipant1 ? data.participant_2_id : data.participant_1_id,
          other_participant_name: isParticipant1 ? data.participant_2_name : data.participant_1_name,
          other_participant_avatar: isParticipant1 ? data.participant_2_avatar : data.participant_1_avatar,
          other_participant_type: isParticipant1 ? data.participant_2_type : data.participant_1_type,
        };
        setSelectedConversation(conversationWithOther);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Update URL with conversation ID
    navigate(`/messages?conversation=${conversation.id}`, { replace: true });
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-24 pb-12">
          <div className="container mx-auto p-6 max-w-7xl">
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              <Skeleton className="col-span-1 h-full" />
              <Skeleton className="col-span-2 h-full" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto p-6 max-w-7xl">
          <h1 className="text-3xl font-bold mb-6">{t('messaging.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="col-span-1 overflow-hidden">
          <MessagesList
            userId={userId}
            selectedConversationId={selectedConversation?.id || null}
            onSelectConversation={handleSelectConversation}
          />
        </Card>

        {/* Chat Window */}
        <Card className="col-span-2 overflow-hidden">
          <ChatWindow userId={userId} conversation={selectedConversation} />
        </Card>
      </div>
        </div>
      </div>
    </>
  );
};

export default Messages;

