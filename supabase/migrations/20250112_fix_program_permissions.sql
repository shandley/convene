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

-- Fix parameter naming conflicts in program management functions
-- The functions were using 'program_id' as parameter name which conflicted with column names

CREATE OR REPLACE FUNCTION can_delete_program(p_program_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    application_count INTEGER;
    is_owner BOOLEAN;
BEGIN
    -- Check if user owns the program
    SELECT COUNT(*) > 0 INTO is_owner
    FROM programs 
    WHERE id = p_program_id AND created_by = auth.uid();
    
    IF NOT is_owner THEN
        RETURN false;
    END IF;
    
    -- Check if program has any applications
    SELECT COUNT(*) INTO application_count
    FROM applications 
    WHERE program_id = p_program_id;
    
    -- Only allow deletion if no applications exist
    RETURN application_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION archive_program(p_program_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE programs 
    SET 
        archived = true,
        archived_at = now(),
        archived_by = auth.uid(),
        status = 'cancelled'
    WHERE id = p_program_id 
    AND created_by = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION unarchive_program(p_program_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE programs 
    SET 
        archived = false,
        archived_at = NULL,
        archived_by = NULL,
        status = 'draft'
    WHERE id = p_program_id 
    AND created_by = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;