import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { Database } from '@/types/database.types'

const categoryTypeSchema = z.enum([
  'personal_info', 'background', 'experience', 'essays', 
  'preferences', 'documents', 'custom'
])

const createCategorySchema = z.object({
  title: z.string().min(1, 'Category title is required'),
  description: z.string().optional(),
  category_type: categoryTypeSchema,
  instructions: z.string().optional(),
  is_visible: z.boolean().default(true),
  order_index: z.number().optional(),
  required_questions_count: z.number().min(0).optional(),
  show_condition: z.record(z.string(), z.any()).optional(),
})

const updateCategorySchema = createCategorySchema.partial()

// Helper function to verify program ownership
async function verifyProgramOwnership(supabase: any, programId: string, userId: string) {
  const { data: program, error } = await supabase
    .from('programs')
    .select('created_by')
    .eq('id', programId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'Program not found', status: 404 }
    }
    return { error: 'Failed to verify program ownership', status: 500 }
  }

  if (program.created_by !== userId) {
    return { error: 'Forbidden', status: 403 }
  }

  return { success: true }
}

// GET /api/programs/[id]/categories - Get all categories for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify program ownership
    const ownership = await verifyProgramOwnership(supabase, programId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    const { data: categories, error } = await supabase
      .from('question_categories')
      .select('*')
      .eq('program_id', programId)
      .order('order_index')

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/programs/[id]/categories - Create a new category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: programId } = await params
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify program ownership
    const ownership = await verifyProgramOwnership(supabase, programId, user.id)
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = createCategorySchema.safeParse(body)
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

    // Determine order index if not provided
    let orderIndex = categoryData.order_index
    if (orderIndex === undefined) {
      const { data: maxOrderData } = await supabase
        .from('question_categories')
        .select('order_index')
        .eq('program_id', programId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle()

      orderIndex = (maxOrderData?.order_index || 0) + 1
    }

    const insertData = {
      program_id: programId,
      title: categoryData.title,
      description: categoryData.description || null,
      category_type: categoryData.category_type,
      instructions: categoryData.instructions || null,
      is_visible: categoryData.is_visible !== undefined ? categoryData.is_visible : true,
      order_index: orderIndex,
      required_questions_count: categoryData.required_questions_count || null,
      show_condition: categoryData.show_condition || null,
    }

    const { data: category, error } = await supabase
      .from('question_categories')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}