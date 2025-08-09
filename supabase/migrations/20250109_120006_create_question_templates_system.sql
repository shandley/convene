-- Migration: Create Question Templates System
-- Description: Creates tables for reusable question templates and libraries for common questions
-- Created: 2025-01-09

-- Create question_templates table for reusable questions
CREATE TABLE IF NOT EXISTS question_templates (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    
    -- Template metadata
    title TEXT NOT NULL,                           -- Human-readable template name
    description TEXT,                              -- Description of what this template is for
    category question_category_type NOT NULL DEFAULT 'custom',
    
    -- Question configuration (same as application_questions)
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    help_text TEXT,
    placeholder TEXT,
    
    -- Validation and options
    required BOOLEAN DEFAULT true,
    max_length INTEGER,
    validation_rules JSONB DEFAULT '{}',
    options JSONB,                                 -- For select/multi_select questions
    
    -- File upload specific (for file questions)
    allowed_file_types TEXT[],
    max_file_size_mb INTEGER,
    max_files INTEGER DEFAULT 1,
    
    -- Selection configuration
    allow_other BOOLEAN DEFAULT false,
    randomize_options BOOLEAN DEFAULT false,
    
    -- Template metadata
    is_system_template BOOLEAN DEFAULT false,      -- System templates cannot be deleted
    is_public BOOLEAN DEFAULT false,               -- Public templates can be used by any program
    created_by UUID REFERENCES profiles(id),       -- Template creator
    usage_count INTEGER DEFAULT 0,                 -- How many times template has been used
    
    -- Tags for searchability
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT check_template_max_length_positive 
        CHECK (max_length IS NULL OR max_length > 0),
    CONSTRAINT check_template_max_file_size_positive 
        CHECK (max_file_size_mb IS NULL OR max_file_size_mb > 0),
    CONSTRAINT check_template_max_files_positive 
        CHECK (max_files IS NULL OR max_files > 0),
    CONSTRAINT check_template_file_requirements
        CHECK (
            question_type != 'file' OR (
                allowed_file_types IS NOT NULL 
                AND max_file_size_mb IS NOT NULL
            )
        )
);

