import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// POST /api/programs/[id]/apply-template
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: programId } = await params
    const { templateId } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Call the database function to apply the template
    const { data, error } = await supabase
      .rpc('apply_review_template', {
        p_program_id: programId,
        p_template_id: templateId
      })

    if (error) {
      console.error('Error applying review template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch the newly created criteria
    const { data: criteria, error: criteriaError } = await supabase
      .from('review_criteria')
      .select('*')
      .eq('program_id', programId)
      .order('sort_order', { ascending: true })

    if (criteriaError) {
      console.error('Error fetching criteria after template application:', criteriaError)
      return NextResponse.json({ error: criteriaError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Template applied successfully',
      criteriaCreated: data,
      criteria
    })
  } catch (error) {
    console.error('Error in POST apply template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}