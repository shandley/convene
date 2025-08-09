import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/public/programs/[id] - Get single program details (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .eq('id', id)
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