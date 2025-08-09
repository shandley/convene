import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { TablesInsert } from '@/types/database.types'

const createProgramSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  application_deadline: z.string().min(1, 'Application deadline is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  location: z.string().optional(),
  fee: z.number().optional(),
  waitlist_capacity: z.number().optional(),
  blind_review: z.boolean().optional(),
  auto_waitlist_promotion: z.boolean().optional(),
})

// GET /api/programs - List programs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    let query = supabase
      .from('programs')
      .select(`
        *,
        created_by_profile:profiles!programs_created_by_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })

    // Add status filter if provided
    if (status) {
      query = query.eq('status', status as any)
    }

    // Add pagination if provided
    if (limit) {
      const limitNum = parseInt(limit, 10)
      const offsetNum = offset ? parseInt(offset, 10) : 0
      query = query.range(offsetNum, offsetNum + limitNum - 1)
    }

    const { data: programs, error } = await query

    if (error) {
      console.error('Error fetching programs:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Programs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/programs - Create program
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = createProgramSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      )
    }

    const programData: TablesInsert<'programs'> = {
      ...validationResult.data,
      created_by: user.id,
      status: 'draft' as const,
    }

    const { data: program, error } = await supabase
      .from('programs')
      .insert(programData)
      .select(`
        *,
        created_by_profile:profiles!programs_created_by_fkey(full_name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating program:', error)
      return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
    }

    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    console.error('Programs POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}