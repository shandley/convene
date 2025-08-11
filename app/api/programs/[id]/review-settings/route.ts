import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/programs/[id]/review-settings
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programId = params.id

    // Get review settings for the program
    const { data: settings, error } = await supabase
      .from('review_settings')
      .select(`
        *,
        template:review_criteria_templates(*)
      `)
      .eq('program_id', programId)
      .single()

    if (error) {
      // If no settings exist yet, return null (not an error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ data: null })
      }
      console.error('Error fetching review settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Error in GET review settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/programs/[id]/review-settings
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programId = params.id
    const body = await request.json()

    // Create review settings
    const { data, error } = await supabase
      .from('review_settings')
      .insert({
        program_id: programId,
        ...body
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating review settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST review settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/programs/[id]/review-settings
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programId = params.id
    const body = await request.json()

    // Update review settings
    const { data, error } = await supabase
      .from('review_settings')
      .update(body)
      .eq('program_id', programId)
      .select()
      .single()

    if (error) {
      console.error('Error updating review settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT review settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/programs/[id]/review-settings
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programId = params.id

    // Delete review settings
    const { error } = await supabase
      .from('review_settings')
      .delete()
      .eq('program_id', programId)

    if (error) {
      console.error('Error deleting review settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Review settings deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE review settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}