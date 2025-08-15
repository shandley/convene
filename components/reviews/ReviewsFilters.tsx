'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, SortAsc } from 'lucide-react'
import { useCallback } from 'react'

type SearchParams = {
  status?: string
  priority?: string
  search?: string
  sort?: string
  order?: string
}

interface ReviewsFiltersProps {
  searchParams: SearchParams
}

export function ReviewsFilters({ searchParams }: ReviewsFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()

  const updateSearchParams = useCallback((updates: Partial<SearchParams>) => {
    const params = new URLSearchParams(currentSearchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const newUrl = `/reviews${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newUrl)
  }, [router, currentSearchParams])

  const handleSearchChange = useCallback((value: string) => {
    updateSearchParams({ search: value })
  }, [updateSearchParams])

  const handleStatusChange = useCallback((value: string) => {
    updateSearchParams({ status: value })
  }, [updateSearchParams])

  const handlePriorityChange = useCallback((value: string) => {
    updateSearchParams({ priority: value })
  }, [updateSearchParams])

  const handleSortChange = useCallback((value: string) => {
    updateSearchParams({ sort: value })
  }, [updateSearchParams])

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by applicant name or program..."
          defaultValue={searchParams.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select 
        value={searchParams.status || 'all'} 
        onValueChange={handleStatusChange}
      >
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

      <Select 
        value={searchParams.priority || 'all'} 
        onValueChange={handlePriorityChange}
      >
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

      <Select 
        value={searchParams.sort || 'due_date'} 
        onValueChange={handleSortChange}
      >
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
  )
}