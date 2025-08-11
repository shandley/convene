// TypeScript types for the Review Configuration & Scoring System
// Generated: 2025-08-10

// Enum types for the review system
export type ScoringType = 'numerical' | 'categorical' | 'binary' | 'rubric' | 'weighted';
export type ScoringMethod = 'average' | 'weighted_average' | 'median' | 'consensus' | 'holistic';
export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type TemplateCategory = 
  | 'workshop' 
  | 'conference' 
  | 'hackathon' 
  | 'bootcamp' 
  | 'seminar' 
  | 'retreat' 
  | 'certification' 
  | 'competition' 
  | 'fellowship' 
  | 'residency';

// Review Criteria Template Types
export interface ReviewCriteriaTemplate {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  is_active: boolean;
  criteria_definition: CriteriaDefinition[];
  total_max_score: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CriteriaDefinition {
  name: string;
  description: string;
  scoring_type: ScoringType;
  weight: number;
  max_score: number;
  min_score: number;
  rubric_definition: Record<string, string>;
  scoring_guide?: string;
}

// Review Settings Types
export interface ReviewSettings {
  id: string;
  program_id: string;
  min_reviews_per_application: number;
  max_reviews_per_application: number;
  min_reviews_per_reviewer: number | null;
  max_reviews_per_reviewer: number | null;
  scoring_method: ScoringMethod;
  requires_consensus: boolean;
  consensus_threshold: number;
  blind_review: boolean;
  allow_reviewer_comments: boolean;
  require_strengths_weaknesses: boolean;
  enable_score_normalization: boolean;
  acceptance_threshold: number | null;
  rejection_threshold: number | null;
  waitlist_threshold: number | null;
  template_id: string | null;
  custom_instructions: string | null;
  created_at: string;
  updated_at: string;
}

// Review Criteria Types
export interface ReviewCriteria {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  scoring_type: ScoringType;
  weight: number;
  max_score: number;
  min_score: number;
  sort_order: number;
  rubric_definition: Record<string, any>;
  scoring_guide: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

// Reviewer Expertise Types
export interface ReviewerExpertise {
  id: string;
  reviewer_id: string;
  expertise_area: string;
  proficiency_level: ExpertiseLevel;
  years_of_experience: number | null;
  specialization_tags: string[];
  verified_by: string | null;
  verification_date: string | null;
  verification_notes: string | null;
  total_reviews_completed: number;
  average_review_quality_score: number | null;
  reliability_score: number;
  created_at: string;
  updated_at: string;
}

// Review Scores Types
export interface ReviewScore {
  id: string;
  review_id: string;
  criteria_id: string;
  raw_score: number;
  normalized_score: number | null;
  weight_applied: number;
  weighted_score: number | null;
  rubric_level: string | null;
  score_rationale: string | null;
  reviewer_confidence: number | null;
  created_at: string;
  updated_at: string;
}

// Extended Database Types (to be merged with existing database.types.ts)
export interface ReviewSystemTables {
  review_criteria_templates: {
    Row: ReviewCriteriaTemplate;
    Insert: Omit<ReviewCriteriaTemplate, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<ReviewCriteriaTemplate, 'id' | 'created_at' | 'updated_at'>>;
  };
  review_settings: {
    Row: ReviewSettings;
    Insert: Omit<ReviewSettings, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<ReviewSettings, 'id' | 'created_at' | 'updated_at'>>;
  };
  review_criteria: {
    Row: ReviewCriteria;
    Insert: Omit<ReviewCriteria, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<ReviewCriteria, 'id' | 'created_at' | 'updated_at'>>;
  };
  reviewer_expertise: {
    Row: ReviewerExpertise;
    Insert: Omit<ReviewerExpertise, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<ReviewerExpertise, 'id' | 'created_at' | 'updated_at'>>;
  };
  review_scores: {
    Row: ReviewScore;
    Insert: Omit<ReviewScore, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<ReviewScore, 'id' | 'created_at' | 'updated_at'>>;
  };
}

// Utility Types for API Responses
export interface ProgramReviewStats {
  total_applications: number;
  applications_reviewed: number;
  applications_pending_review: number;
  average_score: number | null;
  total_reviewers: number;
  reviews_completed: number;
  reviews_pending: number;
}

export interface ReviewerWorkload {
  program_id: string;
  program_title: string;
  total_assigned: number;
  completed: number;
  pending: number;
  deadline: string | null;
  average_score: number | null;
}

export interface ApplicationRanking {
  application_id: string;
  applicant_name: string;
  average_score: number | null;
  review_count: number;
  consensus_score: number | null;
  rank: number;
}

// Form Types for UI Components
export interface CreateReviewSettingsForm {
  program_id: string;
  min_reviews_per_application: number;
  max_reviews_per_application: number;
  min_reviews_per_reviewer?: number;
  max_reviews_per_reviewer?: number;
  scoring_method: ScoringMethod;
  requires_consensus: boolean;
  consensus_threshold: number;
  blind_review: boolean;
  allow_reviewer_comments: boolean;
  require_strengths_weaknesses: boolean;
  enable_score_normalization: boolean;
  acceptance_threshold?: number;
  rejection_threshold?: number;
  waitlist_threshold?: number;
  template_id?: string;
  custom_instructions?: string;
}

export interface CreateReviewCriteriaForm {
  program_id: string;
  name: string;
  description?: string;
  scoring_type: ScoringType;
  weight: number;
  max_score: number;
  min_score: number;
  sort_order: number;
  rubric_definition: Record<string, any>;
  scoring_guide?: string;
  is_required: boolean;
}

export interface SubmitReviewScoreForm {
  review_id: string;
  criteria_id: string;
  raw_score: number;
  rubric_level?: string;
  score_rationale?: string;
  reviewer_confidence?: number;
}

// Service Layer Types
export interface ReviewService {
  // Template operations
  getTemplates(): Promise<ReviewCriteriaTemplate[]>;
  getTemplate(id: string): Promise<ReviewCriteriaTemplate | null>;
  createTemplate(template: Omit<ReviewCriteriaTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ReviewCriteriaTemplate>;
  
  // Settings operations
  getProgramReviewSettings(programId: string): Promise<ReviewSettings | null>;
  updateReviewSettings(programId: string, settings: Partial<ReviewSettings>): Promise<ReviewSettings>;
  
  // Criteria operations
  getProgramCriteria(programId: string): Promise<ReviewCriteria[]>;
  createCriteria(criteria: CreateReviewCriteriaForm): Promise<ReviewCriteria>;
  updateCriteria(id: string, updates: Partial<ReviewCriteria>): Promise<ReviewCriteria>;
  deleteCriteria(id: string): Promise<void>;
  
  // Scoring operations
  submitScores(scores: SubmitReviewScoreForm[]): Promise<ReviewScore[]>;
  getReviewScores(reviewId: string): Promise<ReviewScore[]>;
  
  // Statistics and reporting
  getProgramStats(programId: string): Promise<ProgramReviewStats>;
  getReviewerWorkload(reviewerId: string): Promise<ReviewerWorkload[]>;
  getApplicationRanking(programId: string): Promise<ApplicationRanking[]>;
  
  // Utility functions
  applyTemplate(programId: string, templateId: string): Promise<number>;
  autoAssignReviewers(programId: string, requiredReviewers?: number): Promise<number>;
  calculateConsensus(applicationId: string): Promise<number | null>;
}