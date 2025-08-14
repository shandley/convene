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
            foreignKeyName: "application_questions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "question_templates"
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
            referencedRelation: "programs"
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
            referencedRelation: "programs"
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
      review_criteria: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          max_score: number
          min_score: number
          name: string
          program_id: string
          rubric_definition: Json
          scoring_guide: string | null
          scoring_type: Database["public"]["Enums"]["scoring_type"]
          sort_order: number
          updated_at: string | null
          weight: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          max_score?: number
          min_score?: number
          name: string
          program_id: string
          rubric_definition?: Json
          scoring_guide?: string | null
          scoring_type?: Database["public"]["Enums"]["scoring_type"]
          sort_order?: number
          updated_at?: string | null
          weight?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          max_score?: number
          min_score?: number
          name?: string
          program_id?: string
          rubric_definition?: Json
          scoring_guide?: string | null
          scoring_type?: Database["public"]["Enums"]["scoring_type"]
          sort_order?: number
          updated_at?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_criteria_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      review_criteria_templates: {
        Row: {
          category: Database["public"]["Enums"]["template_category"]
          created_at: string | null
          created_by: string | null
          criteria_definition: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          total_max_score: number
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["template_category"]
          created_at?: string | null
          created_by?: string | null
          criteria_definition?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          total_max_score?: number
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["template_category"]
          created_at?: string | null
          created_by?: string | null
          criteria_definition?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          total_max_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_criteria_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_scores: {
        Row: {
          created_at: string | null
          criteria_id: string
          id: string
          normalized_score: number | null
          raw_score: number
          review_id: string
          reviewer_confidence: number | null
          rubric_level: string | null
          score_rationale: string | null
          updated_at: string | null
          weight_applied: number | null
          weighted_score: number | null
        }
        Insert: {
          created_at?: string | null
          criteria_id: string
          id?: string
          normalized_score?: number | null
          raw_score: number
          review_id: string
          reviewer_confidence?: number | null
          rubric_level?: string | null
          score_rationale?: string | null
          updated_at?: string | null
          weight_applied?: number | null
          weighted_score?: number | null
        }
        Update: {
          created_at?: string | null
          criteria_id?: string
          id?: string
          normalized_score?: number | null
          raw_score?: number
          review_id?: string
          reviewer_confidence?: number | null
          rubric_level?: string | null
          score_rationale?: string | null
          updated_at?: string | null
          weight_applied?: number | null
          weighted_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "review_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_scores_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_settings: {
        Row: {
          acceptance_threshold: number | null
          allow_reviewer_comments: boolean | null
          blind_review: boolean | null
          consensus_threshold: number | null
          created_at: string | null
          custom_instructions: string | null
          enable_score_normalization: boolean | null
          id: string
          max_reviews_per_application: number
          max_reviews_per_reviewer: number | null
          min_reviews_per_application: number
          min_reviews_per_reviewer: number | null
          program_id: string
          rejection_threshold: number | null
          require_strengths_weaknesses: boolean | null
          requires_consensus: boolean | null
          scoring_method: Database["public"]["Enums"]["scoring_method"]
          template_id: string | null
          updated_at: string | null
          waitlist_threshold: number | null
        }
        Insert: {
          acceptance_threshold?: number | null
          allow_reviewer_comments?: boolean | null
          blind_review?: boolean | null
          consensus_threshold?: number | null
          created_at?: string | null
          custom_instructions?: string | null
          enable_score_normalization?: boolean | null
          id?: string
          max_reviews_per_application?: number
          max_reviews_per_reviewer?: number | null
          min_reviews_per_application?: number
          min_reviews_per_reviewer?: number | null
          program_id: string
          rejection_threshold?: number | null
          require_strengths_weaknesses?: boolean | null
          requires_consensus?: boolean | null
          scoring_method?: Database["public"]["Enums"]["scoring_method"]
          template_id?: string | null
          updated_at?: string | null
          waitlist_threshold?: number | null
        }
        Update: {
          acceptance_threshold?: number | null
          allow_reviewer_comments?: boolean | null
          blind_review?: boolean | null
          consensus_threshold?: number | null
          created_at?: string | null
          custom_instructions?: string | null
          enable_score_normalization?: boolean | null
          id?: string
          max_reviews_per_application?: number
          max_reviews_per_reviewer?: number | null
          min_reviews_per_application?: number
          min_reviews_per_reviewer?: number | null
          program_id?: string
          rejection_threshold?: number | null
          require_strengths_weaknesses?: boolean | null
          requires_consensus?: boolean | null
          scoring_method?: Database["public"]["Enums"]["scoring_method"]
          template_id?: string | null
          updated_at?: string | null
          waitlist_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_settings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: true
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_settings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "review_criteria_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      reviewer_expertise: {
        Row: {
          average_review_quality_score: number | null
          created_at: string | null
          expertise_area: string
          id: string
          proficiency_level: Database["public"]["Enums"]["expertise_level"]
          reliability_score: number | null
          reviewer_id: string
          specialization_tags: string[] | null
          total_reviews_completed: number | null
          updated_at: string | null
          verification_date: string | null
          verification_notes: string | null
          verified_by: string | null
          years_of_experience: number | null
        }
        Insert: {
          average_review_quality_score?: number | null
          created_at?: string | null
          expertise_area: string
          id?: string
          proficiency_level?: Database["public"]["Enums"]["expertise_level"]
          reliability_score?: number | null
          reviewer_id: string
          specialization_tags?: string[] | null
          total_reviews_completed?: number | null
          updated_at?: string | null
          verification_date?: string | null
          verification_notes?: string | null
          verified_by?: string | null
          years_of_experience?: number | null
        }
        Update: {
          average_review_quality_score?: number | null
          created_at?: string | null
          expertise_area?: string
          id?: string
          proficiency_level?: Database["public"]["Enums"]["expertise_level"]
          reliability_score?: number | null
          reviewer_id?: string
          specialization_tags?: string[] | null
          total_reviews_completed?: number | null
          updated_at?: string | null
          verification_date?: string | null
          verification_notes?: string | null
          verified_by?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviewer_expertise_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviewer_expertise_verified_by_fkey"
            columns: ["verified_by"]
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
      [_ in never]: never
    }
    Functions: {
      apply_review_template: {
        Args: { program_id_param: string; template_id_param: string }
        Returns: number
      }
      archive_program: {
        Args: { p_program_id: string }
        Returns: undefined
      }
      auto_assign_reviewers: {
        Args: { program_id_param: string; required_reviewers?: number }
        Returns: number
      }
      calculate_application_completion: {
        Args: { app_id: string }
        Returns: number
      }
      calculate_application_weighted_score: {
        Args: { application_id_param: string }
        Returns: number
      }
      calculate_reviewer_consensus: {
        Args: { application_id_param: string }
        Returns: number
      }
      can_delete_program: {
        Args: { p_program_id: string }
        Returns: boolean
      }
      create_question_from_template: {
        Args: {
          p_category_id?: string
          p_order_index?: number
          p_program_id: string
          p_required?: boolean
          p_template_id: string
        }
        Returns: string
      }
      duplicate_program_questions: {
        Args: {
          include_responses?: boolean
          source_program_id: string
          target_program_id: string
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
          document_category: string
          document_id: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          uploaded_at: string
          version: number
        }[]
      }
      get_application_progress: {
        Args: { app_id: string }
        Returns: {
          category_title: string
          completed_questions: number
          completion_percentage: number
          required_questions: number
          total_questions: number
        }[]
      }
      get_application_ranking: {
        Args: { program_id_param: string }
        Returns: {
          applicant_name: string
          application_id: string
          average_score: number
          consensus_score: number
          rank: number
          review_count: number
        }[]
      }
      get_incomplete_questions: {
        Args: { app_id: string }
        Returns: {
          category_title: string
          has_response: boolean
          question_id: string
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          required: boolean
        }[]
      }
      get_program_review_stats: {
        Args: { program_id_param: string }
        Returns: {
          applications_pending_review: number
          applications_reviewed: number
          average_score: number
          reviews_completed: number
          reviews_pending: number
          total_applications: number
          total_reviewers: number
        }[]
      }
      get_reviewer_workload: {
        Args: { reviewer_id_param: string }
        Returns: {
          average_score: number
          completed: number
          deadline: string
          pending: number
          program_id: string
          program_title: string
          total_assigned: number
        }[]
      }
      has_program_access: {
        Args: { access_type?: string; program_id_param: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Returns: boolean
      }
      is_program_admin: {
        Args: { program_id: string; user_id: string }
        Returns: boolean
      }
      migrate_application_responses: {
        Args: { app_id?: string }
        Returns: number
      }
      normalize_review_scores: {
        Args: { program_id_param: string }
        Returns: number
      }
      search_question_templates: {
        Args: {
          category_filter?: Database["public"]["Enums"]["question_category_type"]
          created_by_filter?: string
          include_private?: boolean
          search_text?: string
          tag_filter?: string
          type_filter?: Database["public"]["Enums"]["question_type"]
        }
        Returns: {
          category: Database["public"]["Enums"]["question_category_type"]
          created_at: string
          created_by: string
          description: string
          is_system_template: boolean
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          template_id: string
          title: string
          usage_count: number
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
          p_description?: string
          p_status: string
        }
        Returns: undefined
      }
      validate_review_completion: {
        Args: { review_id_param: string }
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
      expertise_level: "beginner" | "intermediate" | "advanced" | "expert"
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
      scoring_method:
        | "average"
        | "weighted_average"
        | "median"
        | "consensus"
        | "holistic"
      scoring_type:
        | "numerical"
        | "categorical"
        | "binary"
        | "rubric"
        | "weighted"
      template_category:
        | "workshop"
        | "conference"
        | "hackathon"
        | "bootcamp"
        | "seminar"
        | "retreat"
        | "certification"
        | "competition"
        | "fellowship"
        | "residency"
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
      expertise_level: ["beginner", "intermediate", "advanced", "expert"],
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
      scoring_method: [
        "average",
        "weighted_average",
        "median",
        "consensus",
        "holistic",
      ],
      scoring_type: [
        "numerical",
        "categorical",
        "binary",
        "rubric",
        "weighted",
      ],
      template_category: [
        "workshop",
        "conference",
        "hackathon",
        "bootcamp",
        "seminar",
        "retreat",
        "certification",
        "competition",
        "fellowship",
        "residency",
      ],
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