-- Migration: Create participant_status enum
-- Description: Replace the text participant_status field with a proper enum type

-- Create the participant_status enum with appropriate status values
CREATE TYPE participant_status AS ENUM (
    'invited',      -- User has been invited to participate
    'registered',   -- User has registered for the program
    'confirmed',    -- User has confirmed their participation
    'attended',     -- User attended the program
    'cancelled',    -- User cancelled their participation
    'no_show'       -- User didn't show up for the program
);

-- Update the participants table to use the new enum
-- First, update existing records to use valid enum values
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

-- Add a check to ensure logical timestamp consistency
ALTER TABLE participants 
ADD CONSTRAINT check_participant_timestamp_logic 
CHECK (
    (status IN ('confirmed') AND confirmed_at IS NOT NULL) OR 
    (status NOT IN ('confirmed') AND confirmed_at IS NULL) OR
    (status IN ('cancelled') AND declined_at IS NOT NULL) OR
    (status NOT IN ('cancelled') AND declined_at IS NULL)
);

-- Add comments for documentation
COMMENT ON TYPE participant_status IS 'Enumeration of possible participant statuses in the workshop lifecycle';
COMMENT ON COLUMN participants.status IS 'Current status of the participant using standardized enum values';
COMMENT ON CONSTRAINT check_participant_timestamp_logic ON participants IS 'Ensures timestamps are consistent with participant status';