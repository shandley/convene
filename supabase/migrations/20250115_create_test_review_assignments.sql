-- Create review assignments for test reviewer account
-- This migration adds test data for the reviewer@test.com user

-- First, ensure we have the test reviewer
INSERT INTO profiles (id, email, full_name, institution, department, roles)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'reviewer@test.com',
  'Test Reviewer',
  'Test University',
  'Computer Science',
  ARRAY['reviewer']::user_role[]
) ON CONFLICT (id) DO UPDATE SET
  roles = array_append(
    COALESCE(array_remove(profiles.roles, 'reviewer'), ARRAY[]::user_role[]), 
    'reviewer'
  );

-- Create review assignments for existing submitted applications
INSERT INTO review_assignments (
  application_id,
  reviewer_id,
  assigned_by,
  status,
  deadline,
  assigned_at
)
SELECT 
  a.id as application_id,
  '11111111-1111-1111-1111-111111111111' as reviewer_id,
  '11111111-1111-1111-1111-111111111111' as assigned_by,
  'not_started' as status,
  CURRENT_DATE + INTERVAL '7 days' as deadline,
  NOW() as assigned_at
FROM applications a
WHERE a.status = 'submitted'
  AND a.id IN (
    'aaaa1111-aaaa-1111-aaaa-111111111111',
    'bbbb2222-bbbb-2222-bbbb-222222222222', 
    'cccc3333-cccc-3333-cccc-333333333333'
  )
ON CONFLICT (application_id, reviewer_id) DO NOTHING;

-- Add a completed review assignment for testing
INSERT INTO review_assignments (
  application_id,
  reviewer_id,
  assigned_by,
  status,
  deadline,
  assigned_at,
  completed_at
)
SELECT 
  a.id as application_id,
  '11111111-1111-1111-1111-111111111111' as reviewer_id,
  '11111111-1111-1111-1111-111111111111' as assigned_by,
  'completed' as status,
  CURRENT_DATE - INTERVAL '3 days' as deadline,
  NOW() - INTERVAL '10 days' as assigned_at,
  NOW() - INTERVAL '2 days' as completed_at
FROM applications a
WHERE a.status = 'submitted'
  AND a.id = 'bbbb2222-bbbb-2222-bbbb-222222222222'
ON CONFLICT (application_id, reviewer_id) 
DO UPDATE SET 
  status = 'completed',
  completed_at = NOW() - INTERVAL '2 days';