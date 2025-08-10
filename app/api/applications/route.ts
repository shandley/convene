import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/applications - Get applications for authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get URL search params for filtering
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('program_id')

    let query = supabase
      .from('applications')
      .select(`
        id,
        program_id,
        status,
        submitted_at,
        decided_at,
        withdrawn_at,
        created_at,
        updated_at,
        is_draft,
        completion_percentage,
        programs (
          id,
          title,
          type,
          start_date,
          end_date,
          application_deadline
        )
      `)
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false })

    // Filter by program if specified
    if (programId) {
      query = query.eq('program_id', programId)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    return NextResponse.json({ applications: applications || [] })
  } catch (error) {
    console.error('Applications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/applications - Create a new application
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { program_id, responses = {}, statement_of_interest = null, is_draft = true } = body

    if (!program_id) {
      return NextResponse.json({ error: 'program_id is required' }, { status: 400 })
    }

    // Verify the program exists and is accepting applications
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, title, application_deadline, status')
      .eq('id', program_id)
      .single()

    if (programError) {
      if (programError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to verify program' }, { status: 500 })
    }

    // Check if application deadline has passed
    if (new Date(program.application_deadline) < new Date()) {
      return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 })
    }

    // Check if user already has an application for this program
    const { data: existingApplication, error: checkError } = await supabase
      .from('applications')
      .select('id')
      .eq('program_id', program_id)
      .eq('applicant_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to check existing application' }, { status: 500 })
    }

    if (existingApplication) {
      return NextResponse.json({ error: 'You already have an application for this program' }, { status: 409 })
    }

    // Create the application
    const { data: application, error: createError } = await supabase
      .from('applications')
      .insert({
        program_id,
        applicant_id: user.id,
        responses,
        statement_of_interest,
        is_draft,
        completion_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_modified_at: new Date().toISOString()
      })
      .select(`
        id,
        program_id,
        status,
        submitted_at,
        decided_at,
        withdrawn_at,
        created_at,
        updated_at,
        is_draft,
        completion_percentage,
        programs (
          id,
          title,
          type,
          start_date,
          end_date,
          application_deadline
        )
      `)
      .single()

    if (createError) {
      console.error('Error creating application:', createError)
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
    }

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error('Applications POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}