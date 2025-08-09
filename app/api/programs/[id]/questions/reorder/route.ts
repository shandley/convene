import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const reorderSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string().uuid(),
      order_index: z.number().min(0),
      category_id: z.string().uuid().optional().nullable(),
    })
  ).min(1),
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

// POST /api/programs/[id]/questions/reorder - Reorder questions
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
    const validationResult = reorderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      )
    }

    const { questions } = validationResult.data

    // Verify all questions belong to this program
    const questionIds = questions.map(q => q.id)
    const { data: existingQuestions, error: verifyError } = await supabase
      .from('application_questions')
      .select('id, is_system_question')
      .eq('program_id', programId)
      .in('id', questionIds)

    if (verifyError) {
      console.error('Error verifying questions:', verifyError)
      return NextResponse.json(
        { error: 'Failed to verify question ownership' }, 
        { status: 500 }
      )
    }

    if (existingQuestions.length !== questions.length) {
      return NextResponse.json(
        { error: 'One or more questions do not belong to this program' }, 
        { status: 400 }
      )
    }

    // Check if any system questions are being reordered (optional constraint)
    const systemQuestions = existingQuestions.filter(q => q.is_system_question)
    if (systemQuestions.length > 0) {
      // Could optionally prevent reordering of system questions
      // For now, we'll allow it but log it
      console.log('Reordering system questions:', systemQuestions.map(q => q.id))
    }

    // Perform bulk update using a transaction-like approach
    // Since Supabase doesn't support true transactions in the client,
    // we'll update each question individually but validate first
    const updatePromises = questions.map(({ id, order_index, category_id }) =>
      supabase
        .from('application_questions')
        .update({ 
          order_index, 
          category_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('program_id', programId) // Additional safety check
    )

    const results = await Promise.all(updatePromises)
    
    // Check for any errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Error updating question order:', errors)
      return NextResponse.json(
        { error: 'Failed to update question order' }, 
        { status: 500 }
      )
    }

    // Fetch the updated questions to return
    const { data: updatedQuestions, error: fetchError } = await supabase
      .from('application_questions')
      .select(`
        *,
        category:question_categories(id, name, order_index),
        template:question_templates(id, title)
      `)
      .eq('program_id', programId)
      .in('id', questionIds)
      .order('order_index')

    if (fetchError) {
      console.error('Error fetching updated questions:', fetchError)
      return NextResponse.json(
        { error: 'Questions reordered but failed to fetch updated data' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Questions reordered successfully',
      questions: updatedQuestions
    })
  } catch (error) {
    console.error('Questions reorder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}