'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, FileText, Settings, Eye, Save } from 'lucide-react'
import Link from 'next/link'
import type { Tables } from '@/types/database.types'
import type { ApplicationQuestionWithRelations } from '@/types/questions'
import { ApplicationFormPreview } from '@/components/programs/ApplicationFormPreview'
import { QuestionBuilder } from '@/components/programs/questions/QuestionBuilder'
import { QuestionsService } from '@/lib/services/questions'

const editProgramSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  application_deadline: z.string().min(1, 'Application deadline is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  location: z.string().optional(),
  fee: z.number().optional().nullable(),
  blind_review: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'applications_open', 'applications_closed', 'in_review', 'active', 'completed', 'cancelled']).optional(),
})

type EditProgramForm = z.infer<typeof editProgramSchema>

interface EditProgramPageProps {
  params: Promise<{ id: string }>
}

export default function EditProgramPage({ params }: EditProgramPageProps) {
  const { user, loading } = useAuth()
  const [program, setProgram] = useState<Tables<'programs'> | null>(null)
  const [programLoading, setProgramLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [questions, setQuestions] = useState<ApplicationQuestionWithRelations[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const router = useRouter()
  const [id, setId] = useState<string>('')

  const form = useForm<EditProgramForm>({
    resolver: zodResolver(editProgramSchema),
    mode: 'onBlur',
  })

  // Watch form values to detect changes
  const watchedValues = form.watch()

  // Unwrap params
  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (user && id) {
      fetchProgram()
    }
  }, [user, loading, router, id])

  const fetchProgram = async () => {
    try {
      setProgramLoading(true)
      const response = await fetch(`/api/programs/${id}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        if (response.status === 404) {
          setError('Program not found')
          return
        }
        throw new Error('Failed to fetch program')
      }
      
      const data = await response.json()
      setProgram(data.program)
      
      // Set form values
      form.reset({
        title: data.program.title || '',
        description: data.program.description || '',
        type: data.program.type || '',
        start_date: data.program.start_date || '',
        end_date: data.program.end_date || '',
        application_deadline: data.program.application_deadline || '',
        capacity: data.program.capacity || 30,
        location: data.program.location || '',
        fee: data.program.fee || null,
        blind_review: data.program.blind_review || false,
        status: data.program.status || 'draft',
      })
      setHasUnsavedChanges(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setProgramLoading(false)
    }
  }

  const fetchQuestions = useCallback(async () => {
    if (!id || activeTab !== 'questions') return
    
    try {
      setQuestionsLoading(true)
      const response = await fetch(`/api/programs/${id}/questions`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch questions')
      }
      
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (err) {
      console.error('Error fetching questions:', err)
      // Don't set error state here as it's not critical for the main functionality
    } finally {
      setQuestionsLoading(false)
    }
  }, [id, activeTab, router])

  const handleQuestionsChange = useCallback((updatedQuestions: ApplicationQuestionWithRelations[]) => {
    setQuestions(updatedQuestions)
    setHasUnsavedChanges(true)
  }, [])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'questions' && questions.length === 0) {
      fetchQuestions()
    }
  }

  const onSubmit = async (data: EditProgramForm) => {
    if (!user || !id) {
      setError('You must be logged in to edit a program')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/programs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update program')
      }

      const { program } = await response.json()
      setHasUnsavedChanges(false)
      router.push(`/programs/${program.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Effect to fetch questions when tab becomes active
  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions()
    }
  }, [activeTab, fetchQuestions])

  // Effect to detect form changes
  useEffect(() => {
    if (program && form.formState.isDirty) {
      setHasUnsavedChanges(true)
    }
  }, [watchedValues, program, form.formState.isDirty])

  if (loading || programLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (error && !program) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/programs">
              <Button>Back to Programs</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!program) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <Link href={`/programs/${id}`}>
            <Button variant="ghost" className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Program
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Edit Program</h1>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-amber-600">
                <Save className="h-4 w-4" />
                <span className="text-sm font-medium">You have unsaved changes</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Questions
              {questions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {questions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="title">Program Title *</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  className="mt-1"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <div>
                <Label htmlFor="type">Program Type *</Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(value) => form.setValue('type', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="symposium">Symposium</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as any)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="applications_open">Applications Open</SelectItem>
                    <SelectItem value="applications_closed">Applications Closed</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...form.register('start_date')}
                    className="mt-1"
                  />
                  {form.formState.errors.start_date && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.start_date.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    {...form.register('end_date')}
                    className="mt-1"
                  />
                  {form.formState.errors.end_date && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.end_date.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="application_deadline">Application Deadline *</Label>
                <Input
                  id="application_deadline"
                  type="date"
                  {...form.register('application_deadline')}
                  className="mt-1"
                />
                {form.formState.errors.application_deadline && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.application_deadline.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="capacity">Maximum Participants *</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...form.register('capacity', { 
                    valueAsNumber: true,
                    setValueAs: (value) => value === '' ? 0 : Number(value)
                  })}
                  className="mt-1"
                />
                {form.formState.errors.capacity && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.capacity.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...form.register('location')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="fee">Registration Fee</Label>
                <Input
                  id="fee"
                  type="number"
                  {...form.register('fee', { 
                    valueAsNumber: true,
                    setValueAs: (value) => value === '' ? null : Number(value)
                  })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="blind_review"
                  {...form.register('blind_review')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="blind_review">
                  Enable blind review (reviewers cannot see applicant names)
                </Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href={`/programs/${id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || Object.keys(form.formState.errors).length > 0}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="questions" className="mt-6">
        <QuestionBuilder
          programId={id}
          questions={questions}
          onQuestionsChange={handleQuestionsChange}
          isLoading={questionsLoading}
        />
      </TabsContent>

      <TabsContent value="preview" className="mt-6">
        <ApplicationFormPreview
          program={program}
          questions={questions}
          isLoading={questionsLoading}
        />
      </TabsContent>
    </Tabs>
      </div>
    </div>
  )
}