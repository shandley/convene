-- Migration: Add Missing Foreign Key Constraints
-- Description: Adds critical foreign key constraints to ensure referential integrity
-- Created: 2025-01-10

-- Add foreign key constraints that are missing from the current schema

-- 1. Ensure program_members references valid programs and users
ALTER TABLE public.program_members
ADD CONSTRAINT program_members_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

ALTER TABLE public.program_members
ADD CONSTRAINT program_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.program_members
ADD CONSTRAINT program_members_added_by_fkey 
FOREIGN KEY (added_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Ensure applications reference valid programs and users
ALTER TABLE public.applications
ADD CONSTRAINT applications_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

ALTER TABLE public.applications
ADD CONSTRAINT applications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Ensure application_questions reference valid programs and categories
ALTER TABLE public.application_questions
ADD CONSTRAINT application_questions_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

ALTER TABLE public.application_questions
ADD CONSTRAINT application_questions_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.question_categories(id) ON DELETE SET NULL;

ALTER TABLE public.application_questions
ADD CONSTRAINT application_questions_depends_on_question_id_fkey 
FOREIGN KEY (depends_on_question_id) REFERENCES public.application_questions(id) ON DELETE SET NULL;

-- 4. Add the template_id foreign key from the first migration (if not already applied)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'application_questions_template_id_fkey'
    ) THEN
        ALTER TABLE public.application_questions 
        ADD CONSTRAINT application_questions_template_id_fkey 
        FOREIGN KEY (template_id) REFERENCES public.question_templates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Ensure application_responses reference valid applications and questions
ALTER TABLE public.application_responses
ADD CONSTRAINT application_responses_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.application_responses
ADD CONSTRAINT application_responses_question_id_fkey 
FOREIGN KEY (question_id) REFERENCES public.application_questions(id) ON DELETE CASCADE;

-- 6. Ensure reviews reference valid applications and reviewers
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_reviewer_id_fkey 
FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. Ensure review_assignments reference valid reviews and users
ALTER TABLE public.review_assignments
ADD CONSTRAINT review_assignments_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.review_assignments
ADD CONSTRAINT review_assignments_reviewer_id_fkey 
FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.review_assignments
ADD CONSTRAINT review_assignments_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 8. Ensure documents reference valid applications and users
ALTER TABLE public.documents
ADD CONSTRAINT documents_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE public.documents
ADD CONSTRAINT documents_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 9. Ensure participants reference valid programs and users
ALTER TABLE public.participants
ADD CONSTRAINT participants_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

ALTER TABLE public.participants
ADD CONSTRAINT participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 10. Ensure announcements reference valid programs and creators
ALTER TABLE public.announcements
ADD CONSTRAINT announcements_program_id_fkey 
FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

ALTER TABLE public.announcements
ADD CONSTRAINT announcements_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 11. Ensure notification_preferences reference valid users
ALTER TABLE public.notification_preferences
ADD CONSTRAINT notification_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 12. Ensure question_templates reference valid creators
ALTER TABLE public.question_templates
ADD CONSTRAINT question_templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add performance indexes for the foreign key columns
CREATE INDEX IF NOT EXISTS idx_program_members_program_id ON public.program_members(program_id);
CREATE INDEX IF NOT EXISTS idx_program_members_user_id ON public.program_members(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_program_id ON public.applications(program_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_application_questions_program_id ON public.application_questions(program_id);
CREATE INDEX IF NOT EXISTS idx_application_responses_application_id ON public.application_responses(application_id);
CREATE INDEX IF NOT EXISTS idx_application_responses_question_id ON public.application_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_reviews_application_id ON public.reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_application_id ON public.review_assignments(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON public.documents(application_id);
CREATE INDEX IF NOT EXISTS idx_participants_program_id ON public.participants(program_id);
CREATE INDEX IF NOT EXISTS idx_announcements_program_id ON public.announcements(program_id);

-- Add helpful comments
COMMENT ON CONSTRAINT program_members_program_id_fkey ON public.program_members IS 'Ensures program membership references valid programs';
COMMENT ON CONSTRAINT applications_program_id_fkey ON public.applications IS 'Ensures applications reference valid programs';
COMMENT ON CONSTRAINT application_responses_application_id_fkey ON public.application_responses IS 'Ensures responses belong to valid applications';