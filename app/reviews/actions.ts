'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface ActionResult {
  success?: boolean
  error?: string
}

export async function saveDraftAction(formData: FormData): Promise<ActionResult> {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const reviewId = formData.get('reviewId') as string
    const scoresJson = formData.get('scores') as string
    const overallComments = formData.get('overallComments') as string

    if (!reviewId) {
      return { error: 'Review ID is required' }
    }

    // Parse scores data
    let scores: Record<string, any> = {}
    try {
      scores = JSON.parse(scoresJson || '{}')
    } catch (error) {
      return { error: 'Invalid scores data' }
    }

    // Verify the user owns this review assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select('id, reviewer_id, application_id')
      .eq('id', reviewId)
      .eq('reviewer_id', user.id)
      .single()

    if (assignmentError || !assignment) {
      return { error: 'Review not found or access denied' }
    }

    // Get or create review record
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from('reviews')
      .select('id')
      .eq('assignment_id', reviewId)
      .single()

    let reviewRecordId: string

    if (!existingReview) {
      // Create a new review record
      const { data: newReview, error: createReviewError } = await supabase
        .from('reviews')
        .insert({
          assignment_id: reviewId,
          overall_score: 3, // Default to middle score
          comments: overallComments.trim() || '',
          strengths: '',
          weaknesses: '',
          recommendation: ''
        })
        .select('id')
        .single()

      if (createReviewError) {
        console.error('Error creating review record:', createReviewError)
        return { error: 'Failed to create review record' }
      }

      reviewRecordId = newReview.id
    } else {
      reviewRecordId = existingReview.id
    }

    // Save scores
    const scoresArray = Object.values(scores).filter((score: any) => 
      score && typeof score.raw_score === 'number'
    ).map((score: any) => ({
      review_id: reviewRecordId,
      criteria_id: score.criteria_id,
      raw_score: score.raw_score,
      normalized_score: score.normalized_score || null,
      weight_applied: score.weight_applied || 1,
      weighted_score: score.weighted_score || null,
      rubric_level: score.rubric_level || null,
      score_rationale: score.score_rationale || null,
      reviewer_confidence: score.reviewer_confidence || null
    }))

    if (scoresArray.length === 0) {
      return { error: 'No valid scores to save' }
    }

    // Upsert scores (update if exists, insert if not)
    const { error: scoreError } = await supabase
      .from('review_scores')
      .upsert(scoresArray, {
        onConflict: 'review_id,criteria_id'
      })

    if (scoreError) {
      console.error('Error saving scores:', scoreError)
      return { error: `Failed to save scores: ${scoreError.message}` }
    }

    // Update assignment status to in_progress if not already completed
    const { error: statusError } = await supabase
      .from('review_assignments')
      .update({ status: 'in_progress' })
      .eq('id', reviewId)
      .neq('status', 'completed')

    if (statusError) {
      console.error('Error updating assignment status:', statusError)
      // Don't return error for this - scores were saved successfully
    }

    // Save overall comments if provided
    if (overallComments.trim()) {
      const { error: commentsError } = await supabase
        .from('reviews')
        .update({ 
          comments: overallComments.trim()
        })
        .eq('id', reviewRecordId)

      if (commentsError) {
        console.error('Error saving comments:', commentsError)
        // Don't return error - scores were saved successfully
      }
    }

    // Revalidate the page to show updated data
    revalidatePath(`/reviews/${reviewId}`)
    revalidatePath('/reviews')

    return { success: true }
  } catch (error) {
    console.error('Error in saveDraftAction:', error)
    return { error: 'An unexpected error occurred while saving' }
  }
}

