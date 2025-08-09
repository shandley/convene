import type { 
  QuestionType, 
  ApplicationQuestion, 
  ValidationRules,
  SelectOption,
  FileUploadConfig 
} from '@/types/questions'

/**
 * Validates question configuration based on question type
 */
export function validateQuestionConfig(
  questionType: QuestionType,
  config: Partial<ApplicationQuestion>
): string[] {
  const errors: string[] = []

  switch (questionType) {
    case 'file':
      if (!config.allowed_file_types || config.allowed_file_types.length === 0) {
        errors.push('File questions must specify allowed_file_types')
      }
      if (!config.max_file_size_mb || config.max_file_size_mb <= 0) {
        errors.push('File questions must specify max_file_size_mb > 0')
      }
      if (config.max_files && config.max_files <= 0) {
        errors.push('max_files must be greater than 0')
      }
      break

    case 'select':
    case 'multi_select':
      if (!config.options || !Array.isArray(config.options) || config.options.length === 0) {
        errors.push('Select questions must have options defined')
      }
      break

    case 'number':
      if (config.max_length !== null && config.max_length !== undefined) {
        errors.push('Number questions should not have max_length, use validation_rules instead')
      }
      break

    case 'text':
    case 'email':
    case 'url':
    case 'phone':
      if (config.max_length && config.max_length <= 0) {
        errors.push('max_length must be greater than 0')
      }
      break
  }

  return errors
}

/**
 * Gets default validation rules for a question type
 */
export function getDefaultValidationRules(questionType: QuestionType): ValidationRules {
  switch (questionType) {
    case 'text':
      return { min_length: 1, max_length: 500 }
    case 'textarea':
      return { min_length: 1, max_length: 5000 }
    case 'email':
      return { regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', regex_message: 'Please enter a valid email address' }
    case 'url':
      return { regex: '^https?://.+', regex_message: 'Please enter a valid URL starting with http:// or https://' }
    case 'phone':
      return { regex: '^[\\+]?[1-9]?[0-9]{7,15}$', regex_message: 'Please enter a valid phone number' }
    case 'number':
      return { integer_only: false }
    case 'date':
      return { disable_past: false, disable_future: false }
    default:
      return {}
  }
}

/**
 * Gets allowed file types for common file upload scenarios
 */
export function getCommonFileTypes(): Record<string, string[]> {
  return {
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    images: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    spreadsheets: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    presentations: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    archives: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-tar',
      'application/gzip'
    ]
  }
}

/**
 * Gets file upload configuration for common scenarios
 */
export function getDefaultFileConfig(scenario: string): FileUploadConfig {
  const commonTypes = getCommonFileTypes()
  
  switch (scenario) {
    case 'cv_resume':
      return {
        allowed_file_types: commonTypes.documents,
        max_file_size_mb: 10,
        max_files: 1
      }
    case 'portfolio':
      return {
        allowed_file_types: [...commonTypes.documents, ...commonTypes.images],
        max_file_size_mb: 25,
        max_files: 5
      }
    case 'transcript':
      return {
        allowed_file_types: commonTypes.documents,
        max_file_size_mb: 10,
        max_files: 1
      }
    case 'supporting_documents':
      return {
        allowed_file_types: [...commonTypes.documents, ...commonTypes.images],
        max_file_size_mb: 15,
        max_files: 3
      }
    default:
      return {
        allowed_file_types: commonTypes.documents,
        max_file_size_mb: 10,
        max_files: 1
      }
  }
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(sizeInMB: number): string {
  if (sizeInMB < 1) {
    return `${Math.round(sizeInMB * 1024)} KB`
  }
  return `${sizeInMB} MB`
}

/**
 * Gets MIME type display name
 */
export function getMimeTypeDisplayName(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'text/plain': 'Text File',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'text/csv': 'CSV File',
    'application/zip': 'ZIP Archive',
  }

  return mimeMap[mimeType] || mimeType
}

/**
 * Validates select options
 */
export function validateSelectOptions(options: any[]): string[] {
  const errors: string[] = []

  if (!Array.isArray(options)) {
    errors.push('Options must be an array')
    return errors
  }

  if (options.length === 0) {
    errors.push('Options array cannot be empty')
    return errors
  }

  const values = new Set<string>()
  
  options.forEach((option, index) => {
    if (typeof option === 'string') {
      // Simple string option
      if (values.has(option)) {
        errors.push(`Duplicate option value at index ${index}: "${option}"`)
      }
      values.add(option)
    } else if (typeof option === 'object' && option !== null) {
      // Complex option object
      if (!option.value || typeof option.value !== 'string') {
        errors.push(`Option at index ${index} must have a string value`)
      } else {
        if (values.has(option.value)) {
          errors.push(`Duplicate option value at index ${index}: "${option.value}"`)
        }
        values.add(option.value)
      }
      
      if (!option.label || typeof option.label !== 'string') {
        errors.push(`Option at index ${index} must have a string label`)
      }
    } else {
      errors.push(`Option at index ${index} must be a string or object`)
    }
  })

  return errors
}

