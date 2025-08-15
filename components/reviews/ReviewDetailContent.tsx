'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ScoreCriterion, type ReviewCriterion, type ReviewScore } from '@/components/reviews/ScoreCriterion'
import { ReviewProgress } from '@/components/reviews/ReviewProgress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Save, 
  Send, 
  AlertCircle 
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { submitReviewAction, saveDraftAction } from '@/app/reviews/actions'

// Types for the review data
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
  hasLegacyScores: boolean
  legacyComments: string
  legacyOverallScore: number | null
}

interface ReviewDetailContentProps {
  reviewData: ReviewData
  reviewId: string
}

type FormState = {
  scores: Record<string, ReviewScore>
  overallComments: string
}

export function ReviewDetailContent({ reviewData, reviewId }: ReviewDetailContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentTab, setCurrentTab] = useState('application')
  const [error, setError] = useState<string | null>(null)

  // Initialize form state
  const initialFormState: FormState = {
    scores: {},
    overallComments: reviewData.legacyComments || ''
  }

  // Initialize scores from existing scores
  reviewData.criteria.forEach(criterion => {
    const existingScore = reviewData.existingScores[criterion.id]
    if (existingScore) {
      initialFormState.scores[criterion.id] = {
        id: existingScore.id,
        criteria_id: criterion.id,
        raw_score: existingScore.raw_score,
        rubric_level: existingScore.rubric_level,
        score_rationale: existingScore.score_rationale,
        reviewer_confidence: existingScore.reviewer_confidence
      }
    }
  })

  const [optimisticState, addOptimistic] = useOptimistic(
    initialFormState,
    (state: FormState, newState: Partial<FormState>) => ({
      ...state,
      ...newState
    })
  )

  const handleScoreChange = (criteriaId: string, score: Partial<ReviewScore>) => {
    const newScores = {
      ...optimisticState.scores,
      [criteriaId]: {
        ...optimisticState.scores[criteriaId],
        ...score,
        criteria_id: criteriaId
      }
    }
    addOptimistic({ scores: newScores })
  }

  const handleCommentsChange = (comments: string) => {
    addOptimistic({ overallComments: comments })
  }

  const calculateTotalScore = () => {
    if (!reviewData.criteria.length) return 0
    
    let totalWeightedScore = 0
    let totalWeight = 0
    
    reviewData.criteria.forEach(criterion => {
      const score = optimisticState.scores[criterion.id]
      if (score && typeof score.raw_score === 'number') {
        const weightedScore = (score.raw_score / criterion.max_score) * criterion.weight
        totalWeightedScore += weightedScore
        totalWeight += criterion.weight
      }
    })
    
    return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0
  }

  const getScoredCriteriaCount = () => {
    return Object.values(optimisticState.scores).filter(score => 
      score && typeof score.raw_score === 'number'
    ).length
  }

  const handleSaveDraft = async () => {
    const scoredCount = getScoredCriteriaCount()
    if (scoredCount === 0) {
      toast({
        title: "Nothing to Save",
        description: "Please score at least one criterion before saving.",
        variant: "destructive"
      })
      return
    }

    setError(null)
    
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('reviewId', reviewId)
        formData.append('scores', JSON.stringify(optimisticState.scores))
        formData.append('overallComments', optimisticState.overallComments)

        const result = await saveDraftAction(formData)
        
        if (result.error) {
          setError(result.error)
          toast({
            title: "Save Failed",
            description: result.error,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Draft Saved",
            description: "Your review progress has been saved as a draft."
          })
          router.refresh() // Refresh to get updated data
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        setError(errorMessage)
        toast({
          title: "Save Failed",
          description: errorMessage,
          variant: "destructive"
        })
      }
    })
  }

  const handleSubmitReview = async () => {
    const scoredCount = getScoredCriteriaCount()
    if (scoredCount !== reviewData.criteria.length) {
      toast({
        title: "Incomplete Review",
        description: `Please score all ${reviewData.criteria.length} criteria before submitting.`,
        variant: "destructive"
      })
      return
    }

    setError(null)
    
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('reviewId', reviewId)
        formData.append('scores', JSON.stringify(optimisticState.scores))
        formData.append('overallComments', optimisticState.overallComments)

        const result = await submitReviewAction(formData)
        
        if (result.error) {
          setError(result.error)
          toast({
            title: "Submission Failed",
            description: result.error,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Review Submitted",
            description: "Your review has been submitted successfully."
          })
          // Use router.push instead of router.replace to avoid navigation freeze
          router.push('/reviews')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        setError(errorMessage)
        toast({
          title: "Submission Failed",
          description: errorMessage,
          variant: "destructive"
        })
      }
    })
  }

  const totalScore = calculateTotalScore()
  const scoredCount = getScoredCriteriaCount()
  const isCompleted = scoredCount === reviewData.criteria.length

  return (
    <>
      {/* Total Score Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {totalScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                Overall Score
              </div>
            </div>
            <ReviewProgress
              totalCriteria={reviewData.criteria.length}
              scoredCriteria={scoredCount}
              isCompleted={isCompleted}
            />
          </div>
        </CardContent>
      </Card>

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
                {Array.isArray(reviewData.assignment.application.responses) && reviewData.assignment.application.responses.length > 0 ? (
                  reviewData.assignment.application.responses.map((response, index) => (
                    <div key={index} className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">
                        {response.question}
                      </h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {response.answer}
                      </p>
                    </div>
                  ))
                ) : (
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
            {/* Legacy Score Notice */}
            {reviewData.hasLegacyScores && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Legacy Scores Detected
                    </span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    This review contains scores from the previous scoring system. 
                    They have been mapped to the current criteria structure for compatibility.
                    {reviewData.legacyOverallScore && (
                      <span className="ml-1 font-medium">
                        (Original Overall Score: {reviewData.legacyOverallScore}/10)
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Scoring Criteria */}
            <div className="space-y-6">
              {reviewData.criteria.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Scoring Criteria Available
                    </h3>
                    <p className="text-gray-600 mb-4">
                      This review doesn't have any scoring criteria configured.
                      Please contact an administrator to set up the review criteria.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviewData.criteria.map((criterion) => (
                  <ScoreCriterion
                    key={criterion.id}
                    criterion={criterion}
                    score={optimisticState.scores[criterion.id]}
                    onScoreChange={(score) => handleScoreChange(criterion.id, score)}
                    disabled={isPending}
                    loading={false}
                  />
                ))
              )}
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
                  value={optimisticState.overallComments}
                  onChange={(e) => handleCommentsChange(e.target.value)}
                  rows={6}
                  className="mt-2"
                  disabled={isPending}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end bg-white p-4 rounded-lg border">
              {reviewData.hasLegacyScores && Object.values(optimisticState.scores).every(score => score?.id?.startsWith('legacy_')) ? (
                <div className="flex-1 text-right">
                  <p className="text-sm text-amber-700 mb-2">
                    This review is completed with legacy scores. No further modifications are needed.
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isPending ? 'Saving...' : 'Save Draft'}
                  </Button>
                  
                  <Button
                    onClick={handleSubmitReview}
                    disabled={isPending || !isCompleted}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isPending ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </>
              )}
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
    </>
  )
}