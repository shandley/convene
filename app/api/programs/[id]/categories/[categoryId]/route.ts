import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Database } from '@/types/database.types'

const categoryTypeSchema = z.enum([
  'personal_info', 'background', 'experience', 'essays', 
  'preferences', 'documents', 'custom'
])

const updateCategorySchema = z.object({
  title: z.string().min(1, 'Category title is required').optional(),
  description: z.string().optional(),
  category_type: categoryTypeSchema.optional(),
  instructions: z.string().optional(),
  is_visible: z.boolean().optional(),
  order_index: z.number().optional(),
  required_questions_count: z.number().min(0).optional(),
  show_condition: z.record(z.string(), z.any()).optional(),
})

// Helper function to verify category ownership
async function verifyCategoryOwnership(
  supabase: any, 
  programId: string, 
  categoryId: string, 
  userId: string
) {
  const { data: category, error } = await supabase
    .from('question_categories')
    .select(`
      id,
      program_id,
      program:programs!inner(created_by)
    `)
    .eq('id', categoryId)
    .eq('program_id', programId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'Category not found', status: 404 }
    }
    return { error: 'Failed to verify category ownership', status: 500 }
  }

  if (category.program.created_by !== userId) {
    return { error: 'Forbidden', status: 403 }
  }

  return { success: true, category }
}

// GET /api/programs/[id]/categories/[categoryId] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId, categoryId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const ownership = await verifyCategoryOwnership(supabase, programId, categoryId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    const { data: category, error } = await supabase
      .from('question_categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (error) {
      console.error('Error fetching category:', error)
      return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/programs/[id]/categories/[categoryId] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId, categoryId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const ownership = await verifyCategoryOwnership(supabase, programId, categoryId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = updateCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        }, 
        { status: 400 }
      )
    }

    const categoryData = validationResult.data

    const updateData = {
      ...categoryData,
      show_condition: categoryData.show_condition || undefined,
      updated_at: new Date().toISOString(),
    }

    const { data: category, error } = await supabase
      .from('question_categories')
      .update(updateData)
      .eq('id', categoryId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/programs/[id]/categories/[categoryId] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId, categoryId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const ownership = await verifyCategoryOwnership(supabase, programId, categoryId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    // Check if category has questions
    const { data: questions, error: questionsError } = await supabase
      .from('application_questions')
      .select('id, question_text')
      .eq('category_id', categoryId)

    if (questionsError) {
      console.error('Error checking category questions:', questionsError)
      return NextResponse.json(
        { error: 'Failed to verify category usage' }, 
        { status: 500 }
      )
    }

    if (questions && questions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category with questions. Move or delete questions first.',
          questionsCount: questions.length
        }, 
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('question_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}