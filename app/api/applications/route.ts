import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/applications
// Fetch applications for the current user
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
    const program_id = searchParams.get('program_id')

    // Build the query
    let query = supabase
      .from('applications')
      .select(`
        *,
        program:programs(
          id,
          title,
          description,
          status,
          start_date,
          end_date
        )
      `)
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (program_id) {
      query = query.eq('program_id', program_id)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: applications || [] })

  } catch (error) {
    console.error('Error in GET applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}