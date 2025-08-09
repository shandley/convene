# Program Questions API

This directory contains the API endpoints for managing application questions within programs.

## Overview

The Questions API allows program administrators to create, update, delete, and reorder application questions. It also provides functionality to create questions from templates and manage question categories.

## Authentication & Authorization

All endpoints require authentication via JWT token. Users must own the program or have appropriate admin roles to manage questions. System questions have additional restrictions and cannot be modified or deleted by regular users.

## Endpoints

### GET `/api/programs/[id]/questions`

Retrieves all questions for a program.

**Query Parameters:**
- `category_id` (optional): Filter questions by category

**Response:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "program_id": "uuid",
      "category_id": "uuid",
      "question_text": "What is your name?",
      "question_type": "text",
      "help_text": "Enter your full legal name",
      "placeholder": "Full name",
      "required": true,
      "max_length": 100,
      "validation_rules": { "min_length": 2 },
      "options": null,
      "order_index": 1,
      "is_system_question": false,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": null,
      "category": {
        "id": "uuid",
        "name": "Personal Information",
        "order_index": 1
      },
      "template": null
    }
  ]
}
```

### POST `/api/programs/[id]/questions`

Creates a new question for the program.

**Request Body:**
```json
{
  "question_text": "What is your email address?",
  "question_type": "email",
  "category_id": "uuid",
  "help_text": "We'll use this for communication",
  "placeholder": "your.email@example.com",
  "required": true,
  "validation_rules": {
    "regex": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
  }
}
```

**Response:** Returns the created question object (201 status).

### GET `/api/programs/[id]/questions/[questionId]`

Retrieves a specific question with related data.

**Response:**
```json
{
  "question": {
    "id": "uuid",
    "...": "...",
    "category": { "..." },
    "template": { "..." },
    "dependent_questions": [
      {
        "id": "uuid",
        "question_text": "Follow-up question",
        "question_type": "text"
      }
    ]
  }
}
```

### PUT `/api/programs/[id]/questions/[questionId]`

Updates an existing question. System questions cannot be modified.

**Request Body:** Partial question data (same structure as POST)

**Response:** Returns the updated question object.

### DELETE `/api/programs/[id]/questions/[questionId]`

Deletes a question. Restrictions apply:
- System questions cannot be deleted
- Questions with dependent questions cannot be deleted
- Questions with existing responses cannot be deleted

**Response:** 
```json
{ "message": "Question deleted successfully" }
```

### POST `/api/programs/[id]/questions/reorder`

Reorders questions within a program.

**Request Body:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "order_index": 1,
      "category_id": "uuid"
    },
    {
      "id": "uuid",
      "order_index": 2,
      "category_id": "uuid"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Questions reordered successfully",
  "questions": [...]
}
```

### GET `/api/programs/[id]/questions/templates`

Searches available question templates.

**Query Parameters:**
- `search`: Text search in title/description
- `category`: Filter by question category
- `type`: Filter by question type
- `tags`: Filter by tags
- `include_private`: Include user's private templates

**Response:**
```json
{
  "templates": [
    {
      "template_id": "uuid",
      "title": "Full Name Template",
      "description": "Standard name question",
      "category": "personal_info",
      "question_type": "text",
      "question_text": "What is your full name?",
      "usage_count": 42,
      "is_system_template": true,
      "created_by": "uuid",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/programs/[id]/questions/templates`

Creates question(s) from template(s).

**Single Template Request:**
```json
{
  "template_id": "uuid",
  "category_id": "uuid",
  "required": true,
  "customizations": {
    "question_text": "Custom question text",
    "help_text": "Custom help text"
  }
}
```

**Bulk Templates Request:**
```json
{
  "templates": [
    {
      "template_id": "uuid",
      "category_id": "uuid",
      "required": true
    },
    {
      "template_id": "uuid",
      "category_id": "uuid",
      "required": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "created_questions": [...],
  "errors": [
    {
      "template_id": "uuid",
      "error": "Template not found"
    }
  ]
}
```

## Question Types

### Supported Types

1. **text** - Single line text input
2. **textarea** - Multi-line text for essays
3. **select** - Single choice dropdown
4. **multi_select** - Multiple choice checkboxes
5. **checkbox** - Yes/No checkbox
6. **file** - File upload
7. **number** - Numeric input
8. **date** - Date picker
9. **email** - Email with validation
10. **url** - URL with validation
11. **phone** - Phone number input

### Type-Specific Requirements

#### File Upload (`file`)
Required fields:
- `allowed_file_types`: Array of MIME types
- `max_file_size_mb`: Maximum file size
- `max_files`: Number of files allowed (default: 1)

```json
{
  "question_type": "file",
  "allowed_file_types": ["application/pdf", "image/jpeg"],
  "max_file_size_mb": 10,
  "max_files": 1
}
```

#### Select/Multi-Select (`select`, `multi_select`)
Required fields:
- `options`: Array of option objects

```json
{
  "question_type": "select",
  "options": [
    {
      "value": "option1",
      "label": "Option 1",
      "description": "Description"
    },
    "Simple string option"
  ],
  "allow_other": true,
  "randomize_options": false
}
```

## Validation Rules

Questions can include validation rules in the `validation_rules` JSON field:

### Text Validation
```json
{
  "min_length": 10,
  "max_length": 500,
  "regex": "^[A-Za-z\\s]+$",
  "regex_message": "Only letters and spaces allowed"
}
```

### Number Validation
```json
{
  "min": 0,
  "max": 100,
  "integer_only": true
}
```

### Date Validation
```json
{
  "min_date": "2023-01-01",
  "max_date": "2024-12-31",
  "disable_past": false,
  "disable_future": true
}
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "question_text",
      "message": "Question text is required"
    }
  ]
}
```

### Common HTTP Status Codes

- **200** - Success
- **201** - Created
- **207** - Multi-Status (partial success in bulk operations)
- **400** - Validation error
- **401** - Unauthorized
- **403** - Forbidden (insufficient permissions)
- **404** - Not found
- **500** - Internal server error

## Question Categories

Questions can be organized into categories:

- `personal_info` - Basic personal information
- `background` - Educational/professional background
- `experience` - Relevant experience and skills
- `essays` - Essay questions and statements
- `preferences` - Program preferences and choices
- `documents` - Document uploads
- `custom` - Custom categories

## System Questions

System questions are provided by the platform and have special restrictions:
- Cannot be deleted
- Cannot be modified (limited updates allowed)
- Always included in forms
- Have `is_system_question: true`

## Conditional Questions

Questions can be shown based on responses to other questions using the `depends_on_question_id` and `show_condition` fields:

```json
{
  "depends_on_question_id": "uuid",
  "show_condition": {
    "operator": "equals",
    "value": "yes"
  }
}
```

## Templates

Question templates provide reusable question definitions:
- **System templates** - Provided by platform, cannot be deleted
- **Public templates** - Available to all users
- **Private templates** - User-specific templates

Templates include usage tracking and can be customized when creating questions.

## Rate Limiting

API endpoints are subject to standard rate limiting. Bulk operations may have higher limits.

## Examples

See `/lib/examples/questions-api-usage.ts` for comprehensive usage examples including error handling and best practices.

## Client Service

Use the `QuestionsService` class from `/lib/services/questions.ts` for type-safe API interactions:

```typescript
import { QuestionsService } from '@/lib/services/questions'

const questionsService = new QuestionsService()
const questions = await questionsService.getQuestions(programId)
```