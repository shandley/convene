-- Migration: Add missing performance indexes
-- Description: Create indexes for better query performance on frequently accessed columns

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

-- Add comments for documentation
COMMENT ON INDEX idx_documents_application IS 'Improves performance for document queries by application';
COMMENT ON INDEX idx_announcements_program IS 'Improves performance for program-specific announcement queries';
COMMENT ON INDEX idx_program_members_program IS 'Improves performance for program member queries';
COMMENT ON INDEX idx_applications_submitted_at IS 'Improves performance for deadline tracking and application sorting';