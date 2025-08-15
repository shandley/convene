import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReviewDetailContent } from '@/components/reviews/ReviewDetailContent'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock,
  AlertCircle 
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

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

interface LocalReviewData {
  assignment: ReviewAssignment
  criteria: import('@/components/reviews/ScoreCriterion').ReviewCriterion[]
  existingScores: Record<string, any>
  hasLegacyScores: boolean
  legacyComments: string
  legacyOverallScore: number | null
}

async function getReviewData(reviewId: string, userId: string): Promise<LocalReviewData | null> {
  const supabase = await createClient()

  try {
    // Get the review assignment with related data
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select(`
        id,
        application_id,
        reviewer_id,
        status,
        assigned_at,
        deadline,
        completed_at,
        application:applications(
          id,
          program_id,
          submitted_at,
          responses,
          applicant:profiles(
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
      .eq('reviewer_id', userId)
      .single()

    if (assignmentError || !assignment) {
      console.error('Error fetching assignment:', assignmentError)
      return null
    }

    // Get program_id from the nested application
    const programId = (assignment.application as any)?.program_id
    if (!programId) {
      console.error('No program_id found in assignment')
      return null
    }

    // Get review criteria for the program
    const { data: criteria, error: criteriaError } = await supabase
      .from('review_criteria')
      .select('*')
      .eq('program_id', programId)
      .order('sort_order')

    if (criteriaError) {
      console.error('Error fetching criteria:', criteriaError)
      return null
    }

    // Get the review record for this assignment
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, overall_score, comments')
      .eq('assignment_id', reviewId)
      .single()

    let existingScores: Record<string, any> = {}
    let hasLegacyScores = false
    let legacyComments = ''
    let legacyOverallScore = null

    if (review) {
      // Get existing scores for this review
      const { data: scores, error: scoresError } = await supabase
        .from('review_scores')
        .select('*')
        .eq('review_id', review.id)

      if (!scoresError && scores) {
        scores.forEach((score: any) => {
          existingScores[score.criteria_id] = score
        })
      }

      // Check if this is a legacy review
      hasLegacyScores = !!review.overall_score
      legacyComments = review.comments || ''
      legacyOverallScore = review.overall_score || null
    }

    // Transform criteria to match expected interface
    const transformedCriteria = (criteria || []).map((criterion: any) => ({
      id: criterion.id,
      name: criterion.name,
      description: criterion.description,
      max_score: criterion.max_score,
      weight: criterion.weight,
      order_index: criterion.sort_order,
      scoring_type: (criterion.scoring_type || 'numerical') as 'numerical' | 'categorical' | 'binary' | 'rubric' | 'weighted',
      min_score: criterion.min_score || 0,
      rubric_definition: criterion.rubric_definition || {},
      scoring_guide: criterion.scoring_guide || null
    }))

    return {
      assignment: assignment as any,
      criteria: transformedCriteria,
      existingScores,
      hasLegacyScores: !!hasLegacyScores,
      legacyComments,
      legacyOverallScore
    }
  } catch (error) {
    console.error('Error fetching review data:', error)
    return null
  }
}

function ReviewDetailSkeleton() {
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

export default async function ReviewDetailPage({ params }: PageProps) {
  // In Next.js 15, params is a Promise
  const { id: reviewId } = await params
  
  // Get user from server-side cookies
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Check if user has any review assignments (is a reviewer)
  const { data: reviewAssignments } = await supabase
    .from('review_assignments')
    .select('id')
    .eq('reviewer_id', user.id)
    .limit(1)

  const isReviewer = (reviewAssignments?.length || 0) > 0

  if (!isReviewer) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have any review assignments. Contact an administrator if you should have reviewer access.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Suspense fallback={<ReviewDetailSkeleton />}>
        <ReviewDetailContentServer reviewId={reviewId} userId={user.id} />
      </Suspense>
    </div>
  )
}

async function ReviewDetailContentServer({ 
  reviewId, 
  userId 
}: { 
  reviewId: string
  userId: string 
}) {
  const reviewData = await getReviewData(reviewId, userId)

  if (!reviewData) {
    notFound()
  }

  const isOverdue = new Date(reviewData.assignment.deadline) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/reviews"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reviews
          </Link>
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
              <h1 className="text-2xl font-bold text-gray-900">
                {reviewData.assignment.application.program.title}
              </h1>
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
          </div>
        </CardHeader>
      </Card>

      {/* Review Content */}
      <ReviewDetailContent 
        reviewData={reviewData} 
        reviewId={reviewId}
      />
    </div>
  )
}