-- Fix infinite recursion in applications table RLS policies
-- The issue is that multiple policies are checking each other, creating a loop

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Program admins can view program applications" ON applications;
DROP POLICY IF EXISTS "Reviewers can view assigned applications" ON applications;

-- Recreate them with simpler, non-recursive checks
-- Program admins can view applications for programs they created
CREATE POLICY "Program admins can view program applications" 
ON applications FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM programs 
    WHERE programs.id = applications.program_id 
    AND programs.created_by = auth.uid()
  )
);

-- Reviewers can view assigned applications (simplified)
CREATE POLICY "Reviewers can view assigned applications" 
ON applications FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM review_assignments ra
    WHERE ra.application_id = applications.id 
    AND ra.reviewer_id = auth.uid()
  )
);

-- Also ensure the program detail page works by fixing the programs table policies
-- Drop and recreate the update policy to avoid recursion
DROP POLICY IF EXISTS "Program admins can update own programs" ON programs;

CREATE POLICY "Program admins can update own programs" 
ON programs FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Add a comment explaining the fix
COMMENT ON POLICY "Program admins can view program applications" ON applications IS 
'Simplified policy to avoid recursion - checks programs.created_by directly instead of using is_program_admin function';