import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/reviews/stats
// Return reviewer statistics (total, in progress, completed, overdue)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all review assignments for the current user
    const { data: assignments, error } = await supabase
      .from('review_assignments')
      .select('id, status, deadline')
      .eq('reviewer_id', user.id)

    if (error) {
      console.error('Error fetching review assignments for stats:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = new Date()
    
    // Calculate stats
    const stats = {
      total: assignments?.length || 0,
      inProgress: assignments?.filter(r => r.status === 'in_progress').length || 0,
      completed: assignments?.filter(r => r.status === 'completed').length || 0,
      overdue: assignments?.filter(r => 
        r.deadline && new Date(r.deadline) < now && r.status !== 'completed'
      ).length || 0,
      notStarted: assignments?.filter(r => r.status === 'not_started').length || 0
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('Error in GET review stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}