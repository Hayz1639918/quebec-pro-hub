// Types for messaging and notifications system

export type NotificationType =
  | 'new_message'
  | 'new_proposal'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'project_update'
  | 'review_received'
  | 'payment_received'
  | 'milestone_completed'
  | 'contract_signed'
  | 'system_announcement';

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  // From view
  participant_1_name?: string;
  participant_1_avatar?: string | null;
  participant_1_type?: string;
  participant_2_name?: string;
  participant_2_avatar?: string | null;
  participant_2_type?: string;
  unread_count?: number;
  // Computed
  other_participant_id?: string;
  other_participant_name?: string;
  other_participant_avatar?: string | null;
  other_participant_type?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  project_id: string | null;
  proposal_id: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  // Computed
  sender_name?: string;
  sender_avatar?: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  related_user_id: string | null;
  related_project_id: string | null;
  related_proposal_id: string | null;
  related_message_id: string | null;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
}

export interface MessageInput {
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  project_id?: string;
  proposal_id?: string;
  attachment_url?: string;
  attachment_type?: string;
}

