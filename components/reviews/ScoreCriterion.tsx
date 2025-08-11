'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Star, Info } from 'lucide-react'
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
}

export function ScoreCriterion({ 
  criterion, 
  score, 
  onScoreChange, 
  disabled = false 
}: ScoreCriterionProps) {
  const [localScore, setLocalScore] = useState<Partial<ReviewScore>>(
    score || { 
      criteria_id: criterion.id, 
      raw_score: criterion.min_score,
      reviewer_confidence: 3 
    }
  )
  
  const [showRubric, setShowRubric] = useState(false)

  useEffect(() => {
    onScoreChange(localScore)
  }, [localScore, onScoreChange])

  const handleScoreChange = (value: number) => {
    setLocalScore(prev => ({ ...prev, raw_score: value }))
  }

  const handleRationaleChange = (rationale: string) => {
    setLocalScore(prev => ({ ...prev, score_rationale: rationale }))
  }

  const handleConfidenceChange = (confidence: number) => {
    setLocalScore(prev => ({ ...prev, reviewer_confidence: confidence }))
  }

  const renderScoreInput = () => {
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
              disabled={disabled}
              className="max-w-32"
            />
          </div>
        )

      case 'categorical':
        const levels = Object.keys(criterion.rubric_definition)
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
                    disabled={disabled}
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
                disabled={disabled}
              >
                Meets Criteria
              </Button>
              <Button
                variant={localScore.raw_score === criterion.min_score ? "destructive" : "outline"}
                size="sm"
                onClick={() => handleScoreChange(criterion.min_score)}
                disabled={disabled}
              >
                Does Not Meet
              </Button>
            </div>
          </div>
        )

      default:
        return renderScoreInput()
    }
  }

  const renderConfidenceRating = () => (
    <div className="space-y-2">
      <Label>Confidence Level</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleConfidenceChange(rating)}
            disabled={disabled}
            className="focus:outline-none"
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

  const weightedScore = (localScore.raw_score || 0) * (criterion.weight / 100)

  return (
    <Card className="transition-all duration-200 hover:shadow-sm">
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
            disabled={disabled}
            rows={3}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  )
}