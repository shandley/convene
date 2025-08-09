export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          program_id: string | null
          target_audience: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          program_id?: string | null
          target_audience?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          program_id?: string | null
          target_audience?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      application_questions: {
        Row: {
          created_at: string | null
          id: string
          max_length: number | null
          options: Json | null
          order_index: number
          program_id: string | null
          question_text: string
          question_type: string
          required: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_length?: number | null
          options?: Json | null
          order_index: number
          program_id?: string | null
          question_text: string
          question_type: string
          required?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_length?: number | null
          options?: Json | null
          order_index?: number
          program_id?: string | null
          question_text?: string
          question_type?: string
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "application_questions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          created_at: string | null
          decided_at: string | null
          id: string
          program_id: string
          responses: Json
          statement_of_interest: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          updated_at: string | null
          withdrawn_at: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string | null
          decided_at?: string | null
          id?: string
          program_id: string
          responses?: Json
          statement_of_interest?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string | null
          decided_at?: string | null
          id?: string
          program_id?: string
          responses?: Json
          statement_of_interest?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          application_id?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          application_id?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          application_updates: boolean | null
          deadline_reminders: boolean | null
          email_enabled: boolean | null
          program_announcements: boolean | null
          review_assignments: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_updates?: boolean | null
          deadline_reminders?: boolean | null
          email_enabled?: boolean | null
          program_announcements?: boolean | null
          review_assignments?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_updates?: boolean | null
          deadline_reminders?: boolean | null
          email_enabled?: boolean | null
          program_announcements?: boolean | null
          review_assignments?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          application_id: string | null
          confirmed_at: string | null
          created_at: string | null
          declined_at: string | null
          id: string
          program_id: string
          status: Database["public"]["Enums"]["participant_status"] | null
          user_id: string
        }
        Insert: {
          application_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          declined_at?: string | null
          id?: string
          program_id: string
          status?: Database["public"]["Enums"]["participant_status"] | null
          user_id: string
        }
        Update: {
          application_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          declined_at?: string | null
          id?: string
          program_id?: string
          status?: Database["public"]["Enums"]["participant_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          institution: string | null
          roles: Database["public"]["Enums"]["user_role"][] | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          institution?: string | null
          roles?: Database["public"]["Enums"]["user_role"][] | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          institution?: string | null
          roles?: Database["public"]["Enums"]["user_role"][] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      program_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          id: string
          program_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          program_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          program_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_members_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          application_deadline: string
          auto_waitlist_promotion: boolean | null
          blind_review: boolean | null
          capacity: number
          created_at: string | null
          created_by: string
          current_enrolled: number | null
          current_waitlisted: number | null
          description: string | null
          end_date: string
          fee: number | null
          id: string
          location: string | null
          start_date: string
          status: Database["public"]["Enums"]["program_status"] | null
          title: string
          type: string
          updated_at: string | null
          waitlist_capacity: number | null
        }
        Insert: {
          application_deadline: string
          auto_waitlist_promotion?: boolean | null
          blind_review?: boolean | null
          capacity: number
          created_at?: string | null
          created_by: string
          current_enrolled?: number | null
          current_waitlisted?: number | null
          description?: string | null
          end_date: string
          fee?: number | null
          id?: string
          location?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["program_status"] | null
          title: string
          type: string
          updated_at?: string | null
          waitlist_capacity?: number | null
        }
        Update: {
          application_deadline?: string
          auto_waitlist_promotion?: boolean | null
          blind_review?: boolean | null
          capacity?: number
          created_at?: string | null
          created_by?: string
          current_enrolled?: number | null
          current_waitlisted?: number | null
          description?: string | null
          end_date?: string
          fee?: number | null
          id?: string
          location?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["program_status"] | null
          title?: string
          type?: string
          updated_at?: string | null
          waitlist_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_assignments: {
        Row: {
          application_id: string
          assigned_at: string | null
          assigned_by: string
          completed_at: string | null
          deadline: string | null
          id: string
          reviewer_id: string
          status: Database["public"]["Enums"]["review_status"] | null
        }
        Insert: {
          application_id: string
          assigned_at?: string | null
          assigned_by: string
          completed_at?: string | null
          deadline?: string | null
          id?: string
          reviewer_id: string
          status?: Database["public"]["Enums"]["review_status"] | null
        }
        Update: {
          application_id?: string
          assigned_at?: string | null
          assigned_by?: string
          completed_at?: string | null
          deadline?: string | null
          id?: string
          reviewer_id?: string
          status?: Database["public"]["Enums"]["review_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "review_assignments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_assignments_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          assignment_id: string | null
          comments: string | null
          created_at: string | null
          criteria_scores: Json | null
          id: string
          overall_score: number | null
          recommendation: string | null
          strengths: string | null
          updated_at: string | null
          weaknesses: string | null
        }
        Insert: {
          assignment_id?: string | null
          comments?: string | null
          created_at?: string | null
          criteria_scores?: Json | null
          id?: string
          overall_score?: number | null
          recommendation?: string | null
          strengths?: string | null
          updated_at?: string | null
          weaknesses?: string | null
        }
        Update: {
          assignment_id?: string | null
          comments?: string | null
          created_at?: string | null
          criteria_scores?: Json | null
          id?: string
          overall_score?: number | null
          recommendation?: string | null
          strengths?: string | null
          updated_at?: string | null
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "review_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_program_admin: {
        Args: { user_id: string; program_id: string }
        Returns: boolean
      }
    }
    Enums: {
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "accepted"
        | "rejected"
        | "waitlisted"
        | "withdrawn"
      participant_status:
        | "confirmed"
        | "declined"
        | "no_show"
        | "completed"
        | "dropped_out"
      program_status:
        | "draft"
        | "published"
        | "applications_open"
        | "applications_closed"
        | "in_review"
        | "selections_made"
        | "active"
        | "completed"
        | "cancelled"
      review_status: "not_started" | "in_progress" | "completed"
      user_role:
        | "super_admin"
        | "program_admin"
        | "instructor"
        | "reviewer"
        | "applicant"
        | "participant"
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
    Enums: {
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "accepted",
        "rejected",
        "waitlisted",
        "withdrawn",
      ],
      participant_status: [
        "confirmed",
        "declined",
        "no_show",
        "completed",
        "dropped_out",
      ],
      program_status: [
        "draft",
        "published",
        "applications_open",
        "applications_closed",
        "in_review",
        "selections_made",
        "active",
        "completed",
        "cancelled",
      ],
      review_status: ["not_started", "in_progress", "completed"],
      user_role: [
        "super_admin",
        "program_admin",
        "instructor",
        "reviewer",
        "applicant",
        "participant",
      ],
    },
  },
} as const