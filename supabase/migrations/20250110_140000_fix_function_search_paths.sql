-- Migration: Fix Function Search Path Security Issues
-- Description: Adds SET search_path = public to all functions to prevent search path attacks
-- Created: 2025-01-10

-- Fix search_path for all functions to prevent security vulnerabilities
-- This addresses the "Function Search Path Mutable" warnings

-- Update functions with secure search_path settings
ALTER FUNCTION public.update_question_categories_updated_at() 
SET search_path = public;

ALTER FUNCTION public.update_application_questions_updated_at() 
SET search_path = public;

ALTER FUNCTION public.validate_question_configuration(uuid, text, jsonb, text[], integer, integer, boolean, boolean) 
SET search_path = public;

ALTER FUNCTION public.update_application_responses_updated_at() 
SET search_path = public;

ALTER FUNCTION public.create_response_version(uuid, text, jsonb, uuid) 
SET search_path = public;

ALTER FUNCTION public.validate_response_completeness(uuid) 
SET search_path = public;

ALTER FUNCTION public.update_applications_timestamps() 
SET search_path = public;

ALTER FUNCTION public.calculate_application_completion(uuid) 
SET search_path = public;

ALTER FUNCTION public.update_application_review_stats() 
SET search_path = public;

ALTER FUNCTION public.trigger_completion_update() 
SET search_path = public;

ALTER FUNCTION public.migrate_application_responses() 
SET search_path = public;

ALTER FUNCTION public.update_documents_updated_at() 
SET search_path = public;

ALTER FUNCTION public.generate_file_hash(text, bigint) 
SET search_path = public;

ALTER FUNCTION public.find_duplicate_files() 
SET search_path = public;

ALTER FUNCTION public.track_document_access(uuid, text) 
SET search_path = public;

ALTER FUNCTION public.get_application_documents(uuid) 
SET search_path = public;

ALTER FUNCTION public.create_question_from_template(uuid, uuid, integer) 
SET search_path = public;

ALTER FUNCTION public.search_question_templates(text, text, text[]) 
SET search_path = public;

ALTER FUNCTION public.get_application_progress(uuid) 
SET search_path = public;

ALTER FUNCTION public.get_incomplete_questions(uuid) 
SET search_path = public;

ALTER FUNCTION public.duplicate_program_questions(uuid, uuid) 
SET search_path = public;

ALTER FUNCTION public.export_application_responses(uuid) 
SET search_path = public;

ALTER FUNCTION public.can_delete_program(uuid) 
SET search_path = public;

ALTER FUNCTION public.archive_program(uuid) 
SET search_path = public;

ALTER FUNCTION public.unarchive_program(uuid) 
SET search_path = public;

ALTER FUNCTION public.is_program_admin(uuid, uuid) 
SET search_path = public;

ALTER FUNCTION public.update_updated_at_column() 
SET search_path = public;

ALTER FUNCTION public.has_role(text, uuid) 
SET search_path = public;

ALTER FUNCTION public.handle_new_user() 
SET search_path = public;

-- Add helpful comment
COMMENT ON SCHEMA public IS 'All functions now have secure search_path settings to prevent injection attacks';