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
      account_suspensions: {
        Row: {
          id: string
          lifted_at: string | null
          lifted_by: string | null
          reason: string
          suspended_at: string
          suspended_by: string | null
          user_id: string
        }
        Insert: {
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
          suspended_at?: string
          suspended_by?: string | null
          user_id: string
        }
        Update: {
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
          suspended_at?: string
          suspended_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
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
      pet_codes: {
        Row: {
          code: string
          created_at: string
        }
        Insert: {
          code: string
          created_at?: string
        }
        Update: {
          code?: string
          created_at?: string
        }
        Relationships: []
      }
      pet_photos: {
        Row: {
          height: number
          id: string
          owner_id: string
          pet_id: string | null
          position: number | null
          released_at: string | null
          staged_at: string
          thumbhash: string
          width: number
        }
        Insert: {
          height: number
          id: string
          owner_id: string
          pet_id?: string | null
          position?: number | null
          released_at?: string | null
          staged_at?: string
          thumbhash: string
          width: number
        }
        Update: {
          height?: number
          id?: string
          owner_id?: string
          pet_id?: string | null
          position?: number | null
          released_at?: string | null
          staged_at?: string
          thumbhash?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_photos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_renewal_links: {
        Row: {
          created_at: string
          expires_at: string
          pet_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          pet_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          pet_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_renewal_links_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_reviews: {
        Row: {
          outcome: string | null
          pending_kind: string | null
          pending_since: string | null
          pet_id: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          outcome?: string | null
          pending_kind?: string | null
          pending_since?: string | null
          pet_id: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          outcome?: string | null
          pending_kind?: string | null
          pending_since?: string | null
          pet_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_reviews_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: true
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age_as_of: string
          age_unit: string
          age_value: number
          attempt_id: string
          code: string
          department: string
          description: string | null
          expires_at: string | null
          expiry_counted_at: string | null
          good_with_cats: string
          good_with_dogs: string
          good_with_kids: string
          has_chip: boolean
          id: string
          is_neutered: boolean
          is_urgent: boolean
          language: string
          locality: string
          name: string
          owner_id: string
          published_at: string
          reminder_sent_at: string | null
          sex: string
          size: string
          species: string
          status: string
          status_changed_at: string
          takedown_note: string | null
          takedown_reason: string | null
          taken_down_at: string | null
          updated_at: string
          vaccines: string
        }
        Insert: {
          age_as_of: string
          age_unit: string
          age_value: number
          attempt_id: string
          code: string
          department: string
          description?: string | null
          expires_at?: string | null
          expiry_counted_at?: string | null
          good_with_cats?: string
          good_with_dogs?: string
          good_with_kids?: string
          has_chip: boolean
          id?: string
          is_neutered: boolean
          is_urgent?: boolean
          language?: string
          locality: string
          name: string
          owner_id: string
          published_at?: string
          reminder_sent_at?: string | null
          sex: string
          size: string
          species: string
          status?: string
          status_changed_at?: string
          takedown_note?: string | null
          takedown_reason?: string | null
          taken_down_at?: string | null
          updated_at?: string
          vaccines: string
        }
        Update: {
          age_as_of?: string
          age_unit?: string
          age_value?: number
          attempt_id?: string
          code?: string
          department?: string
          description?: string | null
          expires_at?: string | null
          expiry_counted_at?: string | null
          good_with_cats?: string
          good_with_dogs?: string
          good_with_kids?: string
          has_chip?: boolean
          id?: string
          is_neutered?: boolean
          is_urgent?: boolean
          language?: string
          locality?: string
          name?: string
          owner_id?: string
          published_at?: string
          reminder_sent_at?: string | null
          sex?: string
          size?: string
          species?: string
          status?: string
          status_changed_at?: string
          takedown_note?: string | null
          takedown_reason?: string | null
          taken_down_at?: string | null
          updated_at?: string
          vaccines?: string
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
          public_id: string
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
          public_id?: string
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
          public_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          suspension_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          suspension_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          suspension_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_suspension_id_fkey"
            columns: ["suspension_id"]
            isOneToOne: false
            referencedRelation: "account_suspensions"
            referencedColumns: ["id"]
          },
        ]
      }
      vouch_blocks: {
        Row: {
          vouchee_id: string
          voucher_id: string
        }
        Insert: {
          vouchee_id: string
          voucher_id: string
        }
        Update: {
          vouchee_id?: string
          voucher_id?: string
        }
        Relationships: []
      }
      vouches: {
        Row: {
          created_at: string
          vouchee_id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string
          vouchee_id: string
          voucher_id: string
        }
        Update: {
          created_at?: string
          vouchee_id?: string
          voucher_id?: string
        }
        Relationships: []
      }
      withheld_numbers: {
        Row: {
          number_hash: string
          until: string
        }
        Insert: {
          number_hash: string
          until: string
        }
        Update: {
          number_hash?: string
          until?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      avatar_path_for: {
        Args: { p_public_id: string; p_viewer?: string }
        Returns: string
      }
      block_person: {
        Args: { p_blocker: string; p_public_id: string }
        Returns: string
      }
      blocked_profile: {
        Args: { p_public_id: string; p_viewer: string }
        Returns: {
          display_name: string
          is_suspended: boolean
        }[]
      }
      cancel_pending_phone: { Args: { p_user_id: string }; Returns: boolean }
      change_pet_status: {
        Args: {
          p_action: string
          p_owner: string
          p_pending_ttl: string
          p_pet: string
        }
        Returns: {
          code: string
          expires_at: string
          from_state: string
          name: string
          outcome: string
          published_at: string
          sex: string
          state: string
        }[]
      }
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
          withheld: boolean
        }[]
      }
      claim_pet_expiries: {
        Args: { p_limit: number }
        Returns: {
          published_at: string
          status: string
        }[]
      }
      claim_pet_reminders: {
        Args: { p_limit: number }
        Returns: {
          expires_at: string
          name: string
          owner_id: string
          pet_id: string
          sex: string
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
      close_report: {
        Args: { p_report: string }
        Returns: {
          created_at: string
          decision: string
          resolution: string
          resolved_by_name: string
        }[]
      }
      count_open_reports: {
        Args: never
        Returns: {
          others: number
          own: number
        }[]
      }
      count_pet_reviews: { Args: never; Returns: number }
      create_pet_renewal_link: {
        Args: { p_pet: string; p_token_hash: string }
        Returns: undefined
      }
      create_report: {
        Args: {
          p_details?: string
          p_reason: string
          p_reported_public_id: string
          p_reporter: string
        }
        Returns: {
          blocked_already: boolean
          outcome: string
        }[]
      }
      delete_pet: {
        Args: { p_owner: string; p_pet: string }
        Returns: {
          code: string
          from_state: string
          outcome: string
          photo_ids: string[]
        }[]
      }
      delete_pet_photo_rows: { Args: { p_ids: string[] }; Returns: undefined }
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
      give_vouch: {
        Args: {
          p_pending_ttl: string
          p_vouchee_public_id: string
          p_voucher: string
        }
        Returns: {
          created: boolean
          outcome: string
          reached_level_three: boolean
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
      listed_pets: {
        Args: {
          p_after_code?: string
          p_after_published?: string
          p_age_bands?: unknown[]
          p_departments?: string[]
          p_limit?: number
          p_neutered_only?: boolean
          p_sexes?: string[]
          p_sizes?: string[]
          p_species?: string[]
        }
        Returns: {
          age_as_of: string
          age_unit: string
          age_value: number
          code: string
          cover_height: number
          cover_id: string
          cover_owner: string
          cover_thumbhash: string
          cover_width: number
          department: string
          is_urgent: boolean
          locality: string
          name: string
          published_at: string
          sex: string
          species: string
          status: string
          total: number
        }[]
      }
      lock_identity_account: { Args: { p_user_id: string }; Returns: undefined }
      lock_phone_account: { Args: { p_user_id: string }; Returns: undefined }
      lock_phone_number: { Args: { p_number: string }; Returns: undefined }
      my_account_standing: {
        Args: never
        Returns: {
          reason: string
          since: string
        }[]
      }
      my_blocks: {
        Args: { p_user: string }
        Returns: {
          display_name: string
          has_photo: boolean
          public_id: string
          since: string
        }[]
      }
      my_vouches: {
        Args: { p_pending_ttl: string; p_user: string }
        Returns: {
          direction: string
          given_on: string
          mine_lacks_level_two: boolean
          other_display_name: string
          other_has_photo: boolean
          other_lacks_level_two: boolean
          other_public_id: string
        }[]
      }
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
      pet_by_code: {
        Args: { p_code: string }
        Returns: {
          age_as_of: string
          age_unit: string
          age_value: number
          code: string
          department: string
          description: string
          good_with_cats: string
          good_with_dogs: string
          good_with_kids: string
          has_chip: boolean
          is_neutered: boolean
          is_owner: boolean
          is_urgent: boolean
          locality: string
          name: string
          owner_folder: string
          pet_id: string
          photos: Json
          published_at: string
          publisher_avatar_path: string
          publisher_is_rescuer: boolean
          publisher_level: number
          publisher_name: string
          publisher_public_id: string
          sex: string
          size: string
          species: string
          state: string
          takedown_note: string
          takedown_reason: string
          vaccines: string
          version: string
          visibility: string
        }[]
      }
      pet_lifecycle_tick: { Args: never; Returns: undefined }
      pet_photo_ids: {
        Args: { p_owner: string; p_pet: string }
        Returns: string[]
      }
      pet_review_queue: {
        Args: { p_limit: number }
        Returns: {
          age_as_of: string
          age_unit: string
          age_value: number
          code: string
          department: string
          description: string
          good_with_cats: string
          good_with_dogs: string
          good_with_kids: string
          has_chip: boolean
          is_neutered: boolean
          is_own: boolean
          is_urgent: boolean
          locality: string
          name: string
          others: number
          owner_folder: string
          pending_kind: string
          pending_since: string
          pet_id: string
          photos: Json
          publisher_avatar_path: string
          publisher_is_rescuer: boolean
          publisher_level: number
          publisher_name: string
          sex: string
          size: string
          species: string
          state: string
          total: number
          vaccines: string
        }[]
      }
      pet_share_card: {
        Args: { p_code: string }
        Returns: {
          cover_height: number
          cover_id: string
          cover_owner: string
          cover_width: number
          department: string
          locality: string
          name: string
          sex: string
          status: string
          version: string
        }[]
      }
      public_profile: {
        Args: { p_pending_ttl: string; p_public_id: string }
        Returns: {
          department: string
          display_name: string
          has_photo: boolean
          identity_since: string
          is_rescuer: boolean
          level_one: boolean
          locality: string
          member_since: string
          public_id: string
          vouchers: Json
        }[]
      }
      publish_pet: {
        Args: {
          p_attempt: string
          p_fields: Json
          p_owner: string
          p_pending_ttl: string
          p_photo_ids: string[]
          p_staged_ttl: string
        }
        Returns: {
          already: boolean
          pet_id: string
        }[]
      }
      purge_pet_photos: {
        Args: { p_staged_ttl: string }
        Returns: {
          id: string
          owner_id: string
        }[]
      }
      purge_phone_records: {
        Args: { p_pending_ttl: string; p_window: string }
        Returns: undefined
      }
      purge_withheld_numbers: { Args: never; Returns: undefined }
      reactivate_account: {
        Args: { p_suspension: string }
        Returns: {
          display_name: string
          lifted_at: string
          lifted_by_name: string
          outcome: string
          user_id: string
        }[]
      }
      remove_vouch: {
        Args: { p_vouchee: string; p_voucher_public_id: string }
        Returns: string
      }
      renew_by_link: {
        Args: { p_pending_ttl: string; p_token_hash: string }
        Returns: {
          expires_at: string
          outcome: string
          pet_name: string
          sex: string
        }[]
      }
      renewal_link_view: {
        Args: { p_token_hash: string }
        Returns: {
          cover_id: string
          cover_owner: string
          expires_at: string
          name: string
          sex: string
          state: string
        }[]
      }
      report_queue: {
        Args: never
        Returns: {
          created_at: string
          details: string
          history: Json
          reason: string
          report_id: string
          reported_name: string
          reported_public_id: string
          reported_suspended: boolean
          reporter_name: string
          reporter_public_id: string
          reporter_suspended: boolean
        }[]
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
      resolve_pet_review: {
        Args: {
          p_admin: string
          p_known_since: string
          p_note?: string
          p_outcome: string
          p_pet: string
          p_reason?: string
        }
        Returns: {
          code: string
          decision: string
          kind: string
          owner_id: string
          pending_since: string
          pet_name: string
          sex: string
        }[]
      }
      save_pet: {
        Args: {
          p_fields: Json
          p_owner: string
          p_pending_ttl: string
          p_pet: string
          p_photo_ids: string[]
          p_staged_ttl: string
        }
        Returns: string[]
      }
      settle_phone_code: {
        Args: { p_code_id: string; p_outcome: string }
        Returns: undefined
      }
      stage_pet_photo: {
        Args: {
          p_height: number
          p_owner: string
          p_pending_ttl: string
          p_photo_id: string
          p_thumbhash: string
          p_width: number
        }
        Returns: boolean
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
      suspend_account: {
        Args: {
          p_reason: string
          p_report?: string
          p_target_public_id: string
        }
        Returns: {
          closed_reports: Json
          display_name: string
          outcome: string
          resolution: string
          suspended_at: string
          suspended_by_name: string
          user_id: string
          withdrew_request: boolean
        }[]
      }
      suspended_accounts: {
        Args: never
        Returns: {
          display_name: string
          public_id: string
          reason: string
          suspended_at: string
          suspended_by_name: string
          suspension_id: string
        }[]
      }
      unblock_person: {
        Args: { p_blocker: string; p_public_id: string }
        Returns: string
      }
      uruguay_today: { Args: never; Returns: string }
      vouch_standing: {
        Args: { p_target_public_id: string; p_viewer: string }
        Returns: {
          blocked_by_target: boolean
          target_blocked_viewer: boolean
          target_vouches_viewer: boolean
          viewer_blocked_target: boolean
          viewer_vouches: boolean
        }[]
      }
      whoami: { Args: never; Returns: string }
      withdraw_identity_request: {
        Args: { p_user_id: string }
        Returns: {
          decision: string
          request_origin: string
          request_sent_at: string
        }[]
      }
      withdraw_vouch: {
        Args: { p_vouchee_public_id: string; p_voucher: string }
        Returns: string
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

