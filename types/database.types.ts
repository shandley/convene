export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          allow_na: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          examples: Json | null
          exclude_from_total: boolean | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_score: number | null
          min_score: number | null
          name: string
          order_index: number | null
          program_id: string
          rubric_guidelines: Json | null
          scoring_type: Database["public"]["Enums"]["scoring_type"] | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          allow_na?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          examples?: Json | null
          exclude_from_total?: boolean | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_score?: number | null
          min_score?: number | null
          name: string
          order_index?: number | null
          program_id: string
          rubric_guidelines?: Json | null
          scoring_type?: Database["public"]["Enums"]["scoring_type"] | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          allow_na?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          examples?: Json | null
          exclude_from_total?: boolean | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_score?: number | null
          min_score?: number | null
          name?: string
          order_index?: number | null
          program_id?: string
          rubric_guidelines?: Json | null
          scoring_type?: Database["public"]["Enums"]["scoring_type"] | null
          updated_at?: string | null
          weight?: number | null
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
          criteria_json: Json
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["template_category"]
          created_at?: string | null
          created_by?: string | null
          criteria_json: Json
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["template_category"]
          created_at?: string | null
          created_by?: string | null
          criteria_json?: Json
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
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
          comments: string | null
          confidence_level: number | null
          created_at: string | null
          criteria_id: string
          id: string
          is_na: boolean | null
          normalized_score: number | null
          rationale: string | null
          review_id: string
          score: number | null
          time_spent_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          comments?: string | null
          confidence_level?: number | null
          created_at?: string | null
          criteria_id: string
          id?: string
          is_na?: boolean | null
          normalized_score?: number | null
          rationale?: string | null
          review_id: string
          score?: number | null
          time_spent_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          comments?: string | null
          confidence_level?: number | null
          created_at?: string | null
          criteria_id?: string
          id?: string
          is_na?: boolean | null
          normalized_score?: number | null
          rationale?: string | null
          review_id?: string
          score?: number | null
          time_spent_seconds?: number | null
          updated_at?: string | null
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
          allow_abstention: boolean | null
          allow_reviewer_comments: boolean | null
          allow_reviewer_discussion: boolean | null
          auto_calculate_score: boolean | null
          calibration_threshold: number | null
          conflict_resolution: string | null
          created_at: string | null
          enable_calibration: boolean | null
          id: string
          max_reviews_allowed: number | null
          min_feedback_length: number | null
          min_reviews_required: number | null
          notify_on_review_complete: boolean | null
          program_id: string
          require_written_feedback: boolean | null
          review_deadline_days: number | null
          score_threshold_accept: number | null
          score_threshold_reject: number | null
          score_threshold_waitlist_max: number | null
          score_threshold_waitlist_min: number | null
          scoring_method: Database["public"]["Enums"]["scoring_method"] | null
          show_other_reviews: boolean | null
          show_scores_to_applicants: boolean | null
          updated_at: string | null
        }
        Insert: {
          allow_abstention?: boolean | null
          allow_reviewer_comments?: boolean | null
          allow_reviewer_discussion?: boolean | null
          auto_calculate_score?: boolean | null
          calibration_threshold?: number | null
          conflict_resolution?: string | null
          created_at?: string | null
          enable_calibration?: boolean | null
          id?: string
          max_reviews_allowed?: number | null
          min_feedback_length?: number | null
          min_reviews_required?: number | null
          notify_on_review_complete?: boolean | null
          program_id: string
          require_written_feedback?: boolean | null
          review_deadline_days?: number | null
          score_threshold_accept?: number | null
          score_threshold_reject?: number | null
          score_threshold_waitlist_max?: number | null
          score_threshold_waitlist_min?: number | null
          scoring_method?: Database["public"]["Enums"]["scoring_method"] | null
          show_other_reviews?: boolean | null
          show_scores_to_applicants?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allow_abstention?: boolean | null
          allow_reviewer_comments?: boolean | null
          allow_reviewer_discussion?: boolean | null
          auto_calculate_score?: boolean | null
          calibration_threshold?: number | null
          conflict_resolution?: string | null
          created_at?: string | null
          enable_calibration?: boolean | null
          id?: string
          max_reviews_allowed?: number | null
          min_feedback_length?: number | null
          min_reviews_required?: number | null
          notify_on_review_complete?: boolean | null
          program_id?: string
          require_written_feedback?: boolean | null
          review_deadline_days?: number | null
          score_threshold_accept?: number | null
          score_threshold_reject?: number | null
          score_threshold_waitlist_max?: number | null
          score_threshold_waitlist_min?: number | null
          scoring_method?: Database["public"]["Enums"]["scoring_method"] | null
          show_other_reviews?: boolean | null
          show_scores_to_applicants?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_settings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: true
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviewer_expertise: {
        Row: {
          average_review_time_minutes: number | null
          average_score_given: number | null
          certifications: string[] | null
          consistency_score: number | null
          created_at: string | null
          expertise_area: string
          id: string
          is_active: boolean | null
          last_review_date: string | null
          notes: string | null
          proficiency_level: Database["public"]["Enums"]["expertise_level"] | null
          programs_reviewed: number | null
          total_reviews_completed: number | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          years_experience: number | null
        }
        Insert: {
          average_review_time_minutes?: number | null
          average_score_given?: number | null
          certifications?: string[] | null
          consistency_score?: number | null
          created_at?: string | null
          expertise_area: string
          id?: string
          is_active?: boolean | null
          last_review_date?: string | null
          notes?: string | null
          proficiency_level?: Database["public"]["Enums"]["expertise_level"] | null
          programs_reviewed?: number | null
          total_reviews_completed?: number | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Update: {
          average_review_time_minutes?: number | null
          average_score_given?: number | null
          certifications?: string[] | null
          consistency_score?: number | null
          created_at?: string | null
          expertise_area?: string
          id?: string
          is_active?: boolean | null
          last_review_date?: string | null
          notes?: string | null
          proficiency_level?: Database["public"]["Enums"]["expertise_level"] | null
          programs_reviewed?: number | null
          total_reviews_completed?: number | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviewer_expertise_user_id_fkey"
            columns: ["user_id"]
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
      archive_program: {
        Args: { p_program_id: string }
        Returns: undefined
      }
      auto_assign_reviewers_by_expertise: {
        Args: { 
          p_program_id: string
          p_max_assignments?: number 
        }
        Returns: number
      }
      calculate_consensus_score: {
        Args: { p_application_id: string }
        Returns: number
      }
      calculate_criteria_score: {
        Args: { 
          p_review_id: string
          p_criteria_id: string 
        }
        Returns: number
      }
      calculate_review_score: {
        Args: { p_review_id: string }
        Returns: number
      }
      can_delete_program: {
        Args: { p_program_id: string }
        Returns: boolean
      }
      copy_review_template: {
        Args: { 
          p_template_id: string
          p_program_id: string 
        }
        Returns: boolean
      }
      get_reviewer_consistency: {
        Args: { p_reviewer_id: string }
        Returns: number
      }
      normalize_review_scores: {
        Args: { p_program_id: string }
        Returns: undefined
      }
      rank_applications_by_score: {
        Args: { p_program_id: string }
        Returns: {
          application_id: string
          average_score: number
          rank: number
        }[]
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
      unarchive_program: {
        Args: { p_program_id: string }
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
        | "highest"
        | "lowest"
      scoring_type:
        | "numeric"
        | "yes_no"
        | "pass_fail"
        | "letter_grade"
        | "percentage"
      template_category:
        | "workshop"
        | "conference"
        | "hackathon"
        | "fellowship"
        | "research"
        | "training"
        | "competition"
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never