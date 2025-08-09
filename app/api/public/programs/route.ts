import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/public/programs - List published programs (no auth required)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')

    // Build query for public programs - only published or applications_open
    let query = supabase
      .from('programs')
      .select(`
        id,
        title,
        description,
        type,
        start_date,
        end_date,
        application_deadline,
        capacity,
        location,
        fee,
        status,
        current_enrolled,
        current_waitlisted,
        blind_review,
        created_by_profile:profiles!programs_created_by_fkey(full_name)
      `)
      .in('status', ['published', 'applications_open'])
      .order('start_date', { ascending: true })

    // Add type filter if provided
    if (type) {
      query = query.eq('type', type)
    }

    // Add search filter if provided (search in title and description)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Add limit if provided
    if (limit) {
      const limitNum = parseInt(limit, 10)
      query = query.limit(limitNum)
    }

    const { data: programs, error } = await query

    if (error) {
      console.error('Error fetching public programs:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    // Add derived fields for public consumption
    const programsWithMeta = programs.map(program => ({
      ...program,
      daysUntilDeadline: Math.ceil(
        (new Date(program.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      isDeadlineSoon: Math.ceil(
        (new Date(program.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ) <= 7,
      canApply: program.status === 'applications_open' && 
                new Date(program.application_deadline) > new Date(),
      availableSpots: program.blind_review ? null : (program.capacity - (program.current_enrolled || 0))
    }))

    return NextResponse.json({ programs: programsWithMeta })
  } catch (error) {
    console.error('Public programs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/public/programs/[id] - Get single program details (no auth required)
export async function GET_SINGLE(programId: string) {
  try {
    const supabase = await createClient()

    const { data: program, error } = await supabase
      .from('programs')
      .select(`
        id,
        title,
        description,
        type,
        start_date,
        end_date,
        application_deadline,
        capacity,
        location,
        fee,
        status,
        current_enrolled,
        current_waitlisted,
        blind_review,
        waitlist_capacity,
        created_by_profile:profiles!programs_created_by_fkey(full_name, institution),
        application_questions(
          id,
          question_text,
          question_type,
          required,
          options,
          max_length,
          order_index
        )
      `)
      .eq('id', programId)
      .in('status', ['published', 'applications_open'])
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }
      console.error('Error fetching public program:', error)
      return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 })
    }

    // Add derived fields
    const programWithMeta = {
      ...program,
      daysUntilDeadline: Math.ceil(
        (new Date(program.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      isDeadlineSoon: Math.ceil(
        (new Date(program.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ) <= 7,
      canApply: program.status === 'applications_open' && 
                new Date(program.application_deadline) > new Date(),
      availableSpots: program.blind_review ? null : (program.capacity - (program.current_enrolled || 0)),
      hasWaitlist: program.waitlist_capacity && program.waitlist_capacity > 0
    }

    return NextResponse.json({ program: programWithMeta })
  } catch (error) {
    console.error('Public program GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}