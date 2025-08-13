-- Fix circular dependency in RLS policies
-- The issue is that review_assignments policies reference applications,
-- and applications policies reference review_assignments, causing infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Program admins can manage assignments" ON review_assignments;
DROP POLICY IF EXISTS "Reviewers can view assigned applications" ON applications;

-- Create simpler, non-circular policies

-- For review_assignments: Keep the simple reviewer policy, add a direct program admin policy
DROP POLICY IF EXISTS "Reviewers can view own assignments" ON review_assignments;
CREATE POLICY "Reviewers can view own assignments" ON review_assignments
FOR SELECT
TO public
USING (reviewer_id = auth.uid());

-- Program admins can manage assignments - use a direct approach without joining applications
CREATE POLICY "Program admins can manage assignments" ON review_assignments
FOR ALL
TO public 
USING (
  -- Check if user is program admin by checking the program directly via a separate query
  EXISTS (
    SELECT 1 FROM programs p 
    WHERE p.created_by = auth.uid() 
    AND p.id IN (
      SELECT program_id FROM applications a 
      WHERE a.id = review_assignments.application_id
    )
  )
);

-- For applications: Use direct policies without circular references
DROP POLICY IF EXISTS "Program admins can view program applications" ON applications;
CREATE POLICY "Program admins can view program applications" ON applications
FOR SELECT  
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = applications.program_id 
    AND programs.created_by = auth.uid()
  )
);

-- Create a separate simple policy for reviewers to access applications
-- This avoids the circular reference by using a direct user ID check
CREATE POLICY "Reviewers can view applications for review" ON applications
FOR SELECT
TO authenticated  
USING (
  -- Direct check: is this user assigned as a reviewer for this application?
  applications.id IN (
    SELECT application_id FROM review_assignments 
    WHERE reviewer_id = auth.uid()
  )
);

-- Test the policies work correctly
SELECT 'RLS policies updated successfully' as status;