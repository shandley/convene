'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type ReviewStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue'

interface ReviewStatusBadgeProps {
  status: ReviewStatus
  className?: string
}

const statusConfig = {
  not_started: {
    label: 'Not Started',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
  },
  completed: {
    label: 'Completed',
    variant: 'secondary' as const,
    className: 'bg-green-100 text-green-700 hover:bg-green-200'
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-700 hover:bg-red-200'
  }
}

export function ReviewStatusBadge({ status, className }: ReviewStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}