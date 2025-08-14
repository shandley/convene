import { createClient } from '@/lib/supabase/server'
import { getUserFromRequest, createServiceClient } from '@/lib/supabase/server-auth'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/reviews/[id]/scores
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication using our helper that supports both cookies and Authorization header
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      console.error('Auth error in review scores:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS policies and avoid circular dependency issues
    const supabase = createServiceClient()

    const { id: assignmentId } = await params

    // First get the review for this assignment
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('assignment_id', assignmentId)
      .single()

    if (!review) {
      // No review exists yet, return empty scores
      return NextResponse.json({ data: [] })
    }

    // Get review scores
    const { data: scores, error: scoresError } = await supabase
      .from('review_scores')
      .select('*')
      .eq('review_id', review.id)

    if (scoresError) {
      console.error('Error fetching review scores:', scoresError)
      return NextResponse.json({ error: scoresError.message }, { status: 500 })
    }

    // Get criteria separately if we have scores
    let criteria: any[] = []
    if (scores && scores.length > 0) {
      const criteriaIds = scores.map(s => s.criteria_id)
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('review_criteria')
        .select('*')
        .in('id', criteriaIds)
        .order('sort_order', { ascending: true })

      if (criteriaError) {
        console.error('Error fetching review criteria:', criteriaError)
        return NextResponse.json({ error: criteriaError.message }, { status: 500 })
      }

      criteria = criteriaData || []
    }

    // Merge criteria data into scores
    const scoresWithCriteria = scores?.map(score => ({
      ...score,
      criteria: criteria.find(c => c.id === score.criteria_id)
    })) || []

    return NextResponse.json({ data: scoresWithCriteria })
  } catch (error) {
    console.error('Error in GET review scores:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/[id]/scores
// Submit or update scores for a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication using our helper that supports both cookies and Authorization header
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      console.error('Auth error in review scores POST:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS policies and avoid circular dependency issues
    const supabase = createServiceClient()

    const { id: assignmentId } = await params
    const { scores } = await request.json()

    if (!scores || !Array.isArray(scores)) {
      return NextResponse.json(
        { error: 'Invalid scores data' },
        { status: 400 }
      )
    }

    // Verify reviewer has access to this review assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select('id, reviewer_id, application_id')
      .eq('id', assignmentId)
      .eq('reviewer_id', user.id) // Ensure only the assigned reviewer can access
      .single()

    if (assignmentError || !assignment) {
      console.error('Error fetching/accessing review assignment:', assignmentError)
      return NextResponse.json(
        { error: 'Review assignment not found or access denied' },
        { status: 404 }
      )
    }

    // First, ensure a review record exists for this assignment
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from('reviews')
      .select('id')
      .eq('assignment_id', assignmentId)
      .single()

    let reviewId: string

    if (!existingReview) {
      // Create a new review record if it doesn't exist
      const { data: newReview, error: createReviewError } = await supabase
        .from('reviews')
        .insert({
          assignment_id: assignmentId,
          overall_score: 3, // Default to middle score (constraint requires 1-5)
          comments: '',
          strengths: '',
          weaknesses: '',
          recommendation: ''
        })
        .select('id')
        .single()

      if (createReviewError) {
        console.error('Error creating review record:', createReviewError)
        return NextResponse.json({ error: 'Failed to create review record' }, { status: 500 })
      }

      reviewId = newReview.id
    } else {
      reviewId = existingReview.id
    }

    // Upsert scores (insert or update)
    const scoreData = scores.map((score: any) => ({
      review_id: reviewId,
      criteria_id: score.criteria_id,
      raw_score: score.raw_score,
      normalized_score: score.normalized_score || null,
      weight_applied: score.weight_applied || 1,
      weighted_score: score.weighted_score || null,
      rubric_level: score.rubric_level || null,
      score_rationale: score.score_rationale || null,
      reviewer_confidence: score.reviewer_confidence || null
    }))

    const { data: savedScores, error: scoreError } = await supabase
      .from('review_scores')
      .upsert(scoreData, {
        onConflict: 'review_id,criteria_id'
      })
      .select()

    if (scoreError) {
      console.error('Error saving review scores:', scoreError)
      return NextResponse.json({ error: scoreError.message }, { status: 500 })
    }

    // Calculate total weighted score for the review
    const { data: weightedScore, error: calcError } = await supabase
      .rpc('calculate_application_weighted_score', {
        application_id_param: assignment.application_id
      })

    if (calcError) {
      console.error('Error calculating weighted score:', calcError)
    }

    // Update the review record with the calculated score (ensure it's within 1-5 range)
    if (weightedScore) {
      // Convert from percentage (0-100) to 1-5 scale
      const scaledScore = Math.max(1, Math.min(5, Math.round((weightedScore / 100) * 4) + 1))
      
      const { error: updateReviewError } = await supabase
        .from('reviews')
        .update({ overall_score: scaledScore })
        .eq('id', reviewId)
      
      if (updateReviewError) {
        console.error('Error updating review overall score:', updateReviewError)
      }
    }

    // Update review assignment status to in_progress or completed
    const allCriteriaScored = scores.every((s: any) => s.raw_score !== null)
    const newStatus = allCriteriaScored ? 'completed' : 'in_progress'

    const { error: statusError } = await supabase
      .from('review_assignments')
      .update({
        status: newStatus,
        completed_at: allCriteriaScored ? new Date().toISOString() : null
      })
      .eq('id', assignmentId)

    if (statusError) {
      console.error('Error updating review status:', statusError)
    }

    return NextResponse.json({
      data: savedScores,
      status: newStatus,
      message: allCriteriaScored 
        ? 'Review completed successfully' 
        : 'Scores saved successfully'
    })
  } catch (error) {
    console.error('Error in POST review scores:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id]/scores
// Clear all scores for a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication using our helper that supports both cookies and Authorization header
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      console.error('Auth error in review scores DELETE:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS policies and avoid circular dependency issues
    const supabase = createServiceClient()

    const { id: assignmentId } = await params

    // Verify reviewer has access to this review assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select('id, reviewer_id')
      .eq('id', assignmentId)
      .eq('reviewer_id', user.id) // Ensure only the assigned reviewer can access
      .single()

    if (assignmentError || !assignment) {
      console.error('Error fetching/accessing review assignment:', assignmentError)
      return NextResponse.json(
        { error: 'Review assignment not found or access denied' },
        { status: 404 }
      )
    }

    // Get the review for this assignment
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('assignment_id', assignmentId)
      .single()

    if (!review) {
      // No review exists yet, nothing to delete
      return NextResponse.json({ message: 'No scores to delete' })
    }

    // Delete all scores for this review
    const { error } = await supabase
      .from('review_scores')
      .delete()
      .eq('review_id', review.id)

    if (error) {
      console.error('Error deleting review scores:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Reset review assignment status
    const { error: statusError } = await supabase
      .from('review_assignments')
      .update({
        status: 'not_started',
        completed_at: null
      })
      .eq('id', assignmentId)

    if (statusError) {
      console.error('Error updating review status:', statusError)
    }

    return NextResponse.json({ message: 'Review scores cleared successfully' })
  } catch (error) {
    console.error('Error in DELETE review scores:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}