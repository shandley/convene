# Question Builder Components

A comprehensive question builder UI component system for the Convene workshop administration platform. This system allows program administrators to create, edit, and manage application questions with a modern, intuitive interface.

## Components

### QuestionBuilder (Main Component)
The primary component that orchestrates the entire question management experience.

```tsx
import { QuestionBuilder } from '@/components/programs/questions'

export function ProgramQuestionsPage() {
  const [questions, setQuestions] = useState<ApplicationQuestionWithRelations[]>([])
  
  return (
    <QuestionBuilder
      programId={programId}
      questions={questions}
      onQuestionsChange={setQuestions}
      isLoading={loading}
    />
  )
}
```

**Features:**
- Drag-and-drop reordering with @dnd-kit/sortable
- Search and filter questions
- Visual question type indicators
- Required/optional badges
- Edit/delete actions for each question
- Template browsing integration
- Question preview functionality

### QuestionForm
Dynamic form component for creating and editing questions with type-specific configurations.

```tsx
import { QuestionForm } from '@/components/programs/questions'

<QuestionForm
  programId={programId}
  question={editingQuestion} // null for new question
  onSave={handleQuestionSaved}
  onCancel={handleCancel}
/>
```

**Features:**
- Dynamic form fields based on question type
- File upload configuration for file questions
- Options editor for select/multi-select types
- Character limit settings for text fields
- Validation rules configuration
- Required/optional toggle

### QuestionTypeSelector
Visual grid component for selecting question types with descriptions and examples.

```tsx
import { QuestionTypeSelector } from '@/components/programs/questions'

<QuestionTypeSelector
  value={selectedType}
  onChange={setSelectedType}
  disabled={isEditing} // Disable type changes for existing questions
/>
```

**Features:**
- Visual grid of question types with icons
- Grouped by category (text, selection, file, specialized)
- Examples and descriptions for each type
- Disabled state for editing existing questions

### QuestionPreview
Interactive preview component showing how questions appear to applicants.

```tsx
import { QuestionPreview } from '@/components/programs/questions'

<QuestionPreview
  question={previewQuestion}
/>
```

**Features:**
- Renders questions as they appear to applicants
- Interactive form elements
- Validation rules display
- Character count for text fields
- File upload interface preview

### QuestionTemplateModal
Modal component for browsing and selecting from question templates.

```tsx
import { QuestionTemplateModal } from '@/components/programs/questions'

<QuestionTemplateModal
  open={showTemplates}
  onOpenChange={setShowTemplates}
  programId={programId}
  onQuestionsAdded={handleTemplatesAdded}
/>
```

**Features:**
- Search and filter templates
- Category tabs (Personal Info, Background, Essays, etc.)
- Bulk selection and preview
- System and custom template indicators
- Usage statistics

## Question Types Supported

### Text Input Types
- **Short Text**: Single line text input
- **Long Text**: Multi-line textarea
- **Email**: Email with validation
- **Phone**: Phone number with formatting
- **URL**: Website/link with validation

### Selection Types
- **Single Select**: Dropdown selection
- **Multi Select**: Multiple choice from list
- **Checkboxes**: Multiple checkboxes

### Specialized Types
- **Number**: Numeric input with validation
- **Date**: Date picker
- **File Upload**: Document/file submission

## Integration Example

```tsx
'use client'

import { useState, useEffect } from 'react'
import { QuestionBuilder } from '@/components/programs/questions'
import type { ApplicationQuestionWithRelations } from '@/types/questions'

interface ProgramQuestionsProps {
  programId: string
}

export function ProgramQuestions({ programId }: ProgramQuestionsProps) {
  const [questions, setQuestions] = useState<ApplicationQuestionWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load questions
  useEffect(() => {
    loadQuestions()
  }, [programId])

  const loadQuestions = async () => {
    try {
      const response = await fetch(`/api/programs/${programId}/questions`)
      const data = await response.json()
      setQuestions(data.questions)
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionsChange = async (updatedQuestions: ApplicationQuestionWithRelations[]) => {
    setQuestions(updatedQuestions)
    
    // Persist reorder changes
    const reorderData = updatedQuestions.map((q, index) => ({
      id: q.id,
      order_index: index,
      category_id: q.category_id
    }))
    
    try {
      await fetch(`/api/programs/${programId}/questions/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: reorderData })
      })
    } catch (error) {
      console.error('Error reordering questions:', error)
      // Revert changes on error
      loadQuestions()
    }
  }

  return (
    <div className="container mx-auto py-6">
      <QuestionBuilder
        programId={programId}
        questions={questions}
        onQuestionsChange={handleQuestionsChange}
        isLoading={isLoading}
      />
    </div>
  )
}
```

## API Integration

The components integrate with the following API endpoints:

- `GET /api/programs/{id}/questions` - Load questions
- `POST /api/programs/{id}/questions` - Create question
- `PUT /api/programs/{id}/questions/{questionId}` - Update question
- `DELETE /api/programs/{id}/questions/{questionId}` - Delete question
- `PUT /api/programs/{id}/questions/reorder` - Reorder questions
- `GET /api/programs/{id}/questions/templates` - Load templates
- `POST /api/programs/{id}/questions/templates` - Create from templates

## Styling and Theme

All components use shadcn/ui components and follow the Convene design system:

- Consistent color palette with semantic variants
- Dark mode support throughout
- Responsive design (mobile-first)
- Accessible interaction patterns
- Loading and error states
- Empty state illustrations

## Accessibility Features

- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader announcements
- Focus management for modals
- Color contrast compliance
- Semantic HTML structure

## Performance Optimizations

- React.memo for expensive computations
- Virtualization for large question lists
- Debounced search and filtering
- Optimistic UI updates
- Efficient drag-and-drop handling