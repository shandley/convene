import { createClient } from '@/lib/supabase/server'
import { getUserFromRequest, createServiceClient } from '@/lib/supabase/server-auth'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/reviews
// Fetch all reviews assigned to current user with filtering options
export async function GET(request: NextRequest) {
  try {
    // Check authentication using our helper that supports both cookies and Authorization header
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      console.error('Auth error in reviews:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS policies and avoid circular dependency issues
    const supabase = createServiceClient()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority') 
    const program = searchParams.get('program')
    const sort = searchParams.get('sort') || 'due_date'
    const order = searchParams.get('order') || 'asc'

    // Query review_assignments without nested joins to avoid circular RLS dependencies
    let query = supabase
      .from('review_assignments')
      .select('*')
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

    // Note: Filtering on nested fields needs to be done after fetching
    // We'll filter in JavaScript below if program filter is needed

    // Apply basic sorting (complex nested sorting will be done in JavaScript)
    const ascending = order === 'asc'
    switch (sort) {
      case 'due_date':
        query = query.order('deadline', { ascending })
        break
      case 'status':
        query = query.order('status', { ascending })
        break
      case 'program':
        // Can't sort on nested fields with Supabase, will sort in JS below
        query = query.order('deadline', { ascending: true })
        break
      default:
        query = query.order('deadline', { ascending: true })
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Error fetching review assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get application IDs from assignments
    const applicationIds = assignments.map(a => a.application_id)

    // Fetch applications separately to avoid circular RLS issues
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select(`
        id,
        program_id,
        submitted_at,
        applicant_id,
        program:programs(
          id,
          title,
          description
        )
      `)
      .in('id', applicationIds)

    if (appsError) {
      console.error('Error fetching applications:', appsError)
      return NextResponse.json({ error: appsError.message }, { status: 500 })
    }

    // Get applicant IDs from applications
    const applicantIds = applications?.map(a => a.applicant_id).filter(Boolean) || []

    // Fetch applicant profiles separately
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', applicantIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Create lookup maps for efficient joining
    const applicationsMap = new Map(applications?.map(app => [app.id, app]) || [])
    const profilesMap = new Map(profiles?.map(profile => [profile.id, profile]) || [])

    // Transform the data to match the expected Review interface
    let reviews = assignments.map(assignment => {
      const application = applicationsMap.get(assignment.application_id)
      const applicant = application ? profilesMap.get(application.applicant_id) : null

      return {
        id: assignment.id,
        application_id: assignment.application_id,
        reviewer_id: assignment.reviewer_id,
        status: assignment.status,
        assigned_at: assignment.assigned_at,
        due_date: assignment.deadline,
        submitted_at: assignment.completed_at,
        priority: 'medium', // Default priority since it's not in schema
        application: {
          id: application?.id || assignment.application_id,
          program_id: application?.program_id || '',
          applicant_name: applicant?.full_name || 'Unknown',
          applicant_email: applicant?.email || '',
          submitted_at: application?.submitted_at || null,
          program: {
            title: application?.program?.title || 'Unknown Program',
            description: application?.program?.description || ''
          }
        }
      }
    })

    // Apply client-side program filtering if needed
    if (program) {
      reviews = reviews.filter(review => review.application.program_id === program)
    }

    // Apply client-side program sorting if needed
    if (sort === 'program') {
      reviews = reviews.sort((a, b) => {
        const titleA = a.application.program.title || ''
        const titleB = b.application.program.title || ''
        return order === 'asc' 
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA)
      })
    }

    return NextResponse.json({ data: reviews })

  } catch (error) {
    console.error('Error in GET reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}