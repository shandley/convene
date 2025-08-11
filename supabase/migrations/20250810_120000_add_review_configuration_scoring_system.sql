-- Phase 1: Review Configuration & Scoring System Migration
-- This migration adds comprehensive review configuration and scoring capabilities
-- Created: 2025-08-10

-- Create new ENUM types for the review system
CREATE TYPE scoring_type AS ENUM (
    'numerical',      -- 1-10 or 1-5 scale
    'categorical',    -- excellent/good/fair/poor
    'binary',         -- yes/no or pass/fail
    'rubric',         -- detailed rubric with levels
    'weighted'        -- weighted scoring with factors
);

CREATE TYPE scoring_method AS ENUM (
    'average',        -- Simple average of all reviews
    'weighted_average', -- Weighted average based on reviewer expertise
    'median',         -- Median score across reviews
    'consensus',      -- Requires consensus among reviewers
    'holistic'        -- Overall holistic assessment
);

CREATE TYPE expertise_level AS ENUM (
    'beginner',
    'intermediate', 
    'advanced',
    'expert'
);

CREATE TYPE template_category AS ENUM (
    'workshop',
    'conference',
    'hackathon',
    'bootcamp',
    'seminar',
    'retreat',
    'certification',
    'competition',
    'fellowship',
    'residency'
);

-- Table 1: review_criteria_templates
-- Pre-built rubric templates for common program types
CREATE TABLE review_criteria_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category template_category NOT NULL,
    is_active BOOLEAN DEFAULT true,
    criteria_definition JSONB NOT NULL DEFAULT '[]',
    total_max_score INTEGER NOT NULL DEFAULT 100,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_criteria_definition CHECK (jsonb_typeof(criteria_definition) = 'array'),
    CONSTRAINT positive_max_score CHECK (total_max_score > 0)
);

-- Table 2: review_settings
-- Program-level review configuration (one-to-one with programs)
CREATE TABLE review_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Review assignment settings
    min_reviews_per_application INTEGER NOT NULL DEFAULT 2,
    max_reviews_per_application INTEGER NOT NULL DEFAULT 4,
    min_reviews_per_reviewer INTEGER DEFAULT 1,
    max_reviews_per_reviewer INTEGER DEFAULT 10,
    
    -- Scoring configuration
    scoring_method scoring_method NOT NULL DEFAULT 'average',
    requires_consensus BOOLEAN DEFAULT false,
    consensus_threshold NUMERIC(3,2) DEFAULT 0.75, -- 75% agreement threshold
    
    -- Review process settings
    blind_review BOOLEAN DEFAULT false,
    allow_reviewer_comments BOOLEAN DEFAULT true,
    require_strengths_weaknesses BOOLEAN DEFAULT true,
    enable_score_normalization BOOLEAN DEFAULT false,
    
    -- Thresholds and cutoffs
    acceptance_threshold NUMERIC(5,2), -- Minimum score for acceptance
    rejection_threshold NUMERIC(5,2),  -- Below this score = automatic rejection
    waitlist_threshold NUMERIC(5,2),   -- Scores between rejection and acceptance
    
    -- Template and rubric
    template_id UUID REFERENCES review_criteria_templates(id) ON DELETE SET NULL,
    custom_instructions TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_program_review_settings UNIQUE(program_id),
    CONSTRAINT valid_review_counts CHECK (
        min_reviews_per_application <= max_reviews_per_application AND
        min_reviews_per_application > 0 AND
        max_reviews_per_application > 0
    ),
    CONSTRAINT valid_reviewer_limits CHECK (
        (min_reviews_per_reviewer IS NULL OR min_reviews_per_reviewer > 0) AND
        (max_reviews_per_reviewer IS NULL OR max_reviews_per_reviewer > 0) AND
        (min_reviews_per_reviewer IS NULL OR max_reviews_per_reviewer IS NULL OR 
         min_reviews_per_reviewer <= max_reviews_per_reviewer)
    ),
    CONSTRAINT valid_consensus_threshold CHECK (
        consensus_threshold >= 0.5 AND consensus_threshold <= 1.0
    ),
    CONSTRAINT valid_thresholds CHECK (
        (acceptance_threshold IS NULL OR acceptance_threshold >= 0) AND
        (rejection_threshold IS NULL OR rejection_threshold >= 0) AND
        (waitlist_threshold IS NULL OR waitlist_threshold >= 0) AND
        (acceptance_threshold IS NULL OR rejection_threshold IS NULL OR 
         acceptance_threshold > rejection_threshold)
    )
);

-- Table 3: review_criteria
-- Stores scoring criteria and rubrics for each program
CREATE TABLE review_criteria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Criteria definition
    name TEXT NOT NULL,
    description TEXT,
    scoring_type scoring_type NOT NULL DEFAULT 'numerical',
    weight NUMERIC(3,2) NOT NULL DEFAULT 1.00, -- Weight in final score calculation
    max_score INTEGER NOT NULL DEFAULT 10,
    min_score INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Rubric and scoring guide
    rubric_definition JSONB NOT NULL DEFAULT '{}',
    scoring_guide TEXT,
    is_required BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_weight CHECK (weight >= 0 AND weight <= 100),
    CONSTRAINT valid_score_range CHECK (max_score > min_score AND min_score >= 0),
    CONSTRAINT valid_rubric_definition CHECK (jsonb_typeof(rubric_definition) = 'object')
);

