-- Add archived field to programs table for soft delete functionality
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);

-- Create index for archived programs
CREATE INDEX IF NOT EXISTS idx_programs_archived ON programs(archived);

-- Create a function to archive a program
CREATE OR REPLACE FUNCTION archive_program(program_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE programs 
    SET 
        archived = true,
        archived_at = now(),
        archived_by = auth.uid(),
        status = 'cancelled'
    WHERE id = program_id 
    AND created_by = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to unarchive a program
CREATE OR REPLACE FUNCTION unarchive_program(program_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE programs 
    SET 
        archived = false,
        archived_at = NULL,
        archived_by = NULL,
        status = 'draft'
    WHERE id = program_id 
    AND created_by = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the public programs view to exclude archived programs
-- This ensures archived programs don't show up in public listings
CREATE OR REPLACE VIEW public_programs AS
SELECT * FROM programs 
WHERE archived = false 
AND status IN ('published', 'applications_open');

-- Add RLS policy to prevent deletion of programs with applications
CREATE OR REPLACE FUNCTION can_delete_program(program_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    application_count INTEGER;
    is_owner BOOLEAN;
BEGIN
    -- Check if user owns the program
    SELECT COUNT(*) > 0 INTO is_owner
    FROM programs 
    WHERE id = program_id AND created_by = auth.uid();
    
    IF NOT is_owner THEN
        RETURN false;
    END IF;
    
    -- Check if program has any applications
    SELECT COUNT(*) INTO application_count
    FROM applications 
    WHERE program_id = program_id;
    
    -- Only allow deletion if no applications exist
    RETURN application_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for clarity
COMMENT ON COLUMN programs.archived IS 'Soft delete flag - archived programs are hidden from most views';
COMMENT ON COLUMN programs.archived_at IS 'Timestamp when the program was archived';
COMMENT ON COLUMN programs.archived_by IS 'User who archived the program';