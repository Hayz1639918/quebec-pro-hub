import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessagesList } from "@/components/messaging/MessagesList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation } from "@/types/messaging";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import { ArrowLeft } from "lucide-react";

const Messages = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false); // For mobile view toggle

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    // Check if there's a conversation ID in the URL
    const conversationId = searchParams.get('conversation');
    const otherUserId = searchParams.get('user');
    if (conversationId && userId) {
      loadConversation(conversationId);
      setShowChat(true); // Show chat on mobile when URL has conversation
    } else if (otherUserId && userId) {
      loadConversationByUser(otherUserId);
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

  const loadConversationByUser = async (otherUserId: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('conversations_with_details')
        .select('*')
        .or(
          `and(participant_1_id.eq.${userId},participant_2_id.eq.${otherUserId}),` +
          `and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${userId})`
        )
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const isParticipant1 = data.participant_1_id === userId;
        setSelectedConversation({
          ...data,
          other_participant_id: isParticipant1 ? data.participant_2_id : data.participant_1_id,
          other_participant_name: isParticipant1 ? data.participant_2_name : data.participant_1_name,
          other_participant_avatar: isParticipant1 ? data.participant_2_avatar : data.participant_1_avatar,
          other_participant_type: isParticipant1 ? data.participant_2_type : data.participant_1_type,
        });
        setShowChat(true);
      }
    } catch (err) {
      console.error('Error loading conversation by user:', err);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowChat(true); // Show chat on mobile
    // Update URL with conversation ID
    navigate(`/messages?conversation=${conversation.id}`, { replace: true });
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedConversation(null);
    navigate('/messages', { replace: true });
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 sm:pt-24 pb-8 sm:pb-12">
          <div className="container mx-auto px-4 sm:p-6 max-w-7xl">
            <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-4 sm:mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-160px)] sm:h-[calc(100vh-200px)]">
              <Skeleton className="col-span-1 h-full min-h-[300px]" />
              <Skeleton className="col-span-1 lg:col-span-2 h-full min-h-[400px] hidden lg:block" />
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
      <div className="min-h-screen min-h-[100dvh] pt-16 sm:pt-20 md:pt-24 pb-2 sm:pb-4 md:pb-12">
        <div className="container mx-auto px-2 sm:px-4 md:p-6 max-w-7xl">
          {/* Header - Hide on mobile when showing chat */}
          <div className={`mb-3 sm:mb-4 md:mb-6 ${showChat ? 'hidden lg:block' : ''}`}>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('messaging.title')}</h1>
          </div>

          {/* Mobile back button when in chat view */}
          {showChat && (
            <div className="lg:hidden mb-2 sm:mb-4">
              <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-1.5 sm:gap-2 min-h-[44px] touch-target text-sm">
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6 h-[calc(100dvh-130px)] sm:h-[calc(100dvh-160px)] md:h-[calc(100vh-200px)]">
            {/* Conversations List - Hide on mobile when chat is shown */}
            <Card className={`col-span-1 overflow-hidden ${showChat ? 'hidden lg:block' : ''}`}>
              <MessagesList
                userId={userId}
                selectedConversationId={selectedConversation?.id || null}
                onSelectConversation={handleSelectConversation}
              />
            </Card>

            {/* Chat Window - Show on mobile only when conversation selected */}
            <Card className={`col-span-1 lg:col-span-2 overflow-hidden ${!showChat && !selectedConversation ? 'hidden lg:flex' : ''}`}>
              <ChatWindow userId={userId} conversation={selectedConversation} />
            </Card>

            {/* Placeholder for desktop when no conversation selected */}
            {!selectedConversation && (
              <Card className="hidden lg:flex col-span-2 items-center justify-center text-muted-foreground">
                <p>Sélectionnez une conversation pour commencer</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Messages;
