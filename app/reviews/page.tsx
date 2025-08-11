'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { ReviewStats } from '@/components/reviews/ReviewStats'
import { ReviewCard, type Review } from '@/components/reviews/ReviewCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, SortAsc } from 'lucide-react'
import { getMyReviews, getReviewStats, type ReviewStats as ReviewStatsType, type ReviewFilterOptions } from '@/lib/services/reviews'
import { toast } from '@/hooks/use-toast'


type SortOption = 'due_date' | 'priority' | 'status' | 'program'
type FilterStatus = 'all' | 'not_started' | 'in_progress' | 'completed' | 'overdue'
type FilterPriority = 'all' | 'low' | 'medium' | 'high'

export default function ReviewsPage() {
  const { hasRole, loading: authLoading } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStatsType>({ total: 0, inProgress: 0, completed: 0, overdue: 0 })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all')
  const [sortBy, setSortBy] = useState<SortOption>('due_date')

  // Check if user has reviewer role
  const isReviewer = hasRole('reviewer')

  // Fetch reviews from API
  const fetchReviews = async () => {
    if (!isReviewer) return
    
    try {
      setLoading(true)
      setError(null)
      
      const filters: ReviewFilterOptions = {
        status: statusFilter,
        priority: priorityFilter,
        sort: sortBy,
        order: 'asc'
      }
      
      const reviewsData = await getMyReviews(filters)
      setReviews(reviewsData)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      setError('Failed to load reviews. Please try again.')
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats from API
  const fetchStats = async () => {
    if (!isReviewer) return
    
    try {
      setStatsLoading(true)
      const statsData = await getReviewStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Don't show error toast for stats as it's not critical
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isReviewer) {
      fetchReviews()
      fetchStats()
    }
  }, [authLoading, isReviewer])

  // Refetch reviews when filters change
  useEffect(() => {
    if (!authLoading && isReviewer && !loading) {
      fetchReviews()
    }
  }, [statusFilter, priorityFilter, sortBy])

  // Apply client-side search filter (server handles status, priority, sort)
  useEffect(() => {
    let filtered = [...reviews]

    // Apply search filter (client-side for responsiveness)
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.application.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.application.program.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredReviews(filtered)
  }, [reviews, searchTerm])


  if (authLoading) {
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
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
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
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
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
        <ReviewStats stats={stats} loading={statsLoading} />

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by applicant name or program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value: FilterStatus) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(value: FilterPriority) => setPriorityFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="program">Program</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Reviews</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchReviews} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? "Try adjusting your filters to see more reviews."
                  : "You don't have any reviews assigned at the moment."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}