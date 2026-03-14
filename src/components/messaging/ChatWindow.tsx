import { useEffect, useState, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  MoreVertical,
  Paperclip,
  MapPin,
  DollarSign,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message } from "@/types/messaging";
import { formatDistanceToNow, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { MeetingSchedulerDialog } from "./MeetingSchedulerDialog";

// Constants for validation and pagination
const MAX_MESSAGE_LENGTH = 5000;
const MESSAGES_PER_PAGE = 50;

interface PendingMessage extends Message {
  isPending?: boolean;
  isFailed?: boolean;
  tempId?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

interface ChatWindowProps {
  userId: string;
  conversation: Conversation | null;
}

export const ChatWindow = ({ userId, conversation }: ChatWindowProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quote request dialog state
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteProjectName, setQuoteProjectName] = useState("");
  const [quoteDetails, setQuoteDetails] = useState("");
  const [sendingQuote, setSendingQuote] = useState(false);

  // ✅ Phase 2: IntersectionObserver for reliable read receipts
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (conversation) {
      // Reset pagination state when conversation changes
      setMessages([]);
      setOffset(0);
      setHasMore(true);
      fetchMessages(true);
      markConversationAsRead();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [conversation?.id]);

  useEffect(() => {
    // Only scroll to bottom on new messages, not when loading more
    if (messages.length > 0 && !loadingMore) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Fetch messages with pagination
  const fetchMessages = async (isInitial = false) => {
    if (!conversation || (!isInitial && !hasMore)) return;

    try {
      isInitial ? setLoading(true) : setLoadingMore(true);
      
      const currentOffset = isInitial ? 0 : offset;

      // Fetch messages in descending order (newest first) for pagination
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      const newMessages = (data || []).reverse(); // Reverse to show oldest first
      
      if (isInitial) {
        setMessages(newMessages);
      } else {
        // Prepend older messages when loading more
        setMessages((prev) => [...newMessages, ...prev]);
      }

      // Check if there are more messages to load
      const totalFetched = currentOffset + (data?.length || 0);
      setHasMore(totalFetched < (count || 0));
      setOffset(totalFetched);

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('messaging.error_loading_messages'),
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more messages when scrolling to top
  const loadMoreMessages = useCallback(() => {
    if (!loadingMore && hasMore && conversation) {
      fetchMessages(false);
    }
  }, [loadingMore, hasMore, conversation, offset]);

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
      
      // Update local state to show read status immediately
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // ✅ Phase 2: Setup IntersectionObserver for reliable read receipts
  useEffect(() => {
    // Create observer that marks messages as read when visible
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            const senderId = entry.target.getAttribute('data-sender-id');
            
            // Only mark as read if it's not the current user's message
            if (messageId && senderId !== userId) {
              markMessageAsRead(messageId);
              // Stop observing this message once marked as read
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold: 0.5, // Message must be 50% visible
        root: scrollAreaRef.current,
      }
    );

    return () => {
      // Cleanup observer on unmount
      observerRef.current?.disconnect();
    };
  }, [userId]);

  // ✅ Phase 2: Observe messages for read receipts
  useEffect(() => {
    if (!observerRef.current) return;

    // Observe all unread messages that are not from current user
    messageRefs.current.forEach((element, messageId) => {
      const message = messages.find((m) => m.id === messageId);
      if (message && !message.is_read && message.sender_id !== userId) {
        observerRef.current?.observe(element);
      }
    });

    // Cleanup old refs
    return () => {
      messageRefs.current.forEach((element) => {
        observerRef.current?.unobserve(element);
      });
    };
  }, [messages, userId]);

  // ✅ Phase 2: Soft delete message function
  const softDeleteMessage = async (messageId: string) => {
    try {
      const { data, error } = await supabase.rpc('soft_delete_message', {
        message_id: messageId,
        deleter_id: userId,
      });

      if (error) throw error;

      if (data) {
        // Update local state to show message as deleted
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, deleted_at: new Date().toISOString(), deleted_by: userId }
              : msg
          )
        );

        toast({
          title: "Message supprimé",
          description: "Le message a été supprimé avec succès.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de supprimer ce message.",
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression.",
      });
    }
  };

  const sendMessage = async (e: React.FormEvent, retryContent?: string) => {
    e.preventDefault();
    
    const contentToSend = retryContent || newMessage.trim();
    
    if (!contentToSend || !conversation) return;

    // ✅ VALIDATION: Check message length
    if (contentToSend.length > MAX_MESSAGE_LENGTH) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: `Message trop long (max ${MAX_MESSAGE_LENGTH} caractères). Actuellement: ${contentToSend.length}`,
      });
      return;
    }

    const receiverId = conversation.other_participant_id;
    if (!receiverId) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: 'Destinataire introuvable',
      });
      return;
    }

    // Create temporary message for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMessage: PendingMessage = {
      id: tempId,
      tempId,
      conversation_id: conversation.id,
      sender_id: userId,
      receiver_id: receiverId,
      content: contentToSend,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project_id: null,
      proposal_id: null,
      attachment_url: null,
      attachment_type: null,
      isPending: true,
      isFailed: false,
    };

    try {
      setSending(true);

      // ✅ OPTIMISTIC UPDATE: Add pending message immediately
      setMessages((prev) => [...prev, tempMessage]);
      
      // Clear input immediately for better UX
      if (!retryContent) {
        setNewMessage("");
      }

      // Send message to server
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: userId,
        receiver_id: receiverId,
        content: contentToSend,
      }).select().single();

      if (error) throw error;

      // ✅ SUCCESS: Replace pending message with real message
      setMessages((prev) => 
        prev.map(msg => 
          msg.tempId === tempId ? { ...data as Message, isPending: false } : msg
        )
      );

    } catch (error) {
      console.error('Error sending message:', error);
      
      // ✅ FAILURE: Mark message as failed
      setMessages((prev) => 
        prev.map(msg => 
          msg.tempId === tempId ? { ...msg, isPending: false, isFailed: true } : msg
        )
      );
      
      // Show error with retry option
      toast({
        variant: "destructive",
        title: "Échec d'envoi",
        description: "Votre message n'a pas pu être envoyé. Vérifiez votre connexion.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              // Remove failed message and retry
              setMessages((prev) => prev.filter(msg => msg.tempId !== tempId));
              sendMessage(e, contentToSend);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        ),
      });
      
    } finally {
      setSending(false);
    }
  };

  // Retry sending a failed message
  const retryFailedMessage = useCallback((failedMsg: PendingMessage, e: React.MouseEvent) => {
    e.preventDefault();
    // Remove failed message
    setMessages((prev) => prev.filter(msg => msg.tempId !== failedMsg.tempId));
    // Retry sending
    sendMessage(e as any, failedMsg.content);
  }, []);

  // Upload a file and send as message attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      toast({ variant: "destructive", title: "Fichier trop volumineux", description: "La taille maximale est de 10 Mo." });
      return;
    }

    const receiverId = conversation.other_participant_id;
    if (!receiverId) return;

    setUploadingFile(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("chat-attachments").getPublicUrl(path);

      const isImage = file.type.startsWith("image/");
      const content = isImage ? `📷 Image partagée : ${file.name}` : `📎 Fichier partagé : ${file.name}`;

      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: userId,
        receiver_id: receiverId,
        content,
        attachment_url: publicUrl,
        attachment_type: isImage ? "image" : "file",
      });

      toast({ title: "Fichier envoyé", description: file.name });
    } catch (error) {
      console.error("File upload error:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer le fichier." });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Share current GPS position as a Google Maps link
  const handleShareLocation = () => {
    if (!conversation) return;
    const receiverId = conversation.other_participant_id;
    if (!receiverId) return;

    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Non supporté", description: "La géolocalisation n'est pas disponible sur votre navigateur." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const content = `📍 Ma position actuelle : ${mapsUrl}`;
        try {
          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            sender_id: userId,
            receiver_id: receiverId,
            content,
          });
        } catch (error) {
          console.error("GPS share error:", error);
          toast({ variant: "destructive", title: "Erreur", description: "Impossible de partager la position." });
        }
      },
      () => {
        toast({ variant: "destructive", title: "Accès refusé", description: "Autorisez l'accès à votre position dans les paramètres du navigateur." });
      }
    );
  };

  // Send a structured quote request message
  const handleSendQuoteRequest = async () => {
    if (!conversation || !quoteProjectName.trim()) return;
    const receiverId = conversation.other_participant_id;
    if (!receiverId) return;

    setSendingQuote(true);
    try {
      let content = `💰 **Demande de devis**\n📋 Projet : ${quoteProjectName.trim()}`;
      if (quoteDetails.trim()) content += `\n📝 Détails : ${quoteDetails.trim()}`;
      content += `\n\nMerci de me faire parvenir une soumission détaillée pour ce projet.`;

      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: userId,
        receiver_id: receiverId,
        content,
      });

      // Notification to professional
      await supabase.from("notifications").insert({
        user_id: receiverId,
        type: "quote_request",
        title: "Demande de devis reçue",
        message: `Un client demande un devis pour : ${quoteProjectName.trim()}`,
        action_url: `/messages?conversation=${conversation.id}`,
        metadata: { conversation_id: conversation.id },
      });

      toast({ title: "Demande envoyée", description: "Votre demande de devis a été envoyée." });
      setQuoteDialogOpen(false);
      setQuoteProjectName("");
      setQuoteDetails("");
    } catch (error) {
      console.error("Quote request error:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer la demande." });
    } finally {
      setSendingQuote(false);
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
      <div className="p-3 border-b bg-background">
        <div className="flex items-center justify-between gap-3">
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
          {/* Header action buttons */}
          <div className="flex items-center gap-1">
            {/* US-028: Schedule meeting */}
            <MeetingSchedulerDialog
              conversationId={conversation.id}
              organizerId={userId}
              participantId={conversation.other_participant_id || ""}
              participantName={conversation.other_participant_name || ""}
            />
            {/* US-030: Request quote */}
            <Button
              variant="ghost"
              size="icon"
              title="Demander un devis"
              onClick={() => setQuoteDialogOpen(true)}
            >
              <DollarSign className="h-4 w-4" />
            </Button>
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
            {/* Load More Button */}
            <div ref={messagesStartRef}>
              {hasMore && !loading && (
                <div className="flex justify-center mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreMessages}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      'Charger les messages précédents'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Messages */}
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === userId;
              const isPending = message.isPending;
              const isFailed = message.isFailed;
              const isDeleted = !!message.deleted_at;
              
              return (
                <div
                  key={message.id || message.tempId}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                  ref={(el) => {
                    if (el && message.id && !message.tempId) {
                      messageRefs.current.set(message.id, el);
                    }
                  }}
                  data-message-id={message.id}
                  data-sender-id={message.sender_id}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 relative ${
                      isDeleted
                        ? 'bg-muted/50 border border-dashed'
                        : isFailed
                        ? 'bg-destructive/10 border border-destructive'
                        : isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    } ${isPending ? 'opacity-60' : ''} ${isDeleted ? 'italic' : ''}`}
                  >
                    {/* Delete Button (only for own non-deleted messages) */}
                    {isOwnMessage && !isDeleted && !isPending && !isFailed && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => softDeleteMessage(message.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Failed Message Indicator */}
                    {isFailed && (
                      <div className="flex items-center gap-2 mb-2 text-destructive text-xs font-medium">
                        <AlertCircle className="h-3 w-3" />
                        <span>Échec d'envoi</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs underline"
                          onClick={(e) => retryFailedMessage(message, e)}
                        >
                          Réessayer
                        </Button>
                      </div>
                    )}
                    
                    {/* Message Content */}
                    {isDeleted ? (
                      <p className="text-sm text-muted-foreground">
                        🗑️ Message supprimé
                      </p>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        {/* Attachment preview */}
                        {message.attachment_url && (
                          <div className="mt-2">
                            {message.attachment_type === 'image' ? (
                              <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={message.attachment_url}
                                  alt="Image partagée"
                                  className="max-w-xs max-h-48 rounded-lg object-cover border"
                                />
                              </a>
                            ) : (
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 text-xs underline ${isOwnMessage ? 'text-primary-foreground/80' : 'text-primary'}`}
                              >
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                Télécharger le fichier
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Timestamp and Status */}
                    <p
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        isDeleted
                          ? 'text-muted-foreground'
                          : isFailed
                          ? 'text-destructive'
                          : isOwnMessage 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                      {isPending && (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      )}
                      {isOwnMessage && !isPending && !isFailed && !isDeleted && message.is_read && (
                        <span className="ml-2">✓✓</span>
                      )}
                      {isOwnMessage && !isPending && !isFailed && !isDeleted && !message.is_read && (
                        <span className="ml-2">✓</span>
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
      <form onSubmit={sendMessage} className="p-3 border-t bg-background">
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            {/* US-027: File upload button */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Joindre un fichier"
              disabled={uploadingFile}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>

            {/* US-027: GPS share button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Partager ma position"
              onClick={handleShareLocation}
            >
              <MapPin className="h-4 w-4" />
            </Button>

            <div className="flex-1 relative">
              <Input
                placeholder={t('messaging.type_message')}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                className="pr-20"
                maxLength={MAX_MESSAGE_LENGTH}
              />
              {/* Character Counter */}
              <div
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  newMessage.length > MAX_MESSAGE_LENGTH * 0.9
                    ? 'text-destructive font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {newMessage.length}/{MAX_MESSAGE_LENGTH}
              </div>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={sending || !newMessage.trim() || newMessage.length > MAX_MESSAGE_LENGTH}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Warning if approaching limit */}
          {newMessage.length > MAX_MESSAGE_LENGTH * 0.8 && newMessage.length <= MAX_MESSAGE_LENGTH && (
            <p className="text-xs text-muted-foreground">
              Limite de caractères bientôt atteinte
            </p>
          )}
          {newMessage.length > MAX_MESSAGE_LENGTH && (
            <p className="text-xs text-destructive font-medium">
              Message trop long ! Réduisez de {newMessage.length - MAX_MESSAGE_LENGTH} caractères.
            </p>
          )}
        </div>
      </form>

      {/* US-030: Quote request dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Demander un devis
            </DialogTitle>
            <DialogDescription>
              Envoyez une demande de devis à {conversation.other_participant_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Nom du projet *</Label>
              <Input
                value={quoteProjectName}
                onChange={e => setQuoteProjectName(e.target.value)}
                placeholder="Ex : Rénovation salle de bain principale"
              />
            </div>
            <div className="space-y-1">
              <Label>Détails supplémentaires <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea
                value={quoteDetails}
                onChange={e => setQuoteDetails(e.target.value)}
                placeholder="Surface, matériaux souhaités, contraintes particulières..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>Annuler</Button>
              <Button
                onClick={handleSendQuoteRequest}
                disabled={sendingQuote || !quoteProjectName.trim()}
              >
                {sendingQuote ? "Envoi..." : "Envoyer la demande"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

