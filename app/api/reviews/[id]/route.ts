import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/reviews/[id]
// Fetch specific review details with criteria and existing scores
export async function GET(
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

    const { id: reviewId } = await params

    // Get review assignment details
    const { data: assignment, error: reviewError } = await supabase
      .from('review_assignments')
      .select(`
        id,
        application_id,
        reviewer_id,
        status,
        assigned_at,
        deadline,
        completed_at,
        program_id,
        application:applications(
          id,
          program_id,
          submitted_at,
          responses,
          applicant:profiles!applications_applicant_id_fkey(
            id,
            full_name,
            email
          ),
          program:programs(
            id,
            title,
            description
          )
        )
      `)
      .eq('id', reviewId)
      .eq('reviewer_id', user.id)
      .single()

    if (reviewError || !assignment) {
      return NextResponse.json(
        { error: 'Review assignment not found or access denied' },
        { status: 404 }
      )
    }

    // Get review criteria for the program
    const { data: criteria, error: criteriaError } = await supabase
      .from('review_criteria')
      .select('*')
      .eq('program_id', assignment.application.program_id)
      .order('sort_order', { ascending: true })

    if (criteriaError) {
      console.error('Error fetching review criteria:', criteriaError)
      return NextResponse.json({ error: criteriaError.message }, { status: 500 })
    }

    // Get existing scores for this review
    const { data: existingScores, error: scoresError } = await supabase
      .from('review_scores')
      .select('*')
      .eq('review_id', reviewId)

    if (scoresError) {
      console.error('Error fetching existing scores:', scoresError)
      return NextResponse.json({ error: scoresError.message }, { status: 500 })
    }

    // Create a map of existing scores by criteria_id for easy lookup
    const scoresMap = existingScores?.reduce((map, score) => {
      map[score.criteria_id] = score
      return map
    }, {} as Record<string, any>) || {}

    return NextResponse.json({ 
      data: {
        assignment,
        criteria,
        existingScores: scoresMap
      }
    })
  } catch (error) {
    console.error('Error in GET review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/reviews/[id]
// Update review overall comments and other fields
export async function PUT(
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

    const { id: reviewId } = await params
    const { overall_comments } = await request.json()

    // Verify reviewer has access to this review assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select('id, reviewer_id, application_id')
      .eq('id', reviewId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Review assignment not found' },
        { status: 404 }
      )
    }

    // Check if user is the assigned reviewer
    if (assignment.reviewer_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this review' },
        { status: 403 }
      )
    }

    // Create or update review record
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .upsert({
        application_id: assignment.application_id,
        reviewer_id: assignment.reviewer_id,
        assignment_id: reviewId,
        comments: overall_comments,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'assignment_id'
      })
      .select()
      .single()

    if (updateError) {
      console.error('Error updating review:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      data: updatedReview,
      message: 'Review updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}