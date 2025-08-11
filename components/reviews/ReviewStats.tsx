'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react'

interface ReviewStatsProps {
  stats: {
    total: number
    inProgress: number
    completed: number
    overdue: number
  }
  loading?: boolean
}

export function ReviewStats({ stats, loading }: ReviewStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      title: 'Total Assigned',
      value: stats.total,
      description: 'All assigned reviews',
      icon: FileText,
      color: 'text-gray-600'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      description: 'Currently working on',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Completed',
      value: stats.completed,
      description: 'Reviews finished',
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      description: 'Past due date',
      icon: AlertCircle,
      color: 'text-red-600'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {item.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{item.value}</div>
              <p className="text-xs text-gray-600">{item.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}