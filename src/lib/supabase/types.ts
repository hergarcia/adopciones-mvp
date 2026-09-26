export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_expirations: {
        Row: {
          expired_on: string
          notice_origin: string | null
          notice_pending: boolean
          user_id: string
        }
        Insert: {
          expired_on: string
          notice_origin?: string | null
          notice_pending?: boolean
          user_id: string
        }
        Update: {
          expired_on?: string
          notice_origin?: string | null
          notice_pending?: boolean
          user_id?: string
        }
        Relationships: []
      }
      identity_rejections: {
        Row: {
          id: number
          reason: string
          rejected_on: string
          user_id: string
        }
        Insert: {
          id?: never
          reason: string
          rejected_on: string
          user_id: string
        }
        Update: {
          id?: never
          reason?: string
          rejected_on?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_request_images: {
        Row: {
          data: string
          kind: string
          request_id: string
        }
        Insert: {
          data: string
          kind: string
          request_id: string
        }
        Update: {
          data?: string
          kind?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_request_images_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "identity_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_requests: {
        Row: {
          expires_at: string
          id: string
          origin: string
          sent_at: string
          user_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          origin: string
          sent_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          origin?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_resolutions: {
        Row: {
          request_id: string
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          request_id: string
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          request_id?: string
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      identity_verifications: {
        Row: {
          user_id: string
          verified_on: string
        }
        Insert: {
          user_id: string
          verified_on: string
        }
        Update: {
          user_id?: string
          verified_on?: string
        }
        Relationships: []
      }
      login_links: {
        Row: {
          consumed_at: string | null
          delivery: string
          email: string
          expires_at: string
          first_sign_in: boolean
          id: string
          issued_at: string
          superseded_at: string | null
        }
        Insert: {
          consumed_at?: string | null
          delivery: string
          email: string
          expires_at: string
          first_sign_in?: boolean
          id?: string
          issued_at?: string
          superseded_at?: string | null
        }
        Update: {
          consumed_at?: string | null
          delivery?: string
          email?: string
          expires_at?: string
          first_sign_in?: boolean
          id?: string
          issued_at?: string
          superseded_at?: string | null
        }
        Relationships: []
      }
      phone_claims: {
        Row: {
          number: string
          user_id: string
          valid_until: string
        }
        Insert: {
          number: string
          user_id: string
          valid_until: string
        }
        Update: {
          number?: string
          user_id?: string
          valid_until?: string
        }
        Relationships: []
      }
      phone_codes: {
        Row: {
          code_digest: string | null
          consumed_at: string | null
          delivery: string
          expires_at: string
          failed_attempts: number
          id: string
          number: string | null
          number_send_id: number | null
          requested_at: string
          superseded_at: string | null
          user_id: string
        }
        Insert: {
          code_digest?: string | null
          consumed_at?: string | null
          delivery: string
          expires_at: string
          failed_attempts?: number
          id?: string
          number?: string | null
          number_send_id?: number | null
          requested_at?: string
          superseded_at?: string | null
          user_id: string
        }
        Update: {
          code_digest?: string | null
          consumed_at?: string | null
          delivery?: string
          expires_at?: string
          failed_attempts?: number
          id?: string
          number?: string | null
          number_send_id?: number | null
          requested_at?: string
          superseded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_codes_number_send_id_fkey"
            columns: ["number_send_id"]
            isOneToOne: false
            referencedRelation: "phone_number_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_number_sends: {
        Row: {
          id: number
          number_digest: number
          sent_at: string
          skipped: boolean
        }
        Insert: {
          id?: never
          number_digest: number
          sent_at?: string
          skipped?: boolean
        }
        Update: {
          id?: never
          number_digest?: number
          sent_at?: string
          skipped?: boolean
        }
        Relationships: []
      }
      phones: {
        Row: {
          number_lost_on: string | null
          pending_number: string | null
          pending_since: string | null
          user_id: string
          verified_at: string | null
          verified_number: string | null
        }
        Insert: {
          number_lost_on?: string | null
          pending_number?: string | null
          pending_since?: string | null
          user_id: string
          verified_at?: string | null
          verified_number?: string | null
        }
        Update: {
          number_lost_on?: string | null
          pending_number?: string | null
          pending_since?: string | null
          user_id?: string
          verified_at?: string | null
          verified_number?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          department: string
          display_name: string
          id: string
          is_rescuer: boolean
          locality: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          department: string
          display_name: string
          id: string
          is_rescuer?: boolean
          locality: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          department?: string
          display_name?: string
          id?: string
          is_rescuer?: boolean
          locality?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_pending_phone: { Args: { p_user_id: string }; Returns: boolean }
      check_phone_code: {
        Args: {
          p_code_digest: string
          p_max_attempts: number
          p_user_id: string
          p_window: string
        }
        Returns: {
          attempts_left: number
          exhausted: boolean
          expired: boolean
          in_use: boolean
          live_number: string
          matches_superseded: boolean
          no_live_code: boolean
          no_pending: boolean
          verified: boolean
          was_change: boolean
          was_lost: boolean
        }[]
      }
      claim_phone_number: {
        Args: { p_number: string; p_time_zone: string; p_user_id: string }
        Returns: {
          lost_on: string
          outcome: string
          previous_user_id: string
          was_change: boolean
          was_lost: boolean
        }[]
      }
      drop_phone_claim: { Args: { p_user_id: string }; Returns: undefined }
      expire_identity_requests: {
        Args: { p_notice_days: number; p_window_days: number }
        Returns: number
      }
      get_phone_claim: {
        Args: { p_user_id: string }
        Returns: {
          number: string
          valid_until: string
        }[]
      }
      identity_expiry_mail_tick: { Args: never; Returns: undefined }
      identity_level_one: {
        Args: { p_pending_ttl: string; p_user_id: string }
        Returns: boolean
      }
      identity_retry_on: {
        Args: { p_cap: number; p_user_id: string; p_window_days: number }
        Returns: string
      }
      lock_identity_account: { Args: { p_user_id: string }; Returns: undefined }
      lock_phone_account: { Args: { p_user_id: string }; Returns: undefined }
      lock_phone_number: { Args: { p_number: string }; Returns: undefined }
      next_phone_code_at: {
        Args: {
          p_account_cap: number
          p_min_gap: string
          p_site_cap: number
          p_user_id: string
          p_window: string
        }
        Returns: {
          available_at: string
          reason: string
        }[]
      }
      purge_phone_records: {
        Args: { p_pending_ttl: string; p_window: string }
        Returns: undefined
      }
      reserve_phone_code: {
        Args: {
          p_account_cap: number
          p_code_digest: string
          p_code_ttl: string
          p_min_gap: string
          p_number: string
          p_number_cap: number
          p_number_digest: number
          p_site_cap: number
          p_user_id: string
          p_window: string
        }
        Returns: {
          code_id: string
          decision: string
          reached_cap: boolean
          reached_site_cap: boolean
          retry_at: string
        }[]
      }
      resolve_identity_request: {
        Args: {
          p_admin: string
          p_cap: number
          p_outcome: string
          p_pending_ttl: string
          p_reason?: string
          p_request_id: string
          p_window_days: number
        }
        Returns: {
          decision: string
          level_one: boolean
          owner_id: string
          rejections_in_window: number
          request_origin: string
          request_sent_at: string
          resolved_on: string
          retry_on: string
        }[]
      }
      settle_phone_code: {
        Args: { p_code_id: string; p_outcome: string }
        Returns: undefined
      }
      submit_identity_request: {
        Args: {
          p_cap: number
          p_front: string
          p_origin: string
          p_pending_ttl: string
          p_selfie: string
          p_ttl: string
          p_user_id: string
          p_window_days: number
        }
        Returns: {
          decision: string
          request_id: string
          retry_on: string
        }[]
      }
      uruguay_today: { Args: never; Returns: string }
      whoami: { Args: never; Returns: string }
      withdraw_identity_request: {
        Args: { p_user_id: string }
        Returns: {
          decision: string
          request_origin: string
          request_sent_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

