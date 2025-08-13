-- Test Reviewer Setup Script for Convene
-- Run this script in the Supabase SQL Editor to create test data for reviewing applications

-- Create test reviewer profile
INSERT INTO profiles (
    id,
    email,
    full_name,
    institution,
    department,
    bio,
    roles,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'reviewer@test.com',
    'Test Reviewer',
    'Test University',
    'Computer Science',
    'Experienced reviewer for workshop applications with expertise in academic program evaluation.',
    ARRAY['reviewer'::user_role],
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    institution = EXCLUDED.institution,
    department = EXCLUDED.department,
    bio = EXCLUDED.bio,
    roles = EXCLUDED.roles,
    updated_at = now();

-- Create test applicant profiles for realistic applications
INSERT INTO profiles (
    id,
    email,
    full_name,
    institution,
    department,
    bio,
    roles,
    created_at,
    updated_at
) VALUES 
-- Test Applicant 1
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'applicant1@test.com',
    'Alice Johnson',
    'State University',
    'Biology',
    'Graduate student interested in computational biology and data analysis.',
    ARRAY['applicant'::user_role],
    now(),
    now()
),
-- Test Applicant 2
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'applicant2@test.com',
    'Bob Chen',
    'Tech Institute',
    'Engineering',
    'Postdoc researcher with background in machine learning applications.',
    ARRAY['applicant'::user_role],
    now(),
    now()
),
-- Test Applicant 3
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    'applicant3@test.com',
    'Carol Davis',
    'Research University',
    'Psychology',
    'Assistant professor researching human-computer interaction.',
    ARRAY['applicant'::user_role],
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    institution = EXCLUDED.institution,
    department = EXCLUDED.department,
    bio = EXCLUDED.bio,
    roles = EXCLUDED.roles,
    updated_at = now();

-- Create test applications for the Test Conference program
-- Replace with your actual Test Conference program ID if different
INSERT INTO applications (
    id,
    program_id,
    applicant_id,
    status,
    responses,
    statement_of_interest,
    submitted_at,
    created_at,
    updated_at,
    is_draft,
    completion_percentage
) VALUES 
-- Application 1 - Strong candidate
(
    'aaaa1111-aaaa-1111-aaaa-111111111111'::uuid,
    '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'::uuid, -- Test Conference ID
    '22222222-2222-2222-2222-222222222222'::uuid, -- Alice Johnson
    'submitted'::application_status,
    '{"experience": "5+ years in computational biology", "motivation": "Very interested in advancing my research skills", "availability": "Available for full program"}'::jsonb,
    'I am deeply passionate about computational biology and believe this workshop will provide invaluable hands-on experience with cutting-edge techniques. My current research involves analyzing large genomic datasets, and I am particularly excited about the opportunity to learn advanced machine learning approaches that could enhance my work. I have published 3 papers in peer-reviewed journals and have experience presenting at international conferences.',
    now() - interval '3 days',
    now() - interval '5 days',
    now() - interval '3 days',
    false,
    100.00
),
-- Application 2 - Medium candidate
(
    'bbbb2222-bbbb-2222-bbbb-222222222222'::uuid,
    '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid, -- Bob Chen
    'submitted'::application_status,
    '{"experience": "2 years in machine learning", "motivation": "Interested in expanding skill set", "availability": "Available most of the time"}'::jsonb,
    'As a postdoctoral researcher, I am looking to expand my expertise beyond traditional machine learning into more specialized applications. This workshop represents an excellent opportunity to learn from experts and network with peers in the field. While my background is primarily in engineering, I am eager to explore interdisciplinary applications and contribute my technical skills to collaborative projects.',
    now() - interval '2 days',
    now() - interval '4 days',
    now() - interval '2 days',
    false,
    100.00
),
-- Application 3 - Weaker candidate (needs improvement)
(
    'cccc3333-cccc-3333-cccc-333333333333'::uuid,
    '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid, -- Carol Davis
    'submitted'::application_status,
    '{"experience": "Limited technical background", "motivation": "Curious about the field", "availability": "Uncertain due to teaching commitments"}'::jsonb,
    'I am new to this area but very curious about learning. My background is mainly in psychology, but I think technology could be useful for my research. I would like to attend if possible, though I have some scheduling constraints with my teaching responsibilities.',
    now() - interval '1 day',
    now() - interval '6 days',
    now() - interval '1 day',
    false,
    100.00
)
ON CONFLICT (id) DO NOTHING;

