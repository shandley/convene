import type {
  ApplicationQuestionWithRelations,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ReorderQuestionsRequest,
  CreateFromTemplateRequest,
  BulkCreateFromTemplatesRequest,
  SearchTemplatesParams,
  QuestionsResponse,
  QuestionResponse,
  TemplatesResponse,
  CreateFromTemplateResponse,
  ReorderQuestionsResponse,
  QuestionTemplate,
} from '@/types/questions'

export class QuestionsService {
  private baseUrl: string

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  /**
   * Get all questions for a program
   */
  async getQuestions(programId: string, categoryId?: string): Promise<ApplicationQuestionWithRelations[]> {
    const url = new URL(`${this.baseUrl}/programs/${programId}/questions`, window.location.origin)
    if (categoryId) {
      url.searchParams.set('category_id', categoryId)
    }

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.statusText}`)
    }

    const data: QuestionsResponse = await response.json()
    return data.questions
  }

  /**
   * Get a single question
   */
  async getQuestion(programId: string, questionId: string): Promise<ApplicationQuestionWithRelations> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/questions/${questionId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch question: ${response.statusText}`)
    }

    const data: QuestionResponse = await response.json()
    return data.question
  }

  /**
   * Create a new question
   */
  async createQuestion(
    programId: string, 
    questionData: CreateQuestionRequest
  ): Promise<ApplicationQuestionWithRelations> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to create question: ${response.statusText}`)
    }

    const data: QuestionResponse = await response.json()
    return data.question
  }

  /**
   * Update a question
   */
  async updateQuestion(
    programId: string,
    questionId: string,
    updates: UpdateQuestionRequest
  ): Promise<ApplicationQuestionWithRelations> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update question: ${response.statusText}`)
    }

    const data: QuestionResponse = await response.json()
    return data.question
  }

  /**
   * Delete a question
   */
  async deleteQuestion(programId: string, questionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/questions/${questionId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to delete question: ${response.statusText}`)
    }
  }

  /**
   * Reorder questions
   */
  async reorderQuestions(
    programId: string,
    reorderData: ReorderQuestionsRequest
  ): Promise<ApplicationQuestionWithRelations[]> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/questions/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reorderData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to reorder questions: ${response.statusText}`)
    }

    const data: ReorderQuestionsResponse = await response.json()
    return data.questions
  }

  /**
   * Search question templates
   */
  async searchTemplates(
    programId: string,
    params: SearchTemplatesParams = {}
  ): Promise<QuestionTemplate[]> {
    const url = new URL(`${this.baseUrl}/programs/${programId}/questions/templates`, window.location.origin)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`)
    }

    const data: TemplatesResponse = await response.json()
    return data.templates
  }

  /**
   * Create question from template
   */
  async createFromTemplate(
    programId: string,
    templateData: CreateFromTemplateRequest
  ): Promise<CreateFromTemplateResponse> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/questions/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to create question from template: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create multiple questions from templates
   */
  async createFromTemplates(
    programId: string,
    templatesData: BulkCreateFromTemplatesRequest
  ): Promise<CreateFromTemplateResponse> {
    const response = await fetch(`${this.baseUrl}/programs/${programId}/questions/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templatesData),
    })

    if (!response.ok && response.status !== 207) { // 207 is Multi-Status (partial success)
      const error = await response.json()
      throw new Error(error.error || `Failed to create questions from templates: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Duplicate a question
   */
  async duplicateQuestion(
    programId: string,
    questionId: string,
    modifications?: Partial<CreateQuestionRequest>
  ): Promise<ApplicationQuestionWithRelations> {
    // First get the existing question
    const existingQuestion = await this.getQuestion(programId, questionId)
    
    // Create new question data based on existing question
    const newQuestionData: CreateQuestionRequest = {
      question_text: `${existingQuestion.question_text} (Copy)`,
      question_type: existingQuestion.question_type,
      category_id: existingQuestion.category_id,
      help_text: existingQuestion.help_text,
      placeholder: existingQuestion.placeholder,
      required: existingQuestion.required,
      max_length: existingQuestion.max_length,
      validation_rules: existingQuestion.validation_rules as Record<string, any>,
      options: existingQuestion.options ? JSON.parse(JSON.stringify(existingQuestion.options)) : undefined,
      allowed_file_types: existingQuestion.allowed_file_types ? [...existingQuestion.allowed_file_types] : undefined,
      max_file_size_mb: existingQuestion.max_file_size_mb,
      max_files: existingQuestion.max_files,
      allow_other: existingQuestion.allow_other,
      randomize_options: existingQuestion.randomize_options,
      // Don't copy dependencies or templates
      depends_on_question_id: undefined,
      show_condition: undefined,
      template_id: undefined,
      // Apply any modifications
      ...modifications,
    }

    return this.createQuestion(programId, newQuestionData)
  }

  /**
   * Bulk delete questions
   */
  async deleteQuestions(programId: string, questionIds: string[]): Promise<{
    success: string[]
    errors: Array<{ id: string; error: string }>
  }> {
    const results = {
      success: [] as string[],
      errors: [] as Array<{ id: string; error: string }>
    }

    // Delete questions in parallel
    const deletePromises = questionIds.map(async (questionId) => {
      try {
        await this.deleteQuestion(programId, questionId)
        results.success.push(questionId)
      } catch (error) {
        results.errors.push({
          id: questionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })

    await Promise.all(deletePromises)
    return results
  }

  /**
   * Get questions grouped by category
   */
  async getQuestionsGroupedByCategory(programId: string): Promise<{
    categorized: Record<string, ApplicationQuestionWithRelations[]>
    uncategorized: ApplicationQuestionWithRelations[]
  }> {
    const questions = await this.getQuestions(programId)
    
    const categorized: Record<string, ApplicationQuestionWithRelations[]> = {}
    const uncategorized: ApplicationQuestionWithRelations[] = []

    questions.forEach(question => {
      if (question.category_id && question.category) {
        const categoryName = question.category.name
        if (!categorized[categoryName]) {
          categorized[categoryName] = []
        }
        categorized[categoryName].push(question)
      } else {
        uncategorized.push(question)
      }
    })

    // Sort questions within each category by order_index
    Object.values(categorized).forEach(categoryQuestions => {
      categoryQuestions.sort((a, b) => a.order_index - b.order_index)
    })

    uncategorized.sort((a, b) => a.order_index - b.order_index)

    return { categorized, uncategorized }
  }

  /**
   * Export questions as JSON
   */
  async exportQuestions(programId: string): Promise<{
    program_id: string
    exported_at: string
    questions: ApplicationQuestionWithRelations[]
  }> {
    const questions = await this.getQuestions(programId)
    
    return {
      program_id: programId,
      exported_at: new Date().toISOString(),
      questions
    }
  }

  /**
   * Get question usage statistics
   */
  async getQuestionStats(programId: string): Promise<{
    total_questions: number
    by_type: Record<string, number>
    by_category: Record<string, number>
    required_questions: number
    optional_questions: number
    system_questions: number
    custom_questions: number
  }> {
    const questions = await this.getQuestions(programId)
    
    const stats = {
      total_questions: questions.length,
      by_type: {} as Record<string, number>,
      by_category: {} as Record<string, number>,
      required_questions: 0,
      optional_questions: 0,
      system_questions: 0,
      custom_questions: 0,
    }

    questions.forEach(question => {
      // Count by type
      stats.by_type[question.question_type] = (stats.by_type[question.question_type] || 0) + 1
      
      // Count by category
      const categoryName = question.category?.name || 'Uncategorized'
      stats.by_category[categoryName] = (stats.by_category[categoryName] || 0) + 1
      
      // Count required/optional
      if (question.required) {
        stats.required_questions++
      } else {
        stats.optional_questions++
      }
      
      // TODO: Count system/custom once is_system_question field is added
      // if (question.is_system_question) {
      //   stats.system_questions++
      // } else {
      //   stats.custom_questions++
      // }
      // For now, count all as custom
      stats.custom_questions++
    })

    return stats
  }
}