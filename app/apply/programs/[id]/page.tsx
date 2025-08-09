'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'

type PublicProgramDetail = {
  id: string
  title: string
  description: string | null
  type: string
  start_date: string
  end_date: string
  application_deadline: string
  capacity: number
  location: string | null
  fee: number | null
  status: string
  current_enrolled: number | null
  current_waitlisted: number | null
  blind_review: boolean | null
  waitlist_capacity: number | null
  daysUntilDeadline: number
  isDeadlineSoon: boolean
  canApply: boolean
  availableSpots: number | null
  hasWaitlist: boolean
  created_by_profile: {
    full_name: string | null
    institution: string | null
  } | null
  application_questions: Array<{
    id: string
    question_text: string
    question_type: string
    required: boolean | null
    options: any
    max_length: number | null
    order_index: number
  }>
}

type UserApplication = {
  id: string
  status: string
  submitted_at: string | null
}

export default function ProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading, initialized } = useAuth()
  const [program, setProgram] = useState<PublicProgramDetail | null>(null)
  const [userApplication, setUserApplication] = useState<UserApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (params.id) {
      fetchProgram(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    // Check if user has already applied (only if authenticated)
    if (initialized && user && program) {
      checkUserApplication()
    }
  }, [initialized, user, program])

  const fetchProgram = async (programId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/programs/${programId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Program not found or not available for applications')
          return
        }
        throw new Error('Failed to fetch program details')
      }
      
      const data = await response.json()
      setProgram(data.program)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const checkUserApplication = async () => {
    if (!user || !program) return

    try {
      const response = await fetch(`/api/applications?program_id=${program.id}`)
      if (response.ok) {
        const data = await response.json()
        const application = data.applications.find((app: any) => app.program_id === program.id)
        if (application) {
          setUserApplication(application)
        }
      }
    } catch (err) {
      // Silently fail - this is just for UI enhancement
      console.log('Could not check application status:', err)
    }
  }

  const handleApplyClick = () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/auth/login?redirect=/apply/programs/${program?.id}`)
      return
    }

    if (userApplication) {
      // User already applied, redirect to their application
      router.push(`/applications/${userApplication.id}`)
      return
    }

    // Redirect to application form
    router.push(`/apply/programs/${program?.id}/application`)
  }

  const getStatusBadge = (program: PublicProgramDetail) => {
    if (!program.canApply) {
      if (new Date(program.application_deadline) < new Date()) {
        return <Badge variant="secondary">Applications Closed</Badge>
      }
      return <Badge variant="secondary">{program.status}</Badge>
    }

    if (program.isDeadlineSoon) {
      return <Badge variant="destructive">Deadline Soon</Badge>
    }

    return <Badge variant="default">Applications Open</Badge>
  }

  const getDeadlineText = (program: PublicProgramDetail) => {
    if (program.daysUntilDeadline < 0) {
      return 'Applications have closed'
    }
    if (program.daysUntilDeadline === 0) {
      return 'Applications close today!'
    }
    if (program.daysUntilDeadline === 1) {
      return '1 day left to apply'
    }
    return `${program.daysUntilDeadline} days left to apply`
  }

  const getApplyButtonText = () => {
    if (!user) return 'Sign In to Apply'
    if (userApplication) {
      switch (userApplication.status) {
        case 'draft': return 'Continue Application'
        case 'submitted': return 'View Application'
        case 'under_review': return 'Application Under Review'
        case 'accepted': return 'Application Accepted'
        case 'rejected': return 'Application Reviewed'
        case 'waitlisted': return 'On Waitlist'
        default: return 'View Application'
      }
    }
    if (!program?.canApply) return 'Applications Closed'
    return 'Apply Now'
  }

  const getApplyButtonVariant = () => {
    if (!program?.canApply) return 'secondary'
    if (userApplication?.status === 'accepted') return 'default'
    if (userApplication?.status === 'rejected') return 'secondary'
    return 'default'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Loading program details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || 'Program not found'}
            </h3>
            <p className="text-gray-600 mb-6">
              The program you're looking for may not be available or may have been removed.
            </p>
            <Link href="/apply">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Programs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/apply">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Programs
            </Button>
          </Link>
        </div>

        {/* Program header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl md:text-3xl">{program.title}</CardTitle>
                  {getStatusBadge(program)}
                </div>
                <CardDescription className="text-lg">
                  {program.type.charAt(0).toUpperCase() + program.type.slice(1)}
                  {program.created_by_profile?.full_name && (
                    <>
                      {' • Organized by '}
                      {program.created_by_profile.full_name}
                      {program.created_by_profile.institution && (
                        <> at {program.created_by_profile.institution}</>
                      )}
                    </>
                  )}
                </CardDescription>
              </div>
              
              <div className="flex flex-col gap-2 md:items-end">
                <Button 
                  size="lg" 
                  onClick={handleApplyClick}
                  disabled={!program.canApply && !!user}
                  variant={getApplyButtonVariant()}
                >
                  {getApplyButtonText()}
                </Button>
                
                {program.canApply && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className={program.isDeadlineSoon ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {getDeadlineText(program)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* User application status */}
        {userApplication && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">You have already applied to this program</p>
                  <p className="text-sm text-gray-600">
                    Status: <Badge variant="outline">{userApplication.status}</Badge>
                    {userApplication.submitted_at && (
                      <> • Submitted {new Date(userApplication.submitted_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            {program.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About This Program</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    {program.description.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Requirements */}
            {program.application_questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Application Requirements</CardTitle>
                  <CardDescription>
                    The application will include the following questions:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {program.application_questions
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((question, index) => (
                        <div key={question.id} className="border-l-2 border-gray-200 pl-4">
                          <div className="flex items-start gap-2">
                            <span className="text-sm text-gray-500 min-w-[2rem]">
                              {index + 1}.
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {question.question_text}
                                {question.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600 capitalize">
                                {question.question_type.replace('_', ' ')}
                                {question.max_length && (
                                  <> • Max {question.max_length} characters</>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Program Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-sm text-gray-600">
                      {new Date(program.start_date).toLocaleDateString()} - {new Date(program.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Application Deadline</p>
                    <p className={`text-sm ${program.isDeadlineSoon ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {new Date(program.application_deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                {program.location && (
                  <>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-gray-600">{program.location}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-sm text-gray-600">
                      {program.availableSpots !== null ? (
                        <>
                          {program.availableSpots} of {program.capacity} spots available
                          {program.current_enrolled && program.current_enrolled > 0 && (
                            <><br />{program.current_enrolled} enrolled</>
                          )}
                        </>
                      ) : (
                        <>
                          {program.capacity} participants
                          {program.blind_review && (
                            <><br />Blind review process</>
                          )}
                        </>
                      )}
                    </p>
                    {program.hasWaitlist && (
                      <p className="text-sm text-gray-500 mt-1">
                        <Info className="inline h-3 w-3 mr-1" />
                        Waitlist available ({program.waitlist_capacity} spots)
                      </p>
                    )}
                  </div>
                </div>

                {program.fee && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Fee</p>
                        <p className="text-sm text-gray-600">${program.fee}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Call to action */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-medium text-blue-900 mb-2">Ready to Apply?</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    {!user ? (
                      'Sign in to your account to start your application.'
                    ) : userApplication ? (
                      'You can view or edit your application anytime before the deadline.'
                    ) : program.canApply ? (
                      'Start your application now. You can save and return anytime.'
                    ) : (
                      'Applications for this program are currently closed.'
                    )}
                  </p>
                  <Button 
                    onClick={handleApplyClick}
                    disabled={!program.canApply && !!user}
                    variant={getApplyButtonVariant()}
                    className="w-full"
                  >
                    {getApplyButtonText()}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}