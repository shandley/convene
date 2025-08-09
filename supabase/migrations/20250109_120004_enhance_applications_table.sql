-- Migration: Enhance Applications Table
-- Description: Updates the applications table with additional fields for better tracking and workflow management
-- Created: 2025-01-09

-- Add new columns to the applications table
ALTER TABLE applications 
    -- Draft vs submitted tracking
    ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS draft_saved_at TIMESTAMPTZ DEFAULT now(),
    
    -- Enhanced status tracking
    ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS completion_percentage NUMERIC(5,2) DEFAULT 0.00,
    
    -- Withdrawal tracking
    ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT,
    ADD COLUMN IF NOT EXISTS withdrawal_comments TEXT,
    
    -- Review and scoring
    ADD COLUMN IF NOT EXISTS average_score NUMERIC(3,2),              -- Average of all review scores
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,           -- Number of completed reviews
    ADD COLUMN IF NOT EXISTS review_consensus TEXT,                    -- Overall reviewer recommendation
    
    -- Decision tracking  
    ADD COLUMN IF NOT EXISTS decision_reason TEXT,                     -- Reason for acceptance/rejection
    ADD COLUMN IF NOT EXISTS decided_by UUID REFERENCES profiles(id),  -- Who made the final decision
    ADD COLUMN IF NOT EXISTS decision_comments TEXT,                   -- Additional decision comments
    
    -- Waitlist management
    ADD COLUMN IF NOT EXISTS waitlist_position INTEGER,               -- Position on waitlist
    ADD COLUMN IF NOT EXISTS waitlisted_at TIMESTAMPTZ,              -- When moved to waitlist
    
    -- Communication tracking
    ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ,         -- Last automated email timestamp
    ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{}',    -- Email notification preferences
    
    -- Legacy response migration flag
    ADD COLUMN IF NOT EXISTS responses_migrated BOOLEAN DEFAULT false; -- Track migration from JSONB to normalized responses

-- Add constraints
ALTER TABLE applications 
    ADD CONSTRAINT IF NOT EXISTS check_completion_percentage 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    ADD CONSTRAINT IF NOT EXISTS check_average_score 
    CHECK (average_score IS NULL OR (average_score >= 1 AND average_score <= 5)),
    
    ADD CONSTRAINT IF NOT EXISTS check_review_count_positive 
    CHECK (review_count >= 0),
    
    ADD CONSTRAINT IF NOT EXISTS check_waitlist_position_positive 
    CHECK (waitlist_position IS NULL OR waitlist_position > 0),
    
    ADD CONSTRAINT IF NOT EXISTS check_draft_vs_submitted_consistency 
    CHECK (
        (is_draft = true AND submitted_at IS NULL) OR
        (is_draft = false AND submitted_at IS NOT NULL)
    );

-- Update existing records to have consistent draft status
UPDATE applications 
SET is_draft = (submitted_at IS NULL)
WHERE is_draft IS NULL;

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_draft_status 
    ON applications(program_id, is_draft);

CREATE INDEX IF NOT EXISTS idx_applications_completion 
    ON applications(program_id, completion_percentage DESC) 
    WHERE is_draft = false;

CREATE INDEX IF NOT EXISTS idx_applications_average_score 
    ON applications(program_id, average_score DESC NULLS LAST) 
    WHERE status = 'under_review';

CREATE INDEX IF NOT EXISTS idx_applications_review_count 
    ON applications(program_id, review_count);

CREATE INDEX IF NOT EXISTS idx_applications_waitlist 
    ON applications(program_id, waitlist_position) 
    WHERE status = 'waitlisted';

