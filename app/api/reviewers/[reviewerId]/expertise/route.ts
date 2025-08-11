import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/reviewers/[reviewerId]/expertise
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reviewerId: string }> }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewerId } = await params

    // Get reviewer expertise
    const { data: expertise, error } = await supabase
      .from('reviewer_expertise')
      .select('*')
      .eq('reviewer_id', reviewerId)
      .order('proficiency_level', { ascending: false })

    if (error) {
      console.error('Error fetching reviewer expertise:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: expertise })
  } catch (error) {
    console.error('Error in GET reviewer expertise:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviewers/[reviewerId]/expertise
export async function POST(
  request: Request,
  { params }: { params: Promise<{ reviewerId: string }> }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewerId } = await params
    const body = await request.json()

    // Check if user can modify this expertise (admin or self)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, roles')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.roles?.includes('super_admin')
    const isSelf = reviewerId === profile?.id

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this expertise' },
        { status: 403 }
      )
    }

    // Create expertise entry
    const { data, error } = await supabase
      .from('reviewer_expertise')
      .insert({
        reviewer_id: reviewerId,
        ...body
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating reviewer expertise:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST reviewer expertise:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/reviewers/[reviewerId]/expertise
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reviewerId: string }> }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewerId } = await params
    const { expertiseId, ...updates } = await request.json()

    if (!expertiseId) {
      return NextResponse.json(
        { error: 'Expertise ID is required' },
        { status: 400 }
      )
    }

    // Check if user can modify this expertise (admin or self)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, roles')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.roles?.includes('super_admin')
    const isSelf = reviewerId === profile?.id

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this expertise' },
        { status: 403 }
      )
    }

    // Update expertise
    const { data, error } = await supabase
      .from('reviewer_expertise')
      .update(updates)
      .eq('id', expertiseId)
      .eq('reviewer_id', reviewerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating reviewer expertise:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT reviewer expertise:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviewers/[reviewerId]/expertise/[expertiseId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ reviewerId: string; expertiseId: string }> }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewerId, expertiseId } = await params

    // Check if user can modify this expertise (admin or self)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, roles')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.roles?.includes('super_admin')
    const isSelf = reviewerId === profile?.id

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this expertise' },
        { status: 403 }
      )
    }

    // Delete expertise
    const { error } = await supabase
      .from('reviewer_expertise')
      .delete()
      .eq('id', expertiseId)
      .eq('reviewer_id', reviewerId)

    if (error) {
      console.error('Error deleting reviewer expertise:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Expertise deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE reviewer expertise:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}