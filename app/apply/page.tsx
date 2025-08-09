'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Search, Calendar, MapPin, Users, DollarSign, Clock } from 'lucide-react'

type PublicProgram = {
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
  daysUntilDeadline: number
  isDeadlineSoon: boolean
  canApply: boolean
  availableSpots: number | null
  created_by_profile: {
    full_name: string | null
  } | null
}

export default function ApplyPage() {
  const [programs, setPrograms] = useState<PublicProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filteredPrograms, setFilteredPrograms] = useState<PublicProgram[]>([])

  useEffect(() => {
    fetchPrograms()
  }, [])

  useEffect(() => {
    filterPrograms()
  }, [programs, searchTerm, filterType])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/public/programs')
      
      if (!response.ok) {
        throw new Error('Failed to fetch programs')
      }
      
      const data = await response.json()
      setPrograms(data.programs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filterPrograms = () => {
    let filtered = programs

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(program => 
        program.title.toLowerCase().includes(search) ||
        program.description?.toLowerCase().includes(search) ||
        program.type.toLowerCase().includes(search)
      )
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(program => program.type === filterType)
    }

    setFilteredPrograms(filtered)
  }

  const getStatusBadge = (program: PublicProgram) => {
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

  const getDeadlineText = (program: PublicProgram) => {
    if (program.daysUntilDeadline < 0) {
      return 'Applications closed'
    }
    if (program.daysUntilDeadline === 0) {
      return 'Applications close today!'
    }
    if (program.daysUntilDeadline === 1) {
      return '1 day left to apply'
    }
    return `${program.daysUntilDeadline} days left to apply`
  }

  // Get unique program types for filter
  const programTypes = Array.from(new Set(programs.map(p => p.type)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Loading programs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Programs</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore workshops, conferences, and educational programs. Find the perfect opportunity to advance your skills and connect with your community.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-lg p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {programTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'No programs match your criteria' : 'No programs available'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters to find more programs.' 
                : 'Check back soon for new program announcements.'
              }
            </p>
            {(searchTerm || filterType !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg leading-tight">{program.title}</CardTitle>
                    {getStatusBadge(program)}
                  </div>
                  <CardDescription className="text-sm">
                    {program.type.charAt(0).toUpperCase() + program.type.slice(1)}
                    {program.created_by_profile?.full_name && (
                      <> • by {program.created_by_profile.full_name}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {program.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {program.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(program.start_date).toLocaleDateString()} - {new Date(program.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {program.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{program.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>
                        {program.availableSpots !== null ? (
                          `${program.availableSpots} of ${program.capacity} spots available`
                        ) : (
                          `${program.capacity} participants`
                        )}
                      </span>
                    </div>
                    
                    {program.fee && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>${program.fee}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span className={program.isDeadlineSoon ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {getDeadlineText(program)}
                      </span>
                    </div>
                  </div>
                  
                  <Link href={`/apply/programs/${program.id}`}>
                    <Button className="w-full">
                      Learn More
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}