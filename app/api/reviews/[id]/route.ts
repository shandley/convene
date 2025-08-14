import { createClient } from '@/lib/supabase/server'
import { getUserFromRequest, createServiceClient } from '@/lib/supabase/server-auth'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/reviews/[id]
// Fetch specific review details with criteria and existing scores
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication using our helper that supports both cookies and Authorization header
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      console.error('Auth error in review detail:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS policies and avoid circular dependency issues
    const supabase = createServiceClient()

    const { id: reviewId } = await params

    // Get review assignment details
    const { data: assignment, error: reviewError } = await supabase
      .from('review_assignments')
      .select('*')
      .eq('id', reviewId)
      .eq('reviewer_id', user.id)
      .single()

    if (reviewError || !assignment) {
      console.error('Error fetching review assignment:', reviewError)
      return NextResponse.json(
        { error: 'Review assignment not found or access denied' },
        { status: 404 }
      )
    }

    // Get application details separately to avoid circular RLS issues
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        program_id,
        submitted_at,
        responses,
        applicant_id
      `)
      .eq('id', assignment.application_id)
      .single()

    if (appError || !application) {
      console.error('Error fetching application:', appError)
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Get program details
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, title, description')
      .eq('id', application.program_id)
      .single()

    if (programError || !program) {
      console.error('Error fetching program:', programError)
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Get applicant details
    const { data: applicant, error: applicantError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', application.applicant_id)
      .single()

    if (applicantError || !applicant) {
      console.error('Error fetching applicant:', applicantError)
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      )
    }

    // Get review criteria for the program
    const { data: criteria, error: criteriaError } = await supabase
      .from('review_criteria')
      .select('*')
      .eq('program_id', application.program_id)
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

    // Reconstruct the assignment object with nested data for compatibility
    const assignmentWithNested = {
      ...assignment,
      application: {
        ...application,
        applicant: applicant,
        program: program
      }
    }

    return NextResponse.json({ 
      data: {
        assignment: assignmentWithNested,
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication using our helper that supports both cookies and Authorization header
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      console.error('Auth error in review update:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS policies and avoid circular dependency issues
    const supabase = createServiceClient()

    const { id: reviewId } = await params
    const { overall_comments } = await request.json()

    // Verify reviewer has access to this review assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select('id, reviewer_id, application_id')
      .eq('id', reviewId)
      .eq('reviewer_id', user.id) // Ensure only the assigned reviewer can modify
      .single()

    if (assignmentError || !assignment) {
      console.error('Error fetching/accessing review assignment:', assignmentError)
      return NextResponse.json(
        { error: 'Review assignment not found or access denied' },
        { status: 404 }
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