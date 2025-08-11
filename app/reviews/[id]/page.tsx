'use client'

import { useState, useEffect } from 'react'
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

// Mock data for development
const mockApplication = {
  id: 'app-1',
  applicant_name: 'Sarah Johnson',
  applicant_email: 'sarah.johnson@email.com',
  submitted_at: '2025-01-05T10:30:00Z',
  program: {
    title: 'Advanced Machine Learning Workshop',
    description: 'A comprehensive workshop covering advanced ML techniques and applications.'
  },
  responses: [
    {
      question: 'What is your background in machine learning?',
      answer: 'I have 3 years of experience working with machine learning algorithms including supervised and unsupervised learning. I have worked on projects involving neural networks, decision trees, and ensemble methods.'
    },
    {
      question: 'What do you hope to gain from this workshop?',
      answer: 'I want to deepen my understanding of advanced techniques like transformers and GANs, and learn how to apply them to real-world problems in my current role as a data scientist.'
    }
  ]
}

const mockReviewCriteria: ReviewCriterion[] = [
  {
    id: 'criteria-1',
    name: 'Technical Background',
    description: 'Evaluate the applicant\'s technical foundation and relevant experience',
    scoring_type: 'numerical',
    weight: 30,
    max_score: 10,
    min_score: 0,
    rubric_definition: {
      'Excellent (9-10)': 'Strong technical background with extensive relevant experience',
      'Good (7-8)': 'Solid technical background with some relevant experience',
      'Fair (5-6)': 'Basic technical background with limited relevant experience',
      'Poor (0-4)': 'Weak or no relevant technical background'
    },
    scoring_guide: 'Consider depth of experience, relevance to program content, and demonstrated skills'
  },
  {
    id: 'criteria-2',
    name: 'Learning Motivation',
    description: 'Assess the applicant\'s motivation and commitment to learning',
    scoring_type: 'categorical',
    weight: 25,
    max_score: 5,
    min_score: 1,
    rubric_definition: {
      'Excellent': 'Clearly articulated goals with strong motivation and commitment',
      'Good': 'Well-defined goals with good motivation',
      'Fair': 'Some goals identified but motivation unclear',
      'Poor': 'Vague or unclear goals and motivation'
    },
    scoring_guide: 'Look for specific, realistic goals and genuine enthusiasm for learning'
  },
  {
    id: 'criteria-3',
    name: 'Program Fit',
    description: 'How well does the applicant fit with the program objectives?',
    scoring_type: 'binary',
    weight: 20,
    max_score: 1,
    min_score: 0,
    rubric_definition: {
      'Meets Criteria': 'Strong alignment with program objectives and target audience',
      'Does Not Meet': 'Poor fit or misaligned expectations'
    },
    scoring_guide: 'Consider if the program level and content match the applicant\'s needs'
  },
  {
    id: 'criteria-4',
    name: 'Communication Skills',
    description: 'Quality of written communication and expression of ideas',
    scoring_type: 'numerical',
    weight: 15,
    max_score: 10,
    min_score: 0,
    rubric_definition: {
      'Excellent (9-10)': 'Clear, articulate, well-structured responses',
      'Good (7-8)': 'Generally clear with minor issues',
      'Fair (5-6)': 'Understandable but with some clarity issues',
      'Poor (0-4)': 'Unclear, confusing, or poorly structured'
    },
    scoring_guide: 'Evaluate clarity, organization, grammar, and overall communication effectiveness'
  },
  {
    id: 'criteria-5',
    name: 'Commitment & Availability',
    description: 'Applicant\'s ability to commit time and effort to the program',
    scoring_type: 'numerical',
    weight: 10,
    max_score: 10,
    min_score: 0,
    rubric_definition: {
      'Excellent (9-10)': 'Clear schedule availability and strong commitment',
      'Good (7-8)': 'Good availability with minor constraints',
      'Fair (5-6)': 'Some availability concerns or unclear commitment',
      'Poor (0-4)': 'Limited availability or weak commitment'
    },
    scoring_guide: 'Consider time availability, competing commitments, and expressed dedication'
  }
]

const mockReview = {
  id: 'review-1',
  status: 'in_progress',
  due_date: '2025-01-20T23:59:59Z',
  assigned_at: '2025-01-01T00:00:00Z'
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

  const reviewId = params.id as string
  const isReviewer = hasRole('reviewer')

  useEffect(() => {
    if (!authLoading) {
      // Simulate API call - replace with actual API call
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }
  }, [authLoading])

  const handleScoreChange = (criteriaId: string, score: Partial<ReviewScore>) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], ...score }
    }))
  }

  const calculateTotalScore = () => {
    let totalWeightedScore = 0
    let totalWeight = 0
    
    mockReviewCriteria.forEach(criterion => {
      const score = scores[criterion.id]
      if (score && typeof score.raw_score === 'number') {
        const weightedScore = (score.raw_score / criterion.max_score) * criterion.weight
        totalWeightedScore += weightedScore
        totalWeight += criterion.weight
      }
    })
    
    return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0
  }

  const getScoredCriteriaCount = () => {
    return Object.values(scores).filter(score => 
      score && typeof score.raw_score === 'number'
    ).length
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: "Draft Saved",
        description: "Your review progress has been saved as a draft."
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your draft. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitReview = async () => {
    const scoredCount = getScoredCriteriaCount()
    if (scoredCount !== mockReviewCriteria.length) {
      toast({
        title: "Incomplete Review",
        description: `Please score all ${mockReviewCriteria.length} criteria before submitting.`,
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully."
      })
      router.push('/reviews')
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your review. Please try again.",
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

  const isOverdue = new Date(mockReview.due_date) < new Date()
  const totalScore = calculateTotalScore()
  const scoredCount = getScoredCriteriaCount()
  const isCompleted = scoredCount === mockReviewCriteria.length

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/reviews')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Reviews
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
              Due {formatDistanceToNow(new Date(mockReview.due_date), { addSuffix: true })}
            </Badge>
          </div>
        </div>

        {/* Application Info Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-gray-900">
                  {mockApplication.program.title}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{mockApplication.applicant_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Applied {format(new Date(mockApplication.submitted_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Due {format(new Date(mockReview.due_date), 'MMM d, yyyy')}</span>
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
          totalCriteria={mockReviewCriteria.length}
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
                  <p className="text-gray-600">{mockApplication.program.description}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Application Responses</h4>
                  {mockApplication.responses.map((response, index) => (
                    <div key={index} className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">
                        {response.question}
                      </h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {response.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scoring" className="mt-6">
            <div className="space-y-6">
              {/* Scoring Criteria */}
              <div className="space-y-6">
                {mockReviewCriteria.map((criterion) => (
                  <ScoreCriterion
                    key={criterion.id}
                    criterion={criterion}
                    score={scores[criterion.id]}
                    onScoreChange={(score) => handleScoreChange(criterion.id, score)}
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