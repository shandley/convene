'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Star, Info, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScoringType } from '@/types/review-system'

export interface ReviewCriterion {
  id: string
  name: string
  description: string | null
  scoring_type: ScoringType
  weight: number
  max_score: number
  min_score: number
  rubric_definition: Record<string, string>
  scoring_guide: string | null
}

export interface ReviewScore {
  id?: string
  criteria_id: string
  raw_score: number
  rubric_level?: string
  score_rationale?: string
  reviewer_confidence?: number
}

interface ScoreCriterionProps {
  criterion: ReviewCriterion
  score?: ReviewScore
  onScoreChange: (score: Partial<ReviewScore>) => void
  disabled?: boolean
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function ScoreCriterion({ 
  criterion, 
  score, 
  onScoreChange, 
  disabled = false,
  loading = false,
  error = null,
  onRetry
}: ScoreCriterionProps) {
  const [localScore, setLocalScore] = useState<Partial<ReviewScore>>(
    score || { 
      criteria_id: criterion?.id || '', 
      raw_score: criterion?.min_score || 0,
      reviewer_confidence: 3 
    }
  )
  
  const [showRubric, setShowRubric] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !error && criterion?.id) {
      try {
        setIsUpdating(true)
        setUpdateError(null)
        onScoreChange(localScore)
      } catch (err) {
        setUpdateError(err instanceof Error ? err.message : 'Failed to update score')
        console.error('Error updating score:', err)
      } finally {
        setIsUpdating(false)
      }
    }
  }, [localScore, onScoreChange, loading, error, criterion?.id])

  const handleScoreChange = (value: number) => {
    try {
      // Validate score range
      if (value < criterion.min_score || value > criterion.max_score) {
        setUpdateError(`Score must be between ${criterion.min_score} and ${criterion.max_score}`)
        return
      }
      setUpdateError(null)
      setLocalScore(prev => ({ ...prev, raw_score: value }))
    } catch (err) {
      setUpdateError('Failed to update score')
      console.error('Error updating score:', err)
    }
  }

  const handleRationaleChange = (rationale: string) => {
    try {
      setUpdateError(null)
      setLocalScore(prev => ({ ...prev, score_rationale: rationale }))
    } catch (err) {
      setUpdateError('Failed to update rationale')
      console.error('Error updating rationale:', err)
    }
  }

  const handleConfidenceChange = (confidence: number) => {
    try {
      // Validate confidence range
      if (confidence < 1 || confidence > 5) {
        setUpdateError('Confidence must be between 1 and 5')
        return
      }
      setUpdateError(null)
      setLocalScore(prev => ({ ...prev, reviewer_confidence: confidence }))
    } catch (err) {
      setUpdateError('Failed to update confidence')
      console.error('Error updating confidence:', err)
    }
  }

  // Loading skeleton for score input
  const renderScoreInputSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-32" />
    </div>
  )

  const renderScoreInput = () => {
    if (loading) {
      return renderScoreInputSkeleton()
    }

    if (!criterion || !criterion.scoring_type) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            Invalid criterion configuration. Missing scoring type.
          </AlertDescription>
        </Alert>
      )
    }

    try {
      switch (criterion.scoring_type) {
        case 'numerical':
          return (
            <div className="space-y-2">
              <Label htmlFor={`score-${criterion.id}`}>
                Score ({criterion.min_score}-{criterion.max_score})
              </Label>
              <Input
                id={`score-${criterion.id}`}
                type="number"
                min={criterion.min_score}
                max={criterion.max_score}
                value={localScore.raw_score || criterion.min_score}
                onChange={(e) => handleScoreChange(Number(e.target.value))}
                disabled={disabled || isUpdating}
                className="max-w-32"
              />
            </div>
          )

        case 'categorical':
          const levels = Object.keys(criterion.rubric_definition || {})
          if (levels.length === 0) {
            return (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  No rubric levels defined for this categorical criterion.
                </AlertDescription>
              </Alert>
            )
          }
          
          return (
            <div className="space-y-2">
              <Label>Rating Level</Label>
              <div className="flex flex-wrap gap-2">
                {levels.map((level, index) => {
                  const scoreValue = criterion.min_score + 
                    ((criterion.max_score - criterion.min_score) / (levels.length - 1)) * index
                  return (
                    <Button
                      key={level}
                      variant={localScore.rubric_level === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setLocalScore(prev => ({
                          ...prev,
                          rubric_level: level,
                          raw_score: Math.round(scoreValue)
                        }))
                      }}
                      disabled={disabled || isUpdating}
                    >
                      {level}
                    </Button>
                  )
                })}
              </div>
            </div>
          )

        case 'binary':
          return (
            <div className="space-y-2">
              <Label>Assessment</Label>
              <div className="flex gap-2">
                <Button
                  variant={localScore.raw_score === criterion.max_score ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleScoreChange(criterion.max_score)}
                  disabled={disabled || isUpdating}
                >
                  Meets Criteria
                </Button>
                <Button
                  variant={localScore.raw_score === criterion.min_score ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleScoreChange(criterion.min_score)}
                  disabled={disabled || isUpdating}
                >
                  Does Not Meet
                </Button>
              </div>
            </div>
          )

        default:
          return (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                Unsupported scoring type: {criterion.scoring_type}
              </AlertDescription>
            </Alert>
          )
      }
    } catch (err) {
      console.error('Error rendering score input:', err)
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            Error rendering score input. Please try refreshing.
          </AlertDescription>
        </Alert>
      )
    }
  }

  const renderConfidenceRating = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-5 w-5 rounded-sm" />
            ))}
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Label>Confidence Level</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleConfidenceChange(rating)}
              disabled={disabled || loading || isUpdating}
              className="focus:outline-none disabled:opacity-50"
              aria-label={`Confidence level ${rating} out of 5`}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  (localScore.reviewer_confidence || 0) >= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-300"
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600">
          Rate your confidence in this assessment
        </p>
      </div>
    )
  }

  // Safe calculation with error handling
  const calculateWeightedScore = () => {
    try {
      const rawScore = localScore.raw_score || 0
      const weight = criterion?.weight || 0
      return rawScore * (weight / 100)
    } catch (err) {
      console.error('Error calculating weighted score:', err)
      return 0
    }
  }

  const weightedScore = calculateWeightedScore()

  // Handle error states
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="mt-3"
            >
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Handle loading state
  if (loading) {
    return (
      <Card className="transition-all duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-6" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderScoreInputSkeleton()}
          <Skeleton className="h-16 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-5 w-5 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle invalid criterion data
  if (!criterion || !criterion.id) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="py-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              Invalid criterion data. Please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-sm",
      isUpdating && "opacity-75",
      updateError && "border-red-200"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900">
              {criterion.name}
            </CardTitle>
            {criterion.description && (
              <p className="text-sm text-gray-600 mt-1">
                {criterion.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {criterion.weight}% weight
            </Badge>
            {criterion.rubric_definition && Object.keys(criterion.rubric_definition).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRubric(!showRubric)}
                className="h-6 w-6 p-0"
                disabled={loading}
              >
                <Info className="h-3 w-3" />
                <span className="sr-only">Toggle scoring guide</span>
              </Button>
            )}
          </div>
        </div>

        {/* Rubric/Scoring Guide */}
        {showRubric && criterion.rubric_definition && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium text-sm text-gray-900 mb-2">Scoring Guide</h4>
            <div className="space-y-2">
              {Object.entries(criterion.rubric_definition).map(([level, description]) => (
                <div key={level} className="text-sm">
                  <span className="font-medium text-gray-700">{level}:</span>
                  <span className="text-gray-600 ml-2">{description}</span>
                </div>
              ))}
            </div>
            {criterion.scoring_guide && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">{criterion.scoring_guide}</p>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Update status indicator */}
        {isUpdating && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating score...</span>
          </div>
        )}

        {/* Update error alert */}
        {updateError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {updateError}
            </AlertDescription>
          </Alert>
        )}

        {/* Score Input */}
        {renderScoreInput()}

        {/* Score Preview */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
          <div className="text-sm">
            <span className="text-gray-600">Raw Score:</span>
            <span className="font-medium text-gray-900 ml-2">
              {localScore.raw_score || 0} / {criterion.max_score}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Weighted:</span>
            <span className="font-medium text-blue-700 ml-2">
              {weightedScore.toFixed(1)} pts
            </span>
          </div>
        </div>

        {/* Confidence Rating */}
        {renderConfidenceRating()}

        {/* Score Rationale */}
        <div className="space-y-2">
          <Label htmlFor={`rationale-${criterion.id}`}>
            Comments & Rationale
          </Label>
          <Textarea
            id={`rationale-${criterion.id}`}
            placeholder="Explain your reasoning for this score..."
            value={localScore.score_rationale || ''}
            onChange={(e) => handleRationaleChange(e.target.value)}
            disabled={disabled || loading || isUpdating}
            rows={3}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  )
}