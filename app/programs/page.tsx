'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Tables } from '@/types/database.types'

type ProgramWithCreator = Tables<'programs'> & {
  created_by_profile: {
    full_name: string | null
    email: string
  } | null
}

export default function ProgramsPage() {
  const { user, loading, initialized, signOut } = useAuth()
  const [programs, setPrograms] = useState<ProgramWithCreator[]>([])
  const [programsLoading, setProgramsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push('/auth/login')
      return
    }

    if (initialized && user) {
      fetchPrograms()
    }
  }, [user, loading, initialized, router])

  const fetchPrograms = async () => {
    try {
      setProgramsLoading(true)
      const response = await fetch('/api/programs')
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error('Failed to fetch programs')
      }
      
      const data = await response.json()
      setPrograms(data.programs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setProgramsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
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

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your workshop programs and applications
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/programs/create">
                <Button>Create Program</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {programsLoading ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Loading programs...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first workshop program.
            </p>
            <Link href="/programs/create">
              <Button>Create Your First Program</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <Card key={program.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{program.title}</CardTitle>
                    <Badge variant={getStatusVariant(program.status || 'draft')}>
                      {program.status || 'draft'}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {program.type} • {program.capacity} participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {program.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {program.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <strong>Dates:</strong> {new Date(program.start_date).toLocaleDateString()} - {new Date(program.end_date).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Application Deadline:</strong> {new Date(program.application_deadline).toLocaleDateString()}
                    </div>
                    {program.location && (
                      <div>
                        <strong>Location:</strong> {program.location}
                      </div>
                    )}
                    {program.fee && (
                      <div>
                        <strong>Fee:</strong> ${program.fee}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/programs/${program.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/programs/${program.id}/edit`}>
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}