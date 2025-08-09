# Convene Application System Database Schema

This document describes the enhanced database schema for the application system in Convene, implemented through a series of migration files.

## Migration Overview

The following migration files implement a comprehensive application system with custom questions, normalized response storage, and advanced features:

### 1. `20250109_120000_create_question_type_enum.sql`
- Creates enum types for question types, response value types, and question categories
- Provides type safety and consistency across the application
- Supports 11 different question types: text, textarea, select, multi_select, checkbox, file, number, date, email, url, phone

### 2. `20250109_120001_create_question_categories_table.sql`
- Creates the `question_categories` table for organizing questions into logical sections
- Supports both predefined categories (personal_info, background, etc.) and custom categories
- Includes conditional display logic for future enhancements
- Implements proper RLS policies for multi-role access

### 3. `20250109_120002_enhance_application_questions_table.sql`
- Enhances the existing `application_questions` table with advanced configuration options
- Adds support for file upload constraints, validation rules, and conditional logic
- Migrates existing text-based question types to the new enum system
- Includes validation triggers to ensure question configuration consistency

### 4. `20250109_120003_create_application_responses_table.sql`
- Creates the `application_responses` table for normalized response storage
- Replaces the JSONB responses column in applications with a proper relational structure
- Supports response versioning and history tracking
- Implements type-safe storage with validation based on question types

### 5. `20250109_120004_enhance_applications_table.sql`
- Adds comprehensive tracking fields to the applications table
- Implements draft vs. submitted state management
- Adds completion percentage calculation and review statistics
- Includes functions for migrating legacy JSONB responses

### 6. `20250109_120005_update_documents_table.sql`
- Updates the documents table to support question-specific file associations
- Adds file deduplication, virus scanning, and version tracking
- Implements comprehensive file metadata and access tracking
- Supports both application-level and question-level document attachments

### 7. `20250109_120006_create_question_templates_system.sql`
- Creates a reusable question template system
- Implements question libraries for organizing common questions
- Includes default system templates for common application questions
- Supports public templates that can be shared across programs

### 8. `20250109_120007_create_helper_functions_and_views.sql`
- Creates useful views for application overview, statistics, and reporting
- Implements helper functions for progress tracking and data export
- Adds program duplication functionality for question structures
- Provides comprehensive analytics functions

## Key Features Implemented

### 1. Custom Questions System
- **11 Question Types**: text, textarea, select, multi_select, checkbox, file, number, date, email, url, phone
- **Advanced Configuration**: validation rules, file constraints, conditional logic
- **Question Categories**: organize questions into logical sections with custom ordering
- **Template System**: reusable question templates with usage tracking

### 2. Enhanced Response Storage
- **Normalized Structure**: separate table for responses with type safety
- **Response Versioning**: track changes to responses over time
- **Completion Tracking**: automatic validation of required responses
- **Type-Safe Storage**: different columns for different data types

### 3. Application Workflow
- **Draft/Submit States**: clear distinction between drafts and submitted applications
- **Completion Tracking**: automatic calculation of completion percentage
- **Review Integration**: scoring and consensus tracking
- **Waitlist Management**: position tracking and automated notifications

### 4. Document Management
- **Question Association**: link documents to specific questions
- **File Deduplication**: SHA-256 hashing to prevent duplicate uploads
- **Version Control**: track file versions and replacements
- **Security Features**: virus scanning and access control

### 5. Security & Access Control
- **Comprehensive RLS**: row-level security for all tables
- **Role-Based Access**: different permissions for different user roles
- **Multi-Tenant Isolation**: proper data isolation between programs
- **Audit Trails**: complete tracking of changes and access

## Database Schema Relationships

```
programs
├── question_categories (organize questions)
├── application_questions (define questions)
│   └── application_responses (store answers)
├── applications (track submissions)
│   └── documents (file attachments)
└── program_members (access control)

question_templates (reusable questions)
├── question_libraries (organize templates)
└── question_library_templates (template collections)
```

## Usage Examples

### Creating a Program with Custom Questions

