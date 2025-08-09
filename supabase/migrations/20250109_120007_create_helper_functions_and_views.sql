-- Migration: Create Helper Functions and Views
-- Description: Creates useful views and helper functions for the application system
-- Created: 2025-01-09

-- View for complete application overview
CREATE OR REPLACE VIEW application_overview AS
SELECT 
    a.id,
    a.program_id,
    p.title as program_title,
    a.applicant_id,
    prof.full_name as applicant_name,
    prof.email as applicant_email,
    prof.institution as applicant_institution,
    a.status,
    a.is_draft,
    a.completion_percentage,
    a.submitted_at,
    a.decided_at,
    a.decided_by,
    dec_by.full_name as decided_by_name,
    a.average_score,
    a.review_count,
    a.review_consensus,
    a.waitlist_position,
    a.created_at,
    a.last_modified_at,
    
    -- Count of documents
    (SELECT COUNT(*) FROM documents d WHERE d.application_id = a.id) as document_count,
    
    -- Count of responses
    (SELECT COUNT(*) FROM application_responses ar WHERE ar.application_id = a.id AND ar.is_current = true) as response_count,
    
    -- Count of required questions
    (SELECT COUNT(*) FROM application_questions aq WHERE aq.program_id = a.program_id AND aq.required = true) as required_question_count,
    
    -- Count of completed required responses
    (SELECT COUNT(*) 
     FROM application_responses ar 
     JOIN application_questions aq ON aq.id = ar.question_id 
     WHERE ar.application_id = a.id 
     AND ar.is_current = true 
     AND ar.is_complete = true 
     AND aq.required = true) as completed_required_count

FROM applications a
JOIN programs p ON p.id = a.program_id
JOIN profiles prof ON prof.id = a.applicant_id
LEFT JOIN profiles dec_by ON dec_by.id = a.decided_by;

-- View for question statistics
CREATE OR REPLACE VIEW question_statistics AS
SELECT 
    aq.id as question_id,
    aq.program_id,
    aq.question_text,
    aq.question_type,
    aq.required,
    aq.category_id,
    qc.title as category_title,
    
    -- Response statistics
    COUNT(ar.id) as total_responses,
    COUNT(CASE WHEN ar.is_complete THEN 1 END) as complete_responses,
    COUNT(CASE WHEN ar.is_complete = false THEN 1 END) as incomplete_responses,
    
    -- Response rate
    ROUND(
        COUNT(CASE WHEN ar.is_complete THEN 1 END) * 100.0 / NULLIF(COUNT(ar.id), 0), 
        2
    ) as completion_rate,
    
    -- Average response length for text questions
    CASE 
        WHEN aq.question_type IN ('text', 'textarea') THEN
            ROUND(AVG(LENGTH(ar.response_text)), 0)
        ELSE NULL
    END as avg_response_length,
    
    -- File upload statistics
    CASE 
        WHEN aq.question_type = 'file' THEN
            COUNT(CASE WHEN array_length(ar.response_file_urls, 1) > 0 THEN 1 END)
        ELSE NULL
    END as files_uploaded

FROM application_questions aq
LEFT JOIN question_categories qc ON qc.id = aq.category_id
LEFT JOIN application_responses ar ON ar.question_id = aq.id AND ar.is_current = true
GROUP BY aq.id, aq.program_id, aq.question_text, aq.question_type, aq.required, aq.category_id, qc.title;

-- View for program application statistics
CREATE OR REPLACE VIEW program_application_stats AS
SELECT 
    p.id as program_id,
    p.title as program_title,
    p.status as program_status,
    p.capacity,
    p.application_deadline,
    
    -- Application counts
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.is_draft = true THEN 1 END) as draft_applications,
    COUNT(CASE WHEN a.is_draft = false THEN 1 END) as submitted_applications,
    COUNT(CASE WHEN a.status = 'under_review' THEN 1 END) as under_review,
    COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as accepted,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected,
    COUNT(CASE WHEN a.status = 'waitlisted' THEN 1 END) as waitlisted,
    COUNT(CASE WHEN a.status = 'withdrawn' THEN 1 END) as withdrawn,
    
    -- Completion statistics
    ROUND(AVG(a.completion_percentage), 2) as avg_completion_percentage,
    COUNT(CASE WHEN a.completion_percentage = 100 THEN 1 END) as fully_completed,
    
    -- Review statistics
    ROUND(AVG(a.average_score), 2) as avg_score,
    COUNT(CASE WHEN a.review_count > 0 THEN 1 END) as applications_with_reviews,
    
    -- Capacity utilization
    ROUND(
        COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) * 100.0 / NULLIF(p.capacity, 0), 
        2
    ) as capacity_utilization_pct

FROM programs p
LEFT JOIN applications a ON a.program_id = p.id
GROUP BY p.id, p.title, p.status, p.capacity, p.application_deadline;