-- Create question_libraries table for organizing templates
CREATE TABLE IF NOT EXISTS question_libraries (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    
    -- Library metadata
    name TEXT NOT NULL,
    description TEXT,
    
    -- Access control
    is_public BOOLEAN DEFAULT false,               -- Public libraries are visible to all
    created_by UUID NOT NULL REFERENCES profiles(id),
    
    -- Organization
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create junction table for templates in libraries
CREATE TABLE IF NOT EXISTS question_library_templates (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    library_id UUID NOT NULL REFERENCES question_libraries(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES question_templates(id) ON DELETE CASCADE,
    
    -- Organization within library
    order_index INTEGER NOT NULL DEFAULT 0,
    notes TEXT,                                    -- Notes about this template in this library
    
    -- Timestamps
    added_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_library_template UNIQUE (library_id, template_id),
    CONSTRAINT unique_library_order UNIQUE (library_id, order_index)
);

-- Add template reference to application_questions
ALTER TABLE application_questions 
    ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES question_templates(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_templates_category 
    ON question_templates(category);

CREATE INDEX IF NOT EXISTS idx_question_templates_type 
    ON question_templates(question_type);

CREATE INDEX IF NOT EXISTS idx_question_templates_public 
    ON question_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_question_templates_system 
    ON question_templates(is_system_template);

CREATE INDEX IF NOT EXISTS idx_question_templates_creator 
    ON question_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_question_templates_usage 
    ON question_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_question_templates_tags 
    ON question_templates USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_question_libraries_public 
    ON question_libraries(is_public);

CREATE INDEX IF NOT EXISTS idx_question_libraries_creator 
    ON question_libraries(created_by);

CREATE INDEX IF NOT EXISTS idx_question_libraries_tags 
    ON question_libraries USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_library_templates_library 
    ON question_library_templates(library_id, order_index);

CREATE INDEX IF NOT EXISTS idx_library_templates_template 
    ON question_library_templates(template_id);

CREATE INDEX IF NOT EXISTS idx_application_questions_template 
    ON application_questions(template_id);

-- Add triggers for updated_at
CREATE TRIGGER question_templates_updated_at
    BEFORE UPDATE ON question_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_application_questions_updated_at();

CREATE TRIGGER question_libraries_updated_at
    BEFORE UPDATE ON question_libraries
    FOR EACH ROW
    EXECUTE FUNCTION update_application_questions_updated_at();

-- Function to create question from template
CREATE OR REPLACE FUNCTION create_question_from_template(
    p_program_id UUID,
    p_template_id UUID,
    p_category_id UUID DEFAULT NULL,
    p_order_index INTEGER DEFAULT NULL,
    p_required BOOLEAN DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    template_record question_templates;
    new_question_id UUID;
    next_order INTEGER;
BEGIN
    -- Get the template
    SELECT * INTO template_record
    FROM question_templates
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found: %', p_template_id;
    END IF;
    
    -- Determine order index if not provided
    IF p_order_index IS NULL THEN
        SELECT COALESCE(MAX(order_index), 0) + 1 INTO next_order
        FROM application_questions
        WHERE program_id = p_program_id
        AND (p_category_id IS NULL OR category_id = p_category_id);
    ELSE
        next_order := p_order_index;
    END IF;
    
    -- Create the question
    INSERT INTO application_questions (
        program_id,
        category_id,
        template_id,
        question_text,
        question_type,
        help_text,
        placeholder,
        required,
        max_length,
        validation_rules,
        options,
        allowed_file_types,
        max_file_size_mb,
        max_files,
        allow_other,
        randomize_options,
        order_index
    ) VALUES (
        p_program_id,
        p_category_id,
        p_template_id,
        template_record.question_text,
        template_record.question_type,
        template_record.help_text,
        template_record.placeholder,
        COALESCE(p_required, template_record.required),
        template_record.max_length,
        template_record.validation_rules,
        template_record.options,
        template_record.allowed_file_types,
        template_record.max_file_size_mb,
        template_record.max_files,
        template_record.allow_other,
        template_record.randomize_options,
        next_order
    ) RETURNING id INTO new_question_id;
    
    -- Update template usage count
    UPDATE question_templates 
    SET usage_count = usage_count + 1
    WHERE id = p_template_id;
    
    RETURN new_question_id;
END;
$$ language 'plpgsql';

-- Function to search templates
CREATE OR REPLACE FUNCTION search_question_templates(
    search_text TEXT DEFAULT NULL,
    category_filter question_category_type DEFAULT NULL,
    type_filter question_type DEFAULT NULL,
    tag_filter TEXT DEFAULT NULL,
    include_private BOOLEAN DEFAULT false,
    created_by_filter UUID DEFAULT NULL
)
RETURNS TABLE(
    template_id UUID,
    title TEXT,
    description TEXT,
    category question_category_type,
    question_type question_type,
    question_text TEXT,
    usage_count INTEGER,
    is_system_template BOOLEAN,
    created_by UUID,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qt.id,
        qt.title,
        qt.description,
        qt.category,
        qt.question_type,
        qt.question_text,
        qt.usage_count,
        qt.is_system_template,
        qt.created_by,
        qt.created_at
    FROM question_templates qt
    WHERE 
        (qt.is_public = true OR include_private = true OR qt.created_by = auth.uid())
        AND (search_text IS NULL OR (
            qt.title ILIKE '%' || search_text || '%' 
            OR qt.description ILIKE '%' || search_text || '%'
            OR qt.question_text ILIKE '%' || search_text || '%'
        ))
        AND (category_filter IS NULL OR qt.category = category_filter)
        AND (type_filter IS NULL OR qt.question_type = type_filter)
        AND (tag_filter IS NULL OR tag_filter = ANY(qt.tags))
        AND (created_by_filter IS NULL OR qt.created_by = created_by_filter)
    ORDER BY qt.usage_count DESC, qt.created_at DESC;
END;
$$ language 'plpgsql';

-- Enable RLS
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_library_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_templates
CREATE POLICY "Public templates are viewable by all" ON question_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON question_templates
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can manage their own templates" ON question_templates
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Super admins can manage all templates" ON question_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND 'super_admin' = ANY(profiles.roles)
        )
    );

-- RLS Policies for question_libraries
CREATE POLICY "Public libraries are viewable by all" ON question_libraries
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own libraries" ON question_libraries
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can manage their own libraries" ON question_libraries
    FOR ALL USING (created_by = auth.uid());

-- RLS Policies for library templates junction
CREATE POLICY "Users can view library templates they have access to" ON question_library_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM question_libraries ql
            WHERE ql.id = question_library_templates.library_id
            AND (ql.is_public = true OR ql.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can manage their library templates" ON question_library_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM question_libraries ql
            WHERE ql.id = question_library_templates.library_id
            AND ql.created_by = auth.uid()
        )
    );

-- Insert some default system templates
INSERT INTO question_templates (
    title, description, category, question_text, question_type, 
    help_text, required, is_system_template, is_public, tags
) VALUES 
(
    'Full Name', 
    'Standard full name question', 
    'personal_info', 
    'What is your full name?', 
    'text',
    'Please enter your full legal name as it appears on official documents.',
    true, 
    true, 
    true, 
    ARRAY['personal', 'name', 'basic']
),
(
    'Email Address', 
    'Standard email address question', 
    'personal_info', 
    'What is your email address?', 
    'email',
    'Please provide a valid email address where we can contact you.',
    true, 
    true, 
    true, 
    ARRAY['personal', 'contact', 'email']
),
(
    'Institution/Organization', 
    'Standard institution question', 
    'background', 
    'What institution or organization are you affiliated with?', 
    'text',
    'Please provide the name of your current primary institutional affiliation.',
    true, 
    true, 
    true, 
    ARRAY['background', 'institution', 'affiliation']
),
(
    'Statement of Interest', 
    'Standard statement of interest essay', 
    'essays', 
    'Please describe your interest in this program and what you hope to gain from participating.', 
    'textarea',
    'Write a brief statement (250-500 words) explaining your motivation and goals.',
    true, 
    true, 
    true, 
    ARRAY['essay', 'statement', 'interest', 'motivation']
),
(
    'CV/Resume Upload', 
    'Standard CV/Resume upload question', 
    'documents', 
    'Please upload your current CV or resume.', 
    'file',
    'Upload your most recent CV or resume in PDF format.',
    true, 
    true, 
    true, 
    ARRAY['document', 'cv', 'resume']
),
(
    'Dietary Restrictions', 
    'Standard dietary restrictions question', 
    'preferences', 
    'Do you have any dietary restrictions or food allergies we should be aware of?', 
    'textarea',
    'Please list any dietary restrictions, allergies, or special meal requirements.',
    false, 
    true, 
    true, 
    ARRAY['dietary', 'allergies', 'preferences', 'food']
),
(
    'Emergency Contact', 
    'Standard emergency contact question', 
    'personal_info', 
    'Please provide emergency contact information.', 
    'textarea',
    'Include name, relationship, phone number, and email address of someone we can contact in case of emergency.',
    true, 
    true, 
    true, 
    ARRAY['emergency', 'contact', 'safety']
);

-- Update the file upload template with proper file constraints
UPDATE question_templates 
SET 
    allowed_file_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    max_file_size_mb = 10,
    max_files = 1
WHERE question_type = 'file' AND is_system_template = true;

-- Add helpful comments
COMMENT ON TABLE question_templates IS 'Reusable question templates that can be used across multiple programs';
COMMENT ON TABLE question_libraries IS 'Collections of question templates organized by theme or purpose';
COMMENT ON TABLE question_library_templates IS 'Junction table linking templates to libraries';

COMMENT ON COLUMN question_templates.is_system_template IS 'System templates are provided by the platform and cannot be deleted';
COMMENT ON COLUMN question_templates.is_public IS 'Public templates can be used by any program administrator';
COMMENT ON COLUMN question_templates.usage_count IS 'Tracks how many times this template has been used to create questions';

COMMENT ON FUNCTION create_question_from_template(UUID, UUID, UUID, INTEGER, BOOLEAN) IS 'Creates a new application question from a template';
COMMENT ON FUNCTION search_question_templates(TEXT, question_category_type, question_type, TEXT, BOOLEAN, UUID) IS 'Searches question templates with various filters';