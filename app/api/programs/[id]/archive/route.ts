import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/programs/[id]/archive - Archive a program
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Archive the program
    const { error } = await supabase
      .rpc('archive_program' as any, { p_program_id: id })

    if (error) {
      console.error('Error archiving program:', error)
      return NextResponse.json({ 
        error: 'Failed to archive program',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Program archived successfully' })
  } catch (error) {
    console.error('Archive program error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/programs/[id]/archive - Unarchive a program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Unarchive the program
    const { error } = await supabase
      .rpc('unarchive_program' as any, { p_program_id: id })

    if (error) {
      console.error('Error unarchiving program:', error)
      return NextResponse.json({ 
        error: 'Failed to unarchive program',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Program unarchived successfully' })
  } catch (error) {
    console.error('Unarchive program error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}