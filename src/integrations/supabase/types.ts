export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          user_type: 'client' | 'professional'
          company_name: string | null
          rbq_number: string | null
          rbq_certification_url: string | null
          services_offered: string | null
          insurance_info: string | null
          is_rbq_verified: boolean
          professional_type: 'entrepreneur' | 'trade_professional' | null
          city: string | null
          region: string | null
          postal_code: string | null
          bio: string | null
          years_experience: number | null
          average_rating: number
          total_reviews: number
          total_projects: number
          profile_picture_url: string | null
          website_url: string | null
          profile_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          user_type: 'client' | 'professional'
          company_name?: string | null
          rbq_number?: string | null
          rbq_certification_url?: string | null
          services_offered?: string | null
          insurance_info?: string | null
          is_rbq_verified?: boolean
          professional_type?: 'entrepreneur' | 'trade_professional' | null
          city?: string | null
          region?: string | null
          postal_code?: string | null
          bio?: string | null
          years_experience?: number | null
          average_rating?: number
          total_reviews?: number
          total_projects?: number
          profile_picture_url?: string | null
          website_url?: string | null
          profile_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          user_type?: 'client' | 'professional'
          company_name?: string | null
          rbq_number?: string | null
          rbq_certification_url?: string | null
          services_offered?: string | null
          insurance_info?: string | null
          is_rbq_verified?: boolean
          professional_type?: 'entrepreneur' | 'trade_professional' | null
          city?: string | null
          region?: string | null
          postal_code?: string | null
          bio?: string | null
          years_experience?: number | null
          average_rating?: number
          total_reviews?: number
          total_projects?: number
          profile_picture_url?: string | null
          website_url?: string | null
          profile_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          professional_id: string
          client_id: string
          project_id: string | null
          rating: number
          comment: string | null
          quality_rating: number | null
          punctuality_rating: number | null
          communication_rating: number | null
          value_rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          client_id: string
          project_id?: string | null
          rating: number
          comment?: string | null
          quality_rating?: number | null
          punctuality_rating?: number | null
          communication_rating?: number | null
          value_rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          client_id?: string
          project_id?: string | null
          rating?: number
          comment?: string | null
          quality_rating?: number | null
          punctuality_rating?: number | null
          communication_rating?: number | null
          value_rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_items: {
        Row: {
          id: string
          professional_id: string
          title: string
          description: string | null
          image_url: string | null
          project_date: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          title: string
          description?: string | null
          image_url?: string | null
          project_date?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          project_date?: string | null
          category?: string | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          client_id: string
          title: string
          description: string
          category: string | null
          budget_min: number | null
          budget_max: number | null
          city: string | null
          region: string | null
          postal_code: string | null
          status: 'open' | 'in_progress' | 'completed' | 'cancelled'
          deadline: string | null
          created_at: string
          updated_at: string
          proposals_count: number
          views_count: number
          payment_handling_preference: 'platform' | 'offline' | 'negotiable'
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          description: string
          category?: string | null
          budget_min?: number | null
          budget_max?: number | null
          city?: string | null
          region?: string | null
          postal_code?: string | null
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
          deadline?: string | null
          created_at?: string
          updated_at?: string
          proposals_count?: number
          views_count?: number
          payment_handling_preference?: 'platform' | 'offline' | 'negotiable'
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          description?: string
          category?: string | null
          budget_min?: number | null
          budget_max?: number | null
          city?: string | null
          region?: string | null
          postal_code?: string | null
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
          deadline?: string | null
          created_at?: string
          updated_at?: string
          proposals_count?: number
          views_count?: number
          payment_handling_preference?: 'platform' | 'offline' | 'negotiable'
        }
      }
      proposals: {
        Row: {
          id: string
          project_id: string
          professional_id: string
          message: string
          estimated_budget: number | null
          estimated_duration_days: number | null
          status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          professional_id: string
          message: string
          estimated_budget?: number | null
          estimated_duration_days?: number | null
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          professional_id?: string
          message?: string
          estimated_budget?: number | null
          estimated_duration_days?: number | null
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          project_id: string
          template_id: string | null
          client_id: string
          professional_id: string
          title: string
          description: string | null
          contract_content: string
          variables: Record<string, unknown>
          total_amount: number
          currency: string
          payment_schedule: unknown[] | null
          deposit_percentage: number
          start_date: string | null
          end_date: string | null
          estimated_duration_days: number | null
          status: 'draft' | 'pending_client_signature' | 'pending_professional_signature' | 'pending_both_signatures' | 'signed' | 'cancelled' | 'expired'
          client_signed_at: string | null
          professional_signed_at: string | null
          client_signature_data: Record<string, unknown> | null
          professional_signature_data: Record<string, unknown> | null
          terms_and_conditions: string | null
          special_conditions: string | null
          warranty_period_months: number
          created_at: string
          updated_at: string
          expires_at: string | null
          signed_at: string | null
          version: number
          parent_contract_id: string | null
          contract_pdf_url: string | null
          attachments: string[]
          payment_handling: 'platform' | 'offline'
        }
        Insert: {
          id?: string
          project_id: string
          template_id?: string | null
          client_id: string
          professional_id: string
          title: string
          description?: string | null
          contract_content: string
          variables?: Record<string, unknown>
          total_amount: number
          currency?: string
          payment_schedule?: unknown[] | null
          deposit_percentage?: number
          start_date?: string | null
          end_date?: string | null
          estimated_duration_days?: number | null
          status?: 'draft' | 'pending_client_signature' | 'pending_professional_signature' | 'pending_both_signatures' | 'signed' | 'cancelled' | 'expired'
          terms_and_conditions?: string | null
          special_conditions?: string | null
          warranty_period_months?: number
          expires_at?: string | null
          contract_pdf_url?: string | null
          attachments?: string[]
          payment_handling?: 'platform' | 'offline'
        }
        Update: {
          title?: string
          description?: string | null
          contract_content?: string
          total_amount?: number
          status?: 'draft' | 'pending_client_signature' | 'pending_professional_signature' | 'pending_both_signatures' | 'signed' | 'cancelled' | 'expired'
          client_signed_at?: string | null
          professional_signed_at?: string | null
          client_signature_data?: Record<string, unknown> | null
          professional_signature_data?: Record<string, unknown> | null
          contract_pdf_url?: string | null
          updated_at?: string
          payment_handling?: 'platform' | 'offline'
        }
      }
      contract_milestones: {
        Row: {
          id: string
          contract_id: string
          title: string
          amount: number
          due_date: string | null
          status: 'pending' | 'requested' | 'approved' | 'rejected' | 'paid'
          requested_by: string | null
          requested_at: string | null
          validated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          title: string
          amount: number
          due_date?: string | null
          status?: 'pending' | 'requested' | 'approved' | 'rejected' | 'paid'
        }
        Update: {
          title?: string
          amount?: number
          due_date?: string | null
          status?: 'pending' | 'requested' | 'approved' | 'rejected' | 'paid'
          updated_at?: string
        }
      }
      contractor_payments: {
        Row: {
          id: string
          contractor_id: string
          contract_id: string | null
          milestone_id: string | null
          client_id: string | null
          project_id: string | null
          project_title: string
          client_name: string
          milestone: string
          amount: number
          fee: number
          net_amount: number
          currency: string
          status: 'pending' | 'in_escrow' | 'processing' | 'succeeded' | 'released' | 'failed' | 'refunded' | 'disputed' | 'cancelled'
          payment_method: 'transfer' | 'card' | 'crypto' | 'cheque' | 'cash' | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          stripe_charge_id: string | null
          dispute_reason: string | null
          dispute_details: string | null
          released_at: string | null
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          contract_id?: string | null
          milestone_id?: string | null
          client_id?: string | null
          project_id?: string | null
          project_title: string
          client_name: string
          milestone: string
          amount: number
          fee?: number
          net_amount: number
          currency?: string
          status?: 'pending' | 'in_escrow' | 'processing' | 'succeeded' | 'released' | 'failed' | 'refunded' | 'disputed' | 'cancelled'
          payment_method?: 'transfer' | 'card' | 'crypto' | 'cheque' | 'cash' | null
        }
        Update: {
          status?: 'pending' | 'in_escrow' | 'processing' | 'succeeded' | 'released' | 'failed' | 'refunded' | 'disputed' | 'cancelled'
          payment_method?: 'transfer' | 'card' | 'crypto' | 'cheque' | 'cash' | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          released_at?: string | null
          dispute_reason?: string | null
          dispute_details?: string | null
          metadata?: Record<string, unknown>
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          contractor_id: string
          contract_id: string | null
          milestone_id: string | null
          client_id: string | null
          payment_id: string | null
          invoice_number: string
          client_name: string
          client_address: string | null
          project_title: string
          milestone: string
          amount: number
          tax: number
          total: number
          currency: string
          status: 'pending' | 'paid' | 'overdue'
          payment_method: string | null
          pdf_url: string | null
          issued_at: string
          due_at: string | null
          paid_at: string | null
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          contractor_id: string
          contract_id?: string | null
          milestone_id?: string | null
          client_id?: string | null
          payment_id?: string | null
          invoice_number: string
          client_name: string
          project_title: string
          milestone: string
          amount: number
          tax?: number
          total: number
          currency?: string
          status?: 'pending' | 'paid' | 'overdue'
        }
        Update: {
          status?: 'pending' | 'paid' | 'overdue'
          pdf_url?: string | null
          paid_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          related_user_id: string | null
          related_project_id: string | null
          action_url: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          related_user_id?: string | null
          related_project_id?: string | null
          action_url?: string | null
          metadata?: Record<string, unknown> | null
        }
        Update: {
          is_read?: boolean
        }
      }
      favorites: {
        Row: {
          id: string
          client_id: string
          professional_id: string
          notes: string | null
          priority: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          professional_id: string
          notes?: string | null
          priority?: number
        }
        Update: {
          notes?: string | null
          priority?: number
        }
      }
      conversations: {
        Row: {
          id: string
          participant_1: string
          participant_2: string
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          participant_1: string
          participant_2: string
        }
        Update: {
          last_message_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
      }
      project_images: {
        Row: {
          id: string
          project_id: string
          image_url: string
          caption: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          image_url: string
          caption?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          image_url?: string
          caption?: string | null
          display_order?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'client' | 'professional'
      project_status: 'open' | 'in_progress' | 'completed' | 'cancelled'
      contract_status: 'draft' | 'pending_client_signature' | 'pending_professional_signature' | 'pending_both_signatures' | 'signed' | 'cancelled' | 'expired'
      milestone_status: 'pending' | 'requested' | 'approved' | 'rejected' | 'paid'
      mediation_status: 'open' | 'in_review' | 'resolved' | 'rejected'
      proposal_status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
