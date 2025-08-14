import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// GET /api/programs/[id]/review-stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: programId } = await params

    // Get program review statistics using the database function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_program_review_stats', {
        program_id_param: programId
      })

    if (statsError) {
      console.error('Error fetching review stats:', statsError)
      return NextResponse.json({ error: statsError.message }, { status: 500 })
    }

    // Get application rankings
    const { data: rankings, error: rankingsError } = await supabase
      .rpc('get_application_ranking', {
        program_id_param: programId
      })

    if (rankingsError) {
      console.error('Error fetching application rankings:', rankingsError)
      return NextResponse.json({ error: rankingsError.message }, { status: 500 })
    }

    // Get reviewer workload distribution
    const { data: reviewerStats, error: reviewerError } = await supabase
      .from('review_assignments')
      .select(`
        reviewer_id,
        status,
        profiles!review_assignments_reviewer_id_fkey (
          id,
          full_name,
          email
        ),
        applications!review_assignments_application_id_fkey (
          program_id
        )
      `)
      .eq('applications.program_id', programId)

    if (reviewerError) {
      console.error('Error fetching reviewer stats:', reviewerError)
      return NextResponse.json({ error: reviewerError.message }, { status: 500 })
    }

    // Process reviewer stats - filter for this program only
    const filteredStats = reviewerStats?.filter((assignment: any) => 
      assignment.applications?.program_id === programId
    ) || []
    
    const reviewerWorkload = filteredStats.reduce((acc: any, assignment: any) => {
      const reviewerId = assignment.reviewer_id
      if (!acc[reviewerId]) {
        acc[reviewerId] = {
          reviewer: assignment.profiles,
          total_assigned: 0,
          completed: 0,
          in_progress: 0,
          not_started: 0
        }
      }
      acc[reviewerId].total_assigned++
      if (assignment.status === 'completed') {
        acc[reviewerId].completed++
      } else if (assignment.status === 'in_progress') {
        acc[reviewerId].in_progress++
      } else {
        acc[reviewerId].not_started++
      }
      return acc
    }, {})

    return NextResponse.json({
      data: {
        overview: stats,
        rankings,
        reviewerWorkload: Object.values(reviewerWorkload)
      }
    })
  } catch (error) {
    console.error('Error in GET review stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}