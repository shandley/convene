import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/review-templates/[templateId]
export async function GET(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = params

    // Get specific review template
    const { data, error } = await supabase
      .from('review_criteria_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) {
      console.error('Error fetching review template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET review template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/review-templates/[templateId]
export async function PUT(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = params
    const body = await request.json()

    // Update review template
    const { data, error } = await supabase
      .from('review_criteria_templates')
      .update(body)
      .eq('id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating review template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT review template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/review-templates/[templateId]
export async function DELETE(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = params

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('review_criteria_templates')
      .update({ is_active: false })
      .eq('id', templateId)

    if (error) {
      console.error('Error deleting review template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Review template deactivated successfully' })
  } catch (error) {
    console.error('Error in DELETE review template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}