/**
 * Normalizes select options to consistent format
 */
export function normalizeSelectOptions(options: any[]): SelectOption[] {
  return options.map((option, index) => {
    if (typeof option === 'string') {
      return {
        value: option,
        label: option
      }
    } else if (typeof option === 'object' && option !== null) {
      return {
        value: option.value || `option_${index}`,
        label: option.label || option.value || `Option ${index + 1}`,
        description: option.description,
        disabled: Boolean(option.disabled)
      }
    } else {
      return {
        value: `option_${index}`,
        label: `Option ${index + 1}`
      }
    }
  })
}

/**
 * Gets question type display information
 */
export function getQuestionTypeInfo(questionType: QuestionType): {
  label: string
  description: string
  icon: string
  category: string
} {
  const typeInfo: Record<QuestionType, any> = {
    text: {
      label: 'Short Text',
      description: 'Single line text input for brief responses',
      icon: 'text',
      category: 'text'
    },
    textarea: {
      label: 'Long Text',
      description: 'Multi-line text area for essays and detailed responses',
      icon: 'textarea',
      category: 'text'
    },
    select: {
      label: 'Dropdown',
      description: 'Single choice from dropdown menu',
      icon: 'select',
      category: 'choice'
    },
    multi_select: {
      label: 'Multiple Choice',
      description: 'Multiple selections from list of options',
      icon: 'multi_select',
      category: 'choice'
    },
    checkbox: {
      label: 'Checkbox',
      description: 'Yes/No or agreement checkbox',
      icon: 'checkbox',
      category: 'choice'
    },
    file: {
      label: 'File Upload',
      description: 'Upload documents, images, or other files',
      icon: 'file',
      category: 'media'
    },
    number: {
      label: 'Number',
      description: 'Numeric input with validation',
      icon: 'number',
      category: 'input'
    },
    date: {
      label: 'Date',
      description: 'Date picker for date selection',
      icon: 'date',
      category: 'input'
    },
    email: {
      label: 'Email',
      description: 'Email address with validation',
      icon: 'email',
      category: 'input'
    },
    url: {
      label: 'URL',
      description: 'Website URL with validation',
      icon: 'url',
      category: 'input'
    },
    phone: {
      label: 'Phone',
      description: 'Phone number with formatting',
      icon: 'phone',
      category: 'input'
    }
  }

  return typeInfo[questionType] || {
    label: questionType,
    description: 'Unknown question type',
    icon: 'help',
    category: 'unknown'
  }
}

/**
 * Gets next available order index for questions
 */
export function getNextOrderIndex(
  existingQuestions: ApplicationQuestion[], 
  categoryId?: string | null
): number {
  const filteredQuestions = categoryId 
    ? existingQuestions.filter(q => q.category_id === categoryId)
    : existingQuestions.filter(q => q.category_id === null)

  const maxOrder = Math.max(...filteredQuestions.map(q => q.order_index), 0)
  return maxOrder + 1
}

/**
 * Reorders questions maintaining category grouping
 */
export function reorderQuestions(
  questions: ApplicationQuestion[],
  questionId: string,
  newOrderIndex: number,
  newCategoryId?: string | null
): ApplicationQuestion[] {
  const updatedQuestions = [...questions]
  const questionIndex = updatedQuestions.findIndex(q => q.id === questionId)
  
  if (questionIndex === -1) return questions

  const question = updatedQuestions[questionIndex]
  const oldCategoryId = question.category_id
  
  // Update the question
  updatedQuestions[questionIndex] = {
    ...question,
    order_index: newOrderIndex,
    category_id: newCategoryId !== undefined ? newCategoryId : oldCategoryId
  }

  // Renumber other questions in the same category
  const sameCategory = updatedQuestions.filter(q => 
    q.category_id === (newCategoryId !== undefined ? newCategoryId : oldCategoryId) &&
    q.id !== questionId
  )

  sameCategory
    .sort((a, b) => a.order_index - b.order_index)
    .forEach((q, index) => {
      const targetIndex = updatedQuestions.findIndex(uq => uq.id === q.id)
      if (targetIndex !== -1) {
        updatedQuestions[targetIndex] = {
          ...updatedQuestions[targetIndex],
          order_index: index >= newOrderIndex ? index + 1 : index
        }
      }
    })

  return updatedQuestions
}