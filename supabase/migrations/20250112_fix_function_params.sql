-- Drop and recreate functions with proper parameter names to avoid conflicts

-- Drop existing functions
DROP FUNCTION IF EXISTS can_delete_program(UUID);
DROP FUNCTION IF EXISTS archive_program(UUID);
DROP FUNCTION IF EXISTS unarchive_program(UUID);

-- Recreate can_delete_program with prefixed parameter
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

-- Recreate archive_program with prefixed parameter
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

-- Recreate unarchive_program with prefixed parameter
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

-- Add comment explaining the fix
COMMENT ON FUNCTION can_delete_program(UUID) IS 'Checks if a program can be deleted - must be owned by user and have no applications';
COMMENT ON FUNCTION archive_program(UUID) IS 'Archives a program (soft delete) - sets archived flag and changes status to cancelled';
COMMENT ON FUNCTION unarchive_program(UUID) IS 'Unarchives a program - removes archived flag and resets status to draft';