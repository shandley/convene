-- Final Test Reviewer Setup - Corrected Version
-- This script creates the remaining test data with proper constraints

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
    '11111111-1111-1111-1111-111111111111'::uuid, -- Test reviewer
    '4c387bb0-e56d-4274-ad7d-a0695fde28b3'::uuid, -- Admin
    'not_started'::review_status,
    (current_date + interval '7 days')::date,
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
    
    -- Only proceed if we found an assignment
    IF assignment_uuid IS NOT NULL THEN
        -- Generate a UUID for the review
        review_uuid := gen_random_uuid();
        
        -- Create the review with correct score range (1-5)
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
            5, -- Changed from 85 to 5 (scale 1-5)
            '{"technical_background": 5, "motivation": 4, "research_potential": 5, "communication": 4, "fit_for_program": 4}'::jsonb,
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
    ELSE
        RAISE NOTICE 'No assignment found for Alice''s application';
    END IF;
END $$;

-- Display final summary
SELECT 'Setup completed successfully!' as status;
SELECT 'Test Reviewer Account: reviewer@test.com (password: reviewer123)' as login_info;
SELECT 'Test Applicant Accounts: applicant1@test.com, applicant2@test.com, applicant3@test.com (password: applicant123)' as applicant_info;

SELECT 'Review assignments created: ' || count(*) as assignments_count 
FROM review_assignments 
WHERE reviewer_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Sample reviews created: ' || count(*) as reviews_count
FROM reviews r
JOIN review_assignments ra ON r.assignment_id = ra.id
WHERE ra.reviewer_id = '11111111-1111-1111-1111-111111111111';

-- Show the created assignments
SELECT 
    ra.id as assignment_id,
    a.id as application_id,
    p.full_name as applicant_name,
    ra.status,
    ra.deadline
FROM review_assignments ra
JOIN applications a ON ra.application_id = a.id
JOIN profiles p ON a.applicant_id = p.id
WHERE ra.reviewer_id = '11111111-1111-1111-1111-111111111111'
ORDER BY ra.assigned_at;