import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface Application {
  id: string
  applicant_name: string
  applicant_email: string
  submitted_at: string | null
  assigned_reviewers: string[]
}

const createAssignmentSchema = z.object({
  application_ids: z.array(z.string().uuid()),
  reviewer_id: z.string().uuid(),
  deadline: z.string().optional()
})

// GET /api/programs/[id]/review-assignments - Get all review assignments for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this program (either owner or has reviewer role)
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('created_by')
      .eq('id', programId)
      .single()

    if (programError) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    const canViewAll = program.created_by === user.id
    
    // Get review assignments with related data
    // First get applications for this program
    const { data: programApplications, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('program_id', programId)

    if (appError) {
      console.error('Error fetching program applications:', appError)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    const applicationIds = programApplications.map(app => app.id)

    if (applicationIds.length === 0) {
      return NextResponse.json({ assignments: [], applications: [] })
    }

    let assignmentsQuery = supabase
      .from('review_assignments')
      .select(`
        id,
        application_id,
        reviewer_id,
        status,
        deadline,
        assigned_at,
        completed_at,
        applications!review_assignments_application_id_fkey(
          id,
          submitted_at,
          program_id,
          profiles!applications_applicant_id_fkey(
            full_name,
            email
          )
        ),
        profiles!review_assignments_reviewer_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .in('application_id', applicationIds)

    // If not program owner, only show assignments for current user as reviewer
    if (!canViewAll) {
      assignmentsQuery = assignmentsQuery.eq('reviewer_id', user.id)
    }

    const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery

    if (assignmentsError) {
      console.error('Error fetching review assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Get reviews for each assignment
    const assignmentIds = assignmentsData.map(a => a.id)
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('assignment_id, overall_score, submitted_at')
      .in('assignment_id', assignmentIds)

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
    }

    // Combine assignment and review data
    const assignments = assignmentsData.map(assignment => ({
      id: assignment.id,
      application_id: assignment.application_id,
      reviewer_id: assignment.reviewer_id,
      status: assignment.status,
      deadline: assignment.deadline,
      assigned_at: assignment.assigned_at,
      completed_at: assignment.completed_at,
      application: {
        applicant_name: assignment.applications?.profiles?.full_name || '',
        applicant_email: assignment.applications?.profiles?.email || '',
        submitted_at: assignment.applications?.submitted_at || ''
      },
      reviewer: {
        full_name: assignment.profiles?.full_name || '',
        email: assignment.profiles?.email || ''
      },
      review: reviewsData?.find(r => r.assignment_id === assignment.id) ? {
        overall_score: reviewsData.find(r => r.assignment_id === assignment.id)?.overall_score,
        submitted_at: reviewsData.find(r => r.assignment_id === assignment.id)?.submitted_at
      } : undefined
    }))

    // Get applications for assignment interface (only for program owners)
    let applications: Application[] = []
    if (canViewAll) {
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          submitted_at,
          profiles!applications_applicant_id_fkey(
            full_name,
            email
          )
        `)
        .eq('program_id', programId)

      if (!applicationsError && applicationsData) {
        applications = applicationsData.map(app => ({
          id: app.id,
          applicant_name: app.profiles?.full_name || '',
          applicant_email: app.profiles?.email || '',
          submitted_at: app.submitted_at,
          assigned_reviewers: assignments
            .filter(a => a.application_id === app.id)
            .map(a => a.reviewer_id)
        }))
      }
    }

    return NextResponse.json({ 
      assignments,
      applications 
    })
  } catch (error) {
    console.error('Review assignments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/programs/[id]/review-assignments - Create new review assignments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = createAssignmentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      )
    }

    const { application_ids, reviewer_id, deadline } = validationResult.data

    // Check if user owns the program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('created_by')
      .eq('id', programId)
      .single()

    if (programError) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    if (program.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify all applications belong to this program
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('id')
      .eq('program_id', programId)
      .in('id', application_ids)

    if (appsError || !applications || applications.length !== application_ids.length) {
      return NextResponse.json({ error: 'Invalid application IDs' }, { status: 400 })
    }

    // Verify reviewer exists and has reviewer role
    const { data: reviewer, error: reviewerError } = await supabase
      .from('profiles')
      .select('id, roles')
      .eq('id', reviewer_id)
      .single()

    if (reviewerError || !reviewer) {
      return NextResponse.json({ error: 'Reviewer not found' }, { status: 400 })
    }

    const hasReviewerRole = reviewer.roles?.includes('reviewer')
    if (!hasReviewerRole) {
      return NextResponse.json({ error: 'User does not have reviewer role' }, { status: 400 })
    }

    // Create assignments (handle duplicates gracefully)
    const assignmentsToCreate = application_ids.map(applicationId => ({
      application_id: applicationId,
      reviewer_id: reviewer_id,
      assigned_by: user.id,
      program_id: programId,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status: 'not_started' as const
    }))

    const { data: createdAssignments, error: createError } = await supabase
      .from('review_assignments')
      .upsert(assignmentsToCreate, { 
        onConflict: 'application_id,reviewer_id',
        ignoreDuplicates: false 
      })
      .select()

    if (createError) {
      console.error('Error creating assignments:', createError)
      return NextResponse.json({ 
        error: 'Failed to create assignments. Some assignments may already exist.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Review assignments created successfully',
      assignments: createdAssignments
    })
  } catch (error) {
    console.error('Review assignments POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}