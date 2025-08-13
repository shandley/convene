import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/programs/[id]/review-assignments/[assignmentId] - Remove review assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId, assignmentId } = await params
    
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

    // Verify assignment belongs to this program
    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .select(`
        id,
        applications!review_assignments_application_id_fkey(program_id)
      `)
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.applications?.program_id !== programId) {
      return NextResponse.json({ error: 'Assignment not found in this program' }, { status: 404 })
    }

    // Delete the assignment (cascade will handle related reviews)
    const { error: deleteError } = await supabase
      .from('review_assignments')
      .delete()
      .eq('id', assignmentId)

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Assignment removed successfully' })
  } catch (error) {
    console.error('Review assignment DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}