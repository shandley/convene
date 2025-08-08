-- Consolidated Database Improvements for Convene Platform
-- This script applies all the recommended improvements from the database review
-- Execute this script in Supabase SQL Editor or via psql

BEGIN;

-- =============================================================================
-- 1. CRITICAL - Fix the has_role function bug
-- =============================================================================

-- Fix the has_role function to properly check if the provided role exists in the roles array
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, target_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the target_role is in the user's roles array
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND target_role = ANY(roles)
  );
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.has_role(uuid, user_role) IS 
'Check if a user has a specific role in their roles array. Returns true if the target_role is found in the user''s roles array.';

-- =============================================================================
-- 2. HIGH PRIORITY - Add missing performance indexes
-- =============================================================================

-- Index for documents by application_id (for document lookup by application)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_application 
ON documents(application_id);

-- Index for announcements by program_id (for program-specific announcements)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_announcements_program 
ON announcements(program_id);

-- Index for program_members by program_id (for member lookup by program)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_program_members_program 
ON program_members(program_id);

-- Index for applications by submitted_at (for deadline tracking and sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_submitted_at 
ON applications(submitted_at) 
WHERE submitted_at IS NOT NULL;

-- =============================================================================
-- 3. MEDIUM PRIORITY - Add automatic timestamp updates
-- =============================================================================

-- Create a generic function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all tables with updated_at columns (only if they don't exist)

-- Profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_profiles_updated_at') THEN
        CREATE TRIGGER trigger_profiles_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Programs table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_programs_updated_at') THEN
        CREATE TRIGGER trigger_programs_updated_at
            BEFORE UPDATE ON programs
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Applications table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_applications_updated_at') THEN
        CREATE TRIGGER trigger_applications_updated_at
            BEFORE UPDATE ON applications
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Reviews table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_reviews_updated_at') THEN
        CREATE TRIGGER trigger_reviews_updated_at
            BEFORE UPDATE ON reviews
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Announcements table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_announcements_updated_at') THEN
        CREATE TRIGGER trigger_announcements_updated_at
            BEFORE UPDATE ON announcements
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Notification preferences table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notification_preferences_updated_at') THEN
        CREATE TRIGGER trigger_notification_preferences_updated_at
            BEFORE UPDATE ON notification_preferences
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================================================
-- 4. MEDIUM PRIORITY - Create participant_status enum
-- =============================================================================

-- Create the participant_status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_status') THEN
        CREATE TYPE participant_status AS ENUM (
            'invited',      -- User has been invited to participate
            'registered',   -- User has registered for the program
            'confirmed',    -- User has confirmed their participation
            'attended',     -- User attended the program
            'cancelled',    -- User cancelled their participation
            'no_show'       -- User didn't show up for the program
        );
    END IF;
END $$;

-- Update existing records to use valid enum values
UPDATE participants 
SET status = 'confirmed' 
WHERE status IS NULL OR status NOT IN ('invited', 'registered', 'confirmed', 'attended', 'cancelled', 'no_show');

-- Change the column type to use the enum
ALTER TABLE participants 
ALTER COLUMN status TYPE participant_status 
USING status::participant_status;

-- Set a proper default value
ALTER TABLE participants 
ALTER COLUMN status SET DEFAULT 'registered'::participant_status;

-- Make the column NOT NULL since every participant should have a status
ALTER TABLE participants 
ALTER COLUMN status SET NOT NULL;

-- =============================================================================
-- 5. Add data integrity constraints
-- =============================================================================

-- Programs: Ensure start_date comes before end_date
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_program_date_order') THEN
        ALTER TABLE programs 
        ADD CONSTRAINT check_program_date_order 
        CHECK (start_date <= end_date);
    END IF;
END $$;

-- Programs: Ensure application deadline is before program start date
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_application_deadline_before_start') THEN
        ALTER TABLE programs 
        ADD CONSTRAINT check_application_deadline_before_start 
        CHECK (application_deadline <= start_date::timestamp with time zone);
    END IF;
END $$;

-- Programs: Ensure enrollment constraints are logical
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_enrollment_within_capacity') THEN
        ALTER TABLE programs 
        ADD CONSTRAINT check_enrollment_within_capacity 
        CHECK (current_enrolled <= capacity);
    END IF;
END $$;

-- Applications: Ensure submitted_at is set when status is not draft
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_submitted_at_when_not_draft') THEN
        ALTER TABLE applications 
        ADD CONSTRAINT check_submitted_at_when_not_draft 
        CHECK (
            (status = 'draft' AND submitted_at IS NULL) OR 
            (status != 'draft' AND submitted_at IS NOT NULL)
        );
    END IF;
END $$;

-- Applications: Ensure decided_at is set for final statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_decided_at_for_final_status') THEN
        ALTER TABLE applications 
        ADD CONSTRAINT check_decided_at_for_final_status 
        CHECK (
            (status IN ('accepted', 'rejected', 'waitlisted') AND decided_at IS NOT NULL) OR 
            (status NOT IN ('accepted', 'rejected', 'waitlisted'))
        );
    END IF;
END $$;

-- Documents: Ensure positive file size
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_file_size') THEN
        ALTER TABLE documents 
        ADD CONSTRAINT check_positive_file_size 
        CHECK (file_size > 0);
    END IF;
END $$;

-- =============================================================================
-- Add comments for documentation
-- =============================================================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Generic trigger function to automatically update updated_at timestamps';
COMMENT ON TYPE participant_status IS 'Enumeration of possible participant statuses in the workshop lifecycle';
COMMENT ON CONSTRAINT check_program_date_order ON programs IS 'Ensures program start date is not after end date';
COMMENT ON CONSTRAINT check_application_deadline_before_start ON programs IS 'Ensures application deadline is before program starts';
COMMENT ON CONSTRAINT check_submitted_at_when_not_draft ON applications IS 'Ensures submitted_at timestamp consistency with application status';

COMMIT;

-- =============================================================================
-- Verification Queries (run separately to check the improvements)
-- =============================================================================

-- Verify the has_role function works correctly
-- SELECT has_role('00000000-0000-0000-0000-000000000000'::uuid, 'applicant'::user_role);

-- Check that indexes were created
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname IN (
--     'idx_documents_application', 
--     'idx_announcements_program', 
--     'idx_program_members_program', 
--     'idx_applications_submitted_at'
-- );

-- Verify triggers were created
-- SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trigger_%_updated_at';

-- Check participant_status enum
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'participant_status'::regtype ORDER BY enumsortorder;

-- Verify constraints were added
-- SELECT conname FROM pg_constraint WHERE conname LIKE 'check_%' AND conrelid = 'programs'::regclass;