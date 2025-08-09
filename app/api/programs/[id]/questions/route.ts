import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Database } from '@/types/database.types'

// Question validation schemas
const questionTypeSchema = z.enum([
  'text', 'textarea', 'select', 'multi_select', 'checkbox', 
  'file', 'number', 'date', 'email', 'url', 'phone'
])

const questionCategorySchema = z.enum([
  'personal_info', 'background', 'experience', 'essays', 
  'preferences', 'documents', 'custom'
])

const createQuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required'),
  question_type: questionTypeSchema,
  category_id: z.string().uuid().optional(),
  help_text: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  max_length: z.number().positive().optional(),
  validation_rules: z.record(z.string(), z.any()).optional(),
  options: z.array(z.any()).optional(),
  allowed_file_types: z.array(z.string()).optional(),
  max_file_size_mb: z.number().positive().optional(),
  max_files: z.number().positive().default(1),
  allow_other: z.boolean().default(false),
  randomize_options: z.boolean().default(false),
  depends_on_question_id: z.string().uuid().optional(),
  show_condition: z.record(z.string(), z.any()).optional(),
  order_index: z.number().optional(),
  template_id: z.string().uuid().optional(),
})

const updateQuestionSchema = createQuestionSchema.partial()

// Helper function to verify program ownership
async function verifyProgramOwnership(supabase: any, programId: string, userId: string) {
  const { data: program, error } = await supabase
    .from('programs')
    .select('created_by')
    .eq('id', programId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'Program not found', status: 404 }
    }
    return { error: 'Failed to verify program ownership', status: 500 }
  }

  // For now, only allow the creator to manage questions (can be expanded for admins later)
  if (program.created_by !== userId) {
    return { error: 'Forbidden', status: 403 }
  }

  return { success: true }
}

// GET /api/programs/[id]/questions - Get all questions for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify program ownership
    const ownership = await verifyProgramOwnership(supabase, programId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    // Get URL search params for filtering
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    let query = supabase
      .from('application_questions')
      .select(`
        *,
        category:question_categories(id, name, order_index),
        template:question_templates(id, title)
      `)
      .eq('program_id', programId)
      .order('order_index')

    // Filter by category if specified
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: questions, error } = await query

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/programs/[id]/questions - Add a new question to a program
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify program ownership
    const ownership = await verifyProgramOwnership(supabase, programId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = createQuestionSchema.safeParse(body)
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

    // Determine order index if not provided
    let orderIndex = questionData.order_index
    if (orderIndex === undefined) {
      const { data: maxOrderData } = await supabase
        .from('application_questions')
        .select('order_index')
        .eq('program_id', programId)
        .eq('category_id', questionData.category_id || null)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle()

      orderIndex = (maxOrderData?.order_index || 0) + 1
    }

    // Validate file type requirements
    if (questionData.question_type === 'file') {
      if (!questionData.allowed_file_types || questionData.allowed_file_types.length === 0) {
        return NextResponse.json(
          { error: 'File questions must specify allowed_file_types' }, 
          { status: 400 }
        )
      }
      if (!questionData.max_file_size_mb || questionData.max_file_size_mb <= 0) {
        return NextResponse.json(
          { error: 'File questions must specify max_file_size_mb > 0' }, 
          { status: 400 }
        )
      }
    }

    // Validate select questions have options
    if (['select', 'multi_select'].includes(questionData.question_type)) {
      if (!questionData.options || questionData.options.length === 0) {
        return NextResponse.json(
          { error: 'Select questions must have options defined' }, 
          { status: 400 }
        )
      }
    }

    const insertData = {
      program_id: programId,
      category_id: questionData.category_id || null,
      question_text: questionData.question_text,
      question_type: questionData.question_type,
      help_text: questionData.help_text || null,
      placeholder: questionData.placeholder || null,
      required: questionData.required || false,
      max_length: questionData.max_length || null,
      validation_rules: questionData.validation_rules || {},
      options: questionData.options || null,
      allowed_file_types: questionData.allowed_file_types || null,
      max_file_size_mb: questionData.max_file_size_mb || null,
      max_files: questionData.max_files || 1,
      allow_other: questionData.allow_other || false,
      randomize_options: questionData.randomize_options || false,
      depends_on_question_id: questionData.depends_on_question_id || null,
      show_condition: questionData.show_condition || null,
      order_index: orderIndex,
      template_id: questionData.template_id || null,
    }

    const { data: question, error } = await supabase
      .from('application_questions')
      .insert(insertData)
      .select(`
        *,
        category:question_categories(id, name, order_index),
        template:question_templates(id, title)
      `)
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    console.error('Questions POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}