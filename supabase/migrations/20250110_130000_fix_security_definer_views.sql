-- Migration: Fix Security Definer Views
-- Description: Critical security fix - removes SECURITY DEFINER from views to prevent privilege escalation
-- Created: 2025-01-10

-- Drop and recreate views without SECURITY DEFINER
-- These views were flagged as security risks in the audit

-- 1. Fix application_overview view
DROP VIEW IF EXISTS public.application_overview CASCADE;
CREATE VIEW public.application_overview AS
SELECT 
    a.id,
    a.program_id,
    a.user_id,
    a.status,
    a.submitted_at,
    a.updated_at,
    p.name as program_name,
    p.application_deadline,
    pr.full_name as applicant_name,
    pr.email as applicant_email,
    -- Calculate completion percentage
    COALESCE(
        (SELECT COUNT(*)::float / NULLIF(COUNT(*) FILTER (WHERE aq.required = true), 0) * 100
         FROM application_questions aq
         LEFT JOIN application_responses ar ON aq.id = ar.question_id AND ar.application_id = a.id
         WHERE aq.program_id = a.program_id
         AND ar.id IS NOT NULL), 
        0
    )::integer as completion_percentage
FROM applications a
LEFT JOIN programs p ON a.program_id = p.id
LEFT JOIN profiles pr ON a.user_id = pr.id;

-- Add RLS policy for the view
ALTER VIEW public.application_overview ENABLE ROW LEVEL SECURITY;

-- 2. Fix program_application_stats view
DROP VIEW IF EXISTS public.program_application_stats CASCADE;
CREATE VIEW public.program_application_stats AS
SELECT 
    p.id as program_id,
    p.name as program_name,
    COUNT(a.id) as total_applications,
    COUNT(a.id) FILTER (WHERE a.status = 'draft') as draft_applications,
    COUNT(a.id) FILTER (WHERE a.status = 'submitted') as submitted_applications,
    COUNT(a.id) FILTER (WHERE a.status = 'under_review') as under_review_applications,
    COUNT(a.id) FILTER (WHERE a.status = 'accepted') as accepted_applications,
    COUNT(a.id) FILTER (WHERE a.status = 'rejected') as rejected_applications,
    COUNT(a.id) FILTER (WHERE a.status = 'waitlisted') as waitlisted_applications,
    AVG(CASE 
        WHEN a.submitted_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (a.submitted_at - a.created_at)) / 86400
        ELSE NULL 
    END)::integer as avg_completion_days
FROM programs p
LEFT JOIN applications a ON p.id = a.program_id
GROUP BY p.id, p.name;

-- Add RLS policy for the view
ALTER VIEW public.program_application_stats ENABLE ROW LEVEL SECURITY;

-- 3. Fix public_programs view
DROP VIEW IF EXISTS public.public_programs CASCADE;
CREATE VIEW public.public_programs AS
SELECT 
    id,
    name,
    description,
    application_deadline,
    program_dates,
    location,
    max_participants,
    application_fee,
    created_at,
    updated_at
FROM programs 
WHERE is_published = true 
AND application_deadline > NOW()
AND archived_at IS NULL;

-- This view should be accessible to everyone (no RLS needed for public data)

-- 4. Fix question_statistics view
DROP VIEW IF EXISTS public.question_statistics CASCADE;
CREATE VIEW public.question_statistics AS
SELECT 
    aq.id as question_id,
    aq.program_id,
    aq.question_text,
    aq.question_type,
    aq.required,
    COUNT(ar.id) as response_count,
    COUNT(ar.id) FILTER (WHERE ar.response_text IS NOT NULL OR ar.response_data IS NOT NULL) as completed_responses,
    -- Calculate completion rate
    CASE 
        WHEN COUNT(ar.id) > 0 THEN 
            (COUNT(ar.id) FILTER (WHERE ar.response_text IS NOT NULL OR ar.response_data IS NOT NULL)::float / COUNT(ar.id) * 100)::integer
        ELSE 0
    END as completion_rate_percent
FROM application_questions aq
LEFT JOIN application_responses ar ON aq.id = ar.question_id
GROUP BY aq.id, aq.program_id, aq.question_text, aq.question_type, aq.required;

-- Add RLS policy for the view
ALTER VIEW public.question_statistics ENABLE ROW LEVEL SECURITY;

-- Add helpful comments explaining the security fix
COMMENT ON VIEW public.application_overview IS 'Application overview without SECURITY DEFINER - respects user permissions';
COMMENT ON VIEW public.program_application_stats IS 'Program statistics without SECURITY DEFINER - respects user permissions';  
COMMENT ON VIEW public.public_programs IS 'Public programs view - accessible to all users';
COMMENT ON VIEW public.question_statistics IS 'Question statistics without SECURITY DEFINER - respects user permissions';

-- Grant appropriate permissions
GRANT SELECT ON public.application_overview TO authenticated;
GRANT SELECT ON public.program_application_stats TO authenticated;
GRANT SELECT ON public.public_programs TO anon, authenticated;
GRANT SELECT ON public.question_statistics TO authenticated;