CREATE INDEX IF NOT EXISTS idx_applications_last_modified 
    ON applications(program_id, last_modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_decided_by 
    ON applications(decided_by);

-- Update the updated_at trigger to also update last_modified_at
CREATE OR REPLACE FUNCTION update_applications_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.last_modified_at = now();
    
    -- Update draft_saved_at only if still a draft
    IF NEW.is_draft = true THEN
        NEW.draft_saved_at = now();
    END IF;
    
    -- Set submitted_at when transitioning from draft to submitted
    IF OLD.is_draft = true AND NEW.is_draft = false AND NEW.submitted_at IS NULL THEN
        NEW.submitted_at = now();
    END IF;
    
    -- Set decided_at when status changes to a decision status
    IF OLD.status != NEW.status AND NEW.status IN ('accepted', 'rejected') AND NEW.decided_at IS NULL THEN
        NEW.decided_at = now();
        IF NEW.decided_by IS NULL THEN
            NEW.decided_by = auth.uid();
        END IF;
    END IF;
    
    -- Set waitlisted_at when status changes to waitlisted
    IF OLD.status != NEW.status AND NEW.status = 'waitlisted' AND NEW.waitlisted_at IS NULL THEN
        NEW.waitlisted_at = now();
    END IF;
    
    -- Set withdrawn_at when status changes to withdrawn
    IF OLD.status != NEW.status AND NEW.status = 'withdrawn' AND NEW.withdrawn_at IS NULL THEN
        NEW.withdrawn_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS applications_updated_at ON applications;
CREATE TRIGGER applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_applications_timestamps();

-- Function to calculate completion percentage
CREATE OR REPLACE FUNCTION calculate_application_completion(app_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_required INTEGER;
    completed_required INTEGER;
    completion_pct NUMERIC;
BEGIN
    -- Count total required questions for this application's program
    SELECT COUNT(*) INTO total_required
    FROM application_questions aq
    JOIN applications a ON a.program_id = aq.program_id
    WHERE a.id = app_id AND aq.required = true;
    
    -- Count completed required responses
    SELECT COUNT(*) INTO completed_required
    FROM application_responses ar
    JOIN application_questions aq ON aq.id = ar.question_id
    JOIN applications a ON a.id = ar.application_id
    WHERE ar.application_id = app_id 
    AND aq.required = true 
    AND ar.is_current = true 
    AND ar.is_complete = true;
    
    -- Calculate percentage
    IF total_required = 0 THEN
        completion_pct := 100.00;
    ELSE
        completion_pct := ROUND((completed_required * 100.0 / total_required), 2);
    END IF;
    
    -- Update the application record
    UPDATE applications 
    SET completion_percentage = completion_pct
    WHERE id = app_id;
    
    RETURN completion_pct;
END;
$$ language 'plpgsql';

-- Function to update review statistics
CREATE OR REPLACE FUNCTION update_application_review_stats(app_id UUID)
RETURNS void AS $$
DECLARE
    avg_score NUMERIC;
    review_cnt INTEGER;
    consensus TEXT;
BEGIN
    -- Calculate average score and count
    SELECT 
        AVG(r.overall_score),
        COUNT(r.id)
    INTO avg_score, review_cnt
    FROM reviews r
    JOIN review_assignments ra ON ra.id = r.assignment_id
    WHERE ra.application_id = app_id AND r.overall_score IS NOT NULL;
    
    -- Determine consensus (simplified logic)
    SELECT 
        CASE 
            WHEN AVG(r.overall_score) >= 4.0 THEN 'recommend'
            WHEN AVG(r.overall_score) >= 3.0 THEN 'conditional'
            ELSE 'not_recommend'
        END
    INTO consensus
    FROM reviews r
    JOIN review_assignments ra ON ra.id = r.assignment_id
    WHERE ra.application_id = app_id AND r.overall_score IS NOT NULL;
    
    -- Update application
    UPDATE applications 
    SET 
        average_score = ROUND(avg_score, 2),
        review_count = review_cnt,
        review_consensus = consensus
    WHERE id = app_id;
END;
$$ language 'plpgsql';

-- Trigger to update completion percentage when responses change
CREATE OR REPLACE FUNCTION trigger_completion_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update completion for the relevant application
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_application_completion(OLD.application_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_application_completion(NEW.application_id);
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_completion_on_response_change
    AFTER INSERT OR UPDATE OR DELETE ON application_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_completion_update();

-- Function to migrate legacy JSONB responses to normalized table
CREATE OR REPLACE FUNCTION migrate_application_responses(app_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    app_record applications;
    question_record application_questions;
    response_key TEXT;
    response_value JSONB;
    migrated_count INTEGER := 0;
BEGIN
    -- Loop through applications (single app if specified, all if not)
    FOR app_record IN 
        SELECT * FROM applications 
        WHERE (app_id IS NULL OR id = app_id)
        AND responses_migrated = false
        AND responses IS NOT NULL 
        AND jsonb_typeof(responses) = 'object'
    LOOP
        -- Loop through each response in the JSONB
        FOR response_key, response_value IN 
            SELECT key, value FROM jsonb_each(app_record.responses)
        LOOP
            -- Find the corresponding question
            SELECT * INTO question_record
            FROM application_questions 
            WHERE id = response_key::UUID
            AND program_id = app_record.program_id;
            
            IF FOUND THEN
                -- Insert normalized response based on question type
                INSERT INTO application_responses (
                    application_id, 
                    question_id,
                    response_text,
                    response_number,
                    response_date,
                    response_boolean,
                    response_json,
                    response_file_urls,
                    value_type,
                    version,
                    is_current
                ) VALUES (
                    app_record.id,
                    question_record.id,
                    CASE 
                        WHEN question_record.question_type IN ('text', 'textarea', 'email', 'url', 'phone') 
                        THEN response_value #>> '{}'
                        ELSE NULL
                    END,
                    CASE 
                        WHEN question_record.question_type = 'number' 
                        THEN (response_value #>> '{}')::NUMERIC
                        ELSE NULL
                    END,
                    CASE 
                        WHEN question_record.question_type = 'date' 
                        THEN (response_value #>> '{}')::DATE
                        ELSE NULL
                    END,
                    CASE 
                        WHEN question_record.question_type = 'checkbox' 
                        THEN (response_value #>> '{}')::BOOLEAN
                        ELSE NULL
                    END,
                    CASE 
                        WHEN question_record.question_type IN ('multi_select') 
                        THEN response_value
                        ELSE NULL
                    END,
                    CASE 
                        WHEN question_record.question_type = 'file' 
                        THEN ARRAY[response_value #>> '{}']
                        ELSE NULL
                    END,
                    CASE 
                        WHEN question_record.question_type IN ('text', 'textarea', 'email', 'url', 'phone') 
                        THEN 'text'::response_value_type
                        WHEN question_record.question_type = 'number' 
                        THEN 'number'::response_value_type
                        WHEN question_record.question_type = 'date' 
                        THEN 'date'::response_value_type
                        WHEN question_record.question_type = 'checkbox' 
                        THEN 'boolean'::response_value_type
                        WHEN question_record.question_type IN ('multi_select') 
                        THEN 'json'::response_value_type
                        WHEN question_record.question_type = 'file' 
                        THEN 'file_url'::response_value_type
                        ELSE 'text'::response_value_type
                    END,
                    1,
                    true
                );
                
                migrated_count := migrated_count + 1;
            END IF;
        END LOOP;
        
        -- Mark application as migrated
        UPDATE applications 
        SET responses_migrated = true 
        WHERE id = app_record.id;
        
        -- Update completion percentage
        PERFORM calculate_application_completion(app_record.id);
    END LOOP;
    
    RETURN migrated_count;
END;
$$ language 'plpgsql';

-- Add helpful comments
COMMENT ON COLUMN applications.is_draft IS 'Whether the application is still being drafted (true) or has been submitted (false)';
COMMENT ON COLUMN applications.completion_percentage IS 'Percentage of required questions completed (0-100)';
COMMENT ON COLUMN applications.review_consensus IS 'Overall reviewer recommendation: recommend, conditional, not_recommend';
COMMENT ON COLUMN applications.waitlist_position IS 'Position on the waitlist (1 = first in line)';
COMMENT ON COLUMN applications.email_preferences IS 'JSON object with email notification preferences';
COMMENT ON COLUMN applications.responses_migrated IS 'Flag indicating whether legacy JSONB responses have been migrated to normalized table';

COMMENT ON FUNCTION calculate_application_completion(UUID) IS 'Calculates and updates the completion percentage for an application based on required questions';
COMMENT ON FUNCTION migrate_application_responses(UUID) IS 'Migrates legacy JSONB responses to the normalized application_responses table';