-- Create review assignments for the test reviewer
-- Replace the assigned_by UUID with your actual admin user ID if different
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
    'rrrr1111-rrrr-1111-rrrr-111111111111'::uuid,
    'aaaa1111-aaaa-1111-aaaa-111111111111'::uuid, -- Alice's application
    '11111111-1111-1111-1111-111111111111'::uuid, -- Test reviewer
    '4c387bb0-e56d-4274-ad7d-a0695fde28b3'::uuid, -- Admin who created Test Conference
    'not_started'::review_status,
    (current_date + interval '7 days')::date,
    now()
),
-- Assignment 2
(
    'rrrr2222-rrrr-2222-rrrr-222222222222'::uuid,
    'bbbb2222-bbbb-2222-bbbb-222222222222'::uuid, -- Bob's application
    '11111111-1111-1111-1111-111111111111'::uuid, -- Test reviewer
    '4c387bb0-e56d-4274-ad7d-a0695fde28b3'::uuid, -- Admin
    'not_started'::review_status,
    (current_date + interval '7 days')::date,
    now()
),
-- Assignment 3
(
    'rrrr3333-rrrr-3333-rrrr-333333333333'::uuid,
    'cccc3333-cccc-3333-cccc-333333333333'::uuid, -- Carol's application
    '11111111-1111-1111-1111-111111111111'::uuid, -- Test reviewer
    '4c387bb0-e56d-4274-ad7d-a0695fde28b3'::uuid, -- Admin
    'not_started'::review_status,
    (current_date + interval '7 days')::date,
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Add some better application questions to the Test Conference program
INSERT INTO application_questions (
    id,
    program_id,
    question_text,
    question_type,
    required,
    order_index,
    options,
    placeholder_text,
    help_text,
    created_at,
    updated_at
) VALUES 
(
    'qqqq1111-qqqq-1111-qqqq-111111111111'::uuid,
    '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'::uuid,
    'Please describe your relevant background and experience.',
    'textarea',
    true,
    1,
    null,
    'Describe your educational background, research experience, and any relevant skills...',
    'Help reviewers understand your qualifications and preparation for this program.',
    now(),
    now()
),
(
    'qqqq2222-qqqq-2222-qqqq-222222222222'::uuid,
    '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'::uuid,
    'What are your specific learning goals for this workshop?',
    'textarea',
    true,
    2,
    null,
    'What do you hope to learn and achieve during this program?',
    'Be specific about skills, knowledge, or outcomes you want to gain.',
    now(),
    now()
),
(
    'qqqq3333-qqqq-3333-qqqq-333333333333'::uuid,
    '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'::uuid,
    'How will you apply what you learn in this workshop?',
    'textarea',
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
    'revw1111-revw-1111-revw-111111111111'::uuid,
    'rrrr1111-rrrr-1111-rrrr-111111111111'::uuid, -- Alice's review assignment
    85,
    '{"technical_background": 9, "motivation": 8, "research_potential": 9, "communication": 8, "fit_for_program": 8}'::jsonb,
    'Strong technical background with clear research experience. Well-articulated goals and excellent communication skills. Has relevant publications and conference presentations.',
    'Could benefit from more specific examples of how the workshop content relates to current research projects.',
    'This applicant demonstrates excellent preparation and strong motivation. The statement of interest is well-written and shows clear understanding of the program objectives.',
    'Strong Accept - This candidate would be an excellent addition to the program',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Update the review assignment status for the completed review
UPDATE review_assignments 
SET status = 'completed'::review_status, completed_at = now()
WHERE id = 'rrrr1111-rrrr-1111-rrrr-111111111111'::uuid;

-- Display summary of created data
SELECT 'Test data created successfully!' as status;
SELECT 'Test Reviewer Account: reviewer@test.com (password: reviewer123)' as credentials;
SELECT 'Profiles created: ' || count(*) as profiles_count FROM profiles WHERE email LIKE '%test.com';
SELECT 'Applications created: ' || count(*) as applications_count FROM applications WHERE program_id = '547a66aa-87ec-4e01-83a5-d43d3a5edc5e';
SELECT 'Review assignments created: ' || count(*) as assignments_count FROM review_assignments WHERE reviewer_id = '11111111-1111-1111-1111-111111111111';