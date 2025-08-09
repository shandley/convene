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

    // TODO: Implement template search once question_templates table is added to TypeScript types
    // For now, return empty array as the table doesn't exist in the types
    const templates: any[] = []
    const error = null

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

    const createdQuestions: any[] = []
    const errors: Array<{ template_id: string; error: string }> = []

    // TODO: Implement template-based question creation once question_templates table is added to TypeScript types
    // For now, skip template processing
    // The template creation logic will be restored once database types are regenerated
    
    // Process each template
    for (const templateConfig of templates) {
      errors.push({
        template_id: templateConfig.template_id,
        error: 'Template functionality not yet available'
      })
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