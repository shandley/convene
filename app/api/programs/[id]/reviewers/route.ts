import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/programs/[id]/reviewers - Get available reviewers for a program
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

    // Get all users with reviewer role
    const { data: reviewers, error: reviewersError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        roles,
        reviewer_expertise!reviewer_id(
          expertise_area,
          proficiency_level,
          years_of_experience,
          specialization_tags,
          total_reviews_completed
        )
      `)
      .contains('roles', ['reviewer'])

    if (reviewersError) {
      console.error('Error fetching reviewers:', reviewersError)
      return NextResponse.json({ error: 'Failed to fetch reviewers' }, { status: 500 })
    }

    // Transform the data to include expertise information
    const reviewersList = reviewers.map(reviewer => ({
      id: reviewer.id,
      full_name: reviewer.full_name || 'Unknown',
      email: reviewer.email,
      expertise: reviewer.reviewer_expertise?.map(exp => exp.expertise_area) || [],
      specialization_tags: reviewer.reviewer_expertise?.[0]?.specialization_tags || [],
      total_reviews_completed: reviewer.reviewer_expertise?.[0]?.total_reviews_completed || 0,
      years_of_experience: reviewer.reviewer_expertise?.[0]?.years_of_experience || 0,
      proficiency_level: reviewer.reviewer_expertise?.[0]?.proficiency_level || 'beginner'
    }))

    // Get current review workload for each reviewer
    const reviewerIds = reviewersList.map(r => r.id)
    const { data: workloadData, error: workloadError } = await supabase
      .from('review_assignments')
      .select('reviewer_id, status')
      .in('reviewer_id', reviewerIds)
      .in('status', ['not_started', 'in_progress'])

    if (!workloadError && workloadData) {
      // Add current workload to each reviewer
      reviewersList.forEach((reviewer: any) => {
        const currentWorkload = workloadData.filter(w => w.reviewer_id === reviewer.id).length
        reviewer.current_workload = currentWorkload
      })
    }

    return NextResponse.json({ reviewers: reviewersList })
  } catch (error) {
    console.error('Reviewers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}