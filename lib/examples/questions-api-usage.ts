/**
 * Examples of using the Questions API endpoints
 * 
 * This file demonstrates how to interact with the questions API endpoints
 * from both server components and client components in Next.js 14.
 */

import { QuestionsService } from '@/lib/services/questions'
import type { 
  CreateQuestionRequest, 
  UpdateQuestionRequest,
  ReorderQuestionsRequest,
  CreateFromTemplateRequest 
} from '@/types/questions'

// Initialize the service
const questionsService = new QuestionsService()

/**
 * Example 1: Fetch all questions for a program
 */
export async function fetchProgramQuestions(programId: string) {
  try {
    const questions = await questionsService.getQuestions(programId)
    console.log(`Found ${questions.length} questions`)
    return questions
  } catch (error) {
    console.error('Error fetching questions:', error)
    throw error
  }
}

/**
 * Example 2: Create a basic text question
 */
export async function createBasicTextQuestion(programId: string) {
  const questionData: CreateQuestionRequest = {
    question_text: "What is your full name?",
    question_type: "text",
    help_text: "Please enter your legal name as it appears on official documents",
    placeholder: "Enter your full name",
    required: true,
    max_length: 100,
    validation_rules: {
      min_length: 2,
      max_length: 100
    }
  }

  try {
    const question = await questionsService.createQuestion(programId, questionData)
    console.log('Created question:', question.id)
    return question
  } catch (error) {
    console.error('Error creating question:', error)
    throw error
  }
}

/**
 * Example 3: Create a file upload question
 */
export async function createFileUploadQuestion(programId: string) {
  const questionData: CreateQuestionRequest = {
    question_text: "Please upload your CV/Resume",
    question_type: "file",
    help_text: "Upload your most recent CV or resume. Accepted formats: PDF, Word documents.",
    required: true,
    allowed_file_types: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    max_file_size_mb: 10,
    max_files: 1
  }

  try {
    const question = await questionsService.createQuestion(programId, questionData)
    console.log('Created file upload question:', question.id)
    return question
  } catch (error) {
    console.error('Error creating file upload question:', error)
    throw error
  }
}

/**
 * Example 4: Create a multi-select question
 */
export async function createMultiSelectQuestion(programId: string) {
  const questionData: CreateQuestionRequest = {
    question_text: "Which programming languages are you proficient in?",
    question_type: "multi_select",
    help_text: "Select all that apply. Choose languages where you have practical experience.",
    required: false,
    options: [
      { value: "javascript", label: "JavaScript", description: "Including Node.js, React, etc." },
      { value: "python", label: "Python", description: "Including Django, Flask, data science libraries" },
      { value: "java", label: "Java", description: "Including Spring, Android development" },
      { value: "csharp", label: "C#", description: "Including .NET, ASP.NET" },
      { value: "cpp", label: "C++", description: "Including system programming" },
      { value: "go", label: "Go", description: "Including web services, CLI tools" },
      { value: "rust", label: "Rust", description: "Including system programming, WebAssembly" },
      { value: "other", label: "Other" }
    ],
    allow_other: true,
    randomize_options: false
  }

  try {
    const question = await questionsService.createQuestion(programId, questionData)
    console.log('Created multi-select question:', question.id)
    return question
  } catch (error) {
    console.error('Error creating multi-select question:', error)
    throw error
  }
}

/**
 * Example 5: Update a question
 */
export async function updateQuestionText(programId: string, questionId: string, newText: string) {
  const updates: UpdateQuestionRequest = {
    question_text: newText,
    help_text: "Updated help text for clarity"
  }

  try {
    const question = await questionsService.updateQuestion(programId, questionId, updates)
    console.log('Updated question:', question.id)
    return question
  } catch (error) {
    console.error('Error updating question:', error)
    throw error
  }
}

/**
 * Example 6: Reorder questions
 */
export async function reorderQuestions(programId: string, questionIds: string[]) {
  // Create reorder data with new order indices
  const reorderData: ReorderQuestionsRequest = {
    questions: questionIds.map((id, index) => ({
      id,
      order_index: index + 1
    }))
  }

  try {
    const questions = await questionsService.reorderQuestions(programId, reorderData)
    console.log('Reordered questions successfully')
    return questions
  } catch (error) {
    console.error('Error reordering questions:', error)
    throw error
  }
}

/**
 * Example 7: Search and use question templates
 */
