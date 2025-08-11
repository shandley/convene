'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReviewStatusBadge, type ReviewStatus } from './ReviewStatusBadge'
import { Clock, User, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export interface Review {
  id: string
  application_id: string
  reviewer_id: string
  status: ReviewStatus
  assigned_at: string
  due_date: string
  submitted_at?: string
  priority?: 'low' | 'medium' | 'high'
  application: {
    id: string
    program_id: string
    applicant_name: string
    program: {
      title: string
    }
  }
}

interface ReviewCardProps {
  review: Review
  onStartReview?: (reviewId: string) => void
}

export function ReviewCard({ review, onStartReview }: ReviewCardProps) {
  const isOverdue = new Date(review.due_date) < new Date() && review.status !== 'completed'
  const dueDate = new Date(review.due_date)
  const dueDateText = formatDistanceToNow(dueDate, { addSuffix: true })

  const getActionButton = () => {
    switch (review.status) {
      case 'not_started':
        return (
          <Link href={`/reviews/${review.id}`}>
            <Button size="sm" className="w-full">
              Start Review
            </Button>
          </Link>
        )
      case 'in_progress':
        return (
          <Link href={`/reviews/${review.id}`}>
            <Button size="sm" variant="outline" className="w-full">
              Continue Review
            </Button>
          </Link>
        )
      case 'completed':
        return (
          <Link href={`/reviews/${review.id}`}>
            <Button size="sm" variant="outline" className="w-full">
              View Review
            </Button>
          </Link>
        )
      default:
        return null
    }
  }

  const getPriorityBadge = () => {
    if (!review.priority) return null
    
    const priorityConfig = {
      low: { label: 'Low', className: 'bg-green-100 text-green-700' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
      high: { label: 'High', className: 'bg-red-100 text-red-700' }
    }
    
    const config = priorityConfig[review.priority]
    return (
      <Badge className={config.className}>
        {config.label} Priority
      </Badge>
    )
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isOverdue ? 'ring-2 ring-red-200' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {review.application.program.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <User className="h-3 w-3" />
              <span className="truncate">{review.application.applicant_name}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <ReviewStatusBadge status={isOverdue ? 'overdue' : review.status} />
            {getPriorityBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-3 w-3" />
            <span>Due {dueDateText}</span>
            {isOverdue && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
          </div>
        </div>
        
        {getActionButton()}
      </CardContent>
    </Card>
  )
}