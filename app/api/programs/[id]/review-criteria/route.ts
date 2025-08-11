import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/programs/[id]/review-criteria
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programId = params.id

    // Get review criteria for the program
    const { data: criteria, error } = await supabase
      .from('review_criteria')
      .select('*')
      .eq('program_id', programId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching review criteria:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: criteria })
  } catch (error) {
    console.error('Error in GET review criteria:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/programs/[id]/review-criteria
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programId = params.id
    const body = await request.json()

    // If sort_order is not provided, get the next available order
    if (body.sort_order === undefined) {
      const { data: existingCriteria } = await supabase
        .from('review_criteria')
        .select('sort_order')
        .eq('program_id', programId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      body.sort_order = existingCriteria ? existingCriteria.sort_order + 1 : 1
    }

    // Create review criterion
    const { data, error } = await supabase
      .from('review_criteria')
      .insert({
        program_id: programId,
        ...body
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating review criterion:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST review criteria:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/programs/[id]/review-criteria/bulk
// Bulk update for reordering criteria
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programId = params.id
    const { criteria } = await request.json()

    // Bulk update criteria (useful for reordering)
    const updates = criteria.map((criterion: any) => 
      supabase
        .from('review_criteria')
        .update({ sort_order: criterion.sort_order })
        .eq('id', criterion.id)
        .eq('program_id', programId)
    )

    const results = await Promise.all(updates)
    const hasError = results.some(result => result.error)

    if (hasError) {
      return NextResponse.json(
        { error: 'Failed to update some criteria' },
        { status: 500 }
      )
    }

    // Return updated criteria
    const { data, error } = await supabase
      .from('review_criteria')
      .select('*')
      .eq('program_id', programId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching updated criteria:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT review criteria:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}