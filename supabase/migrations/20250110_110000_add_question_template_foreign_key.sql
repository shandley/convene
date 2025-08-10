-- Migration: Add Foreign Key for Question Templates
-- Description: Adds foreign key constraint between application_questions.template_id and question_templates.id
-- Created: 2025-01-10

-- Add foreign key constraint for template_id
ALTER TABLE application_questions 
ADD CONSTRAINT application_questions_template_id_fkey 
FOREIGN KEY (template_id) REFERENCES question_templates(id) ON DELETE SET NULL;

-- Add index for performance on template lookups
CREATE INDEX IF NOT EXISTS idx_application_questions_template_id 
    ON application_questions(template_id);

-- Add helpful comment
COMMENT ON COLUMN application_questions.template_id IS 'Reference to question_templates.id for reusable question templates';