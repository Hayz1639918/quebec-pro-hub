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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          target_id: string
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          target_id: string
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string
          target_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
          end_time: string
          id: string
          notes: string | null
          professional_id: string
          project_id: string | null
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          notes?: string | null
          professional_id: string
          project_id?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          professional_id?: string
          project_id?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_amendments: {
        Row: {
          amendment_number: number
          approved_by_client: boolean | null
          approved_by_professional: boolean | null
          changes: Json
          contract_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          new_content: string | null
          title: string
        }
        Insert: {
          amendment_number: number
          approved_by_client?: boolean | null
          approved_by_professional?: boolean | null
          changes: Json
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          new_content?: string | null
          title: string
        }
        Update: {
          amendment_number?: number
          approved_by_client?: boolean | null
          approved_by_professional?: boolean | null
          changes?: Json
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          new_content?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_amendments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_amendments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_audit_trail: {
        Row: {
          contract_id: string
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_audit_trail_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_milestones: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          due_date: string | null
          id: string
          requested_at: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          requested_at?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          requested_at?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title?: string
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_milestones_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_proposals: {
        Row: {
          client_id: string
          contract_content_draft: string
          created_at: string | null
          currency: string | null
          deposit_percentage: number | null
          description: string | null
          end_date: string | null
          id: string
          payment_handling: string
          professional_id: string
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["contract_proposal_status"]
          template_id: string | null
          title: string
          total_amount: number
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          client_id: string
          contract_content_draft: string
          created_at?: string | null
          currency?: string | null
          deposit_percentage?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          payment_handling?: string
          professional_id: string
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_proposal_status"]
          template_id?: string | null
          title: string
          total_amount: number
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          client_id?: string
          contract_content_draft?: string
          created_at?: string | null
          currency?: string | null
          deposit_percentage?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          payment_handling?: string
          professional_id?: string
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_proposal_status"]
          template_id?: string | null
          title?: string
          total_amount?: number
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_proposals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          name: string
          source_pdf_url: string | null
          source_type: string | null
          template_content: string
          updated_at: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name: string
          source_pdf_url?: string | null
          source_type?: string | null
          template_content: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name?: string
          source_pdf_url?: string | null
          source_type?: string | null
          template_content?: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_payments: {
        Row: {
          amount: number
          client_id: string | null
          client_name: string
          contract_id: string | null
          contractor_id: string
          created_at: string | null
          currency: string
          dispute_details: string | null
          dispute_reason: string | null
          fee: number
          id: string
          metadata: Json | null
          milestone: string
          milestone_id: string | null
          net_amount: number
          payment_method: string | null
          project_id: string | null
          project_title: string
          released_at: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          client_name: string
          contract_id?: string | null
          contractor_id: string
          created_at?: string | null
          currency?: string
          dispute_details?: string | null
          dispute_reason?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          milestone: string
          milestone_id?: string | null
          net_amount: number
          payment_method?: string | null
          project_id?: string | null
          project_title: string
          released_at?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          client_name?: string
          contract_id?: string | null
          contractor_id?: string
          created_at?: string | null
          currency?: string
          dispute_details?: string | null
          dispute_reason?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          milestone?: string
          milestone_id?: string | null
          net_amount?: number
          payment_method?: string | null
          project_id?: string | null
          project_title?: string
          released_at?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "contract_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_trades: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          professional_id: string
          trade_code: string
          trade_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          professional_id: string
          trade_code: string
          trade_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          professional_id?: string
          trade_code?: string
          trade_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_trades_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_trades_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_trades_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_trades_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_trades_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_trades_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_trades_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          attachments: Json | null
          client_id: string
          client_signature_data: Json | null
          client_signed_at: string | null
          contract_content: string
          contract_pdf_url: string | null
          created_at: string | null
          currency: string | null
          deposit_percentage: number | null
          description: string | null
          end_date: string | null
          estimated_duration_days: number | null
          expires_at: string | null
          id: string
          is_uploaded: boolean | null
          parent_contract_id: string | null
          payment_handling: string
          payment_schedule: Json | null
          professional_id: string
          professional_signature_data: Json | null
          professional_signed_at: string | null
          project_id: string | null
          signed_at: string | null
          special_conditions: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"] | null
          template_id: string | null
          terms_and_conditions: string | null
          title: string
          total_amount: number
          updated_at: string | null
          uploaded_at: string | null
          uploaded_file_url: string | null
          uploaded_filename: string | null
          variables: Json | null
          version: number | null
          warranty_period_months: number | null
        }
        Insert: {
          attachments?: Json | null
          client_id: string
          client_signature_data?: Json | null
          client_signed_at?: string | null
          contract_content: string
          contract_pdf_url?: string | null
          created_at?: string | null
          currency?: string | null
          deposit_percentage?: number | null
          description?: string | null
          end_date?: string | null
          estimated_duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_uploaded?: boolean | null
          parent_contract_id?: string | null
          payment_handling?: string
          payment_schedule?: Json | null
          professional_id: string
          professional_signature_data?: Json | null
          professional_signed_at?: string | null
          project_id?: string | null
          signed_at?: string | null
          special_conditions?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          template_id?: string | null
          terms_and_conditions?: string | null
          title: string
          total_amount: number
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_file_url?: string | null
          uploaded_filename?: string | null
          variables?: Json | null
          version?: number | null
          warranty_period_months?: number | null
        }
        Update: {
          attachments?: Json | null
          client_id?: string
          client_signature_data?: Json | null
          client_signed_at?: string | null
          contract_content?: string
          contract_pdf_url?: string | null
          created_at?: string | null
          currency?: string | null
          deposit_percentage?: number | null
          description?: string | null
          end_date?: string | null
          estimated_duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_uploaded?: boolean | null
          parent_contract_id?: string | null
          payment_handling?: string
          payment_schedule?: Json | null
          professional_id?: string
          professional_signature_data?: Json | null
          professional_signed_at?: string | null
          project_id?: string | null
          signed_at?: string | null
          special_conditions?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          template_id?: string | null
          terms_and_conditions?: string | null
          title?: string
          total_amount?: number
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_file_url?: string | null
          uploaded_filename?: string | null
          variables?: Json | null
          version?: number | null
          warranty_period_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_parent_contract_id_fkey"
            columns: ["parent_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_1_id?: string
          participant_2_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          attachments: Json | null
          category: Database["public"]["Enums"]["dispute_category"]
          contract_id: string
          created_at: string | null
          description: string
          id: string
          opened_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          category: Database["public"]["Enums"]["dispute_category"]
          contract_id: string
          created_at?: string | null
          description: string
          id?: string
          opened_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          category?: Database["public"]["Enums"]["dispute_category"]
          contract_id?: string
          created_at?: string | null
          description?: string
          id?: string
          opened_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          notes: string | null
          priority: number | null
          professional_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          professional_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_certificates: {
        Row: {
          certificate_url: string | null
          created_at: string
          expires_at: string
          id: string
          insurance_type: string
          professional_id: string
          renewal_alert_sent: boolean
          status: string
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          expires_at: string
          id?: string
          insurance_type?: string
          professional_id: string
          renewal_alert_sent?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          insurance_type?: string
          professional_id?: string
          renewal_alert_sent?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_certificates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_certificates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_certificates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_certificates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_certificates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_certificates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_certificates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_address: string | null
          client_id: string | null
          client_name: string
          contract_id: string | null
          contractor_id: string
          currency: string
          due_at: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          metadata: Json | null
          milestone: string
          milestone_id: string | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          pdf_url: string | null
          project_title: string
          status: string
          tax: number
          total: number
        }
        Insert: {
          amount: number
          client_address?: string | null
          client_id?: string | null
          client_name: string
          contract_id?: string | null
          contractor_id: string
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          metadata?: Json | null
          milestone: string
          milestone_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          project_title: string
          status?: string
          tax?: number
          total: number
        }
        Update: {
          amount?: number
          client_address?: string | null
          client_id?: string | null
          client_name?: string
          contract_id?: string | null
          contractor_id?: string
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          metadata?: Json | null
          milestone?: string
          milestone_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          project_title?: string
          status?: string
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "contract_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "contractor_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      mediations: {
        Row: {
          created_at: string | null
          id: string
          professional_id: string
          reason: string
          review_id: string
          status: Database["public"]["Enums"]["mediation_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          professional_id: string
          reason: string
          review_id: string
          status?: Database["public"]["Enums"]["mediation_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          professional_id?: string
          reason?: string
          review_id?: string
          status?: Database["public"]["Enums"]["mediation_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mediations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          conversation_id: string
          created_at: string | null
          duration_minutes: number
          id: string
          meeting_url: string | null
          notes: string | null
          organizer_id: string
          participant_id: string
          scheduled_at: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          notes?: string | null
          organizer_id: string
          participant_id: string
          scheduled_at: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          notes?: string | null
          organizer_id?: string
          participant_id?: string
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_rate_limits: {
        Row: {
          created_at: string | null
          message_count: number | null
          updated_at: string | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          message_count?: number | null
          updated_at?: string | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          message_count?: number | null
          updated_at?: string | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          id: string
          is_read: boolean | null
          message_type: string
          original_content: string | null
          project_id: string | null
          proposal_id: string | null
          quote_amount: number | null
          read_at: string | null
          receiver_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          original_content?: string | null
          project_id?: string | null
          proposal_id?: string | null
          quote_amount?: number | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          original_content?: string | null
          project_id?: string | null
          proposal_id?: string | null
          quote_amount?: number | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          related_message_id: string | null
          related_project_id: string | null
          related_proposal_id: string | null
          related_user_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          related_message_id?: string | null
          related_project_id?: string | null
          related_proposal_id?: string | null
          related_user_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          related_message_id?: string | null
          related_project_id?: string | null
          related_proposal_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_message_id_fkey"
            columns: ["related_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_proposal_id_fkey"
            columns: ["related_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_proposal_id_fkey"
            columns: ["related_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          category: string | null
          created_at: string | null
          description: string | null
          duration_days: number | null
          id: string
          image_url: string | null
          is_featured: boolean
          location: string | null
          professional_id: string
          project_cost: number | null
          project_date: string | null
          title: string
          updated_at: string | null
          work_category: string | null
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          location?: string | null
          professional_id: string
          project_cost?: number | null
          project_date?: string | null
          title: string
          updated_at?: string | null
          work_category?: string | null
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          location?: string | null
          professional_id?: string
          project_cost?: number | null
          project_date?: string | null
          title?: string
          updated_at?: string | null
          work_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_meetings: {
        Row: {
          client_name: string
          created_at: string | null
          duration_minutes: number
          has_reminder: boolean | null
          id: string
          meeting_url: string | null
          notes: string | null
          organizer_id: string
          pre_questions: string | null
          project_name: string | null
          reminder_1h_sent_at: string | null
          reminder_24h_sent_at: string | null
          scheduled_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          client_name: string
          created_at?: string | null
          duration_minutes?: number
          has_reminder?: boolean | null
          id?: string
          meeting_url?: string | null
          notes?: string | null
          organizer_id: string
          pre_questions?: string | null
          project_name?: string | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          created_at?: string | null
          duration_minutes?: number
          has_reminder?: boolean | null
          id?: string
          meeting_url?: string | null
          notes?: string | null
          organizer_id?: string
          pre_questions?: string | null
          project_name?: string | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_meetings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_availability: {
        Row: {
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          notes: string | null
          professional_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          professional_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          professional_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_certifications: {
        Row: {
          cert_name: string
          cert_number: string | null
          cert_type: string
          certificate_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string | null
          issuer: string | null
          professional_id: string
          updated_at: string
        }
        Insert: {
          cert_name: string
          cert_number?: string | null
          cert_type?: string
          certificate_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          professional_id: string
          updated_at?: string
        }
        Update: {
          cert_name?: string
          cert_number?: string | null
          cert_type?: string
          certificate_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_certifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_certifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_certifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_certifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_certifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_certifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_certifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepts_small_projects: boolean | null
          activity_score: number | null
          address: string | null
          availability_status:
            | Database["public"]["Enums"]["availability_status"]
            | null
          available_from: string | null
          average_rating: number | null
          bio: string | null
          business_volume_cad: number | null
          certifications: Json | null
          city: string | null
          company_name: string | null
          company_type: string | null
          created_at: string | null
          daily_rate_max: number | null
          daily_rate_min: number | null
          email: string
          favorites_count: number | null
          full_name: string
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          id_document_type: string | null
          id_document_url: string | null
          id_document_verified: boolean | null
          id_document_verified_at: string | null
          id_document_verified_by: string | null
          insurance_expires_at: string | null
          insurance_info: string | null
          is_admin: boolean | null
          is_rbq_verified: boolean | null
          languages: string[] | null
          last_active_at: string | null
          latitude: number | null
          linkedin_url: string | null
          location: unknown
          location_last_updated: string | null
          longitude: number | null
          minimum_project_budget: number | null
          notification_preferences: Json | null
          payout_enabled: boolean | null
          phone: string | null
          postal_code: string | null
          professional_type: string | null
          profile_completed: boolean | null
          profile_picture_url: string | null
          profile_views: number | null
          profile_views_count: number | null
          proposals_last_30_days: number | null
          rbq_certification_url: string | null
          rbq_expires_at: string | null
          rbq_number: string | null
          rbq_rejection_reason: string | null
          rbq_subcat: string | null
          rbq_verification_notes: string | null
          rbq_verified_at: string | null
          rbq_verified_by: string | null
          region: string | null
          response_time_hours: number | null
          search_vector: unknown
          service_radius_km: number | null
          service_zones: string[] | null
          services_offered: string | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          subscription_tier: string | null
          total_projects: number | null
          total_projects_external: number | null
          total_proposals_sent: number | null
          total_reviews: number | null
          trade_specialty: string | null
          travel_distance_km: number | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          verified_at: string | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          accepts_small_projects?: boolean | null
          activity_score?: number | null
          address?: string | null
          availability_status?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          available_from?: string | null
          average_rating?: number | null
          bio?: string | null
          business_volume_cad?: number | null
          certifications?: Json | null
          city?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          daily_rate_max?: number | null
          daily_rate_min?: number | null
          email: string
          favorites_count?: number | null
          full_name: string
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id: string
          id_document_type?: string | null
          id_document_url?: string | null
          id_document_verified?: boolean | null
          id_document_verified_at?: string | null
          id_document_verified_by?: string | null
          insurance_expires_at?: string | null
          insurance_info?: string | null
          is_admin?: boolean | null
          is_rbq_verified?: boolean | null
          languages?: string[] | null
          last_active_at?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          location?: unknown
          location_last_updated?: string | null
          longitude?: number | null
          minimum_project_budget?: number | null
          notification_preferences?: Json | null
          payout_enabled?: boolean | null
          phone?: string | null
          postal_code?: string | null
          professional_type?: string | null
          profile_completed?: boolean | null
          profile_picture_url?: string | null
          profile_views?: number | null
          profile_views_count?: number | null
          proposals_last_30_days?: number | null
          rbq_certification_url?: string | null
          rbq_expires_at?: string | null
          rbq_number?: string | null
          rbq_rejection_reason?: string | null
          rbq_subcat?: string | null
          rbq_verification_notes?: string | null
          rbq_verified_at?: string | null
          rbq_verified_by?: string | null
          region?: string | null
          response_time_hours?: number | null
          search_vector?: unknown
          service_radius_km?: number | null
          service_zones?: string[] | null
          services_offered?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          total_projects?: number | null
          total_projects_external?: number | null
          total_proposals_sent?: number | null
          total_reviews?: number | null
          trade_specialty?: string | null
          travel_distance_km?: number | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          verified_at?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          accepts_small_projects?: boolean | null
          activity_score?: number | null
          address?: string | null
          availability_status?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          available_from?: string | null
          average_rating?: number | null
          bio?: string | null
          business_volume_cad?: number | null
          certifications?: Json | null
          city?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          daily_rate_max?: number | null
          daily_rate_min?: number | null
          email?: string
          favorites_count?: number | null
          full_name?: string
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          id_document_verified?: boolean | null
          id_document_verified_at?: string | null
          id_document_verified_by?: string | null
          insurance_expires_at?: string | null
          insurance_info?: string | null
          is_admin?: boolean | null
          is_rbq_verified?: boolean | null
          languages?: string[] | null
          last_active_at?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          location?: unknown
          location_last_updated?: string | null
          longitude?: number | null
          minimum_project_budget?: number | null
          notification_preferences?: Json | null
          payout_enabled?: boolean | null
          phone?: string | null
          postal_code?: string | null
          professional_type?: string | null
          profile_completed?: boolean | null
          profile_picture_url?: string | null
          profile_views?: number | null
          profile_views_count?: number | null
          proposals_last_30_days?: number | null
          rbq_certification_url?: string | null
          rbq_expires_at?: string | null
          rbq_number?: string | null
          rbq_rejection_reason?: string | null
          rbq_subcat?: string | null
          rbq_verification_notes?: string | null
          rbq_verified_at?: string | null
          rbq_verified_by?: string | null
          region?: string | null
          response_time_hours?: number | null
          search_vector?: unknown
          service_radius_km?: number | null
          service_zones?: string[] | null
          services_offered?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          total_projects?: number | null
          total_projects_external?: number | null
          total_proposals_sent?: number | null
          total_reviews?: number | null
          trade_specialty?: string | null
          travel_distance_km?: number | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          verified_at?: string | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_document_verified_by_fkey"
            columns: ["id_document_verified_by"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_document_verified_by_fkey"
            columns: ["id_document_verified_by"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_document_verified_by_fkey"
            columns: ["id_document_verified_by"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_document_verified_by_fkey"
            columns: ["id_document_verified_by"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_document_verified_by_fkey"
            columns: ["id_document_verified_by"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_document_verified_by_fkey"
            columns: ["id_document_verified_by"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_document_verified_by_fkey"
            columns: ["id_document_verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_rbq_verified_by_fkey"
            columns: ["rbq_verified_by"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_rbq_verified_by_fkey"
            columns: ["rbq_verified_by"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_rbq_verified_by_fkey"
            columns: ["rbq_verified_by"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_rbq_verified_by_fkey"
            columns: ["rbq_verified_by"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_rbq_verified_by_fkey"
            columns: ["rbq_verified_by"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_rbq_verified_by_fkey"
            columns: ["rbq_verified_by"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_rbq_verified_by_fkey"
            columns: ["rbq_verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          project_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          project_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          message: string | null
          professional_id: string
          project_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          message?: string | null
          professional_id: string
          project_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          message?: string | null
          professional_id?: string
          project_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      project_reports: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_read_by_client: boolean | null
          photos: Json | null
          professional_id: string
          progress_percentage: number | null
          project_id: string
          report_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_read_by_client?: boolean | null
          photos?: Json | null
          professional_id: string
          progress_percentage?: number | null
          project_id: string
          report_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_read_by_client?: boolean | null
          photos?: Json | null
          professional_id?: string
          progress_percentage?: number | null
          project_id?: string
          report_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_reports_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reports_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reports_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reports_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reports_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reports_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reports_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_professional_id: string | null
          budget_max: number | null
          budget_min: number | null
          category: string
          city: string | null
          client_id: string
          completion_confirmed_at: string | null
          completion_notes: string | null
          completion_requested_at: string | null
          contract_id: string | null
          created_at: string | null
          current_phase: string | null
          deadline: string | null
          description: string
          documents_urls: Json | null
          evaluation_criteria: Json | null
          id: string
          insurance_requirements: Json | null
          latitude: number | null
          licensing_requirements: Json | null
          longitude: number | null
          media_urls: Json | null
          milestones: Json | null
          payment_handling_preference: string
          payment_terms: Json | null
          postal_code: string | null
          progress_percentage: number | null
          progress_status:
            | Database["public"]["Enums"]["project_progress_status"]
            | null
          project_end_date: string | null
          project_start_date: string | null
          project_type: string | null
          proposals_count: number | null
          questions_deadline: string | null
          region: string | null
          site_visit_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          submission_deadline: string | null
          technical_specifications: Json | null
          tender_number: string | null
          title: string
          updated_at: string | null
          views_count: number | null
          warranty_period_months: number | null
          work_description_detailed: string | null
          work_schedule: Json | null
        }
        Insert: {
          assigned_professional_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category: string
          city?: string | null
          client_id: string
          completion_confirmed_at?: string | null
          completion_notes?: string | null
          completion_requested_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          current_phase?: string | null
          deadline?: string | null
          description: string
          documents_urls?: Json | null
          evaluation_criteria?: Json | null
          id?: string
          insurance_requirements?: Json | null
          latitude?: number | null
          licensing_requirements?: Json | null
          longitude?: number | null
          media_urls?: Json | null
          milestones?: Json | null
          payment_handling_preference?: string
          payment_terms?: Json | null
          postal_code?: string | null
          progress_percentage?: number | null
          progress_status?:
            | Database["public"]["Enums"]["project_progress_status"]
            | null
          project_end_date?: string | null
          project_start_date?: string | null
          project_type?: string | null
          proposals_count?: number | null
          questions_deadline?: string | null
          region?: string | null
          site_visit_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          submission_deadline?: string | null
          technical_specifications?: Json | null
          tender_number?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
          warranty_period_months?: number | null
          work_description_detailed?: string | null
          work_schedule?: Json | null
        }
        Update: {
          assigned_professional_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          city?: string | null
          client_id?: string
          completion_confirmed_at?: string | null
          completion_notes?: string | null
          completion_requested_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          current_phase?: string | null
          deadline?: string | null
          description?: string
          documents_urls?: Json | null
          evaluation_criteria?: Json | null
          id?: string
          insurance_requirements?: Json | null
          latitude?: number | null
          licensing_requirements?: Json | null
          longitude?: number | null
          media_urls?: Json | null
          milestones?: Json | null
          payment_handling_preference?: string
          payment_terms?: Json | null
          postal_code?: string | null
          progress_percentage?: number | null
          progress_status?:
            | Database["public"]["Enums"]["project_progress_status"]
            | null
          project_end_date?: string | null
          project_start_date?: string | null
          project_type?: string | null
          proposals_count?: number | null
          questions_deadline?: string | null
          region?: string | null
          site_visit_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          submission_deadline?: string | null
          technical_specifications?: Json | null
          tender_number?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
          warranty_period_months?: number | null
          work_description_detailed?: string | null
          work_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          additional_documents: Json | null
          budget_breakdown: Json | null
          created_at: string | null
          detailed_description: string | null
          equipment_list: Json | null
          estimated_budget: number | null
          estimated_duration_days: number | null
          id: string
          insurance_proof_url: string | null
          message: string
          payment_terms_accepted: boolean | null
          professional_id: string
          project_id: string
          proposal_number: string | null
          rbq_license_number: string | null
          references: Json | null
          status: Database["public"]["Enums"]["proposal_status"] | null
          team_composition: Json | null
          timeline_details: Json | null
          updated_at: string | null
          valid_until: string | null
          warranty_offered_months: number | null
          work_methodology: string | null
        }
        Insert: {
          additional_documents?: Json | null
          budget_breakdown?: Json | null
          created_at?: string | null
          detailed_description?: string | null
          equipment_list?: Json | null
          estimated_budget?: number | null
          estimated_duration_days?: number | null
          id?: string
          insurance_proof_url?: string | null
          message: string
          payment_terms_accepted?: boolean | null
          professional_id: string
          project_id: string
          proposal_number?: string | null
          rbq_license_number?: string | null
          references?: Json | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          team_composition?: Json | null
          timeline_details?: Json | null
          updated_at?: string | null
          valid_until?: string | null
          warranty_offered_months?: number | null
          work_methodology?: string | null
        }
        Update: {
          additional_documents?: Json | null
          budget_breakdown?: Json | null
          created_at?: string | null
          detailed_description?: string | null
          equipment_list?: Json | null
          estimated_budget?: number | null
          estimated_duration_days?: number | null
          id?: string
          insurance_proof_url?: string | null
          message?: string
          payment_terms_accepted?: boolean | null
          professional_id?: string
          project_id?: string
          proposal_number?: string | null
          rbq_license_number?: string | null
          references?: Json | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          team_composition?: Json | null
          timeline_details?: Json | null
          updated_at?: string | null
          valid_until?: string | null
          warranty_offered_months?: number | null
          work_methodology?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_grids: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          max_rate: number | null
          min_rate: number
          professional_id: string
          rate_type: string
          trade_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          max_rate?: number | null
          min_rate: number
          professional_id: string
          rate_type: string
          trade_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          max_rate?: number | null
          min_rate?: number
          professional_id?: string
          rate_type?: string
          trade_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_grids_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_grids_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_grids_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_grids_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_grids_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_grids_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_grids_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rbq_licenses: {
        Row: {
          category: string
          certificate_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string | null
          last_verified_at: string | null
          license_number: string
          notes: string | null
          professional_id: string
          status: string
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          category: string
          certificate_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_verified_at?: string | null
          license_number: string
          notes?: string | null
          professional_id: string
          status?: string
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          category?: string
          certificate_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_verified_at?: string | null
          license_number?: string
          notes?: string | null
          professional_id?: string
          status?: string
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rbq_licenses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbq_licenses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          review_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          review_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          review_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          reason: string
          reporter_id: string
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          reporter_id: string
          review_id: string
          status?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          review_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          professional_id: string
          project_id: string
          rating: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          professional_id: string
          project_id: string
          rating: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          professional_id?: string
          project_id?: string
          rating?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      subcontractor_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          subcontractor_id: string
          title: string
          visible_to_subcontractor: boolean
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subcontractor_id: string
          title: string
          visible_to_subcontractor?: boolean
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          subcontractor_id?: string
          title?: string
          visible_to_subcontractor?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_tasks_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          email: string
          full_name: string
          id: string
          invited_at: string | null
          owner_professional_id: string
          status: Database["public"]["Enums"]["subcontractor_status"]
        }
        Insert: {
          email: string
          full_name: string
          id?: string
          invited_at?: string | null
          owner_professional_id: string
          status?: Database["public"]["Enums"]["subcontractor_status"]
        }
        Update: {
          email?: string
          full_name?: string
          id?: string
          invited_at?: string | null
          owner_professional_id?: string
          status?: Database["public"]["Enums"]["subcontractor_status"]
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_owner_professional_id_fkey"
            columns: ["owner_professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractors_owner_professional_id_fkey"
            columns: ["owner_professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractors_owner_professional_id_fkey"
            columns: ["owner_professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractors_owner_professional_id_fkey"
            columns: ["owner_professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractors_owner_professional_id_fkey"
            columns: ["owner_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractors_owner_professional_id_fkey"
            columns: ["owner_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractors_owner_professional_id_fkey"
            columns: ["owner_professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ends_at: string | null
          features: Json | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ends_at?: string | null
          features?: Json | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ends_at?: string | null
          features?: Json | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          conversation_id: string | null
          created_at: string
          detail: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          open_projects: number | null
          pending_verifications: number | null
          signed_contracts: number | null
          total_clients: number | null
          total_contracts: number | null
          total_professionals: number | null
          total_projects: number | null
          verified_professionals: number | null
        }
        Relationships: []
      }
      admin_pending_verifications: {
        Row: {
          city: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          insurance_info: string | null
          missing_certification: boolean | null
          phone: string | null
          postal_code: string | null
          professional_type: string | null
          rbq_certification_url: string | null
          rbq_number: string | null
          region: string | null
          services_offered: string | null
          trade_specialty: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          insurance_info?: string | null
          missing_certification?: never
          phone?: string | null
          postal_code?: string | null
          professional_type?: string | null
          rbq_certification_url?: string | null
          rbq_number?: string | null
          region?: string | null
          services_offered?: string | null
          trade_specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          insurance_info?: string | null
          missing_certification?: never
          phone?: string | null
          postal_code?: string | null
          professional_type?: string | null
          rbq_certification_url?: string | null
          rbq_number?: string | null
          region?: string | null
          services_offered?: string | null
          trade_specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_rejected_professionals: {
        Row: {
          city: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          rbq_certification_url: string | null
          rbq_number: string | null
          rbq_rejection_reason: string | null
          region: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          rbq_certification_url?: string | null
          rbq_number?: string | null
          rbq_rejection_reason?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          rbq_certification_url?: string | null
          rbq_number?: string | null
          rbq_rejection_reason?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_verified_professionals: {
        Row: {
          city: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_rbq_verified: boolean | null
          rbq_number: string | null
          rbq_verified_at: string | null
          region: string | null
          verified_by_name: string | null
        }
        Relationships: []
      }
      conversations_with_details: {
        Row: {
          created_at: string | null
          id: string | null
          last_message_at: string | null
          last_message_preview: string | null
          participant_1_avatar: string | null
          participant_1_id: string | null
          participant_1_name: string | null
          participant_1_type: Database["public"]["Enums"]["user_type"] | null
          participant_2_avatar: string | null
          participant_2_id: string | null
          participant_2_name: string | null
          participant_2_type: Database["public"]["Enums"]["user_type"] | null
          unread_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites_with_details: {
        Row: {
          activity_score: number | null
          availability_status:
            | Database["public"]["Enums"]["availability_status"]
            | null
          available_from: string | null
          average_rating: number | null
          bio: string | null
          city: string | null
          company_name: string | null
          email: string | null
          favorite_id: string | null
          favorited_at: string | null
          full_name: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string | null
          is_rbq_verified: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          phone: string | null
          priority: number | null
          professional_id: string | null
          profile_picture_url: string | null
          rbq_number: string | null
          region: string | null
          response_time_hours: number | null
          services_offered: string | null
          subscription_tier: string | null
          total_projects: number | null
          total_reviews: number | null
          user_id: string | null
          years_experience: number | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      professionals_map_view: {
        Row: {
          average_rating: number | null
          city: string | null
          company_name: string | null
          full_name: string | null
          id: string | null
          is_rbq_verified: boolean | null
          latitude: number | null
          longitude: number | null
          rbq_number: string | null
          region: string | null
          service_radius_km: number | null
          services_offered: string | null
          total_reviews: number | null
          years_experience: number | null
        }
        Insert: {
          average_rating?: never
          city?: string | null
          company_name?: string | null
          full_name?: string | null
          id?: string | null
          is_rbq_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          rbq_number?: string | null
          region?: string | null
          service_radius_km?: number | null
          services_offered?: string | null
          total_reviews?: never
          years_experience?: number | null
        }
        Update: {
          average_rating?: never
          city?: string | null
          company_name?: string | null
          full_name?: string | null
          id?: string | null
          is_rbq_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          rbq_number?: string | null
          region?: string | null
          service_radius_km?: number | null
          services_offered?: string | null
          total_reviews?: never
          years_experience?: number | null
        }
        Relationships: []
      }
      professionals_with_distance: {
        Row: {
          activity_score: number | null
          average_rating: number | null
          bio: string | null
          city: string | null
          company_name: string | null
          created_at: string | null
          distance_km: number | null
          email: string | null
          full_name: string | null
          id: string | null
          insurance_info: string | null
          is_rbq_verified: boolean | null
          last_active_at: string | null
          latitude: number | null
          location: unknown
          location_last_updated: string | null
          longitude: number | null
          phone: string | null
          postal_code: string | null
          profile_picture_url: string | null
          profile_views_count: number | null
          proposals_last_30_days: number | null
          rbq_certification_url: string | null
          rbq_number: string | null
          region: string | null
          services_offered: string | null
          total_projects: number | null
          total_proposals_sent: number | null
          total_reviews: number | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          activity_score?: number | null
          average_rating?: number | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          distance_km?: never
          email?: string | null
          full_name?: string | null
          id?: string | null
          insurance_info?: string | null
          is_rbq_verified?: boolean | null
          last_active_at?: string | null
          latitude?: number | null
          location?: unknown
          location_last_updated?: string | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          profile_picture_url?: string | null
          profile_views_count?: number | null
          proposals_last_30_days?: number | null
          rbq_certification_url?: string | null
          rbq_number?: string | null
          region?: string | null
          services_offered?: string | null
          total_projects?: number | null
          total_proposals_sent?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          activity_score?: number | null
          average_rating?: number | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          distance_km?: never
          email?: string | null
          full_name?: string | null
          id?: string | null
          insurance_info?: string | null
          is_rbq_verified?: boolean | null
          last_active_at?: string | null
          latitude?: number | null
          location?: unknown
          location_last_updated?: string | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          profile_picture_url?: string | null
          profile_views_count?: number | null
          proposals_last_30_days?: number | null
          rbq_certification_url?: string | null
          rbq_number?: string | null
          region?: string | null
          services_offered?: string | null
          total_projects?: number | null
          total_proposals_sent?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      projects_map_view: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string | null
          city: string | null
          client_name: string | null
          created_at: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          region: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          title: string | null
        }
        Relationships: []
      }
      proposals_complete: {
        Row: {
          additional_documents: Json | null
          budget_breakdown: Json | null
          client_company: string | null
          client_email: string | null
          client_name: string | null
          created_at: string | null
          detailed_description: string | null
          equipment_list: Json | null
          estimated_budget: number | null
          estimated_duration_days: number | null
          id: string | null
          insurance_proof_url: string | null
          message: string | null
          payment_terms_accepted: boolean | null
          professional_company: string | null
          professional_email: string | null
          professional_id: string | null
          professional_name: string | null
          professional_phone: string | null
          professional_rbq: string | null
          project_category: string | null
          project_city: string | null
          project_id: string | null
          project_region: string | null
          project_title: string | null
          proposal_number: string | null
          rbq_license_number: string | null
          references: Json | null
          status: Database["public"]["Enums"]["proposal_status"] | null
          team_composition: Json | null
          tender_number: string | null
          timeline_details: Json | null
          updated_at: string | null
          valid_until: string | null
          warranty_offered_months: number | null
          work_methodology: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tenders_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders_complete: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string | null
          city: string | null
          client_company: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          documents_urls: Json | null
          evaluation_criteria: Json | null
          id: string | null
          insurance_requirements: Json | null
          licensing_requirements: Json | null
          milestones: Json | null
          payment_terms: Json | null
          postal_code: string | null
          project_end_date: string | null
          project_start_date: string | null
          project_type: string | null
          proposals_count: number | null
          questions_deadline: string | null
          region: string | null
          site_visit_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          submission_deadline: string | null
          technical_specifications: Json | null
          tender_number: string | null
          title: string | null
          updated_at: string | null
          views_count: number | null
          warranty_period_months: number | null
          work_description_detailed: string | null
          work_schedule: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_rejected_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_verified_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "favorites_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "professionals_with_distance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_contract_proposal: {
        Args: { proposal_uuid: string }
        Returns: string
      }
      accept_proposal: { Args: { proposal_uuid: string }; Returns: boolean }
      add_audit_trail_entry:
        | {
            Args: {
              contract_uuid: string
              created_at_param: string
              details_param?: Json
              event_type_param: string
              ip_address_param?: string
              user_agent_param?: string
              user_id_param: string
              user_name_param: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_contract_id: string
              p_details?: Json
              p_event_type: string
              p_ip_address?: string
              p_user_agent?: string
              p_user_id: string
              p_user_name: string
            }
            Returns: string
          }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_allow_resubmission: {
        Args: { p_professional_id: string }
        Returns: Json
      }
      admin_delete_rejected_account: {
        Args: { p_professional_id: string }
        Returns: Json
      }
      admin_reject_rbq: {
        Args: { p_professional_id: string; p_reason: string }
        Returns: Json
      }
      admin_verify_rbq: {
        Args: { p_notes?: string; p_professional_id: string }
        Returns: Json
      }
      approve_milestone: { Args: { p_milestone: string }; Returns: undefined }
      calculate_activity_score: {
        Args: { profile_id: string }
        Returns: number
      }
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      check_booking_availability: {
        Args: {
          p_date: string
          p_end_time: string
          p_professional_id: string
          p_start_time: string
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: number }
      complete_project: {
        Args: { p_notes?: string; p_project_id: string }
        Returns: boolean
      }
      delete_custom_template: { Args: { template_id: string }; Returns: Json }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      find_professionals_nearby: {
        Args: { radius_km?: number; user_lat: number; user_lon: number }
        Returns: {
          average_rating: number
          city: string
          company_name: string
          distance_km: number
          full_name: string
          id: string
          is_rbq_verified: boolean
          latitude: number
          longitude: number
          rbq_number: string
          region: string
          service_radius_km: number
          services_offered: string
          total_reviews: number
          years_experience: number
        }[]
      }
      find_projects_nearby: {
        Args: { radius_km?: number; user_lat: number; user_lon: number }
        Returns: {
          budget_max: number
          budget_min: number
          category: string
          city: string
          client_name: string
          created_at: string
          distance_km: number
          id: string
          latitude: number
          longitude: number
          region: string
          status: string
          title: string
        }[]
      }
      generate_contract_content: {
        Args: { template_id: string; variables: Json }
        Returns: string
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_proposal_number: { Args: never; Returns: string }
      generate_tender_number: { Args: never; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_city_coordinates: {
        Args: { city_name: string }
        Returns: {
          lat: number
          lon: number
        }[]
      }
      get_client_favorites_count: {
        Args: { p_client_id: string }
        Returns: number
      }
      get_contract_audit_trail: {
        Args: { contract_uuid: string }
        Returns: {
          created_at: string
          details: Json
          event_type: string
          id: string
          ip_address: string
          user_name: string
        }[]
      }
      get_contract_status: {
        Args: { contract_uuid: string }
        Returns: Database["public"]["Enums"]["contract_status"]
      }
      get_deleted_messages_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_favorites_count: {
        Args: { p_professional_id: string }
        Returns: number
      }
      get_or_create_conversation: {
        Args: { user_1_id: string; user_2_id: string }
        Returns: string
      }
      get_professional_revenue_summary: {
        Args: { p_professional_id: string }
        Returns: Json
      }
      get_profile_completeness: {
        Args: { profile_id: string }
        Returns: number
      }
      get_proposal_conversion_rate: {
        Args: { p_professional_id: string }
        Returns: Json
      }
      get_review_statistics: {
        Args: { p_professional_id: string }
        Returns: Json
      }
      get_unread_messages_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_unread_notifications_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_upcoming_bookings: {
        Args: { p_days?: number; p_professional_id: string }
        Returns: {
          client_id: string
          client_name: string
          date: string
          end_time: string
          id: string
          notes: string
          project_id: string
          project_title: string
          start_time: string
          status: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      increment_profile_views: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      increment_project_views: {
        Args: { project_uuid: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_contract_signed: { Args: { contract_uuid: string }; Returns: boolean }
      is_favorite: {
        Args: { p_client_id: string; p_professional_id: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_target_id: string
          p_target_type: string
        }
        Returns: string
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_conversation_as_read: {
        Args: { conv_id: string }
        Returns: undefined
      }
      mark_message_as_read: { Args: { message_id: string }; Returns: undefined }
      notification_pref_key: { Args: { notif_type: string }; Returns: string }
      notify_clients_of_pro_compliance: {
        Args: {
          p_message_prefix: string
          p_professional_id: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      notify_compliance_expiry: { Args: never; Returns: undefined }
      permanently_delete_user_messages: {
        Args: { user_uuid: string }
        Returns: number
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      reject_milestone: {
        Args: { p_milestone: string; p_reason?: string }
        Returns: undefined
      }
      reject_proposal: { Args: { proposal_uuid: string }; Returns: boolean }
      request_milestone_validation: {
        Args: { p_milestone: string }
        Returns: undefined
      }
      respond_to_invitation: {
        Args: { p_invitation_id: string; p_response: string }
        Returns: {
          client_id: string
          created_at: string
          id: string
          message: string | null
          professional_id: string
          project_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "project_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      restore_deleted_message: {
        Args: { message_id: string }
        Returns: boolean
      }
      run_compliance_checks: { Args: never; Returns: number }
      send_meeting_reminders: { Args: never; Returns: number }
      send_quote_request: {
        Args: {
          p_amount: number
          p_conversation_id: string
          p_description?: string
        }
        Returns: string
      }
      settle_offline_payment: {
        Args: { method?: string; note?: string; payment_id: string }
        Returns: string
      }
      should_notify: {
        Args: { notif_type: string; target_user: string }
        Returns: boolean
      }
      soft_delete_message: {
        Args: { deleter_id: string; message_id: string }
        Returns: boolean
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_all_activity_scores: { Args: never; Returns: undefined }
      update_project_progress: {
        Args: {
          p_current_phase?: string
          p_progress_percentage: number
          p_progress_status?: Database["public"]["Enums"]["project_progress_status"]
          p_project_id: string
        }
        Returns: boolean
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      availability_status: "available" | "busy" | "unavailable"
      contract_proposal_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "withdrawn"
      contract_status:
        | "draft"
        | "pending_client_signature"
        | "pending_professional_signature"
        | "pending_both_signatures"
        | "signed"
        | "cancelled"
        | "expired"
      dispute_category:
        | "quality"
        | "delay"
        | "payment"
        | "communication"
        | "other"
      dispute_status: "open" | "investigating" | "resolved" | "closed"
      mediation_status: "open" | "in_review" | "resolved" | "rejected"
      message_status: "sent" | "delivered" | "read" | "failed"
      milestone_status:
        | "pending"
        | "requested"
        | "approved"
        | "rejected"
        | "paid"
      notification_type:
        | "new_message"
        | "new_proposal"
        | "proposal_accepted"
        | "proposal_rejected"
        | "project_update"
        | "review_received"
        | "payment_received"
        | "milestone_completed"
        | "contract_signed"
        | "system_announcement"
        | "contract_created"
        | "contract_fully_signed"
        | "project_report"
        | "proposal_withdrawn"
        | "rbq_verified"
        | "rbq_rejected"
        | "quote_request"
        | "project_completed"
        | "review_requested"
        | "meeting_reminder"
        | "review_reply"
        | "subscription_expiring"
        | "payment_pending"
        | "invoice_issued"
        | "dispute_opened"
        | "dispute_resolved"
        | "milestone_requested"
        | "milestone_approved"
        | "milestone_rejected"
        | "invitation_received"
        | "invitation_accepted"
        | "invitation_declined"
        | "license_status_changed"
        | "insurance_status_changed"
      project_progress_status:
        | "not_started"
        | "in_progress"
        | "paused"
        | "completed"
        | "cancelled"
      project_status: "open" | "in_progress" | "completed" | "cancelled"
      proposal_status: "pending" | "accepted" | "rejected"
      subcontractor_status: "invited" | "active" | "removed"
      subscription_plan: "free" | "premium"
      subscription_status: "active" | "canceled"
      task_status: "todo" | "in_progress" | "done"
      user_type: "client" | "professional"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
    Enums: {
      availability_status: ["available", "busy", "unavailable"],
      contract_proposal_status: [
        "pending",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      contract_status: [
        "draft",
        "pending_client_signature",
        "pending_professional_signature",
        "pending_both_signatures",
        "signed",
        "cancelled",
        "expired",
      ],
      dispute_category: [
        "quality",
        "delay",
        "payment",
        "communication",
        "other",
      ],
      dispute_status: ["open", "investigating", "resolved", "closed"],
      mediation_status: ["open", "in_review", "resolved", "rejected"],
      message_status: ["sent", "delivered", "read", "failed"],
      milestone_status: [
        "pending",
        "requested",
        "approved",
        "rejected",
        "paid",
      ],
      notification_type: [
        "new_message",
        "new_proposal",
        "proposal_accepted",
        "proposal_rejected",
        "project_update",
        "review_received",
        "payment_received",
        "milestone_completed",
        "contract_signed",
        "system_announcement",
        "contract_created",
        "contract_fully_signed",
        "project_report",
        "proposal_withdrawn",
        "rbq_verified",
        "rbq_rejected",
        "quote_request",
        "project_completed",
        "review_requested",
        "meeting_reminder",
        "review_reply",
        "subscription_expiring",
        "payment_pending",
        "invoice_issued",
        "dispute_opened",
        "dispute_resolved",
        "milestone_requested",
        "milestone_approved",
        "milestone_rejected",
        "invitation_received",
        "invitation_accepted",
        "invitation_declined",
        "license_status_changed",
        "insurance_status_changed",
      ],
      project_progress_status: [
        "not_started",
        "in_progress",
        "paused",
        "completed",
        "cancelled",
      ],
      project_status: ["open", "in_progress", "completed", "cancelled"],
      proposal_status: ["pending", "accepted", "rejected"],
      subcontractor_status: ["invited", "active", "removed"],
      subscription_plan: ["free", "premium"],
      subscription_status: ["active", "canceled"],
      task_status: ["todo", "in_progress", "done"],
      user_type: ["client", "professional"],
    },
  },
} as const
