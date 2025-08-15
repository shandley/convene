import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReviewsList } from '@/components/reviews/ReviewsList'
import { ReviewsFilters } from '@/components/reviews/ReviewsFilters'
import { ReviewStats } from '@/components/reviews/ReviewStats'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type SearchParams = {
  status?: string
  priority?: string
  search?: string
  sort?: string
  order?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

async function getReviewStats(userId: string) {
  const supabase = await createClient()
  
  try {
    // Get review assignments for the current user
    const { data: assignments, error } = await supabase
      .from('review_assignments')
      .select('status, deadline')
      .eq('reviewer_id', userId)

    if (error) {
      console.error('Error fetching review stats:', error)
      return { total: 0, inProgress: 0, completed: 0, overdue: 0 }
    }

    const now = new Date()
    const stats = {
      total: assignments?.length || 0,
      inProgress: assignments?.filter((a: any) => a.status === 'in_progress').length || 0,
      completed: assignments?.filter((a: any) => a.status === 'completed').length || 0,
      overdue: assignments?.filter((a: any) => 
        a.status !== 'completed' && new Date(a.deadline) < now
      ).length || 0
    }

    return stats
  } catch (error) {
    console.error('Error calculating review stats:', error)
    return { total: 0, inProgress: 0, completed: 0, overdue: 0 }
  }
}

async function getReviews(userId: string, searchParams: SearchParams) {
  const supabase = await createClient()
  
  try {
    // Build query with filters
    let query = supabase
      .from('review_assignments')
      .select(`
        id,
        application_id,
        reviewer_id,
        status,
        assigned_at,
        deadline,
        completed_at,
        program_id,
        application:applications(
          id,
          program_id,
          submitted_at,
          applicant_id,
          program:programs(
            id,
            title,
            description
          ),
          applicant:profiles(
            id,
            full_name,
            email
          )
        )
      `)
      .eq('reviewer_id', userId)

    // Apply status filter
    if (searchParams.status && searchParams.status !== 'all') {
      if (searchParams.status === 'overdue') {
        query = query
          .lt('deadline', new Date().toISOString())
          .neq('status', 'completed')
      } else {
        query = query.eq('status', searchParams.status as any)
      }
    }

    // Apply sorting
    const sortField = searchParams.sort || 'deadline'
    const sortOrder = searchParams.order === 'desc' ? false : true

    switch (sortField) {
      case 'due_date':
        query = query.order('deadline', { ascending: sortOrder })
        break
      case 'status':
        query = query.order('status', { ascending: sortOrder })
        break
      default:
        query = query.order('deadline', { ascending: true })
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return []
    }

    if (!assignments) return []

    // Transform data to match expected Review interface
    const reviews = assignments.map((assignment: any) => ({
      id: assignment.id,
      application_id: assignment.application_id,
      reviewer_id: assignment.reviewer_id,
      status: assignment.status,
      assigned_at: assignment.assigned_at,
      due_date: assignment.deadline,
      submitted_at: assignment.completed_at,
      priority: 'medium' as const, // Default priority since not in schema
      application: {
        id: assignment.application?.id || assignment.application_id,
        program_id: assignment.application?.program_id || '',
        applicant_name: assignment.application?.applicant?.full_name || 'Unknown',
        applicant_email: assignment.application?.applicant?.email || '',
        submitted_at: assignment.application?.submitted_at || null,
        program: {
          title: assignment.application?.program?.title || 'Unknown Program',
          description: assignment.application?.program?.description || ''
        }
      }
    }))

    // Apply search filter (client-side for now)
    if (searchParams.search) {
      const searchTerm = searchParams.search.toLowerCase()
      return reviews.filter((review: any) =>
        review.application.applicant_name.toLowerCase().includes(searchTerm) ||
        review.application.program.title.toLowerCase().includes(searchTerm)
      )
    }

    return reviews
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

function ReviewsPageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Reviews skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  // Await searchParams in Next.js 15
  const params = await searchParams
  
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
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-2">
            Review and evaluate applications assigned to you
          </p>
        </div>

        {/* Stats */}
        <Suspense fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-12 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        }>
          <ReviewStatsServer userId={user.id} />
        </Suspense>

        {/* Filters */}
        <ReviewsFilters searchParams={params} />

        {/* Reviews List */}
        <Suspense fallback={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        }>
          <ReviewsListServer userId={user.id} searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}

async function ReviewStatsServer({ userId }: { userId: string }) {
  const stats = await getReviewStats(userId)
  return <ReviewStats stats={stats} loading={false} />
}

async function ReviewsListServer({ 
  userId, 
  searchParams 
}: { 
  userId: string
  searchParams: SearchParams 
}) {
  const reviews = await getReviews(userId, searchParams)
  return <ReviewsList reviews={reviews} />
}