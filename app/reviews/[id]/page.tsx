'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { ScoreCriterion, type ReviewCriterion, type ReviewScore } from '@/components/reviews/ScoreCriterion'
import { ReviewProgress } from '@/components/reviews/ReviewProgress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Save, 
  Send, 
  User, 
  Calendar, 
  Clock,
  AlertCircle 
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from '@/hooks/use-toast'

// Types for API responses
interface ReviewAssignment {
  id: string
  application_id: string
  reviewer_id: string
  status: string
  assigned_at: string
  deadline: string
  completed_at: string | null
  program_id: string
  application: {
    id: string
    program_id: string
    submitted_at: string
    responses: Array<{
      question: string
      answer: string
    }>
    applicant: {
      id: string
      full_name: string
      email: string
    }
    program: {
      id: string
      title: string
      description: string
    }
  }
}

interface ReviewData {
  assignment: ReviewAssignment
  criteria: ReviewCriterion[]
  existingScores: Record<string, any>
}

export default function ReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasRole, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState<Record<string, ReviewScore>>({})
  const [overallComments, setOverallComments] = useState('')
  const [currentTab, setCurrentTab] = useState('application')
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reviewId = params.id as string
  const isReviewer = hasRole('reviewer')

  // Fetch review data from API
  const fetchReviewData = useCallback(async () => {
    if (!reviewId || authLoading) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/reviews/${reviewId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch review data')
      }

      const result = await response.json()
      const data: ReviewData = result.data
      
      setReviewData(data)
      
      // Initialize scores from existing scores if available
      const initialScores: Record<string, ReviewScore> = {}
      data.criteria.forEach(criterion => {
        const existingScore = data.existingScores[criterion.id]
        if (existingScore) {
          initialScores[criterion.id] = {
            id: existingScore.id,
            criteria_id: criterion.id,
            raw_score: existingScore.raw_score,
            rubric_level: existingScore.rubric_level,
            score_rationale: existingScore.score_rationale,
            reviewer_confidence: existingScore.reviewer_confidence
          }
        }
      })
      setScores(initialScores)
      
      // Load existing overall comments if they exist
      // Note: Overall comments are stored in the reviews table, not review_assignments
      // We'll handle this separately if needed
    } catch (err) {
      console.error('Error fetching review data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [reviewId, authLoading])

  useEffect(() => {
    fetchReviewData()
  }, [fetchReviewData])

  const handleScoreChange = useCallback((criteriaId: string, score: Partial<ReviewScore>) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: { 
        ...prev[criteriaId], 
        ...score,
        criteria_id: criteriaId // Ensure criteria_id is always set
      }
    }))
  }, [])

  const calculateTotalScore = useCallback(() => {
    if (!reviewData) return 0
    
    let totalWeightedScore = 0
    let totalWeight = 0
    
    reviewData.criteria.forEach(criterion => {
      const score = scores[criterion.id]
      if (score && typeof score.raw_score === 'number') {
        const weightedScore = (score.raw_score / criterion.max_score) * criterion.weight
        totalWeightedScore += weightedScore
        totalWeight += criterion.weight
      }
    })
    
    return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0
  }, [reviewData, scores])

  const getScoredCriteriaCount = useCallback(() => {
    return Object.values(scores).filter(score => 
      score && typeof score.raw_score === 'number'
    ).length
  }, [scores])

  const handleSaveDraft = async () => {
    if (!reviewData) return
    
    setSaving(true)
    try {
      // Save scores as draft (in_progress status)
      const scoresArray = Object.values(scores).filter(score => 
        score && typeof score.raw_score === 'number'
      ).map(score => ({
        criteria_id: score.criteria_id,
        raw_score: score.raw_score,
        rubric_level: score.rubric_level || null,
        score_rationale: score.score_rationale || null,
        reviewer_confidence: score.reviewer_confidence || null
      }))

      if (scoresArray.length === 0) {
        toast({
          title: "Nothing to Save",
          description: "Please score at least one criterion before saving.",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/reviews/${reviewId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scores: scoresArray })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save draft')
      }

      // Save overall comments if provided
      if (overallComments.trim()) {
        const commentsResponse = await fetch(`/api/reviews/${reviewId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ overall_comments: overallComments })
        })

        if (!commentsResponse.ok) {
          console.warn('Failed to save comments, but scores were saved')
        }
      }

      toast({
        title: "Draft Saved",
        description: "Your review progress has been saved as a draft."
      })
    } catch (error) {
      console.error('Error saving draft:', error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "There was an error saving your draft. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewData) return
    
    const scoredCount = getScoredCriteriaCount()
    if (scoredCount !== reviewData.criteria.length) {
      toast({
        title: "Incomplete Review",
        description: `Please score all ${reviewData.criteria.length} criteria before submitting.`,
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      // Prepare scores data for submission
      const scoresArray = Object.values(scores).map(score => ({
        criteria_id: score.criteria_id,
        raw_score: score.raw_score,
        rubric_level: score.rubric_level || null,
        score_rationale: score.score_rationale || null,
        reviewer_confidence: score.reviewer_confidence || null
      }))

      // Submit all scores (this will mark the review as completed)
      const scoresResponse = await fetch(`/api/reviews/${reviewId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scores: scoresArray })
      })

      if (!scoresResponse.ok) {
        const errorData = await scoresResponse.json()
        throw new Error(errorData.error || 'Failed to submit review scores')
      }

      // Save overall comments
      if (overallComments.trim()) {
        const commentsResponse = await fetch(`/api/reviews/${reviewId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ overall_comments: overallComments })
        })

        if (!commentsResponse.ok) {
          console.warn('Failed to save comments, but review was submitted')
        }
      }

      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully."
      })

      // Use replace to prevent back button issues and don't reset submitting state
      // since we're navigating away
      router.replace('/reviews')
      return // Exit early to prevent finally block from executing
    } catch (error) {
      console.error('Error submitting review:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "There was an error submitting your review. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-64 w-full" />
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Review</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchReviewData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!reviewData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Not Found</h2>
            <p className="text-gray-600">
              The requested review could not be found or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isReviewer) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have reviewer permissions to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOverdue = new Date(reviewData.assignment.deadline) < new Date()
  const totalScore = calculateTotalScore()
  const scoredCount = getScoredCriteriaCount()
  const isCompleted = scoredCount === reviewData.criteria.length

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.replace('/reviews')}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Back to Reviews'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {isOverdue && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
            <Badge variant="outline">
              Due {formatDistanceToNow(new Date(reviewData.assignment.deadline), { addSuffix: true })}
            </Badge>
          </div>
        </div>

        {/* Application Info Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-900">
                  {reviewData.assignment.application.program.title}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{reviewData.assignment.application.applicant.full_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Applied {format(new Date(reviewData.assignment.application.submitted_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Due {format(new Date(reviewData.assignment.deadline), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {totalScore.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  Overall Score
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Progress Indicator */}
        <ReviewProgress
          totalCriteria={reviewData.criteria.length}
          scoredCriteria={scoredCount}
          isCompleted={isCompleted}
          className="bg-white p-4 rounded-lg border"
        />

        {/* Main Content */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="application">Application Details</TabsTrigger>
            <TabsTrigger value="scoring">Scoring</TabsTrigger>
            <TabsTrigger value="previous" disabled>Previous Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="application" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Program</h4>
                  <p className="text-gray-600">{reviewData.assignment.application.program.description}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Application Responses</h4>
                  {reviewData.assignment.application.responses?.map((response, index) => (
                    <div key={index} className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">
                        {response.question}
                      </h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {response.answer}
                      </p>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500 italic">
                      No application responses available.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scoring" className="mt-6">
            <div className="space-y-6">
              {/* Scoring Criteria */}
              <div className="space-y-6">
                {reviewData.criteria.map((criterion) => (
                  <ScoreCriterion
                    key={criterion.id}
                    criterion={criterion}
                    score={scores[criterion.id]}
                    onScoreChange={(score) => handleScoreChange(criterion.id, score)}
                    disabled={submitting}
                  />
                ))}
              </div>

              {/* Overall Comments */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="overall-comments" className="text-sm font-medium">
                    Additional feedback and recommendations
                  </Label>
                  <Textarea
                    id="overall-comments"
                    placeholder="Provide overall feedback, strengths, weaknesses, and recommendations for the applicant..."
                    value={overallComments}
                    onChange={(e) => setOverallComments(e.target.value)}
                    rows={6}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end bg-white p-4 rounded-lg border">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saving || submitting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                
                <Button
                  onClick={handleSubmitReview}
                  disabled={saving || submitting || !isCompleted}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="previous" className="mt-6">
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600">Previous reviews will be shown here once available.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}