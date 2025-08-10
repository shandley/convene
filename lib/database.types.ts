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
            referencedRelation: "program_application_stats"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "announcements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      application_questions: {
        Row: {
          allow_other: boolean | null
          allowed_file_types: string[] | null
          category_id: string | null
          created_at: string | null
          depends_on_question_id: string | null
          help_text: string | null
          id: string
          is_system_question: boolean | null
          max_file_size_mb: number | null
          max_files: number | null
          max_length: number | null
          options: Json | null
          order_index: number
          placeholder: string | null
          program_id: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          randomize_options: boolean | null
          required: boolean | null
          show_condition: Json | null
          template_id: string | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          allow_other?: boolean | null
          allowed_file_types?: string[] | null
          category_id?: string | null
          created_at?: string | null
          depends_on_question_id?: string | null
          help_text?: string | null
          id?: string
          is_system_question?: boolean | null
          max_file_size_mb?: number | null
          max_files?: number | null
          max_length?: number | null
          options?: Json | null
          order_index: number
          placeholder?: string | null
          program_id?: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          randomize_options?: boolean | null
          required?: boolean | null
          show_condition?: Json | null
          template_id?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          allow_other?: boolean | null
          allowed_file_types?: string[] | null
          category_id?: string | null
          created_at?: string | null
          depends_on_question_id?: string | null
          help_text?: string | null
          id?: string
          is_system_question?: boolean | null
          max_file_size_mb?: number | null
          max_files?: number | null
          max_length?: number | null
          options?: Json | null
          order_index?: number
          placeholder?: string | null
          program_id?: string | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          randomize_options?: boolean | null
          required?: boolean | null
          show_condition?: Json | null
          template_id?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "application_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "question_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_questions_depends_on_question_id_fkey"
            columns: ["depends_on_question_id"]
            isOneToOne: false
            referencedRelation: "application_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_questions_depends_on_question_id_fkey"
            columns: ["depends_on_question_id"]
            isOneToOne: false
            referencedRelation: "question_statistics"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "application_questions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_application_stats"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "application_questions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_questions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      application_responses: {
        Row: {
          application_id: string
          created_at: string | null
          id: string
          is_complete: boolean | null
          is_current: boolean | null
          question_id: string
          response_boolean: boolean | null
          response_date: string | null
          response_file_urls: string[] | null
          response_json: Json | null
          response_number: number | null
          response_text: string | null
          updated_at: string | null
          value_type: Database["public"]["Enums"]["response_value_type"]
          version: number | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          is_current?: boolean | null
          question_id: string
          response_boolean?: boolean | null
          response_date?: string | null
          response_file_urls?: string[] | null
          response_json?: Json | null
          response_number?: number | null
          response_text?: string | null
          updated_at?: string | null
          value_type: Database["public"]["Enums"]["response_value_type"]
          version?: number | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          id?: string
          is_complete?: boolean | null
          is_current?: boolean | null
          question_id?: string
          response_boolean?: boolean | null
          response_date?: string | null
          response_file_urls?: string[] | null
          response_json?: Json | null
          response_number?: number | null
          response_text?: string | null
          updated_at?: string | null
          value_type?: Database["public"]["Enums"]["response_value_type"]
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "application_responses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_responses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "application_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_statistics"
            referencedColumns: ["question_id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          average_score: number | null
          completion_percentage: number | null
          created_at: string | null
          decided_at: string | null
          decided_by: string | null
          decision_comments: string | null
          decision_reason: string | null
          draft_saved_at: string | null
          email_preferences: Json | null
          id: string
          is_draft: boolean | null
          last_email_sent_at: string | null
          last_modified_at: string | null
          program_id: string
          responses: Json
          responses_migrated: boolean | null
          review_consensus: string | null
          review_count: number | null
          statement_of_interest: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          updated_at: string | null
          waitlist_position: number | null
          waitlisted_at: string | null
          withdrawal_comments: string | null
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          applicant_id: string
          average_score?: number | null
          completion_percentage?: number | null
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_comments?: string | null
          decision_reason?: string | null
          draft_saved_at?: string | null
          email_preferences?: Json | null
          id?: string
          is_draft?: boolean | null
          last_email_sent_at?: string | null
          last_modified_at?: string | null
          program_id: string
          responses?: Json
          responses_migrated?: boolean | null
          review_consensus?: string | null
          review_count?: number | null
          statement_of_interest?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          waitlist_position?: number | null
          waitlisted_at?: string | null
          withdrawal_comments?: string | null
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          applicant_id?: string
          average_score?: number | null
          completion_percentage?: number | null
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_comments?: string | null
          decision_reason?: string | null
          draft_saved_at?: string | null
          email_preferences?: Json | null
          id?: string
          is_draft?: boolean | null
          last_email_sent_at?: string | null
          last_modified_at?: string | null
          program_id?: string
          responses?: Json
          responses_migrated?: boolean | null
          review_consensus?: string | null
          review_count?: number | null
          statement_of_interest?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          waitlist_position?: number | null
          waitlisted_at?: string | null
          withdrawal_comments?: string | null
          withdrawal_reason?: string | null
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
            foreignKeyName: "applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_application_stats"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string | null
          document_category: string | null
          download_count: number | null
          file_hash: string | null
          file_name: string
          file_path: string | null
          file_size: number
          file_type: string
          file_url: string
          id: string
          is_processed: boolean | null
          is_public: boolean | null
          last_accessed_at: string | null
          processing_status: string | null
          question_id: string | null
          replaces_document_id: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string
          version: number | null
          virus_scan_status: string | null
        }
        Insert: {
          application_id?: string | null
          document_category?: string | null
          download_count?: number | null
          file_hash?: string | null
          file_name: string
          file_path?: string | null
          file_size: number
          file_type: string
          file_url: string
          id?: string
          is_processed?: boolean | null
          is_public?: boolean | null
          last_accessed_at?: string | null
          processing_status?: string | null
          question_id?: string | null
          replaces_document_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by: string
          version?: number | null
          virus_scan_status?: string | null
        }
        Update: {
          application_id?: string | null
          document_category?: string | null
          download_count?: number | null
          file_hash?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          is_processed?: boolean | null
          is_public?: boolean | null
          last_accessed_at?: string | null
          processing_status?: string | null
          question_id?: string | null
          replaces_document_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
          version?: number | null
          virus_scan_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "application_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "application_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_statistics"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "documents_replaces_document_id_fkey"
            columns: ["replaces_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
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
            referencedRelation: "application_overview"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "program_application_stats"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "participants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_programs"
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
            referencedRelation: "program_application_stats"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "program_members_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_members_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_programs"
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
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
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
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
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
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
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
            foreignKeyName: "programs_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_categories: {
        Row: {
          category_type: Database["public"]["Enums"]["question_category_type"]
          created_at: string | null
          description: string | null
          id: string
          instructions: string | null
          is_visible: boolean
          order_index: number
          program_id: string
          required_questions_count: number | null
          show_condition: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category_type?: Database["public"]["Enums"]["question_category_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          is_visible?: boolean
          order_index: number
          program_id: string
          required_questions_count?: number | null
          show_condition?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category_type?: Database["public"]["Enums"]["question_category_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          instructions?: string | null
          is_visible?: boolean
          order_index?: number
          program_id?: string
          required_questions_count?: number | null
          show_condition?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_categories_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_application_stats"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "question_categories_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_categories_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      question_libraries: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_libraries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_library_templates: {
        Row: {
          added_at: string | null
          id: string
          library_id: string
          notes: string | null
          order_index: number
          template_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          library_id: string
          notes?: string | null
          order_index?: number
          template_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          library_id?: string
          notes?: string | null
          order_index?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_library_templates_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "question_libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_library_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "question_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      question_templates: {
        Row: {
          allow_other: boolean | null
          allowed_file_types: string[] | null
          category: Database["public"]["Enums"]["question_category_type"]
          created_at: string | null
          created_by: string | null
          description: string | null
          help_text: string | null
          id: string
          is_public: boolean | null
          is_system_template: boolean | null
          max_file_size_mb: number | null
          max_files: number | null
          max_length: number | null
          options: Json | null
          placeholder: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          randomize_options: boolean | null
          required: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          usage_count: number | null
          validation_rules: Json | null
        }
        Insert: {
          allow_other?: boolean | null
          allowed_file_types?: string[] | null
          category?: Database["public"]["Enums"]["question_category_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          help_text?: string | null
          id?: string
          is_public?: boolean | null
          is_system_template?: boolean | null
          max_file_size_mb?: number | null
          max_files?: number | null
          max_length?: number | null
          options?: Json | null
          placeholder?: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          randomize_options?: boolean | null
          required?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
          validation_rules?: Json | null
        }
        Update: {
          allow_other?: boolean | null
          allowed_file_types?: string[] | null
          category?: Database["public"]["Enums"]["question_category_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          help_text?: string | null
          id?: string
          is_public?: boolean | null
          is_system_template?: boolean | null
          max_file_size_mb?: number | null
          max_files?: number | null
          max_length?: number | null
          options?: Json | null
          placeholder?: string | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          randomize_options?: boolean | null
          required?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "question_templates_created_by_fkey"
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
            referencedRelation: "application_overview"
            referencedColumns: ["id"]
          },
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
      security_config_status: {
        Row: {
          config_item: string
          description: string | null
          id: string
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_item: string
          description?: string | null
          id?: string
          status: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_item?: string
          description?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_config_status_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      application_overview: {
        Row: {
          applicant_email: string | null
          applicant_id: string | null
          applicant_institution: string | null
          applicant_name: string | null
          average_score: number | null
          completed_required_count: number | null
          completion_percentage: number | null
          created_at: string | null
          decided_at: string | null
          decided_by: string | null
          decided_by_name: string | null
          document_count: number | null
          id: string | null
          is_draft: boolean | null
          last_modified_at: string | null
          program_id: string | null
          program_title: string | null
          required_question_count: number | null
          response_count: number | null
          review_consensus: string | null
          review_count: number | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          waitlist_position: number | null
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
            foreignKeyName: "applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_application_stats"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_application_stats: {
        Row: {
          accepted: number | null
          application_deadline: string | null
          applications_with_reviews: number | null
          avg_completion_percentage: number | null
          avg_score: number | null
          capacity: number | null
          capacity_utilization_pct: number | null
          draft_applications: number | null
          fully_completed: number | null
          program_id: string | null
          program_status: Database["public"]["Enums"]["program_status"] | null
          program_title: string | null
          rejected: number | null
          submitted_applications: number | null
          total_applications: number | null
          under_review: number | null
          waitlisted: number | null
          withdrawn: number | null
        }
        Relationships: []
      }
      public_programs: {
        Row: {
          application_deadline: string | null
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          auto_waitlist_promotion: boolean | null
          blind_review: boolean | null
          capacity: number | null
          created_at: string | null
          created_by: string | null
          current_enrolled: number | null
          current_waitlisted: number | null
          description: string | null
          end_date: string | null
          fee: number | null
          id: string | null
          location: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["program_status"] | null
          title: string | null
          type: string | null
          updated_at: string | null
          waitlist_capacity: number | null
        }
        Insert: {
          application_deadline?: string | null
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          auto_waitlist_promotion?: boolean | null
          blind_review?: boolean | null
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          current_enrolled?: number | null
          current_waitlisted?: number | null
          description?: string | null
          end_date?: string | null
          fee?: number | null
          id?: string | null
          location?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["program_status"] | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          waitlist_capacity?: number | null
        }
        Update: {
          application_deadline?: string | null
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          auto_waitlist_promotion?: boolean | null
          blind_review?: boolean | null
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          current_enrolled?: number | null
          current_waitlisted?: number | null
          description?: string | null
          end_date?: string | null
          fee?: number | null
          id?: string | null
          location?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["program_status"] | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          waitlist_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_statistics: {
        Row: {
          avg_response_length: number | null
          category_id: string | null
          category_title: string | null
          complete_responses: number | null
          completion_rate: number | null
          files_uploaded: number | null
          incomplete_responses: number | null
          program_id: string | null
          question_id: string | null
          question_text: string | null
          question_type: Database["public"]["Enums"]["question_type"] | null
          required: boolean | null
          total_responses: number | null
        }
        Relationships: [
          {
            foreignKeyName: "application_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "question_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_questions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_application_stats"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "application_questions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_questions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      archive_program: {
        Args: { p_program_id: string }
        Returns: undefined
      }
      calculate_application_completion: {
        Args: { app_id: string }
        Returns: number
      }
      can_delete_program: {
        Args: { p_program_id: string }
        Returns: boolean
      }
      create_question_from_template: {
        Args: {
          p_program_id: string
          p_template_id: string
          p_category_id?: string
          p_order_index?: number
          p_required?: boolean
        }
        Returns: string
      }
      duplicate_program_questions: {
        Args: {
          source_program_id: string
          target_program_id: string
          include_responses?: boolean
        }
        Returns: number
      }
      export_application_responses: {
        Args: { app_id: string }
        Returns: Json
      }
      find_duplicate_files: {
        Args: { hash: string }
        Returns: {
          document_id: string
          file_name: string
          uploaded_at: string
        }[]
      }
      generate_file_hash: {
        Args: { file_content: string }
        Returns: string
      }
      get_application_documents: {
        Args: { app_id: string; question_id?: string }
        Returns: {
          document_id: string
          file_name: string
          file_type: string
          file_size: number
          file_url: string
          document_category: string
          uploaded_at: string
          version: number
        }[]
      }
      get_application_progress: {
        Args: { app_id: string }
        Returns: {
          category_title: string
          total_questions: number
          required_questions: number
          completed_questions: number
          completion_percentage: number
        }[]
      }
      get_incomplete_questions: {
        Args: { app_id: string }
        Returns: {
          question_id: string
          category_title: string
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          required: boolean
          has_response: boolean
        }[]
      }
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
      migrate_application_responses: {
        Args: { app_id?: string }
        Returns: number
      }
      search_question_templates: {
        Args: {
          search_text?: string
          category_filter?: Database["public"]["Enums"]["question_category_type"]
          type_filter?: Database["public"]["Enums"]["question_type"]
          tag_filter?: string
          include_private?: boolean
          created_by_filter?: string
        }
        Returns: {
          template_id: string
          title: string
          description: string
          category: Database["public"]["Enums"]["question_category_type"]
          question_type: Database["public"]["Enums"]["question_type"]
          question_text: string
          usage_count: number
          is_system_template: boolean
          created_by: string
          created_at: string
        }[]
      }
      track_document_access: {
        Args: { doc_id: string }
        Returns: undefined
      }
      unarchive_program: {
        Args: { p_program_id: string }
        Returns: undefined
      }
      update_application_review_stats: {
        Args: { app_id: string }
        Returns: undefined
      }
      update_security_config_status: {
        Args: {
          p_config_item: string
          p_status: string
          p_description?: string
        }
        Returns: undefined
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
      question_category_type:
        | "personal_info"
        | "background"
        | "experience"
        | "essays"
        | "preferences"
        | "documents"
        | "custom"
      question_type:
        | "text"
        | "textarea"
        | "select"
        | "multi_select"
        | "checkbox"
        | "file"
        | "number"
        | "date"
        | "email"
        | "url"
        | "phone"
      response_value_type:
        | "text"
        | "number"
        | "date"
        | "boolean"
        | "json"
        | "file_url"
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
      question_category_type: [
        "personal_info",
        "background",
        "experience",
        "essays",
        "preferences",
        "documents",
        "custom",
      ],
      question_type: [
        "text",
        "textarea",
        "select",
        "multi_select",
        "checkbox",
        "file",
        "number",
        "date",
        "email",
        "url",
        "phone",
      ],
      response_value_type: [
        "text",
        "number",
        "date",
        "boolean",
        "json",
        "file_url",
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
