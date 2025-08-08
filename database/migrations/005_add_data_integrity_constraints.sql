-- Migration: Add data integrity constraints
-- Description: Add CHECK constraints for date ordering and other business logic validation

-- Programs: Ensure start_date comes before end_date
ALTER TABLE programs 
ADD CONSTRAINT check_program_date_order 
CHECK (start_date <= end_date);

-- Programs: Ensure application deadline is before program start date
ALTER TABLE programs 
ADD CONSTRAINT check_application_deadline_before_start 
CHECK (application_deadline <= start_date::timestamp with time zone);

-- Programs: Ensure capacity constraints are logical
ALTER TABLE programs 
ADD CONSTRAINT check_enrollment_within_capacity 
CHECK (current_enrolled <= capacity);

ALTER TABLE programs 
ADD CONSTRAINT check_waitlist_within_capacity 
CHECK (current_waitlisted <= waitlist_capacity);

-- Programs: Ensure non-negative counts
ALTER TABLE programs 
ADD CONSTRAINT check_current_enrolled_non_negative 
CHECK (current_enrolled >= 0);

ALTER TABLE programs 
ADD CONSTRAINT check_current_waitlisted_non_negative 
CHECK (current_waitlisted >= 0);

-- Applications: Ensure submitted_at is set when status is not draft
ALTER TABLE applications 
ADD CONSTRAINT check_submitted_at_when_not_draft 
CHECK (
    (status = 'draft' AND submitted_at IS NULL) OR 
    (status != 'draft' AND submitted_at IS NOT NULL)
);

-- Applications: Ensure decided_at is set for final statuses
ALTER TABLE applications 
ADD CONSTRAINT check_decided_at_for_final_status 
CHECK (
    (status IN ('accepted', 'rejected', 'waitlisted') AND decided_at IS NOT NULL) OR 
    (status NOT IN ('accepted', 'rejected', 'waitlisted'))
);

-- Applications: Ensure withdrawn_at is set when status is withdrawn
ALTER TABLE applications 
ADD CONSTRAINT check_withdrawn_at_when_withdrawn 
CHECK (
    (status = 'withdrawn' AND withdrawn_at IS NOT NULL) OR 
    (status != 'withdrawn' AND withdrawn_at IS NULL)
);

-- Review assignments: Ensure deadline is reasonable (after assignment)
ALTER TABLE review_assignments 
ADD CONSTRAINT check_review_deadline_after_assignment 
CHECK (deadline IS NULL OR deadline >= assigned_at::date);

-- Review assignments: Ensure completed_at is set when status is completed
ALTER TABLE review_assignments 
ADD CONSTRAINT check_completed_at_when_completed 
CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR 
    (status != 'completed' AND completed_at IS NULL)
);

-- Documents: Ensure positive file size
ALTER TABLE documents 
ADD CONSTRAINT check_positive_file_size 
CHECK (file_size > 0);

-- Application questions: Ensure positive order_index
ALTER TABLE application_questions 
ADD CONSTRAINT check_positive_order_index 
CHECK (order_index > 0);

-- Application questions: Ensure reasonable max_length if specified
ALTER TABLE application_questions 
ADD CONSTRAINT check_reasonable_max_length 
CHECK (max_length IS NULL OR (max_length > 0 AND max_length <= 10000));

-- Add comments for documentation
COMMENT ON CONSTRAINT check_program_date_order ON programs IS 'Ensures program start date is not after end date';
COMMENT ON CONSTRAINT check_application_deadline_before_start ON programs IS 'Ensures application deadline is before program starts';
COMMENT ON CONSTRAINT check_enrollment_within_capacity ON programs IS 'Ensures enrolled count does not exceed capacity';
COMMENT ON CONSTRAINT check_submitted_at_when_not_draft ON applications IS 'Ensures submitted_at timestamp consistency with application status';
COMMENT ON CONSTRAINT check_decided_at_for_final_status ON applications IS 'Ensures decision timestamp is recorded for final application statuses';
COMMENT ON CONSTRAINT check_positive_file_size ON documents IS 'Ensures uploaded documents have positive file size';