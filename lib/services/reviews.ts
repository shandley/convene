import type { Review } from '@/components/reviews/ReviewCard'

/**
 * Custom error class for review service errors
 */
export class ReviewServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'ReviewServiceError'
  }
}

/**
 * Safe wrapper for async operations with error handling
 */
export async function safeReviewOperation<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    console.error('Review service error:', error)
    
    if (error instanceof ReviewServiceError) {
      throw error
    }
    
    if (error instanceof Error) {
      throw new ReviewServiceError(
        errorMessage || error.message,
        'OPERATION_FAILED'
      )
    }
    
    throw new ReviewServiceError(
      errorMessage || 'An unexpected error occurred',
      'UNKNOWN_ERROR'
    )
  }
}

/**
 * Handle HTTP response errors
 */
function handleResponseError(response: Response): never {
  const status = response.status
  let message = 'An error occurred'
  
  switch (status) {
    case 400:
      message = 'Invalid request data'
      break
    case 401:
      message = 'You are not authorized to perform this action'
      break
    case 403:
      message = 'You do not have permission to access this resource'
      break
    case 404:
      message = 'The requested resource was not found'
      break
    case 409:
      message = 'There was a conflict with your request'
      break
    case 422:
      message = 'The request data is invalid'
      break
    case 429:
      message = 'Too many requests. Please try again later'
      break
    case 500:
      message = 'Internal server error. Please try again later'
      break
    case 503:
      message = 'Service temporarily unavailable. Please try again later'
      break
    default:
      message = `Request failed with status ${status}`
  }
  
  throw new ReviewServiceError(message, `HTTP_${status}`, status)
}

export interface ReviewStats {
  total: number
  inProgress: number
  completed: number
  overdue: number
  notStarted?: number
}

export interface ReviewScore {
  criteria_id: string
  raw_score: number | null
  normalized_score?: number | null
  weight_applied?: number
  weighted_score?: number | null
  rubric_level?: string | null
  score_rationale?: string | null
  reviewer_confidence?: number | null
}

export interface ReviewCriterion {
  id: string
  name: string
  description: string
  scoring_type: 'numerical' | 'categorical' | 'binary'
  weight: number
  max_score: number
  min_score: number
  rubric_definition?: Record<string, string>
  scoring_guide?: string
  sort_order?: number
}

export interface ReviewDetail {
  review: Review & {
    overall_comments?: string
    application: {
      id: string
      program_id: string
      applicant_name: string
      applicant_email: string
      submitted_at: string
      application_data?: any
      program: {
        id: string
        title: string
        description: string
      }
    }
  }
  criteria: ReviewCriterion[]
  existingScores: Record<string, ReviewScore>
}

export interface ReviewFilterOptions {
  status?: 'all' | 'not_started' | 'in_progress' | 'completed' | 'overdue'
  priority?: 'all' | 'low' | 'medium' | 'high'
  program?: string
  sort?: 'due_date' | 'priority' | 'status' | 'program'
  order?: 'asc' | 'desc'
}

/**
 * Fetch all reviews assigned to current user
 */
export async function getMyReviews(filters?: ReviewFilterOptions): Promise<Review[]> {
  return safeReviewOperation(async () => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value)
        }
      })
    }

    const response = await fetch(`/api/reviews?${params.toString()}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      handleResponseError(response)
    }

    const { data } = await response.json()
    return data || []
  }, 'Failed to fetch reviews') ?? []
}

/**
 * Get reviewer statistics
 */
export async function getReviewStats(): Promise<ReviewStats> {
  try {
    const response = await fetch('/api/reviews/stats', {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch review stats: ${response.statusText}`)
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching review stats:', error)
    throw error
  }
}

/**
 * Get specific review details with criteria and existing scores
 */
export async function getReviewById(reviewId: string): Promise<ReviewDetail> {
  try {
    const response = await fetch(`/api/reviews/${reviewId}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch review: ${response.statusText}`)
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching review:', error)
    throw error
  }
}

/**
 * Save review scores (draft or final)
 */
export async function saveReviewScores(
  reviewId: string, 
  scores: ReviewScore[]
): Promise<{ success: boolean; status: string; message: string }> {
  try {
    const response = await fetch(`/api/reviews/${reviewId}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ scores }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to save review scores')
    }

    const result = await response.json()
    return {
      success: true,
      status: result.status,
      message: result.message
    }
  } catch (error) {
    console.error('Error saving review scores:', error)
    throw error
  }
}

/**
 * Update review overall comments
 */
export async function updateReviewComments(
  reviewId: string, 
  overallComments: string
): Promise<void> {
  try {
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ overall_comments: overallComments }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update review comments')
    }
  } catch (error) {
    console.error('Error updating review comments:', error)
    throw error
  }
}

/**
 * Submit final review (convenience method)
 */
export async function submitReview(
  reviewId: string, 
  scores: ReviewScore[],
  overallComments?: string
): Promise<void> {
  try {
    // First save the overall comments if provided
    if (overallComments) {
      await updateReviewComments(reviewId, overallComments)
    }

    // Then save the scores (this will automatically set status to completed if all criteria are scored)
    const result = await saveReviewScores(reviewId, scores)
    
    if (result.status !== 'completed') {
      throw new Error('Review submission failed: Not all criteria have been scored')
    }
  } catch (error) {
    console.error('Error submitting review:', error)
    throw error
  }
}

/**
 * Clear all scores for a review
 */
export async function clearReviewScores(reviewId: string): Promise<void> {
  try {
    const response = await fetch(`/api/reviews/${reviewId}/scores`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to clear review scores')
    }
  } catch (error) {
    console.error('Error clearing review scores:', error)
    throw error
  }
}

/**
 * Get existing scores for a review
 */
export async function getReviewScores(reviewId: string): Promise<ReviewScore[]> {
  try {
    const response = await fetch(`/api/reviews/${reviewId}/scores`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch review scores: ${response.statusText}`)
    }

    const { data } = await response.json()
    return data || []
  } catch (error) {
    console.error('Error fetching review scores:', error)
    throw error
  }
}