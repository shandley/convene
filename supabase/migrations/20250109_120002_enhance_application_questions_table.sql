-- Migration: Enhance Application Questions Table
-- Description: Updates the existing application_questions table with additional fields for enhanced functionality
-- Created: 2025-01-09

-- First, let's add the new columns to the existing application_questions table
ALTER TABLE application_questions 
    -- Add category reference
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES question_categories(id) ON DELETE SET NULL,
    
    -- Enhance question configuration
    ADD COLUMN IF NOT EXISTS help_text TEXT,                    -- Additional guidance for the applicant
    ADD COLUMN IF NOT EXISTS placeholder TEXT,                  -- Placeholder text for form fields
    ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}',  -- JSON validation rules (min/max, regex, etc.)
    
    -- File upload specific fields
    ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[],         -- Allowed MIME types for file questions
    ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER,          -- Maximum file size in MB
    ADD COLUMN IF NOT EXISTS max_files INTEGER DEFAULT 1,      -- Maximum number of files for multi-file uploads
    
    -- Selection fields (for select/multi_select)
    ADD COLUMN IF NOT EXISTS allow_other BOOLEAN DEFAULT false, -- Allow "Other" option with text input
    ADD COLUMN IF NOT EXISTS randomize_options BOOLEAN DEFAULT false, -- Randomize option order
    
    -- Conditional logic (for future enhancement)
    ADD COLUMN IF NOT EXISTS depends_on_question_id UUID REFERENCES application_questions(id),
    ADD COLUMN IF NOT EXISTS show_condition JSONB,             -- Condition for when to show this question
    
    -- Enhanced metadata
    ADD COLUMN IF NOT EXISTS is_system_question BOOLEAN DEFAULT false, -- System questions cannot be deleted
    ADD COLUMN IF NOT EXISTS template_id UUID,                 -- Reference to question template (future)
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update the question_type column to use the enum (if not already done)
-- We'll do this safely by creating a new column and migrating data
DO $$
BEGIN
    -- Check if question_type is already the enum type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'application_questions' 
        AND column_name = 'question_type'
        AND udt_name = 'question_type'
    ) THEN
        -- Add new enum column
        ALTER TABLE application_questions 
        ADD COLUMN question_type_enum question_type;
        
        -- Migrate existing data to enum values
        UPDATE application_questions SET question_type_enum = 
            CASE 
                WHEN question_type = 'text' THEN 'text'::question_type
                WHEN question_type = 'textarea' THEN 'textarea'::question_type
                WHEN question_type = 'select' THEN 'select'::question_type
                WHEN question_type = 'multi_select' THEN 'multi_select'::question_type
                WHEN question_type = 'checkbox' THEN 'checkbox'::question_type
                WHEN question_type = 'file' THEN 'file'::question_type
                WHEN question_type = 'number' THEN 'number'::question_type
                WHEN question_type = 'date' THEN 'date'::question_type
                WHEN question_type = 'email' THEN 'email'::question_type
                WHEN question_type = 'url' THEN 'url'::question_type
                WHEN question_type = 'phone' THEN 'phone'::question_type
                ELSE 'text'::question_type
            END;
            
        -- Drop old column and rename new one
        ALTER TABLE application_questions DROP COLUMN question_type;
        ALTER TABLE application_questions RENAME COLUMN question_type_enum TO question_type;
        ALTER TABLE application_questions ALTER COLUMN question_type SET NOT NULL;
    END IF;
END $$;

-- Add check constraints for validation
ALTER TABLE application_questions 
    ADD CONSTRAINT IF NOT EXISTS check_max_length_positive 
    CHECK (max_length IS NULL OR max_length > 0),
    
    ADD CONSTRAINT IF NOT EXISTS check_max_file_size_positive 
    CHECK (max_file_size_mb IS NULL OR max_file_size_mb > 0),
    
    ADD CONSTRAINT IF NOT EXISTS check_max_files_positive 
    CHECK (max_files IS NULL OR max_files > 0),
    
    ADD CONSTRAINT IF NOT EXISTS check_file_type_requirements
    CHECK (
        question_type != 'file' OR (
            allowed_file_types IS NOT NULL 
            AND max_file_size_mb IS NOT NULL
        )
    );

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_questions_category 
    ON application_questions(category_id);

CREATE INDEX IF NOT EXISTS idx_application_questions_program_category_order 
    ON application_questions(program_id, category_id, order_index);

CREATE INDEX IF NOT EXISTS idx_application_questions_type 
    ON application_questions(question_type);

CREATE INDEX IF NOT EXISTS idx_application_questions_required 
    ON application_questions(program_id, required);

CREATE INDEX IF NOT EXISTS idx_application_questions_depends_on 
    ON application_questions(depends_on_question_id);

CREATE INDEX IF NOT EXISTS idx_application_questions_system 
    ON application_questions(program_id, is_system_question);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_application_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS application_questions_updated_at ON application_questions;
CREATE TRIGGER application_questions_updated_at
    BEFORE UPDATE ON application_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_application_questions_updated_at();

-- Function to validate question configuration based on type
CREATE OR REPLACE FUNCTION validate_question_configuration()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate file upload questions have required fields
    IF NEW.question_type = 'file' THEN
        IF NEW.allowed_file_types IS NULL OR array_length(NEW.allowed_file_types, 1) = 0 THEN
            RAISE EXCEPTION 'File questions must specify allowed_file_types';
        END IF;
        IF NEW.max_file_size_mb IS NULL OR NEW.max_file_size_mb <= 0 THEN
            RAISE EXCEPTION 'File questions must specify max_file_size_mb > 0';
        END IF;
    END IF;
    
    -- Validate select questions have options
    IF NEW.question_type IN ('select', 'multi_select') THEN
        IF NEW.options IS NULL OR jsonb_array_length(NEW.options) = 0 THEN
            RAISE EXCEPTION 'Select questions must have options defined';
        END IF;
    END IF;
    
    -- Validate number questions don't have conflicting validation
    IF NEW.question_type = 'number' THEN
        IF NEW.max_length IS NOT NULL THEN
            RAISE EXCEPTION 'Number questions should not have max_length, use validation_rules instead';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS validate_question_configuration_trigger ON application_questions;
CREATE TRIGGER validate_question_configuration_trigger
    BEFORE INSERT OR UPDATE ON application_questions
    FOR EACH ROW
    EXECUTE FUNCTION validate_question_configuration();

-- Add helpful comments
COMMENT ON COLUMN application_questions.category_id IS 'Groups questions into logical sections for better UX';
COMMENT ON COLUMN application_questions.validation_rules IS 'JSON object with validation rules like {"min": 10, "max": 500, "regex": "pattern"}';
COMMENT ON COLUMN application_questions.allowed_file_types IS 'Array of allowed MIME types, e.g., {"application/pdf", "image/jpeg"}';
COMMENT ON COLUMN application_questions.show_condition IS 'JSON condition for conditional questions, e.g., {"question_id": "uuid", "operator": "equals", "value": "yes"}';
COMMENT ON COLUMN application_questions.is_system_question IS 'System questions are required by the platform and cannot be deleted by program admins';
COMMENT ON COLUMN application_questions.template_id IS 'Future: Reference to reusable question templates';