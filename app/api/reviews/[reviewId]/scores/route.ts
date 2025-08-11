import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/reviews/[reviewId]/scores
export async function GET(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = params

    // Get review scores with criteria details
    const { data: scores, error } = await supabase
      .from('review_scores')
      .select(`
        *,
        criteria:review_criteria(*)
      `)
      .eq('review_id', reviewId)
      .order('criteria(sort_order)', { ascending: true })

    if (error) {
      console.error('Error fetching review scores:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: scores })
  } catch (error) {
    console.error('Error in GET review scores:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/[reviewId]/scores
// Submit or update scores for a review
export async function POST(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = params
    const { scores } = await request.json()

    if (!scores || !Array.isArray(scores)) {
      return NextResponse.json(
        { error: 'Invalid scores data' },
        { status: 400 }
      )
    }

    // Verify reviewer has access to this review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, reviewer_id, application_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if user is the assigned reviewer
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (review.reviewer_id !== profile?.id) {
      return NextResponse.json(
        { error: 'You are not authorized to score this review' },
        { status: 403 }
      )
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
        p_application_id: review.application_id
      })

    if (calcError) {
      console.error('Error calculating weighted score:', calcError)
    }

    // Update review status to in_progress or completed
    const allCriteriaScored = scores.every((s: any) => s.raw_score !== null)
    const newStatus = allCriteriaScored ? 'completed' : 'in_progress'

    const { error: statusError } = await supabase
      .from('reviews')
      .update({
        status: newStatus,
        submitted_at: allCriteriaScored ? new Date().toISOString() : null
      })
      .eq('id', reviewId)

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

// DELETE /api/reviews/[reviewId]/scores
// Clear all scores for a review
export async function DELETE(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = params

    // Verify reviewer has access to this review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, reviewer_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if user is the assigned reviewer
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (review.reviewer_id !== profile?.id) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this review' },
        { status: 403 }
      )
    }

    // Delete all scores for this review
    const { error } = await supabase
      .from('review_scores')
      .delete()
      .eq('review_id', reviewId)

    if (error) {
      console.error('Error deleting review scores:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Reset review status
    const { error: statusError } = await supabase
      .from('reviews')
      .update({
        status: 'not_started',
        submitted_at: null
      })
      .eq('id', reviewId)

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