export async function searchAndUseTemplates(programId: string) {
  try {
    // Search for templates
    const templates = await questionsService.searchTemplates(programId, {
      search: "email",
      category: "personal_info",
      include_private: false
    })

    console.log(`Found ${templates.length} email templates`)

    if (templates.length > 0) {
      // Use the first template
      const templateData: CreateFromTemplateRequest = {
        template_id: templates[0].id,
        required: true,
        customizations: {
          help_text: "We'll use this email for all program communications"
        }
      }

      const result = await questionsService.createFromTemplate(programId, templateData)
      console.log('Created question from template:', result.created_questions[0]?.id)
      return result
    }
  } catch (error) {
    console.error('Error with templates:', error)
    throw error
  }
}

/**
 * Example 8: Bulk create questions from templates
 */
export async function createBasicApplicationForm(programId: string) {
  // Get common templates
  const templates = await questionsService.searchTemplates(programId, {
    tags: "basic"
  })

  // Find specific templates by title
  const nameTemplate = templates.find(t => t.title.toLowerCase().includes('name'))
  const emailTemplate = templates.find(t => t.title.toLowerCase().includes('email'))
  const institutionTemplate = templates.find(t => t.title.toLowerCase().includes('institution'))
  const cvTemplate = templates.find(t => t.title.toLowerCase().includes('cv'))
  const statementTemplate = templates.find(t => t.title.toLowerCase().includes('statement'))

  if (!nameTemplate || !emailTemplate) {
    throw new Error('Required basic templates not found')
  }

  // Create multiple questions from templates
  const templateRequests: CreateFromTemplateRequest[] = [
    {
      template_id: nameTemplate.id,
      order_index: 1,
      required: true
    },
    {
      template_id: emailTemplate.id,
      order_index: 2,
      required: true
    }
  ]

  // Add optional templates if found
  if (institutionTemplate) {
    templateRequests.push({
      template_id: institutionTemplate.id,
      order_index: 3,
      required: true
    })
  }

  if (cvTemplate) {
    templateRequests.push({
      template_id: cvTemplate.id,
      order_index: 4,
      required: true
    })
  }

  if (statementTemplate) {
    templateRequests.push({
      template_id: statementTemplate.id,
      order_index: 5,
      required: true,
      customizations: {
        question_text: "Why are you interested in this program?",
        help_text: "Please write a brief statement (250-500 words) explaining your motivation and what you hope to gain."
      }
    })
  }

  try {
    const result = await questionsService.createFromTemplates(programId, {
      templates: templateRequests
    })

    console.log(`Created ${result.created_questions.length} questions from templates`)
    if (result.errors && result.errors.length > 0) {
      console.warn('Some templates failed:', result.errors)
    }

    return result
  } catch (error) {
    console.error('Error creating form from templates:', error)
    throw error
  }
}

/**
 * Example 9: Get questions with statistics
 */
export async function getQuestionsWithStats(programId: string) {
  try {
    const [questions, stats, groupedQuestions] = await Promise.all([
      questionsService.getQuestions(programId),
      questionsService.getQuestionStats(programId),
      questionsService.getQuestionsGroupedByCategory(programId)
    ])

    console.log('Question Statistics:', stats)
    console.log('Questions by category:', Object.keys(groupedQuestions.categorized))
    console.log('Uncategorized questions:', groupedQuestions.uncategorized.length)

    return { questions, stats, groupedQuestions }
  } catch (error) {
    console.error('Error fetching question data:', error)
    throw error
  }
}

/**
 * Example 10: Error handling patterns
 */
export async function demonstrateErrorHandling(programId: string) {
  try {
    // This will likely fail - demonstrates error handling
    const questionData: CreateQuestionRequest = {
      question_text: "", // Empty text will cause validation error
      question_type: "file", // File type without required fields
      required: true
    }

    await questionsService.createQuestion(programId, questionData)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation Error:', error.message)
      
      // Handle different types of errors
      if (error.message.includes('Validation failed')) {
        console.log('This is a validation error - check your input data')
      } else if (error.message.includes('Unauthorized')) {
        console.log('Authentication error - user needs to log in')
      } else if (error.message.includes('Forbidden')) {
        console.log('Permission error - user cannot modify this program')
      } else {
        console.log('Unexpected error occurred')
      }
    }
  }
}

/**
 * Example 11: React Hook usage (for client components)
 */
export function useQuestionsExample() {
  // This would typically be in a React component
  // import { useState, useEffect } from 'react'
  // import { QuestionsService } from '@/lib/services/questions'
  
  /*
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const questionsService = new QuestionsService()
        const data = await questionsService.getQuestions(programId)
        setQuestions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuestions()
  }, [programId])
  
  return { questions, loading, error }
  */
}

/**
 * Example 12: Server Action usage (for server components)
 */
export async function serverActionExample(programId: string) {
  // This would be in a server action
  'use server'
  
  try {
    const questionsService = new QuestionsService()
    const questions = await questionsService.getQuestions(programId)
    return { success: true, questions }
  } catch (error) {
    console.error('Server action error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}