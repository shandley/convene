import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Database } from '@/types/database.types'

// Question validation schemas
const questionTypeSchema = z.enum([
  'text', 'textarea', 'select', 'multi_select', 'checkbox', 
  'file', 'number', 'date', 'email', 'url', 'phone'
])

const updateQuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required').optional(),
  question_type: questionTypeSchema.optional(),
  category_id: z.string().uuid().optional(),
  help_text: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  max_length: z.number().positive().optional(),
  validation_rules: z.record(z.string(), z.any()).optional(),
  options: z.array(z.any()).optional(),
  allowed_file_types: z.array(z.string()).optional(),
  max_file_size_mb: z.number().positive().optional(),
  max_files: z.number().positive().optional(),
  allow_other: z.boolean().optional(),
  randomize_options: z.boolean().optional(),
  depends_on_question_id: z.string().uuid().optional(),
  show_condition: z.record(z.string(), z.any()).optional(),
  order_index: z.number().optional(),
})

// Helper function to verify program ownership and question ownership
async function verifyQuestionOwnership(
  supabase: any, 
  programId: string, 
  questionId: string, 
  userId: string
) {
  const { data: question, error } = await supabase
    .from('application_questions')
    .select(`
      id,
      program_id,
      is_system_question,
      program:programs!inner(created_by)
    `)
    .eq('id', questionId)
    .eq('program_id', programId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'Question not found', status: 404 }
    }
    return { error: 'Failed to verify question ownership', status: 500 }
  }

  // For now, only allow the program creator to manage questions
  if (question.program.created_by !== userId) {
    return { error: 'Forbidden', status: 403 }
  }

  return { success: true, question }
}

// GET /api/programs/[id]/questions/[questionId] - Get single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId, questionId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const ownership = await verifyQuestionOwnership(supabase, programId, questionId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    const { data: question, error } = await supabase
      .from('application_questions')
      .select(`
        *,
        category:question_categories(id, name, order_index),
        template:question_templates(id, title),
        dependent_questions:application_questions!depends_on_question_id(id, question_text, question_type)
      `)
      .eq('id', questionId)
      .single()

    if (error) {
      console.error('Error fetching question:', error)
      return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Question GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/programs/[id]/questions/[questionId] - Update question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId, questionId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const ownership = await verifyQuestionOwnership(supabase, programId, questionId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    // Check if it's a system question
    if (ownership.question.is_system_question) {
      return NextResponse.json(
        { error: 'System questions cannot be modified' }, 
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = updateQuestionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      )
    }

    const questionData = validationResult.data

    // Validate file type requirements if updating to file type
    if (questionData.question_type === 'file') {
      if (questionData.allowed_file_types && questionData.allowed_file_types.length === 0) {
        return NextResponse.json(
          { error: 'File questions must specify allowed_file_types' }, 
          { status: 400 }
        )
      }
      if (questionData.max_file_size_mb !== undefined && questionData.max_file_size_mb <= 0) {
        return NextResponse.json(
          { error: 'File questions must specify max_file_size_mb > 0' }, 
          { status: 400 }
        )
      }
    }

    // Validate select questions have options if updating to select type
    if (questionData.question_type && ['select', 'multi_select'].includes(questionData.question_type)) {
      if (questionData.options && questionData.options.length === 0) {
        return NextResponse.json(
          { error: 'Select questions must have options defined' }, 
          { status: 400 }
        )
      }
    }

    const updateData = {
      ...questionData,
      validation_rules: questionData.validation_rules || undefined,
      options: questionData.options || undefined,
      show_condition: questionData.show_condition || undefined,
      updated_at: new Date().toISOString(),
    }

    const { data: question, error } = await supabase
      .from('application_questions')
      .update(updateData)
      .eq('id', questionId)
      .select(`
        *,
        category:question_categories(id, name, order_index),
        template:question_templates(id, title)
      `)
      .single()

    if (error) {
      console.error('Error updating question:', error)
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Question PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/programs/[id]/questions/[questionId] - Delete question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId, questionId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const ownership = await verifyQuestionOwnership(supabase, programId, questionId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    // Check if it's a system question
    if (ownership.question.is_system_question) {
      return NextResponse.json(
        { error: 'System questions cannot be deleted' }, 
        { status: 400 }
      )
    }

    // Check if question has dependent questions
    const { data: dependentQuestions, error: dependentError } = await supabase
      .from('application_questions')
      .select('id, question_text')
      .eq('depends_on_question_id', questionId)

    if (dependentError) {
      console.error('Error checking dependent questions:', dependentError)
      return NextResponse.json(
        { error: 'Failed to verify question dependencies' }, 
        { status: 500 }
      )
    }

    if (dependentQuestions && dependentQuestions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete question with dependent questions. Remove dependencies first.',
          dependentQuestions: dependentQuestions.map(q => ({ id: q.id, text: q.question_text }))
        }, 
        { status: 400 }
      )
    }

    // Check if question has responses (applications submitted)
    const { data: responses, error: responsesError } = await supabase
      .from('application_responses')
      .select('id')
      .eq('question_id', questionId)
      .limit(1)

    if (responsesError) {
      console.error('Error checking question responses:', responsesError)
      return NextResponse.json(
        { error: 'Failed to verify question usage' }, 
        { status: 500 }
      )
    }

    if (responses && responses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete question that has been answered by applicants' }, 
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('application_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Error deleting question:', error)
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Question DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}