import type { QuestionCategory, QuestionCategoryType } from '@/types/questions'

export interface CreateCategoryRequest {
  title: string
  description?: string
  category_type: QuestionCategoryType
  instructions?: string
  is_visible?: boolean
  order_index?: number
  required_questions_count?: number
  show_condition?: Record<string, any>
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export interface CategoriesResponse {
  categories: QuestionCategory[]
}

export interface CategoryResponse {
  category: QuestionCategory
}

export class CategoriesService {
  private baseUrl: string

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  /**
   * Get all categories for a program
   */
  async getCategories(programId: string): Promise<QuestionCategory[]> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/categories`)
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }

    const data: CategoriesResponse = await response.json()
    return data.categories
  }

  /**
   * Get a single category
   */
  async getCategory(programId: string, categoryId: string): Promise<QuestionCategory> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/categories/${categoryId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch category: ${response.statusText}`)
    }

    const data: CategoryResponse = await response.json()
    return data.category
  }

  /**
   * Create a new category
   */
  async createCategory(
    programId: string, 
    categoryData: CreateCategoryRequest
  ): Promise<QuestionCategory> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to create category: ${response.statusText}`)
    }

    const data: CategoryResponse = await response.json()
    return data.category
  }

  /**
   * Update a category
   */
  async updateCategory(
    programId: string,
    categoryId: string,
    updates: UpdateCategoryRequest
  ): Promise<QuestionCategory> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update category: ${response.statusText}`)
    }

    const data: CategoryResponse = await response.json()
    return data.category
  }

  /**
   * Delete a category
   */
  async deleteCategory(programId: string, categoryId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/categories/${categoryId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to delete category: ${response.statusText}`)
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(
    programId: string,
    categoryUpdates: { id: string; order_index: number }[]
  ): Promise<QuestionCategory[]> {
    const updatePromises = categoryUpdates.map(({ id, order_index }) =>
      this.updateCategory(programId, id, { order_index })
    )

    await Promise.all(updatePromises)
    
    // Fetch updated categories
    return this.getCategories(programId)
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(programId: string): Promise<{
    total_categories: number
    by_type: Record<string, number>
    visible_categories: number
    hidden_categories: number
    categories_with_questions: number
    empty_categories: number
  }> {
    const categories = await this.getCategories(programId)
    
    const stats = {
      total_categories: categories.length,
      by_type: {} as Record<string, number>,
      visible_categories: 0,
      hidden_categories: 0,
      categories_with_questions: 0,
      empty_categories: 0,
    }

    categories.forEach(category => {
      // Count by type
      stats.by_type[category.category_type] = (stats.by_type[category.category_type] || 0) + 1
      
      // Count visible/hidden
      if (category.is_visible) {
        stats.visible_categories++
      } else {
        stats.hidden_categories++
      }
      
      // TODO: Count categories with questions once we can fetch question counts
      // For now, assume all are empty
      stats.empty_categories++
    })

    return stats
  }

  /**
   * Create default categories for a program
   */
  async createDefaultCategories(programId: string): Promise<QuestionCategory[]> {
    const defaultCategories: CreateCategoryRequest[] = [
      {
        title: 'Personal Information',
        description: 'Basic personal and contact details',
        category_type: 'personal_info',
        instructions: 'Please provide your personal information accurately.',
        is_visible: true,
        order_index: 1,
      },
      {
        title: 'Background',
        description: 'Educational and professional background',
        category_type: 'background',
        instructions: 'Tell us about your educational and professional background.',
        is_visible: true,
        order_index: 2,
      },
      {
        title: 'Experience',
        description: 'Relevant experience and skills',
        category_type: 'experience',
        instructions: 'Describe your relevant experience and skills.',
        is_visible: true,
        order_index: 3,
      },
      {
        title: 'Essays & Statements',
        description: 'Personal statements and essay responses',
        category_type: 'essays',
        instructions: 'Please provide thoughtful responses to the following prompts.',
        is_visible: true,
        order_index: 4,
      },
      {
        title: 'Supporting Documents',
        description: 'Upload required documents',
        category_type: 'documents',
        instructions: 'Upload the required supporting documents.',
        is_visible: true,
        order_index: 5,
      },
    ]

    const createdCategories = await Promise.all(
      defaultCategories.map(category => this.createCategory(programId, category))
    )

    return createdCategories
  }
}