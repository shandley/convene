-- Migration: Create Application Responses Table
-- Description: Creates a normalized table for storing individual question responses with type safety and history
-- Created: 2025-01-09

-- Create application_responses table for normalized response storage
-- This replaces the JSONB responses column in applications for better data integrity and querying
CREATE TABLE IF NOT EXISTS application_responses (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    
    -- Foreign keys
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES application_questions(id) ON DELETE CASCADE,
    
    -- Response data with type safety
    response_text TEXT,                             -- Text responses (text, textarea, email, url, phone)
    response_number NUMERIC,                        -- Numeric responses
    response_date DATE,                             -- Date responses
    response_boolean BOOLEAN,                       -- Boolean responses (checkbox)
    response_json JSONB,                            -- Complex responses (multi_select, file metadata)
    response_file_urls TEXT[],                      -- File upload URLs
    
    -- Response metadata
    value_type response_value_type NOT NULL,        -- Indicates which response field contains the data
    is_complete BOOLEAN DEFAULT false,              -- Whether the response satisfies the question requirements
    
    -- Version tracking for response history
    version INTEGER DEFAULT 1,                     -- Version number for this response
    is_current BOOLEAN DEFAULT true,               -- Whether this is the current/active response
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT application_responses_unique_current 
        UNIQUE (application_id, question_id, is_current) 
        DEFERRABLE INITIALLY DEFERRED,
    
    -- Ensure only one response field is populated based on value_type
    CONSTRAINT response_value_consistency CHECK (
        (value_type = 'text' AND response_text IS NOT NULL AND 
         response_number IS NULL AND response_date IS NULL AND 
         response_boolean IS NULL AND response_json IS NULL AND response_file_urls IS NULL)
        OR
        (value_type = 'number' AND response_number IS NOT NULL AND 
         response_text IS NULL AND response_date IS NULL AND 
         response_boolean IS NULL AND response_json IS NULL AND response_file_urls IS NULL)
        OR
        (value_type = 'date' AND response_date IS NOT NULL AND 
         response_text IS NULL AND response_number IS NULL AND 
         response_boolean IS NULL AND response_json IS NULL AND response_file_urls IS NULL)
        OR
        (value_type = 'boolean' AND response_boolean IS NOT NULL AND 
         response_text IS NULL AND response_number IS NULL AND 
         response_date IS NULL AND response_json IS NULL AND response_file_urls IS NULL)
        OR
        (value_type = 'json' AND response_json IS NOT NULL AND 
         response_text IS NULL AND response_number IS NULL AND 
         response_date IS NULL AND response_boolean IS NULL AND response_file_urls IS NULL)
        OR
        (value_type = 'file_url' AND response_file_urls IS NOT NULL AND 
         response_text IS NULL AND response_number IS NULL AND 
         response_date IS NULL AND response_boolean IS NULL AND response_json IS NULL)
    ),
    
    -- Version must be positive
    CONSTRAINT positive_version CHECK (version > 0),
    
    -- Only current responses can have is_current = true per application/question combo
    CONSTRAINT single_current_response 
        EXCLUDE (application_id WITH =, question_id WITH =) 
        WHERE (is_current = true)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_application_responses_application 
    ON application_responses(application_id);

CREATE INDEX IF NOT EXISTS idx_application_responses_question 
    ON application_responses(question_id);

CREATE INDEX IF NOT EXISTS idx_application_responses_current 
    ON application_responses(application_id, question_id) 
    WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_application_responses_complete 
    ON application_responses(application_id, is_complete) 
    WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_application_responses_value_type 
    ON application_responses(value_type);

CREATE INDEX IF NOT EXISTS idx_application_responses_updated 
    ON application_responses(updated_at DESC);

-- Partial indexes for different value types to optimize queries
CREATE INDEX IF NOT EXISTS idx_application_responses_text 
    ON application_responses(application_id, question_id, response_text) 
    WHERE value_type = 'text' AND is_current = true;

CREATE INDEX IF NOT EXISTS idx_application_responses_number 
    ON application_responses(application_id, question_id, response_number) 
    WHERE value_type = 'number' AND is_current = true;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_application_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER application_responses_updated_at
    BEFORE UPDATE ON application_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_application_responses_updated_at();

-- Function to handle response versioning
CREATE OR REPLACE FUNCTION create_response_version()
RETURNS TRIGGER AS $$
BEGIN
    -- If updating an existing response, create a new version
    IF TG_OP = 'UPDATE' AND OLD.is_current = true THEN
        -- Mark old response as not current
        UPDATE application_responses 
        SET is_current = false 
        WHERE id = OLD.id;
        
        -- Create new version
        NEW.version = OLD.version + 1;
        NEW.is_current = true;
        NEW.created_at = now();
        NEW.updated_at = now();
        
        -- Insert as new record
        INSERT INTO application_responses (
            application_id, question_id, response_text, response_number, 
            response_date, response_boolean, response_json, response_file_urls,
            value_type, is_complete, version, is_current, created_at, updated_at
        ) VALUES (
            NEW.application_id, NEW.question_id, NEW.response_text, NEW.response_number,
            NEW.response_date, NEW.response_boolean, NEW.response_json, NEW.response_file_urls,
            NEW.value_type, NEW.is_complete, NEW.version, NEW.is_current, NEW.created_at, NEW.updated_at
        );
        
        -- Return null to prevent the update of the original record
        RETURN NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER response_versioning
    BEFORE UPDATE ON application_responses
    FOR EACH ROW
    EXECUTE FUNCTION create_response_version();

-- Function to validate response completeness
CREATE OR REPLACE FUNCTION validate_response_completeness()
RETURNS TRIGGER AS $$
DECLARE
    question_record application_questions;
    is_valid BOOLEAN := true;
BEGIN
    -- Get the question details
    SELECT * INTO question_record 
    FROM application_questions 
    WHERE id = NEW.question_id;
    
    -- Check if required question has a valid response
    IF question_record.required THEN
        CASE NEW.value_type
            WHEN 'text' THEN
                is_valid := NEW.response_text IS NOT NULL AND trim(NEW.response_text) != '';
            WHEN 'number' THEN
                is_valid := NEW.response_number IS NOT NULL;
            WHEN 'date' THEN
                is_valid := NEW.response_date IS NOT NULL;
            WHEN 'boolean' THEN
                is_valid := NEW.response_boolean IS NOT NULL;
            WHEN 'json' THEN
                is_valid := NEW.response_json IS NOT NULL AND NEW.response_json != 'null'::jsonb;
            WHEN 'file_url' THEN
                is_valid := NEW.response_file_urls IS NOT NULL AND array_length(NEW.response_file_urls, 1) > 0;
            ELSE
                is_valid := false;
        END CASE;
    END IF;
    
    -- Validate text length constraints
    IF NEW.value_type = 'text' AND question_record.max_length IS NOT NULL THEN
        is_valid := is_valid AND length(NEW.response_text) <= question_record.max_length;
    END IF;
    
    -- Set is_complete based on validation
    NEW.is_complete := is_valid;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_response_completeness_trigger
    BEFORE INSERT OR UPDATE ON application_responses
    FOR EACH ROW
    EXECUTE FUNCTION validate_response_completeness();

-- Enable RLS
ALTER TABLE application_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Applicants can only access their own application responses
CREATE POLICY "Applicants can manage their own responses" ON application_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_responses.application_id 
            AND applications.applicant_id = auth.uid()
        )
    );

-- Program members can view responses for their programs
CREATE POLICY "Program members can view responses" ON application_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN program_members pm ON pm.program_id = a.program_id
            WHERE a.id = application_responses.application_id 
            AND pm.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND 'super_admin' = ANY(profiles.roles)
        )
    );

-- Super admins can do anything
CREATE POLICY "Super admins can manage all responses" ON application_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND 'super_admin' = ANY(profiles.roles)
        )
    );

-- Add helpful comments
COMMENT ON TABLE application_responses IS 'Normalized storage for application responses with versioning and type safety';
COMMENT ON COLUMN application_responses.value_type IS 'Indicates which response column contains the actual data';
COMMENT ON COLUMN application_responses.is_complete IS 'Whether the response meets the question requirements (required, length, etc.)';
COMMENT ON COLUMN application_responses.version IS 'Version number for response history tracking';
COMMENT ON COLUMN application_responses.is_current IS 'Only one response per application/question can be current';
COMMENT ON COLUMN application_responses.response_json IS 'Used for multi-select arrays, file metadata, and other complex data';
COMMENT ON COLUMN application_responses.response_file_urls IS 'Array of file URLs for file upload questions';