export async function submitReviewAction(formData: FormData): Promise<ActionResult> {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Authentication required' }
    }

    const reviewId = formData.get('reviewId') as string
    const scoresJson = formData.get('scores') as string
    const overallComments = formData.get('overallComments') as string

    if (!reviewId) {
      return { error: 'Review ID is required' }
    }

    // Parse scores data
    let scores: Record<string, any> = {}
    try {
      scores = JSON.parse(scoresJson || '{}')
    } catch (error) {
      return { error: 'Invalid scores data' }
    }

    // Verify the user owns this review assignment and get program info
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select(`
        id, 
        reviewer_id, 
        application_id,
        application:applications(program_id)
      `)
      .eq('id', reviewId)
      .eq('reviewer_id', user.id)
      .single()

    if (assignmentError || !assignment) {
      return { error: 'Review not found or access denied' }
    }

    const programId = (assignment.application as any)?.program_id
    if (!programId) {
      return { error: 'Unable to determine program for validation' }
    }

    // Get review criteria to validate completeness
    const { data: criteria, error: criteriaError } = await supabase
      .from('review_criteria')
      .select('id')
      .eq('program_id', programId)

    if (criteriaError || !criteria) {
      return { error: 'Failed to validate review criteria' }
    }

    // Validate that all criteria are scored
    const scoredCriteriaIds = Object.values(scores)
      .filter((score: any) => score && typeof score.raw_score === 'number')
      .map((score: any) => score.criteria_id)

    const requiredCriteriaIds = criteria.map((c: any) => c.id)
    const missingCriteria = requiredCriteriaIds.filter((id: any) => !scoredCriteriaIds.includes(id))

    if (missingCriteria.length > 0) {
      return { error: `Please score all criteria before submitting (${missingCriteria.length} missing)` }
    }

    // Get or create review record
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from('reviews')
      .select('id')
      .eq('assignment_id', reviewId)
      .single()

    let reviewRecordId: string

    if (!existingReview) {
      // Create a new review record
      const { data: newReview, error: createReviewError } = await supabase
        .from('reviews')
        .insert({
          assignment_id: reviewId,
          overall_score: 3, // Default to middle score
          comments: overallComments.trim() || '',
          strengths: '',
          weaknesses: '',
          recommendation: ''
        })
        .select('id')
        .single()

      if (createReviewError) {
        console.error('Error creating review record:', createReviewError)
        return { error: 'Failed to create review record' }
      }

      reviewRecordId = newReview.id
    } else {
      reviewRecordId = existingReview.id
    }

    // Save all scores
    const scoresArray = Object.values(scores).map((score: any) => ({
      review_id: reviewRecordId,
      criteria_id: score.criteria_id,
      raw_score: score.raw_score,
      normalized_score: score.normalized_score || null,
      weight_applied: score.weight_applied || 1,
      weighted_score: score.weighted_score || null,
      rubric_level: score.rubric_level || null,
      score_rationale: score.score_rationale || null,
      reviewer_confidence: score.reviewer_confidence || null
    }))

    // Upsert all scores
    const { error: scoreError } = await supabase
      .from('review_scores')
      .upsert(scoresArray, {
        onConflict: 'review_id,criteria_id'
      })

    if (scoreError) {
      console.error('Error saving scores:', scoreError)
      return { error: `Failed to save scores: ${scoreError.message}` }
    }

    // Update review with overall comments
    if (overallComments.trim()) {
      const { error: commentsError } = await supabase
        .from('reviews')
        .update({ 
          comments: overallComments.trim()
        })
        .eq('id', reviewRecordId)

      if (commentsError) {
        console.error('Error saving comments:', commentsError)
        // Don't return error - review was saved successfully
      }
    }

    // Update assignment status to completed and set completion time
    const { error: statusError } = await supabase
      .from('review_assignments')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', reviewId)

    if (statusError) {
      console.error('Error updating assignment status:', statusError)
      return { error: `Failed to complete review: ${statusError.message}` }
    }

    // Revalidate pages to show updated data
    revalidatePath(`/reviews/${reviewId}`)
    revalidatePath('/reviews')

    return { success: true }
  } catch (error) {
    console.error('Error in submitReviewAction:', error)
    return { error: 'An unexpected error occurred while submitting' }
  }
}