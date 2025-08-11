import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/programs/[id]/review-criteria/[criteriaId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; criteriaId: string }> }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { criteriaId } = await params

    // Get specific review criterion
    const { data, error } = await supabase
      .from('review_criteria')
      .select('*')
      .eq('id', criteriaId)
      .single()

    if (error) {
      console.error('Error fetching review criterion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET review criterion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/programs/[id]/review-criteria/[criteriaId]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; criteriaId: string }> }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { criteriaId } = await params
    const body = await request.json()

    // Update review criterion
    const { data, error } = await supabase
      .from('review_criteria')
      .update(body)
      .eq('id', criteriaId)
      .select()
      .single()

    if (error) {
      console.error('Error updating review criterion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT review criterion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/programs/[id]/review-criteria/[criteriaId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; criteriaId: string }> }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { criteriaId } = await params

    // Delete review criterion
    const { error } = await supabase
      .from('review_criteria')
      .delete()
      .eq('id', criteriaId)

    if (error) {
      console.error('Error deleting review criterion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Review criterion deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE review criterion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}