```sql
-- 1. Create question categories
INSERT INTO question_categories (program_id, title, order_index) VALUES
('program-uuid', 'Personal Information', 1),
('program-uuid', 'Experience & Background', 2),
('program-uuid', 'Essay Questions', 3);

-- 2. Create questions using templates
SELECT create_question_from_template(
    'program-uuid',     -- program_id
    'template-uuid',    -- template_id
    'category-uuid',    -- category_id
    1                   -- order_index
);

-- 3. Create custom questions
INSERT INTO application_questions (
    program_id, category_id, question_text, question_type,
    required, max_length, order_index
) VALUES (
    'program-uuid', 'category-uuid',
    'Why are you interested in this program?',
    'textarea', true, 500, 2
);
```

### Submitting Application Responses

```sql
-- Submit a text response
INSERT INTO application_responses (
    application_id, question_id, response_text, value_type
) VALUES (
    'app-uuid', 'question-uuid', 'My response text', 'text'
);

-- Submit a file response
INSERT INTO application_responses (
    application_id, question_id, response_file_urls, value_type
) VALUES (
    'app-uuid', 'question-uuid', ARRAY['https://storage.url/file.pdf'], 'file_url'
);
```

### Querying Application Data

```sql
-- Get application overview
SELECT * FROM application_overview 
WHERE program_id = 'program-uuid' 
ORDER BY submitted_at DESC;

-- Get application progress
SELECT * FROM get_application_progress('app-uuid');

-- Get incomplete questions
SELECT * FROM get_incomplete_questions('app-uuid');

-- Export application responses
SELECT export_application_responses('app-uuid');
```

## Migration Legacy Data

If you have existing applications with JSONB responses, use the migration function:

```sql
-- Migrate all applications
SELECT migrate_application_responses();

-- Migrate specific application
SELECT migrate_application_responses('app-uuid');
```

## Performance Considerations

The schema includes comprehensive indexing for:
- Program-based queries (most common access pattern)
- Question type and category filtering
- Response completion status
- File metadata and access tracking
- Template usage and search

## Security Model

### Row Level Security Policies
- **Applicants**: Can only access their own applications and responses
- **Program Members**: Can access data for programs they're associated with
- **Super Admins**: Full access to all data
- **Public Access**: Limited to public templates and published program information

### Data Privacy
- All sensitive data is protected by RLS policies
- File uploads are scanned and controlled
- Response history is maintained for audit purposes
- Personal information is only accessible to authorized users

## Deployment Instructions

1. Apply migrations in order:
   ```bash
   # Using Supabase CLI
   supabase db push

   # Or apply individually
   psql -f 20250109_120000_create_question_type_enum.sql
   psql -f 20250109_120001_create_question_categories_table.sql
   # ... continue with remaining files
   ```

2. Verify the schema:
   ```sql
   SELECT * FROM question_templates WHERE is_system_template = true;
   ```

3. Test the migration function with existing data:
   ```sql
   SELECT migrate_application_responses();
   ```

## Future Enhancements Supported

The schema is designed to support future features:
- **Conditional Questions**: show/hide based on other responses
- **Question Dependencies**: chain questions together
- **Advanced Validation**: custom validation rules per question
- **Integration APIs**: export/import application data
- **Analytics Dashboard**: comprehensive reporting capabilities
- **Mobile Optimization**: efficient queries for mobile apps

## Troubleshooting

### Common Issues

1. **Enum Migration Errors**: If you have existing data that doesn't match the enum values, update the data before running the enum migration.

2. **RLS Policy Conflicts**: Ensure users have the correct roles assigned in the profiles table.

3. **File Upload Issues**: Verify that allowed_file_types and max_file_size_mb are set for file questions.

4. **Response Validation Failures**: Check that responses match the expected value_type for each question.

### Maintenance Queries

```sql
-- Check response completion rates
SELECT * FROM question_statistics WHERE completion_rate < 80;

-- Find orphaned responses
SELECT * FROM application_responses ar
WHERE NOT EXISTS (SELECT 1 FROM applications a WHERE a.id = ar.application_id);

-- Update completion percentages
SELECT calculate_application_completion(id) FROM applications;
```

This comprehensive schema provides a robust foundation for the Convene application system with room for future enhancements and excellent performance characteristics.