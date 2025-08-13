-- Create Auth User for Test Reviewer
-- This script creates the authentication user for the test reviewer
-- Run this in the Supabase SQL Editor BEFORE running the test-reviewer-setup.sql

-- Insert into auth.users table to create the authentication record
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'reviewer@test.com',
    crypt('reviewer123', gen_salt('bf')), -- This creates a bcrypt hash of 'reviewer123'
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test Reviewer", "institution": "Test University"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

-- Also create auth entries for test applicants so they can log in if needed
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
-- Test Applicant 1
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'applicant1@test.com',
    crypt('applicant123', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Alice Johnson", "institution": "State University"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- Test Applicant 2
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'applicant2@test.com',
    crypt('applicant123', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Bob Chen", "institution": "Tech Institute"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
-- Test Applicant 3
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'applicant3@test.com',
    crypt('applicant123', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Carol Davis", "institution": "Research University"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

-- Verify the users were created
SELECT 'Auth users created successfully!' as status;
SELECT email, created_at FROM auth.users WHERE email LIKE '%test.com' ORDER BY created_at;