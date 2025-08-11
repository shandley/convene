-- Helper Functions for Review Configuration & Scoring System
-- Created: 2025-08-10
-- Provides utility functions for managing the review system

-- Function to get program review statistics
CREATE OR REPLACE FUNCTION get_program_review_stats(program_id_param UUID)
RETURNS TABLE (
    total_applications INTEGER,
    applications_reviewed INTEGER,
    applications_pending_review INTEGER,
    average_score NUMERIC,
    total_reviewers INTEGER,
    reviews_completed INTEGER,
    reviews_pending INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM applications WHERE program_id = program_id_param),
        (SELECT COUNT(DISTINCT a.id)::INTEGER 
         FROM applications a 
         JOIN review_assignments ra ON a.id = ra.application_id
         WHERE a.program_id = program_id_param AND ra.status = 'completed'),
        (SELECT COUNT(DISTINCT a.id)::INTEGER 
         FROM applications a 
         JOIN review_assignments ra ON a.id = ra.application_id
         WHERE a.program_id = program_id_param AND ra.status != 'completed'),
        (SELECT AVG(a.average_score) 
         FROM applications a 
         WHERE a.program_id = program_id_param AND a.average_score IS NOT NULL),
        (SELECT COUNT(DISTINCT ra.reviewer_id)::INTEGER
         FROM review_assignments ra
         JOIN applications a ON a.id = ra.application_id
         WHERE a.program_id = program_id_param),
        (SELECT COUNT(*)::INTEGER
         FROM review_assignments ra
         JOIN applications a ON a.id = ra.application_id
         WHERE a.program_id = program_id_param AND ra.status = 'completed'),
        (SELECT COUNT(*)::INTEGER
         FROM review_assignments ra
         JOIN applications a ON a.id = ra.application_id
         WHERE a.program_id = program_id_param AND ra.status != 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get reviewer workload
CREATE OR REPLACE FUNCTION get_reviewer_workload(reviewer_id_param UUID)
RETURNS TABLE (
    program_id UUID,
    program_title TEXT,
    total_assigned INTEGER,
    completed INTEGER,
    pending INTEGER,
    deadline DATE,
    average_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        COUNT(ra.id)::INTEGER as total_assigned,
        COUNT(CASE WHEN ra.status = 'completed' THEN 1 END)::INTEGER as completed,
        COUNT(CASE WHEN ra.status != 'completed' THEN 1 END)::INTEGER as pending,
        MIN(ra.deadline) as deadline,
        AVG(r.overall_score) as average_score
    FROM review_assignments ra
    JOIN applications a ON a.id = ra.application_id
    JOIN programs p ON p.id = a.program_id
    LEFT JOIN reviews r ON r.assignment_id = ra.id
    WHERE ra.reviewer_id = reviewer_id_param
    GROUP BY p.id, p.title
    ORDER BY deadline ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-assign reviewers based on expertise
CREATE OR REPLACE FUNCTION auto_assign_reviewers(
    program_id_param UUID,
    required_reviewers INTEGER DEFAULT 2
) RETURNS INTEGER AS $$
DECLARE
    app_record RECORD;
    reviewer_record RECORD;
    assignment_count INTEGER := 0;
    current_assignments INTEGER;
BEGIN
    -- Loop through all applications needing reviewers
    FOR app_record IN
        SELECT a.id as application_id
        FROM applications a
        WHERE a.program_id = program_id_param
        AND a.status = 'submitted'
        AND (
            SELECT COUNT(*)
            FROM review_assignments ra
            WHERE ra.application_id = a.id
        ) < required_reviewers
    LOOP
        -- Find suitable reviewers for this application
        FOR reviewer_record IN
            SELECT 
                p.id as reviewer_id,
                re.expertise_area,
                re.reliability_score,
                COALESCE(
                    (SELECT COUNT(*) 
                     FROM review_assignments ra2 
                     WHERE ra2.reviewer_id = p.id 
                     AND ra2.status != 'completed'), 
                    0
                ) as current_workload
            FROM profiles p
            JOIN reviewer_expertise re ON re.reviewer_id = p.id
            WHERE 'reviewer' = ANY(p.roles)
            AND NOT EXISTS (
                SELECT 1 FROM review_assignments ra3
                WHERE ra3.application_id = app_record.application_id
                AND ra3.reviewer_id = p.id
            )
            ORDER BY 
                re.reliability_score DESC,
                current_workload ASC,
                random()
        LOOP
            -- Check current assignments for this application
            SELECT COUNT(*) INTO current_assignments
            FROM review_assignments ra
            WHERE ra.application_id = app_record.application_id;
            
            -- Stop if we have enough reviewers for this application
            IF current_assignments >= required_reviewers THEN
                EXIT;
            END IF;
            
            -- Assign this reviewer
            INSERT INTO review_assignments (
                application_id,
                reviewer_id,
                assigned_by,
                status,
                deadline,
                assigned_at
            ) VALUES (
                app_record.application_id,
                reviewer_record.reviewer_id,
                auth.uid(),
                'not_started',
                CURRENT_DATE + INTERVAL '14 days',
                now()
            );
            
            assignment_count := assignment_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN assignment_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate reviewer consensus
CREATE OR REPLACE FUNCTION calculate_reviewer_consensus(application_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
    scores NUMERIC[];
    avg_score NUMERIC;
    variance NUMERIC := 0;
    consensus_score NUMERIC;
BEGIN
    -- Get all completed review scores for this application
    SELECT array_agg(r.overall_score) INTO scores
    FROM reviews r
    JOIN review_assignments ra ON r.assignment_id = ra.id
    WHERE ra.application_id = application_id_param
    AND ra.status = 'completed'
    AND r.overall_score IS NOT NULL;
    
    -- Return NULL if no scores available
    IF scores IS NULL OR array_length(scores, 1) = 0 THEN
        RETURN NULL;
    END IF;
    
    -- Calculate average
    SELECT AVG(unnest) INTO avg_score FROM unnest(scores);
    
    -- Calculate variance
    SELECT AVG(power(unnest - avg_score, 2)) INTO variance FROM unnest(scores);
    
    -- Convert variance to consensus score (0-1 scale, higher = more consensus)
    -- Using exponential decay: consensus = exp(-variance)
    consensus_score := exp(-variance);
    
    RETURN consensus_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to normalize scores across different criteria
CREATE OR REPLACE FUNCTION normalize_review_scores(program_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    criteria_record RECORD;
    score_record RECORD;
    normalized_value NUMERIC;
    updated_count INTEGER := 0;
BEGIN
    -- Loop through each criteria for the program
    FOR criteria_record IN
        SELECT id, max_score, min_score
        FROM review_criteria
        WHERE program_id = program_id_param
    LOOP
        -- Update normalized scores for this criteria
        FOR score_record IN
            SELECT rs.id, rs.raw_score
            FROM review_scores rs
            JOIN reviews r ON r.id = rs.review_id
            JOIN review_assignments ra ON ra.id = r.assignment_id
            JOIN applications a ON a.id = ra.application_id
            WHERE a.program_id = program_id_param
            AND rs.criteria_id = criteria_record.id
        LOOP
            -- Calculate normalized score (0-100 scale)
            normalized_value := ((score_record.raw_score - criteria_record.min_score)::NUMERIC / 
                               (criteria_record.max_score - criteria_record.min_score)::NUMERIC) * 100;
            
            -- Update the record
            UPDATE review_scores
            SET normalized_score = normalized_value
            WHERE id = score_record.id;
            
            updated_count := updated_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get application ranking for a program
CREATE OR REPLACE FUNCTION get_application_ranking(program_id_param UUID)
RETURNS TABLE (
    application_id UUID,
    applicant_name TEXT,
    average_score NUMERIC,
    review_count INTEGER,
    consensus_score NUMERIC,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH scored_applications AS (
        SELECT 
            a.id as application_id,
            COALESCE(p.full_name, 'Unknown') as applicant_name,
            a.average_score,
            a.review_count,
            calculate_reviewer_consensus(a.id) as consensus_score
        FROM applications a
        JOIN profiles p ON p.id = a.applicant_id
        WHERE a.program_id = program_id_param
        AND a.status = 'submitted'
        AND a.average_score IS NOT NULL
    )
    SELECT 
        sa.application_id,
        sa.applicant_name,
        sa.average_score,
        sa.review_count,
        sa.consensus_score,
        ROW_NUMBER() OVER (ORDER BY sa.average_score DESC, sa.consensus_score DESC)::INTEGER as rank
    FROM scored_applications sa
    ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to copy criteria from template to program
CREATE OR REPLACE FUNCTION apply_review_template(program_id_param UUID, template_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    template_record RECORD;
    criteria_def JSONB;
    criterion JSONB;
    inserted_count INTEGER := 0;
BEGIN
    -- Get the template
    SELECT * INTO template_record
    FROM review_criteria_templates
    WHERE id = template_id_param AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or inactive: %', template_id_param;
    END IF;
    
    -- Delete existing criteria for this program
    DELETE FROM review_criteria WHERE program_id = program_id_param;
    
    -- Insert criteria from template
    FOR criterion IN SELECT * FROM jsonb_array_elements(template_record.criteria_definition)
    LOOP
        INSERT INTO review_criteria (
            program_id,
            name,
            description,
            scoring_type,
            weight,
            max_score,
            min_score,
            sort_order,
            rubric_definition,
            scoring_guide
        ) VALUES (
            program_id_param,
            criterion->>'name',
            criterion->>'description',
            (criterion->>'scoring_type')::scoring_type,
            COALESCE((criterion->>'weight')::NUMERIC, 1.0),
            COALESCE((criterion->>'max_score')::INTEGER, 10),
            COALESCE((criterion->>'min_score')::INTEGER, 0),
            inserted_count,
            COALESCE(criterion->'rubric_definition', '{}'),
            criterion->>'scoring_guide'
        );
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    -- Update the review settings to reference this template
    INSERT INTO review_settings (program_id, template_id)
    VALUES (program_id_param, template_id_param)
    ON CONFLICT (program_id) 
    DO UPDATE SET 
        template_id = template_id_param,
        updated_at = now();
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate review completion
CREATE OR REPLACE FUNCTION validate_review_completion(review_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    required_scores INTEGER;
    actual_scores INTEGER;
    review_record RECORD;
BEGIN
    -- Get review details
    SELECT r.*, ra.application_id, a.program_id INTO review_record
    FROM reviews r
    JOIN review_assignments ra ON r.assignment_id = ra.id
    JOIN applications a ON a.id = ra.application_id
    WHERE r.id = review_id_param;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Count required criteria
    SELECT COUNT(*) INTO required_scores
    FROM review_criteria
    WHERE program_id = review_record.program_id
    AND is_required = true;
    
    -- Count actual scores provided
    SELECT COUNT(*) INTO actual_scores
    FROM review_scores
    WHERE review_id = review_id_param;
    
    -- Review is complete if all required scores are provided
    RETURN actual_scores >= required_scores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;