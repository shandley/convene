'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MoreVertical, Archive, Trash2, Edit } from 'lucide-react'
import type { Tables } from '@/types/database.types'

type ProgramWithDetails = Tables<'programs'> & {
  created_by_profile: {
    full_name: string | null
    email: string
  } | null
}

interface ProgramDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function ProgramDetailsPage({ params }: ProgramDetailsPageProps) {
  const { user, loading } = useAuth()
  const [program, setProgram] = useState<ProgramWithDetails | null>(null)
  const [programLoading, setProgramLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const { toast } = useToast()

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setProgramLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!id || archiving) return
    
    setArchiving(true)
    try {
      const response = await fetch(`/api/programs/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to archive program')
      }

      toast({
        title: 'Success',
        description: 'Program has been archived successfully',
      })

      router.push('/programs')
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to archive program',
        variant: 'destructive',
      })
    } finally {
      setArchiving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || deleting) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 400 && errorData.error?.includes('applications')) {
          throw new Error('Cannot delete program with existing applications. Please archive it instead.')
        }
        throw new Error(errorData.error || 'Failed to delete program')
      }

      toast({
        title: 'Success',
        description: 'Program has been deleted successfully',
      })

      router.push('/programs')
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete program',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'published': return 'default'
      case 'applications_open': return 'default'
      case 'applications_closed': return 'secondary'
      case 'in_review': return 'secondary'
      case 'active': return 'default'
      case 'completed': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  if (loading || programLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (error) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/programs">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Programs
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {/* Only show actions if user is the creator */}
              {user && program.created_by === user.id && (
                <>
                  <Link href={`/programs/${program.id}/edit`}>
                    <Button variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive Program
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive Program</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to archive this program? Archived programs will not be visible in the main list but can be restored later. Existing applications will remain intact.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleArchive}
                              disabled={archiving}
                            >
                              {archiving ? 'Archiving...' : 'Archive Program'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Program
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Program</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete this program? This action cannot be undone. All program data will be lost forever.
                                <br /><br />
                                <strong>Note: Programs with existing applications cannot be deleted and must be archived instead.</strong>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deleting ? 'Deleting...' : 'Delete Program'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Program Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-2xl">{program.title}</CardTitle>
                  <Badge variant={getStatusVariant(program.status || 'draft')}>
                    {program.status || 'draft'}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  {program.type} • {program.capacity} participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {program.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{program.description}</p>
                  </div>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-1">Start Date</h4>
                    <p className="text-gray-700">{new Date(program.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">End Date</h4>
                    <p className="text-gray-700">{new Date(program.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Application Deadline</h4>
                    <p className="text-gray-700">{new Date(program.application_deadline).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Location</h4>
                    <p className="text-gray-700">{program.location || 'TBD'}</p>
                  </div>
                  {program.fee && (
                    <div>
                      <h4 className="font-semibold mb-1">Registration Fee</h4>
                      <p className="text-gray-700">${program.fee}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold mb-1">Blind Review</h4>
                    <p className="text-gray-700">{program.blind_review ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Capacity</h4>
                    <p className="text-gray-700">{program.capacity} participants</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Applications</h4>
                    <p className="text-gray-700">0 submitted</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Enrolled</h4>
                    <p className="text-gray-700">{program.current_enrolled || 0} participants</p>
                  </div>
                  {program.waitlist_capacity && (
                    <div>
                      <h4 className="font-semibold mb-1">Waitlist</h4>
                      <p className="text-gray-700">{program.current_waitlisted || 0} / {program.waitlist_capacity}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Created By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{program.created_by_profile?.full_name || 'Unknown'}</p>
                  <p className="text-gray-600 text-sm">{program.created_by_profile?.email}</p>
                  <p className="text-gray-500 text-sm">
                    Created {new Date(program.created_at || '').toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}