'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, FileText, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Application {
  id: string
  program_id: string
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted'
  submitted_at: string | null
  created_at: string
  program: {
    id: string
    title: string
    description: string
    status: string
    start_date: string | null
    end_date: string | null
  }
}

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/applications', {
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch applications')
        }

        const result = await response.json()
        setApplications(result.data || [])
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError('Failed to load applications. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchApplications()
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">
              Please sign in to view your applications.
            </p>
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status: Application['status']) => {
    const variants: Record<Application['status'], { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      submitted: { variant: 'default', label: 'Submitted' },
      under_review: { variant: 'outline', label: 'Under Review' },
      accepted: { variant: 'success', label: 'Accepted' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      waitlisted: { variant: 'warning', label: 'Waitlisted' },
    }
    
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-2">
            View and manage your program applications
          </p>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Applications Yet
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted any applications yet.
              </p>
              <Link href="/apply">
                <Button>Browse Programs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">
                      {application.program.title}
                    </CardTitle>
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {application.program.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {application.program.start_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Starts {format(new Date(application.program.start_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    
                    {application.submitted_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          Submitted {format(new Date(application.submitted_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    asChild
                  >
                    <Link href={`/applications/${application.id}`}>
                      View Application
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}