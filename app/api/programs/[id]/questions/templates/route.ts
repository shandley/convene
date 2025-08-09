import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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
    validation_rules: z.record(z.any()).optional(),
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

    // Use the search function from the database
    const { data: templates, error } = await supabase
      .rpc('search_question_templates', {
        search_text: search,
        category_filter: category,
        type_filter: questionType,
        tag_filter: tags,
        include_private: includePrivate,
        created_by_filter: null,
      })

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
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

    const createdQuestions = []
    const errors = []

    // Process each template
    for (const templateConfig of templates) {
      try {
        // Get the template details
        const { data: template, error: templateError } = await supabase
          .from('question_templates')
          .select('*')
          .eq('id', templateConfig.template_id)
          .single()

        if (templateError || !template) {
          errors.push({
            template_id: templateConfig.template_id,
            error: 'Template not found'
          })
          continue
        }

        // Check if template is accessible (public or owned by user)
        if (!template.is_public && template.created_by !== user.id) {
          errors.push({
            template_id: templateConfig.template_id,
            error: 'Template not accessible'
          })
          continue
        }

        // Determine order index if not provided
        let orderIndex = templateConfig.order_index
        if (orderIndex === undefined) {
          const { data: maxOrderData } = await supabase
            .from('application_questions')
            .select('order_index')
            .eq('program_id', programId)
            .eq('category_id', templateConfig.category_id || null)
            .order('order_index', { ascending: false })
            .limit(1)
            .maybeSingle()

          orderIndex = (maxOrderData?.order_index || 0) + 1
        }

        // Apply customizations if provided
        const customizations = templateConfig.customizations || {}
        
        // Create the question data
        const questionData = {
          program_id: programId,
          category_id: templateConfig.category_id,
          template_id: template.id,
          question_text: customizations.question_text || template.question_text,
          question_type: template.question_type,
          help_text: customizations.help_text || template.help_text,
          placeholder: customizations.placeholder || template.placeholder,
          required: templateConfig.required !== undefined ? templateConfig.required : template.required,
          max_length: template.max_length,
          validation_rules: customizations.validation_rules || template.validation_rules,
          options: customizations.options || template.options,
          allowed_file_types: template.allowed_file_types,
          max_file_size_mb: template.max_file_size_mb,
          max_files: template.max_files,
          allow_other: template.allow_other,
          randomize_options: template.randomize_options,
          order_index: orderIndex,
        }

        // Create the question
        const { data: question, error: createError } = await supabase
          .from('application_questions')
          .insert(questionData)
          .select(`
            *,
            category:question_categories(id, name, order_index),
            template:question_templates(id, title)
          `)
          .single()

        if (createError) {
          console.error('Error creating question from template:', createError)
          errors.push({
            template_id: templateConfig.template_id,
            error: 'Failed to create question'
          })
          continue
        }

        // Update template usage count
        await supabase
          .from('question_templates')
          .update({ usage_count: template.usage_count + 1 })
          .eq('id', template.id)

        createdQuestions.push(question)
      } catch (error) {
        console.error('Error processing template:', error)
        errors.push({
          template_id: templateConfig.template_id,
          error: 'Unexpected error'
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