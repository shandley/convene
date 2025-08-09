import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { TablesUpdate } from '@/types/database.types'

const updateProgramSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required').optional(),
  start_date: z.string().min(1, 'Start date is required').optional(),
  end_date: z.string().min(1, 'End date is required').optional(),
  application_deadline: z.string().min(1, 'Application deadline is required').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  location: z.string().optional(),
  fee: z.number().optional(),
  waitlist_capacity: z.number().optional(),
  blind_review: z.boolean().optional(),
  auto_waitlist_promotion: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'applications_open', 'applications_closed', 'in_review', 'selections_made', 'active', 'completed', 'cancelled']).optional(),
})

// GET /api/programs/[id] - Get single program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: program, error } = await supabase
      .from('programs')
      .select(`
        *,
        created_by_profile:profiles!programs_created_by_fkey(full_name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }
      console.error('Error fetching program:', error)
      return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 })
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Program GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/programs/[id] - Update program
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = updateProgramSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      )
    }

    // Check if user owns the program or has admin role
    const { data: existingProgram, error: fetchError } = await supabase
      .from('programs')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to verify program ownership' }, { status: 500 })
    }

    // For now, only allow the creator to update (can be expanded for admins later)
    if (existingProgram.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const programData: TablesUpdate<'programs'> = {
      ...validationResult.data,
      updated_at: new Date().toISOString(),
    }

    const { data: program, error } = await supabase
      .from('programs')
      .update(programData)
      .eq('id', id)
      .select(`
        *,
        created_by_profile:profiles!programs_created_by_fkey(full_name, email)
      `)
      .single()

    if (error) {
      console.error('Error updating program:', error)
      return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Program PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/programs/[id] - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the program or has admin role
    const { data: existingProgram, error: fetchError } = await supabase
      .from('programs')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to verify program ownership' }, { status: 500 })
    }

    // For now, only allow the creator to delete (can be expanded for admins later)
    if (existingProgram.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if program can be deleted (no applications)
    const { data: canDelete, error: checkError } = await supabase
      .rpc('can_delete_program' as any, { p_program_id: id })

    if (checkError) {
      console.error('Error checking delete permission:', checkError)
      return NextResponse.json({ error: 'Failed to verify deletion safety' }, { status: 500 })
    }

    if (!canDelete) {
      return NextResponse.json({ 
        error: 'Cannot delete program with existing applications. Archive it instead.' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting program:', error)
      return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Program DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}