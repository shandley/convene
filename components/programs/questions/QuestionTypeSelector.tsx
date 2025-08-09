'use client'

import React from 'react'
import { 
  FileText, 
  Hash, 
  Calendar, 
  Mail, 
  Link, 
  Phone, 
  Upload, 
  CheckSquare, 
  List,
  AlignLeft
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { QuestionType } from '@/types/questions'

interface QuestionTypeOption {
  type: QuestionType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'text' | 'selection' | 'file' | 'other'
  color: string
  examples?: string[]
}

const QUESTION_TYPES: QuestionTypeOption[] = [
  // Text Input Types
  {
    type: 'text',
    label: 'Short Text',
    description: 'Single line text input for brief responses',
    icon: FileText,
    category: 'text',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    examples: ['Name', 'Institution', 'Job Title']
  },
  {
    type: 'textarea',
    label: 'Long Text',
    description: 'Multi-line text area for detailed responses',
    icon: AlignLeft,
    category: 'text',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    examples: ['Personal Statement', 'Research Experience', 'Goals']
  },
  {
    type: 'email',
    label: 'Email',
    description: 'Email address with validation',
    icon: Mail,
    category: 'text',
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    examples: ['Contact Email', 'Supervisor Email']
  },
  {
    type: 'phone',
    label: 'Phone',
    description: 'Phone number input with formatting',
    icon: Phone,
    category: 'text',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    examples: ['Contact Phone', 'Emergency Contact']
  },
  {
    type: 'url',
    label: 'URL',
    description: 'Website or link with validation',
    icon: Link,
    category: 'text',
    color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
    examples: ['Portfolio Website', 'LinkedIn Profile']
  },

  // Selection Types
  {
    type: 'select',
    label: 'Single Select',
    description: 'Choose one option from a dropdown list',
    icon: List,
    category: 'selection',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    examples: ['Academic Level', 'Preferred Track', 'Time Zone']
  },
  {
    type: 'multi_select',
    label: 'Multi Select',
    description: 'Choose multiple options from a list',
    icon: CheckSquare,
    category: 'selection',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    examples: ['Research Interests', 'Available Dates', 'Skills']
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    description: 'Multiple checkboxes for multiple selections',
    icon: CheckSquare,
    category: 'selection',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    examples: ['Dietary Restrictions', 'Workshop Topics', 'Certifications']
  },

  // Other Types
  {
    type: 'number',
    label: 'Number',
    description: 'Numeric input with validation',
    icon: Hash,
    category: 'other',
    color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
    examples: ['Years of Experience', 'GPA', 'Age']
  },
  {
    type: 'date',
    label: 'Date',
    description: 'Date picker for specific dates',
    icon: Calendar,
    category: 'other',
    color: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
    examples: ['Birth Date', 'Graduation Date', 'Available From']
  },

  // File Type
  {
    type: 'file',
    label: 'File Upload',
    description: 'Upload documents, images, or other files',
    icon: Upload,
    category: 'file',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    examples: ['Resume/CV', 'Portfolio', 'Transcripts', 'Recommendation Letters']
  },
]

const CATEGORIES = [
  { key: 'text', label: 'Text Input', description: 'Text-based questions and inputs' },
  { key: 'selection', label: 'Selection', description: 'Options and multiple choice questions' },
  { key: 'file', label: 'File Upload', description: 'Document and file submission questions' },
  { key: 'other', label: 'Specialized', description: 'Numbers, dates, and other specialized inputs' },
] as const

interface QuestionTypeSelectorProps {
  value: QuestionType
  onChange: (type: QuestionType) => void
  disabled?: boolean
}

export function QuestionTypeSelector({ value, onChange, disabled = false }: QuestionTypeSelectorProps) {
  const selectedType = QUESTION_TYPES.find(type => type.type === value)

  return (
    <div className="space-y-6">
      {/* Current Selection Display */}
      {selectedType && (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-2">
            <selectedType.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {selectedType.label}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedType.description}
              </p>
            </div>
            <Badge variant="outline" className="ml-auto">
              Selected
            </Badge>
          </div>
          {selectedType.examples && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Common uses:
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedType.examples.map((example, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question Type Grid by Category */}
      {CATEGORIES.map(category => {
        const categoryTypes = QUESTION_TYPES.filter(type => type.category === category.key)
        
        return (
          <div key={category.key} className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {category.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryTypes.map((questionType) => {
                const Icon = questionType.icon
                const isSelected = value === questionType.type
                
                return (
                  <Card
                    key={questionType.type}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950'
                        : questionType.color
                    } ${
                      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                    }`}
                    onClick={() => !disabled && onChange(questionType.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected 
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm mb-1 ${
                            isSelected 
                              ? 'text-blue-900 dark:text-blue-100' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {questionType.label}
                          </h4>
                          <p className={`text-xs leading-relaxed ${
                            isSelected 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {questionType.description}
                          </p>
                          
                          {questionType.examples && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {questionType.examples.slice(0, 2).map((example, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className={`text-xs ${
                                      isSelected 
                                        ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200' 
                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {example}
                                  </Badge>
                                ))}
                                {questionType.examples.length > 2 && (
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${
                                      isSelected 
                                        ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200' 
                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    +{questionType.examples.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      {disabled && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Question type cannot be changed after creation
          </p>
        </div>
      )}
    </div>
  )
}