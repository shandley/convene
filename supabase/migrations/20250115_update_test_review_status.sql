-- Update review assignments to have different statuses for testing
UPDATE review_assignments 
SET 
  status = 'not_started',
  completed_at = NULL,
  deadline = CURRENT_DATE + INTERVAL '7 days'
WHERE reviewer_id = '11111111-1111-1111-1111-111111111111'
  AND application_id IN (
    'aaaa1111-aaaa-1111-aaaa-111111111111',
    'cccc3333-cccc-3333-cccc-333333333333'
  );

-- Keep one as completed for variety
UPDATE review_assignments 
SET 
  status = 'completed',
  completed_at = NOW() - INTERVAL '2 days',
  deadline = CURRENT_DATE - INTERVAL '3 days'
WHERE reviewer_id = '11111111-1111-1111-1111-111111111111'
  AND application_id = 'bbbb2222-bbbb-2222-bbbb-222222222222';

-- Add one more assignment that's in progress
UPDATE review_assignments 
SET 
  status = 'in_progress',
  completed_at = NULL,
  deadline = CURRENT_DATE + INTERVAL '3 days'
WHERE reviewer_id = '11111111-1111-1111-1111-111111111111'
  AND application_id = 'aaaa1111-aaaa-1111-aaaa-111111111111';