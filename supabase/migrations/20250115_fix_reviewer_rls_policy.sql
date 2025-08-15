-- Fix RLS policy for reviewers to view their assignments
-- The existing policy might have issues with auth.uid() resolution

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Reviewers can view own assignments" ON review_assignments;

-- Create a new, more explicit policy
CREATE POLICY "Reviewers can view own assignments" 
ON review_assignments 
FOR SELECT 
TO authenticated
USING (
  reviewer_id = auth.uid()
  OR 
  reviewer_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  )
);

-- Also ensure the reviewer can see their completed assignments
DROP POLICY IF EXISTS "Reviewers can view completed assignments" ON review_assignments;

CREATE POLICY "Reviewers can view completed assignments"
ON review_assignments
FOR SELECT
TO authenticated 
USING (
  reviewer_id = auth.uid() 
  AND status IN ('not_started', 'in_progress', 'completed')
);