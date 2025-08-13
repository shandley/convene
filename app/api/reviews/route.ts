import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/reviews
// Fetch all reviews assigned to current user with filtering options
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority') 
    const program = searchParams.get('program')
    const sort = searchParams.get('sort') || 'due_date'
    const order = searchParams.get('order') || 'asc'

    // Build the query - using review_assignments as the main table
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
        application:applications(
          id,
          program_id,
          submitted_at,
          applicant:profiles!applications_applicant_id_fkey(
            id,
            full_name,
            email
          ),
          program:programs(
            id,
            title,
            description
          )
        )
      `)
      .eq('reviewer_id', user.id)

    // Apply filters
    if (status && status !== 'all') {
      if (status === 'overdue') {
        // Filter for overdue reviews (past due date and not completed)
        query = query.lt('deadline', new Date().toISOString())
          .neq('status', 'completed' as const)
      } else {
        query = query.eq('status', status as any)
      }
    }

    // Priority is not in the schema, skip this filter
    // if (priority && priority !== 'all') {
    //   query = query.eq('priority', priority)
    // }

    if (program) {
      query = query.eq('application.program_id', program)
    }

    // Apply sorting
    const ascending = order === 'asc'
    switch (sort) {
      case 'due_date':
        query = query.order('deadline', { ascending })
        break
      case 'status':
        query = query.order('status', { ascending })
        break
      case 'program':
        query = query.order('application.program.title', { ascending })
        break
      default:
        query = query.order('deadline', { ascending: true })
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Error fetching review assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to match the expected Review interface
    const reviews = assignments?.map(assignment => ({
      id: assignment.id,
      application_id: assignment.application_id,
      reviewer_id: assignment.reviewer_id,
      status: assignment.status,
      assigned_at: assignment.assigned_at,
      due_date: assignment.deadline,
      submitted_at: assignment.completed_at,
      priority: 'medium', // Default priority since it's not in schema
      application: {
        id: assignment.application.id,
        program_id: assignment.application.program_id,
        applicant_name: assignment.application.applicant?.full_name || 'Unknown',
        applicant_email: assignment.application.applicant?.email || '',
        submitted_at: assignment.application.submitted_at,
        program: {
          title: assignment.application.program.title,
          description: assignment.application.program.description
        }
      }
    })) || []

    return NextResponse.json({ data: reviews })

  } catch (error) {
    console.error('Error in GET reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}