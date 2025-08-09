import type { Json } from './database.types'

// Question Types
export type QuestionType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'multi_select' 
  | 'checkbox' 
  | 'file' 
  | 'number' 
  | 'date' 
  | 'email' 
  | 'url' 
  | 'phone'

export type QuestionCategoryType = 
  | 'personal_info' 
  | 'background' 
  | 'experience' 
  | 'essays' 
  | 'preferences' 
  | 'documents' 
  | 'custom'

// Database Row Types
export interface ApplicationQuestion {
  id: string
  program_id: string
  category_id: string | null
  template_id: string | null
  question_text: string
  question_type: QuestionType
  help_text: string | null
  placeholder: string | null
  required: boolean
  max_length: number | null
  validation_rules: Json
  options: Json | null
  allowed_file_types: string[] | null
  max_file_size_mb: number | null
  max_files: number
  allow_other: boolean
  randomize_options: boolean
  depends_on_question_id: string | null
  show_condition: Json | null
  is_system_question: boolean
  order_index: number
  created_at: string
  updated_at: string | null
}

export interface QuestionCategory {
  id: string
  name: string
  order_index: number
}

export interface QuestionTemplate {
  id: string
  title: string
  description: string | null
  category: QuestionCategoryType
  question_text: string
  question_type: QuestionType
  help_text: string | null
  placeholder: string | null
  required: boolean
  max_length: number | null
  validation_rules: Json
  options: Json | null
  allowed_file_types: string[] | null
  max_file_size_mb: number | null
  max_files: number
  allow_other: boolean
  randomize_options: boolean
  is_system_template: boolean
  is_public: boolean
  created_by: string | null
  usage_count: number
  tags: string[]
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface ApplicationQuestionWithRelations extends ApplicationQuestion {
  category?: QuestionCategory | null
  template?: Pick<QuestionTemplate, 'id' | 'title'> | null
  dependent_questions?: Pick<ApplicationQuestion, 'id' | 'question_text' | 'question_type'>[]
}

// API Request/Response Types
export interface CreateQuestionRequest {
  question_text: string
  question_type: QuestionType
  category_id?: string
  help_text?: string
  placeholder?: string
  required?: boolean
  max_length?: number
  validation_rules?: Record<string, any>
  options?: any[]
  allowed_file_types?: string[]
  max_file_size_mb?: number
  max_files?: number
  allow_other?: boolean
  randomize_options?: boolean
  depends_on_question_id?: string
  show_condition?: Record<string, any>
  order_index?: number
  template_id?: string
}

export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {}

export interface ReorderQuestionsRequest {
  questions: {
    id: string
    order_index: number
    category_id?: string | null
  }[]
}

export interface CreateFromTemplateRequest {
  template_id: string
  category_id?: string
  order_index?: number
  required?: boolean
  customizations?: {
    question_text?: string
    help_text?: string
    placeholder?: string
    options?: any[]
    validation_rules?: Record<string, any>
  }
}

export interface BulkCreateFromTemplatesRequest {
  templates: CreateFromTemplateRequest[]
}

export interface SearchTemplatesParams {
  search?: string
  category?: QuestionCategoryType
  type?: QuestionType
  tags?: string
  include_private?: boolean
}

// API Response Types
export interface QuestionsResponse {
  questions: ApplicationQuestionWithRelations[]
}

export interface QuestionResponse {
  question: ApplicationQuestionWithRelations
}

export interface TemplatesResponse {
  templates: QuestionTemplate[]
}

export interface CreateFromTemplateResponse {
  success: boolean
  created_questions: ApplicationQuestionWithRelations[]
  errors?: Array<{
    template_id: string
    error: string
  }>
}

export interface ReorderQuestionsResponse {
  message: string
  questions: ApplicationQuestionWithRelations[]
}

// Validation Rules Types
export interface TextValidationRules {
  min_length?: number
  max_length?: number
  regex?: string
  regex_message?: string
}

export interface NumberValidationRules {
  min?: number
  max?: number
  integer_only?: boolean
}

export interface DateValidationRules {
  min_date?: string
  max_date?: string
  disable_past?: boolean
  disable_future?: boolean
}

export interface FileValidationRules {
  allowed_extensions?: string[]
  max_size_mb?: number
  min_files?: number
  max_files?: number
}

export type ValidationRules = 
  | TextValidationRules 
  | NumberValidationRules 
  | DateValidationRules 
  | FileValidationRules 
  | Record<string, any>

// Question Option Types
export interface SelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface FileUploadConfig {
  allowed_file_types: string[]
  max_file_size_mb: number
  max_files: number
  accept_multiple?: boolean
}

// Conditional Logic Types
export interface ShowCondition {
  question_id: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than'
  value: any
  logical_operator?: 'and' | 'or' // For multiple conditions
}

// Error Types
export interface QuestionValidationError {
  field: string
  message: string
  code?: string
}

export interface ApiError {
  error: string
  details?: QuestionValidationError[] | any[]
}