-- Migration: Update Documents Table for Question Association
-- Description: Updates the documents table to support linking documents to specific questions
-- Created: 2025-01-09

-- Add question association to documents table
ALTER TABLE documents 
    -- Link documents to specific questions (for file upload questions)
    ADD COLUMN IF NOT EXISTS question_id UUID REFERENCES application_questions(id) ON DELETE CASCADE,
    
    -- Enhanced file metadata
    ADD COLUMN IF NOT EXISTS file_hash TEXT,                    -- SHA-256 hash for deduplication
    ADD COLUMN IF NOT EXISTS file_path TEXT,                    -- Storage path/key
    ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT false, -- Whether file has been processed/scanned
    ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending', -- processing, completed, failed
    ADD COLUMN IF NOT EXISTS virus_scan_status TEXT DEFAULT 'pending', -- clean, infected, failed, pending
    
    -- File categorization
    ADD COLUMN IF NOT EXISTS document_category TEXT,            -- Custom category for organization
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,  -- Whether file can be publicly accessed
    
    -- Version tracking
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,        -- Version number for file updates
    ADD COLUMN IF NOT EXISTS replaces_document_id UUID REFERENCES documents(id), -- Previous version reference
    
    -- Access tracking
    ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ,
    
    -- Enhanced timestamps
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Make application_id nullable since documents can now be associated with questions instead
ALTER TABLE documents 
    ALTER COLUMN application_id DROP NOT NULL;

-- Add constraint to ensure document has either application_id OR question_id
ALTER TABLE documents 
    ADD CONSTRAINT IF NOT EXISTS check_document_association 
    CHECK (
        (application_id IS NOT NULL AND question_id IS NULL) OR
        (application_id IS NULL AND question_id IS NOT NULL) OR
        (application_id IS NOT NULL AND question_id IS NOT NULL)
    );

-- Add constraints for file validation
ALTER TABLE documents 
    ADD CONSTRAINT IF NOT EXISTS check_file_size_positive 
    CHECK (file_size > 0),
    
    ADD CONSTRAINT IF NOT EXISTS check_version_positive 
    CHECK (version > 0),
    
    ADD CONSTRAINT IF NOT EXISTS check_download_count_positive 
    CHECK (download_count >= 0),
    
    ADD CONSTRAINT IF NOT EXISTS check_processing_status_valid 
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    
    ADD CONSTRAINT IF NOT EXISTS check_virus_scan_status_valid 
    CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'failed', 'skipped'));

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_documents_question_id 
    ON documents(question_id);

CREATE INDEX IF NOT EXISTS idx_documents_application_question 
    ON documents(application_id, question_id);

CREATE INDEX IF NOT EXISTS idx_documents_file_hash 
    ON documents(file_hash);

CREATE INDEX IF NOT EXISTS idx_documents_processing_status 
    ON documents(processing_status);

CREATE INDEX IF NOT EXISTS idx_documents_virus_scan 
    ON documents(virus_scan_status);

CREATE INDEX IF NOT EXISTS idx_documents_category 
    ON documents(document_category);

CREATE INDEX IF NOT EXISTS idx_documents_public 
    ON documents(is_public);

CREATE INDEX IF NOT EXISTS idx_documents_version 
    ON documents(replaces_document_id, version);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Function to generate file hash
CREATE OR REPLACE FUNCTION generate_file_hash(file_content BYTEA)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(file_content, 'sha256'), 'hex');
END;
$$ language 'plpgsql';

