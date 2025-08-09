-- Migration: Create Question Type Enum and Response Value Type Enum
-- Description: Creates enum types for question types and response value types to ensure data consistency
-- Created: 2025-01-09

-- Create enum for question types
-- This provides type safety and ensures consistency across the application
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM (
        'text',           -- Single line text input
        'textarea',       -- Multi-line text input (essays, descriptions)
        'select',         -- Single choice dropdown
        'multi_select',   -- Multiple choice checkboxes
        'checkbox',       -- Single checkbox (yes/no, agreements)
        'file',           -- File upload
        'number',         -- Numeric input
        'date',           -- Date picker
        'email',          -- Email input with validation
        'url',            -- URL input with validation
        'phone'           -- Phone number input
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for response types to handle different data storage needs
DO $$ BEGIN
    CREATE TYPE response_value_type AS ENUM (
        'text',
        'number', 
        'date',
        'boolean',
        'json',      -- For multi-select, file metadata, etc.
        'file_url'   -- For file uploads
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for question categories to organize questions into logical groups
DO $$ BEGIN
    CREATE TYPE question_category_type AS ENUM (
        'personal_info',      -- Basic personal information
        'background',         -- Educational/professional background
        'experience',         -- Relevant experience and skills
        'essays',            -- Essay questions and statements
        'preferences',       -- Program preferences and choices
        'documents',         -- Document uploads
        'custom'             -- Custom categories defined by program
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comment explaining the design decision
COMMENT ON TYPE question_type IS 'Defines the available input types for application questions. Each type determines the UI component and validation rules.';
COMMENT ON TYPE response_value_type IS 'Defines how response values are stored based on the question type. Allows for efficient querying and type-safe storage.';
COMMENT ON TYPE question_category_type IS 'Organizes questions into logical groups for better UX and form organization.';