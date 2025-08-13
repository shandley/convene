'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { 
  UserPlus, 
  Download, 
  Mail, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ClipboardList,
  BarChart3
} from 'lucide-react'

interface ReviewAssignment {
  id: string
  application_id: string
  reviewer_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  deadline: string
  assigned_at: string
  completed_at?: string
  application: {
    applicant_name: string
    applicant_email: string
    submitted_at: string
  }
  reviewer: {
    full_name: string
    email: string
  }
  review?: {
    overall_score: number
    submitted_at: string
  }
}

interface ReviewerOption {
  id: string
  full_name: string
  email: string
  expertise?: string[]
  total_reviews_completed?: number
  current_workload?: number
}

interface Application {
  id: string
  applicant_name: string
  applicant_email: string
  submitted_at: string | null
  assigned_reviewers: string[]
}

interface ReviewStats {
  overview?: {
    total_assignments: number
    completed_reviews: number
    pending_reviews: number
    average_score?: number
    completion_rate: number
  }
  total_assignments: number
  completed_reviews: number
  pending_reviews: number
  average_score?: number
  completion_rate: number
}

interface ReviewsTabProps {
  programId: string
  canManage: boolean
}

export function ReviewsTab({ programId, canManage }: ReviewsTabProps) {
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([])
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [selectedReviewer, setSelectedReviewer] = useState('')
  const [reviewDeadline, setReviewDeadline] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (programId) {
      fetchData()
    }
  }, [programId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [assignmentsRes, reviewersRes, statsRes] = await Promise.all([
        fetch(`/api/programs/${programId}/review-assignments`),
        canManage ? fetch(`/api/programs/${programId}/reviewers`) : Promise.resolve(null),
        fetch(`/api/programs/${programId}/review-stats`)
      ])

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData.assignments || [])
        setApplications(assignmentsData.applications || [])
      }

      if (reviewersRes?.ok) {
        const reviewersData = await reviewersRes.json()
        setReviewers(reviewersData.reviewers || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        // Handle both direct stats and nested data structure
        const stats = statsData.data?.overview || statsData.stats || statsData
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching review data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load review data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignReviewer = async () => {
    if (!selectedReviewer || selectedApplications.length === 0 || !reviewDeadline) {
      toast({
        title: 'Missing Information',
        description: 'Please select applications, reviewer, and deadline',
        variant: 'destructive'
      })
      return
    }

    setAssignmentLoading(true)
    try {
      const response = await fetch(`/api/programs/${programId}/review-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_ids: selectedApplications,
          reviewer_id: selectedReviewer,
          deadline: reviewDeadline
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign reviewer')
      }

      toast({
        title: 'Success',
        description: 'Reviews assigned successfully'
      })

      setSelectedApplications([])
      setSelectedReviewer('')
      setReviewDeadline('')
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error assigning reviewer:', error)
      toast({
        title: 'Error',
        description: 'Failed to assign reviewer',
        variant: 'destructive'
      })
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/programs/${programId}/review-assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove assignment')
      }

      toast({
        title: 'Success',
        description: 'Review assignment removed'
      })

      fetchData() // Refresh data
    } catch (error) {
      console.error('Error removing assignment:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove assignment',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'in_progress': return 'secondary'
      case 'not_started': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'not_started': return <AlertCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Loading review data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_assignments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed_reviews}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completion_rate.toFixed(1)}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_reviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.average_score ? stats.average_score.toFixed(1) : 'N/A'}
              </div>
              {stats.average_score && (
                <p className="text-xs text-muted-foreground">out of 5.0</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignment Interface */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Reviewers</CardTitle>
            <CardDescription>
              Select applications and assign reviewers with deadlines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Reviewer</label>
                <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewers.map((reviewer) => (
                      <SelectItem key={reviewer.id} value={reviewer.id}>
                        <div className="flex flex-col">
                          <span>{reviewer.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {reviewer.email} • {reviewer.total_reviews_completed || 0} reviews
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Review Deadline</label>
                <Input
                  type="date"
                  value={reviewDeadline}
                  onChange={(e) => setReviewDeadline(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleAssignReviewer}
                  disabled={assignmentLoading || selectedApplications.length === 0}
                  className="w-full"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {assignmentLoading ? 'Assigning...' : `Assign to ${selectedApplications.length} app(s)`}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Select applications below to assign reviews
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Review Assignments</CardTitle>
              <CardDescription>
                Current review assignments and their status
              </CardDescription>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reminders
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Results
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="mx-auto h-12 w-12 mb-4" />
              <p>No review assignments yet</p>
              {canManage && (
                <p className="text-sm">Start by assigning reviewers to applications</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {canManage && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedApplications.length === applications.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedApplications(applications.map(app => app.id))
                          } else {
                            setSelectedApplications([])
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>Applicant</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Assigned</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    {canManage && (
                      <TableCell>
                        <Checkbox
                          checked={selectedApplications.includes(assignment.application_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedApplications([...selectedApplications, assignment.application_id])
                            } else {
                              setSelectedApplications(selectedApplications.filter(id => id !== assignment.application_id))
                            }
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{assignment.application.applicant_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {assignment.application.applicant_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{assignment.reviewer.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {assignment.reviewer.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(assignment.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(assignment.status)}
                          {assignment.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.review?.overall_score ? (
                        <span className="font-medium">
                          {assignment.review.overall_score}/5
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.deadline ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(assignment.deadline).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No deadline</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}