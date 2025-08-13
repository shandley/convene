-- Complete Test Reviewer Setup - Fix remaining issues
-- This script completes the test reviewer setup by fixing the failed parts

-- Create review assignments for the test reviewer
INSERT INTO review_assignments (
    id,
    application_id,
    reviewer_id,
    assigned_by,
    status,
    deadline,
    assigned_at
) VALUES 
-- Assignment 1
(
    gen_random_uuid(),
    'aaaa1111-aaaa-1111-aaaa-111111111111'::uuid, -- Alice's application
    '11111111-1111-1111-1111-111111111111'::uuid, -- Test reviewer
    '4c387bb0-e56d-4274-ad7d-a0695fde28b3'::uuid, -- Admin who created Test Conference
    'not_started'::review_status,
    (current_date + interval '7 days')::date,
    now()
),
-- Assignment 2
(
    gen_random_uuid(),
    'bbbb2222-bbbb-2222-bbbb-222222222222'::uuid, -- Bob's application
    '11111111-1111-1111-1111-111111111111'::uuid, -- Test reviewer
    '4c387bb0-e56d-4274-ad7d-a0695fde28b3'::uuid, -- Admin
    'not_started'::review_status,
    (current_date + interval '7 days')::date,
    now()
),
-- Assignment 3
(
    gen_random_uuid(),
    'cccc3333-cccc-3333-cccc-333333333333'::uuid, -- Carol's application
    '11111111-1111-1111-1111-1111-111111111111'::uuid, -- Test reviewer
    '4c387bb0-e56d-4274-ad7d-a0695fde28b3'::uuid, -- Admin
    'not_started'::review_status,
    (current_date + interval '7 days')::date,
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Add application questions with correct column names
INSERT INTO application_questions (
    id,
    program_id,
    question_text,
    question_type,
    required,
    order_index,
    options,
    placeholder,
    help_text,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'::uuid,
    'Please describe your relevant background and experience.',
    'textarea'::question_type,
    true,
    1,
    null,
    'Describe your educational background, research experience, and any relevant skills...',
    'Help reviewers understand your qualifications and preparation for this program.',
    now(),
    now()
),
(
    gen_random_uuid(),
    '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'::uuid,
    'What are your specific learning goals for this workshop?',
    'textarea'::question_type,
    true,
    2,
    null,
    'What do you hope to learn and achieve during this program?',
    'Be specific about skills, knowledge, or outcomes you want to gain.',
    now(),
    now()
),
(
    gen_random_uuid(),
    '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'::uuid,
    'How will you apply what you learn in this workshop?',
    'textarea'::question_type,
    true,
    3,
    null,
    'Describe how you plan to use the knowledge and skills gained...',
    'Consider your current projects, future research, or career goals.',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Create one sample review to show what a completed review looks like
-- First get a review assignment ID to use
DO $$
DECLARE
    assignment_uuid uuid;
    review_uuid uuid;
BEGIN
    -- Get the first assignment ID for Alice's application
    SELECT id INTO assignment_uuid 
    FROM review_assignments 
    WHERE application_id = 'aaaa1111-aaaa-1111-aaaa-111111111111'::uuid
    AND reviewer_id = '11111111-1111-1111-1111-111111111111'::uuid
    LIMIT 1;
    
    -- Generate a UUID for the review
    review_uuid := gen_random_uuid();
    
    -- Create the review
    INSERT INTO reviews (
        id,
        assignment_id,
        overall_score,
        criteria_scores,
        strengths,
        weaknesses,
        comments,
        recommendation,
        created_at,
        updated_at
    ) VALUES (
        review_uuid,
        assignment_uuid,
        85,
        '{"technical_background": 9, "motivation": 8, "research_potential": 9, "communication": 8, "fit_for_program": 8}'::jsonb,
        'Strong technical background with clear research experience. Well-articulated goals and excellent communication skills. Has relevant publications and conference presentations.',
        'Could benefit from more specific examples of how the workshop content relates to current research projects.',
        'This applicant demonstrates excellent preparation and strong motivation. The statement of interest is well-written and shows clear understanding of the program objectives.',
        'Strong Accept - This candidate would be an excellent addition to the program',
        now(),
        now()
    );
    
    -- Update the review assignment status for the completed review
    UPDATE review_assignments 
    SET status = 'completed'::review_status, completed_at = now()
    WHERE id = assignment_uuid;
    
    RAISE NOTICE 'Created sample review with ID: %', review_uuid;
END $$;

-- Display final summary
SELECT 'Setup completed successfully!' as status;
SELECT 'Test Reviewer Account: reviewer@test.com (password: reviewer123)' as login_info;
SELECT 'Test Applicant Accounts: applicant1@test.com, applicant2@test.com, applicant3@test.com (password: applicant123)' as applicant_info;

SELECT 'Review assignments created: ' || count(*) as assignments_count 
FROM review_assignments 
WHERE reviewer_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Application questions created: ' || count(*) as questions_count
FROM application_questions
WHERE program_id = '547a66aa-87ec-4e01-83a5-d43d3a5edc5e';

SELECT 'Sample reviews created: ' || count(*) as reviews_count
FROM reviews r
JOIN review_assignments ra ON r.assignment_id = ra.id
WHERE ra.reviewer_id = '11111111-1111-1111-1111-111111111111';