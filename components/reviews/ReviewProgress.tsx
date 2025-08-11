'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock } from 'lucide-react'

interface ReviewProgressProps {
  totalCriteria: number
  scoredCriteria: number
  isCompleted?: boolean
  className?: string
}

export function ReviewProgress({ 
  totalCriteria, 
  scoredCriteria, 
  isCompleted = false,
  className 
}: ReviewProgressProps) {
  const progress = totalCriteria > 0 ? (scoredCriteria / totalCriteria) * 100 : 0
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Clock className="h-4 w-4 text-blue-600" />
          )}
          <span className="text-sm font-medium text-gray-900">
            Review Progress
          </span>
        </div>
        <Badge variant={isCompleted ? "secondary" : "outline"} className={
          isCompleted 
            ? "bg-green-100 text-green-700" 
            : "bg-blue-100 text-blue-700"
        }>
          {scoredCriteria} of {totalCriteria}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <Progress 
          value={progress} 
          className="h-2"
        />
        <p className="text-xs text-gray-600">
          {isCompleted 
            ? "Review completed" 
            : `${totalCriteria - scoredCriteria} criteria remaining`
          }
        </p>
      </div>
    </div>
  )
}