-- Function to get application progress details
CREATE OR REPLACE FUNCTION get_application_progress(app_id UUID)
RETURNS TABLE(
    category_title TEXT,
    total_questions INTEGER,
    required_questions INTEGER,
    completed_questions INTEGER,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(qc.title, 'Uncategorized') as category_title,
        COUNT(aq.id)::INTEGER as total_questions,
        COUNT(CASE WHEN aq.required THEN 1 END)::INTEGER as required_questions,
        COUNT(CASE WHEN ar.is_complete THEN 1 END)::INTEGER as completed_questions,
        ROUND(
            COUNT(CASE WHEN ar.is_complete THEN 1 END) * 100.0 / NULLIF(COUNT(aq.id), 0), 
            2
        ) as completion_percentage
    FROM application_questions aq
    LEFT JOIN question_categories qc ON qc.id = aq.category_id
    LEFT JOIN application_responses ar ON ar.question_id = aq.id 
        AND ar.application_id = app_id 
        AND ar.is_current = true
    WHERE aq.program_id = (SELECT program_id FROM applications WHERE id = app_id)
    GROUP BY qc.id, qc.title, qc.order_index
    ORDER BY qc.order_index NULLS LAST;
END;
$$ language 'plpgsql';

-- Function to get incomplete questions for an application
CREATE OR REPLACE FUNCTION get_incomplete_questions(app_id UUID)
RETURNS TABLE(
    question_id UUID,
    category_title TEXT,
    question_text TEXT,
    question_type question_type,
    required BOOLEAN,
    has_response BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aq.id,
        COALESCE(qc.title, 'Uncategorized') as category_title,
        aq.question_text,
        aq.question_type,
        aq.required,
        ar.id IS NOT NULL as has_response
    FROM application_questions aq
    LEFT JOIN question_categories qc ON qc.id = aq.category_id
    LEFT JOIN application_responses ar ON ar.question_id = aq.id 
        AND ar.application_id = app_id 
        AND ar.is_current = true 
        AND ar.is_complete = true
    WHERE aq.program_id = (SELECT program_id FROM applications WHERE id = app_id)
    AND ar.id IS NULL  -- No complete response
    ORDER BY aq.required DESC, qc.order_index NULLS LAST, aq.order_index;
END;
$$ language 'plpgsql';

-- Function to duplicate questions from another program
CREATE OR REPLACE FUNCTION duplicate_program_questions(
    source_program_id UUID,
    target_program_id UUID,
    include_responses BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
    category_mapping JSONB := '{}';
    question_mapping JSONB := '{}';
    category_record RECORD;
    question_record RECORD;
    new_category_id UUID;
    new_question_id UUID;
    duplicated_count INTEGER := 0;
BEGIN
    -- First, duplicate categories
    FOR category_record IN 
        SELECT * FROM question_categories 
        WHERE program_id = source_program_id 
        ORDER BY order_index
    LOOP
        INSERT INTO question_categories (
            program_id, title, description, category_type, order_index,
            is_visible, instructions, show_condition
        ) VALUES (
            target_program_id, category_record.title, category_record.description,
            category_record.category_type, category_record.order_index,
            category_record.is_visible, category_record.instructions, 
            category_record.show_condition
        ) RETURNING id INTO new_category_id;
        
        -- Store mapping for questions
        category_mapping := category_mapping || jsonb_build_object(
            category_record.id::TEXT, new_category_id::TEXT
        );
    END LOOP;
    
    -- Then duplicate questions
    FOR question_record IN
        SELECT * FROM application_questions 
        WHERE program_id = source_program_id 
        ORDER BY category_id NULLS LAST, order_index
    LOOP
        -- Get the new category ID if this question had a category
        new_category_id := NULL;
        IF question_record.category_id IS NOT NULL THEN
            new_category_id := (category_mapping ->> question_record.category_id::TEXT)::UUID;
        END IF;
        
        INSERT INTO application_questions (
            program_id, category_id, template_id, question_text, question_type,
            help_text, placeholder, required, max_length, validation_rules,
            options, allowed_file_types, max_file_size_mb, max_files,
            allow_other, randomize_options, order_index, is_system_question,
            depends_on_question_id, show_condition
        ) VALUES (
            target_program_id, new_category_id, question_record.template_id,
            question_record.question_text, question_record.question_type,
            question_record.help_text, question_record.placeholder, 
            question_record.required, question_record.max_length, 
            question_record.validation_rules, question_record.options,
            question_record.allowed_file_types, question_record.max_file_size_mb,
            question_record.max_files, question_record.allow_other,
            question_record.randomize_options, question_record.order_index,
            question_record.is_system_question, NULL, -- We'll handle dependencies later
            question_record.show_condition
        ) RETURNING id INTO new_question_id;
        
        -- Store question mapping
        question_mapping := question_mapping || jsonb_build_object(
            question_record.id::TEXT, new_question_id::TEXT
        );
        
        duplicated_count := duplicated_count + 1;
    END LOOP;
    
    -- Update question dependencies using the mapping
    UPDATE application_questions 
    SET depends_on_question_id = (question_mapping ->> depends_on_question_id::TEXT)::UUID
    WHERE program_id = target_program_id 
    AND depends_on_question_id IS NOT NULL;
    
    RETURN duplicated_count;
END;
$$ language 'plpgsql';

-- Function to export application responses as JSON
CREATE OR REPLACE FUNCTION export_application_responses(app_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    category_data JSONB;
    question_data JSONB;
    response_data JSONB;
    category_record RECORD;
    question_record RECORD;
    response_record RECORD;
BEGIN
    -- Get application info
    SELECT jsonb_build_object(
        'application_id', a.id,
        'program_title', p.title,
        'applicant_name', prof.full_name,
        'applicant_email', prof.email,
        'status', a.status,
        'submitted_at', a.submitted_at,
        'completion_percentage', a.completion_percentage
    ) INTO result
    FROM applications a
    JOIN programs p ON p.id = a.program_id
    JOIN profiles prof ON prof.id = a.applicant_id
    WHERE a.id = app_id;
    
    -- Add categories and responses
    result := result || jsonb_build_object('categories', '[]'::jsonb);
    
    FOR category_record IN
        SELECT DISTINCT qc.*, qc.title as category_title
        FROM question_categories qc
        JOIN application_questions aq ON aq.category_id = qc.id
        WHERE aq.program_id = (SELECT program_id FROM applications WHERE id = app_id)
        ORDER BY qc.order_index
    LOOP
        category_data := jsonb_build_object(
            'category_id', category_record.id,
            'title', category_record.title,
            'description', category_record.description,
            'questions', '[]'::jsonb
        );
        
        -- Add questions in this category
        FOR question_record IN
            SELECT * FROM application_questions
            WHERE category_id = category_record.id
            ORDER BY order_index
        LOOP
            -- Get response for this question
            SELECT 
                ar.response_text,
                ar.response_number,
                ar.response_date,
                ar.response_boolean,
                ar.response_json,
                ar.response_file_urls,
                ar.value_type,
                ar.is_complete,
                ar.updated_at
            INTO response_record
            FROM application_responses ar
            WHERE ar.application_id = app_id 
            AND ar.question_id = question_record.id 
            AND ar.is_current = true;
            
            question_data := jsonb_build_object(
                'question_id', question_record.id,
                'question_text', question_record.question_text,
                'question_type', question_record.question_type,
                'required', question_record.required,
                'response', CASE 
                    WHEN response_record.response_text IS NOT NULL THEN 
                        jsonb_build_object('value', response_record.response_text, 'type', 'text')
                    WHEN response_record.response_number IS NOT NULL THEN 
                        jsonb_build_object('value', response_record.response_number, 'type', 'number')
                    WHEN response_record.response_date IS NOT NULL THEN 
                        jsonb_build_object('value', response_record.response_date, 'type', 'date')
                    WHEN response_record.response_boolean IS NOT NULL THEN 
                        jsonb_build_object('value', response_record.response_boolean, 'type', 'boolean')
                    WHEN response_record.response_json IS NOT NULL THEN 
                        jsonb_build_object('value', response_record.response_json, 'type', 'json')
                    WHEN response_record.response_file_urls IS NOT NULL THEN 
                        jsonb_build_object('value', response_record.response_file_urls, 'type', 'file_urls')
                    ELSE NULL
                END,
                'is_complete', COALESCE(response_record.is_complete, false),
                'updated_at', response_record.updated_at
            );
            
            category_data := jsonb_set(
                category_data, 
                '{questions}', 
                (category_data->'questions') || jsonb_build_array(question_data)
            );
        END LOOP;
        
        result := jsonb_set(
            result, 
            '{categories}', 
            (result->'categories') || jsonb_build_array(category_data)
        );
    END LOOP;
    
    RETURN result;
END;
$$ language 'plpgsql';

-- Create indexes on views for better performance
CREATE INDEX IF NOT EXISTS idx_application_overview_program 
    ON applications(program_id, status);

CREATE INDEX IF NOT EXISTS idx_application_overview_applicant 
    ON applications(applicant_id, status);

-- Add helpful comments
COMMENT ON VIEW application_overview IS 'Comprehensive view of applications with calculated statistics';
COMMENT ON VIEW question_statistics IS 'Statistics about question response rates and completion';
COMMENT ON VIEW program_application_stats IS 'Program-level statistics for applications and capacity';

COMMENT ON FUNCTION get_application_progress(UUID) IS 'Returns completion progress by category for an application';
COMMENT ON FUNCTION get_incomplete_questions(UUID) IS 'Returns list of incomplete questions for an application';
COMMENT ON FUNCTION duplicate_program_questions(UUID, UUID, BOOLEAN) IS 'Duplicates question structure from one program to another';
COMMENT ON FUNCTION export_application_responses(UUID) IS 'Exports all application responses as structured JSON';