-- Table 4: reviewer_expertise
-- Tracks reviewer qualifications and experience areas
CREATE TABLE reviewer_expertise (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Expertise information
    expertise_area TEXT NOT NULL,
    proficiency_level expertise_level NOT NULL DEFAULT 'intermediate',
    years_of_experience INTEGER,
    specialization_tags TEXT[] DEFAULT '{}',
    
    -- Verification and credibility
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verification_date TIMESTAMPTZ,
    verification_notes TEXT,
    
    -- Performance tracking
    total_reviews_completed INTEGER DEFAULT 0,
    average_review_quality_score NUMERIC(3,2),
    reliability_score NUMERIC(3,2) DEFAULT 5.0, -- 1-10 scale
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_experience_years CHECK (years_of_experience IS NULL OR years_of_experience >= 0),
    CONSTRAINT valid_quality_score CHECK (
        average_review_quality_score IS NULL OR 
        (average_review_quality_score >= 0 AND average_review_quality_score <= 10)
    ),
    CONSTRAINT valid_reliability_score CHECK (
        reliability_score >= 1 AND reliability_score <= 10
    ),
    CONSTRAINT unique_reviewer_expertise UNIQUE(reviewer_id, expertise_area)
);

-- Table 5: review_scores
-- Stores individual criterion scores for each review
CREATE TABLE review_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES review_criteria(id) ON DELETE CASCADE,
    
    -- Score information
    raw_score NUMERIC(5,2) NOT NULL,
    normalized_score NUMERIC(5,2), -- Normalized to 0-100 scale
    weight_applied NUMERIC(3,2) DEFAULT 1.00,
    weighted_score NUMERIC(5,2), -- raw_score * weight_applied
    
    -- Additional scoring data
    rubric_level TEXT, -- Which rubric level was selected
    score_rationale TEXT,
    reviewer_confidence NUMERIC(3,2), -- 0-100% confidence in this score
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_review_criteria_score UNIQUE(review_id, criteria_id),
    CONSTRAINT valid_raw_score CHECK (raw_score >= 0),
    CONSTRAINT valid_normalized_score CHECK (
        normalized_score IS NULL OR (normalized_score >= 0 AND normalized_score <= 100)
    ),
    CONSTRAINT valid_weight CHECK (weight_applied >= 0 AND weight_applied <= 100),
    CONSTRAINT valid_confidence CHECK (
        reviewer_confidence IS NULL OR (reviewer_confidence >= 0 AND reviewer_confidence <= 100)
    )
);

-- Create indexes for performance
CREATE INDEX idx_review_criteria_templates_category ON review_criteria_templates(category);
CREATE INDEX idx_review_criteria_templates_active ON review_criteria_templates(is_active);

CREATE INDEX idx_review_settings_program ON review_settings(program_id);
CREATE INDEX idx_review_settings_template ON review_settings(template_id);

CREATE INDEX idx_review_criteria_program ON review_criteria(program_id);
CREATE INDEX idx_review_criteria_sort_order ON review_criteria(program_id, sort_order);

CREATE INDEX idx_reviewer_expertise_reviewer ON reviewer_expertise(reviewer_id);
CREATE INDEX idx_reviewer_expertise_area ON reviewer_expertise(expertise_area);
CREATE INDEX idx_reviewer_expertise_level ON reviewer_expertise(proficiency_level);

CREATE INDEX idx_review_scores_review ON review_scores(review_id);
CREATE INDEX idx_review_scores_criteria ON review_scores(criteria_id);

-- Create functions for score calculations
CREATE OR REPLACE FUNCTION calculate_application_weighted_score(application_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_weighted_score NUMERIC := 0;
    total_weight NUMERIC := 0;
    review_record RECORD;
    review_score NUMERIC := 0;
    review_weight NUMERIC := 0;
BEGIN
    -- Calculate weighted average across all reviews for this application
    FOR review_record IN
        SELECT r.id as review_id
        FROM reviews r
        JOIN review_assignments ra ON r.assignment_id = ra.id
        WHERE ra.application_id = application_id_param
        AND ra.status = 'completed'
    LOOP
        -- Calculate this review's weighted score
        SELECT 
            COALESCE(SUM(rs.weighted_score), 0),
            COALESCE(SUM(rc.weight), 0)
        INTO review_score, review_weight
        FROM review_scores rs
        JOIN review_criteria rc ON rs.criteria_id = rc.id
        WHERE rs.review_id = review_record.review_id;
        
        -- Add to totals
        total_weighted_score := total_weighted_score + review_score;
        total_weight := total_weight + review_weight;
    END LOOP;
    
    -- Return weighted average (avoid division by zero)
    IF total_weight > 0 THEN
        RETURN total_weighted_score / total_weight;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_application_scores()
RETURNS TRIGGER AS $$
DECLARE
    target_application_id UUID;
BEGIN
    -- Get the application ID for this review
    SELECT ra.application_id INTO target_application_id
    FROM review_assignments ra 
    JOIN reviews r ON r.assignment_id = ra.id 
    WHERE r.id = COALESCE(NEW.review_id, OLD.review_id);
    
    -- Update the application's average score and review count
    UPDATE applications
    SET 
        average_score = calculate_application_weighted_score(target_application_id),
        review_count = (
            SELECT COUNT(DISTINCT r.id)
            FROM reviews r
            JOIN review_assignments ra ON r.assignment_id = ra.id
            WHERE ra.application_id = target_application_id
            AND ra.status = 'completed'
        )
    WHERE id = target_application_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update application scores
CREATE TRIGGER trigger_update_application_scores
    AFTER INSERT OR UPDATE OR DELETE ON review_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_application_scores();

-- Update the updated_at timestamp for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_criteria_templates_updated_at 
    BEFORE UPDATE ON review_criteria_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_settings_updated_at 
    BEFORE UPDATE ON review_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_criteria_updated_at 
    BEFORE UPDATE ON review_criteria 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviewer_expertise_updated_at 
    BEFORE UPDATE ON reviewer_expertise 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_scores_updated_at 
    BEFORE UPDATE ON review_scores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();