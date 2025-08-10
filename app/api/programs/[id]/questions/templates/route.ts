import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Define enum values for type safety
const QUESTION_CATEGORIES = [
  'personal_info',
  'background', 
  'experience',
  'essays',
  'preferences',
  'documents',
  'custom'
] as const

const QUESTION_TYPES = [
  'text',
  'textarea',
  'select', 
  'multi_select',
  'checkbox',
  'file',
  'number',
  'date',
  'email',
  'url',
  'phone'
] as const

type QuestionCategory = typeof QUESTION_CATEGORIES[number]
type QuestionType = typeof QUESTION_TYPES[number]

const createFromTemplateSchema = z.object({
  template_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  order_index: z.number().optional(),
  required: z.boolean().optional(),
  customizations: z.object({
    question_text: z.string().optional(),
    help_text: z.string().optional(),
    placeholder: z.string().optional(),
    options: z.array(z.any()).optional(),
    validation_rules: z.record(z.string(), z.any()).optional(),
  }).optional(),
})

const bulkCreateFromTemplatesSchema = z.object({
  templates: z.array(createFromTemplateSchema).min(1),
})

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

  if (program.created_by !== userId) {
    return { error: 'Forbidden', status: 403 }
  }

  return { success: true }
}

// GET /api/programs/[id]/questions/templates - Get available question templates
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
    const category = searchParams.get('category')
    const questionType = searchParams.get('type')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')
    const includePrivate = searchParams.get('include_private') === 'true'

    // Build query for templates
    let query = supabase
      .from('question_templates')
      .select('*')
      .or(`is_public.eq.true${includePrivate ? ',created_by.eq.' + user.id : ''}`)
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters with type validation
    if (category && QUESTION_CATEGORIES.includes(category as QuestionCategory)) {
      query = query.eq('category', category as QuestionCategory)
    }
    if (questionType && QUESTION_TYPES.includes(questionType as QuestionType)) {
      query = query.eq('question_type', questionType as QuestionType)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,question_text.ilike.%${search}%`)
    }
    if (tags) {
      query = query.contains('tags', [tags])
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/programs/[id]/questions/templates - Create question(s) from template(s)
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
    
    // Check if this is a bulk operation or single template
    let templates: any[]
    if (body.templates) {
      // Bulk operation
      const validationResult = bulkCreateFromTemplatesSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationResult.error.issues 
          }, 
          { status: 400 }
        )
      }
      templates = validationResult.data.templates
    } else {
      // Single template operation
      const validationResult = createFromTemplateSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationResult.error.issues 
          }, 
          { status: 400 }
        )
      }
      templates = [validationResult.data]
    }

    const createdQuestions: any[] = []
    const errors: Array<{ template_id: string; error: string }> = []

    // Process each template
    for (const templateConfig of templates) {
      try {
        // Use the create_question_from_template RPC function
        const { data: questionId, error: createError } = await supabase.rpc('create_question_from_template', {
          p_program_id: programId,
          p_template_id: templateConfig.template_id,
          p_category_id: templateConfig.category_id || null,
          p_order_index: templateConfig.order_index || null,
          p_required: templateConfig.required !== undefined ? templateConfig.required : null
        })

        if (createError) {
          errors.push({
            template_id: templateConfig.template_id,
            error: createError.message || 'Failed to create question from template'
          })
          continue
        }

        if (!questionId) {
          errors.push({
            template_id: templateConfig.template_id,
            error: 'No question ID returned from template creation'
          })
          continue
        }

        // Fetch the complete question data with relations
        const { data: question, error: fetchError } = await supabase
          .from('application_questions')
          .select(`
            *,
            question_templates(id, title)
          `)
          .eq('id', questionId)
          .single()

        if (fetchError || !question) {
          errors.push({
            template_id: templateConfig.template_id,
            error: 'Failed to fetch created question data'
          })
          continue
        }

        // Apply any customizations if provided
        if (templateConfig.customizations) {
          const updates: any = {}
          const customizations = templateConfig.customizations

          if (customizations.question_text) updates.question_text = customizations.question_text
          if (customizations.help_text) updates.help_text = customizations.help_text
          if (customizations.placeholder) updates.placeholder = customizations.placeholder
          if (customizations.options) updates.options = customizations.options
          if (customizations.validation_rules) updates.validation_rules = customizations.validation_rules

          if (Object.keys(updates).length > 0) {
            const { data: updatedQuestion, error: updateError } = await supabase
              .from('application_questions')
              .update(updates)
              .eq('id', questionId)
              .select(`
                *,
                question_templates(id, title)
              `)
              .single()

            if (updateError) {
              errors.push({
                template_id: templateConfig.template_id,
                error: 'Question created but failed to apply customizations'
              })
            } else if (updatedQuestion) {
              createdQuestions.push(updatedQuestion)
            }
          } else {
            createdQuestions.push(question)
          }
        } else {
          createdQuestions.push(question)
        }

        // Track template usage (increment usage_count)
        const { data: template } = await supabase
          .from('question_templates')
          .select('usage_count')
          .eq('id', templateConfig.template_id)
          .single()
        
        if (template) {
          await supabase
            .from('question_templates')
            .update({ usage_count: (template.usage_count || 0) + 1 })
            .eq('id', templateConfig.template_id)
        }
      } catch (templateError) {
        console.error(`Error processing template ${templateConfig.template_id}:`, templateError)
        errors.push({
          template_id: templateConfig.template_id,
          error: templateError instanceof Error ? templateError.message : 'Unknown error occurred'
        })
      }
    }

    // Return results
    const response: any = {
      success: createdQuestions.length > 0,
      created_questions: createdQuestions,
    }

    if (errors.length > 0) {
      response.errors = errors
    }

    if (createdQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions were created', details: errors }, 
        { status: 400 }
      )
    }

    const status = errors.length > 0 ? 207 : 201 // 207 Multi-Status if partial success
    return NextResponse.json(response, { status })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}