-- Function to find duplicate files
CREATE OR REPLACE FUNCTION find_duplicate_files(hash TEXT)
RETURNS TABLE(document_id UUID, file_name TEXT, uploaded_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.file_name, d.uploaded_at
    FROM documents d
    WHERE d.file_hash = hash
    ORDER BY d.uploaded_at ASC;
END;
$$ language 'plpgsql';

-- Function to track file access
CREATE OR REPLACE FUNCTION track_document_access(doc_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE documents 
    SET 
        download_count = download_count + 1,
        last_accessed_at = now()
    WHERE id = doc_id;
END;
$$ language 'plpgsql';

-- Function to get application documents by question
CREATE OR REPLACE FUNCTION get_application_documents(app_id UUID, question_id UUID DEFAULT NULL)
RETURNS TABLE(
    document_id UUID,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    file_url TEXT,
    document_category TEXT,
    uploaded_at TIMESTAMPTZ,
    version INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.file_name,
        d.file_type,
        d.file_size,
        d.file_url,
        d.document_category,
        d.uploaded_at,
        d.version
    FROM documents d
    WHERE d.application_id = app_id
    AND (question_id IS NULL OR d.question_id = question_id)
    AND d.virus_scan_status IN ('clean', 'skipped')
    ORDER BY d.uploaded_at DESC;
END;
$$ language 'plpgsql';

-- Update RLS policies for question-linked documents
DROP POLICY IF EXISTS "Users can view documents for their applications" ON documents;
DROP POLICY IF EXISTS "Users can manage their application documents" ON documents;

-- New comprehensive policies
CREATE POLICY "Applicants can view their application documents" ON documents
    FOR SELECT USING (
        (application_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = documents.application_id 
            AND applications.applicant_id = auth.uid()
        ))
        OR 
        (question_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM application_questions aq
            JOIN applications a ON a.program_id = aq.program_id
            WHERE aq.id = documents.question_id
            AND a.applicant_id = auth.uid()
            AND a.id = documents.application_id
        ))
    );

CREATE POLICY "Applicants can manage their application documents" ON documents
    FOR ALL USING (
        uploaded_by = auth.uid()
        AND (
            (application_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM applications 
                WHERE applications.id = documents.application_id 
                AND applications.applicant_id = auth.uid()
            ))
            OR 
            (question_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM application_questions aq
                JOIN applications a ON a.program_id = aq.program_id
                WHERE aq.id = documents.question_id
                AND a.applicant_id = auth.uid()
                AND a.id = documents.application_id
            ))
        )
    );

-- Program members can view documents for applications in their programs
CREATE POLICY "Program members can view program documents" ON documents
    FOR SELECT USING (
        (application_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM applications a
            JOIN program_members pm ON pm.program_id = a.program_id
            WHERE a.id = documents.application_id 
            AND pm.user_id = auth.uid()
        ))
        OR
        (question_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM application_questions aq
            JOIN program_members pm ON pm.program_id = aq.program_id
            WHERE aq.id = documents.question_id
            AND pm.user_id = auth.uid()
        ))
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND 'super_admin' = ANY(profiles.roles)
        )
    );

-- Public documents can be viewed by anyone (if needed for program materials)
CREATE POLICY "Public documents are viewable by all" ON documents
    FOR SELECT USING (
        is_public = true 
        AND virus_scan_status = 'clean'
    );

-- Add helpful comments
COMMENT ON COLUMN documents.question_id IS 'Links document to a specific application question (for file upload questions)';
COMMENT ON COLUMN documents.file_hash IS 'SHA-256 hash of file content for deduplication and integrity checking';
COMMENT ON COLUMN documents.processing_status IS 'Status of file processing: pending, processing, completed, failed';
COMMENT ON COLUMN documents.virus_scan_status IS 'Result of virus scanning: pending, clean, infected, failed, skipped';
COMMENT ON COLUMN documents.document_category IS 'Custom category for organizing documents within an application';
COMMENT ON COLUMN documents.is_public IS 'Whether this document can be accessed publicly (e.g., program materials)';
COMMENT ON COLUMN documents.version IS 'Version number for file updates/replacements';
COMMENT ON COLUMN documents.replaces_document_id IS 'Reference to the previous version of this document';

COMMENT ON FUNCTION track_document_access(UUID) IS 'Tracks document downloads and access for analytics';
COMMENT ON FUNCTION get_application_documents(UUID, UUID) IS 'Retrieves documents for an application, optionally filtered by question';