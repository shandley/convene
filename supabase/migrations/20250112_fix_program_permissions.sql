-- Fix program creation permissions to allow any authenticated user to create programs
-- Previously only program_admin and super_admin could create programs, which prevented new users

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Program admins can create programs" ON programs;

-- Create a more permissive policy that allows any authenticated user to create programs
CREATE POLICY "Authenticated users can create programs" 
ON programs FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also ensure users can view their own programs regardless of status
DROP POLICY IF EXISTS "Anyone can view published programs" ON programs;

-- Create separate policies for viewing
CREATE POLICY "Users can view their own programs" 
ON programs FOR SELECT 
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Anyone can view published programs" 
ON programs FOR SELECT 
TO public
USING (status != 'draft');

-- Add comment explaining the change
COMMENT ON POLICY "Authenticated users can create programs" ON programs IS 
'Any authenticated user can create programs. They automatically become the program admin for programs they create.';