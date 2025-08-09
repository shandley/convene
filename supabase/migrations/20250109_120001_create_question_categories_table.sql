-- Migration: Create Question Categories Table
-- Description: Creates a table to organize application questions into logical categories/sections
-- Created: 2025-01-09

-- Create question_categories table
CREATE TABLE IF NOT EXISTS question_categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Category details
    title TEXT NOT NULL,                           -- Display name (e.g., "Personal Information")
    description TEXT,                              -- Optional description for the category
    category_type question_category_type NOT NULL DEFAULT 'custom',
    
    -- Ordering and display
    order_index INTEGER NOT NULL,                  -- Order in which categories appear
    is_visible BOOLEAN NOT NULL DEFAULT true,     -- Whether category is shown to applicants
    
    -- Configuration
    instructions TEXT,                             -- Instructions shown at the top of this section
    required_questions_count INTEGER DEFAULT 0,    -- Number of required questions in this category
    
    -- Conditional display (future enhancement)
    show_condition JSONB,                          -- Conditions for when to show this category
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT positive_order_index CHECK (order_index >= 0),
    CONSTRAINT non_negative_required_count CHECK (required_questions_count >= 0),
    CONSTRAINT unique_program_category_order UNIQUE (program_id, order_index),
    CONSTRAINT unique_program_category_title UNIQUE (program_id, title)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_question_categories_program_id 
    ON question_categories(program_id);

CREATE INDEX IF NOT EXISTS idx_question_categories_program_order 
    ON question_categories(program_id, order_index);

CREATE INDEX IF NOT EXISTS idx_question_categories_type 
    ON question_categories(category_type);

CREATE INDEX IF NOT EXISTS idx_question_categories_visible 
    ON question_categories(program_id, is_visible, order_index);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_question_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER question_categories_updated_at
    BEFORE UPDATE ON question_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_question_categories_updated_at();

-- Add RLS policies
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;

-- Program members can view categories for their programs
CREATE POLICY "Program members can view question categories" ON question_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM program_members 
            WHERE program_members.program_id = question_categories.program_id 
            AND program_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND 'super_admin' = ANY(profiles.roles)
        )
    );

-- Program admins and instructors can manage categories
CREATE POLICY "Program admins can manage question categories" ON question_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM program_members 
            WHERE program_members.program_id = question_categories.program_id 
            AND program_members.user_id = auth.uid()
            AND program_members.role IN ('program_admin', 'instructor')
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND 'super_admin' = ANY(profiles.roles)
        )
    );

-- Applicants can view categories for programs with open applications
CREATE POLICY "Applicants can view categories for open programs" ON question_categories
    FOR SELECT USING (
        is_visible = true 
        AND EXISTS (
            SELECT 1 FROM programs 
            WHERE programs.id = question_categories.program_id 
            AND programs.status IN ('published', 'applications_open')
        )
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND 'applicant' = ANY(profiles.roles)
        )
    );

-- Add comments
COMMENT ON TABLE question_categories IS 'Organizes application questions into logical categories/sections for better UX';
COMMENT ON COLUMN question_categories.category_type IS 'Predefined category type for common groupings, or custom for program-specific categories';
COMMENT ON COLUMN question_categories.show_condition IS 'Future: JSON condition for when to display this category based on other responses';
COMMENT ON COLUMN question_categories.required_questions_count IS 'Cached count of required questions in this category for progress tracking';