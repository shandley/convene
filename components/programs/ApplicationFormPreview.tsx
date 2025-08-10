'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Upload, FileText, Hash, Mail, Link, Phone, List, CheckSquare, Save, Eye, AlertTriangle } from 'lucide-react'
import type { ApplicationQuestionWithRelations, QuestionType } from '@/types/questions'
import type { Tables } from '@/types/database.types'

interface ApplicationFormPreviewProps {
  program: Tables<'programs'>
  questions: ApplicationQuestionWithRelations[]
  isLoading?: boolean
  mode?: 'admin' | 'applicant'
  onSave?: () => Promise<boolean> | void
  onPublish?: () => Promise<void> | void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
}

const getQuestionTypeIcon = (type: QuestionType) => {
  const icons = {
    text: FileText,
    textarea: FileText,
    select: List,
    multi_select: List,
    checkbox: CheckSquare,
    file: Upload,
    number: Hash,
    date: Calendar,
    email: Mail,
    url: Link,
    phone: Phone,
  }
  return icons[type] || FileText
}

const renderQuestionInput = (question: ApplicationQuestionWithRelations) => {
  const Icon = getQuestionTypeIcon(question.question_type)

  switch (question.question_type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
      return (
        <Input 
          placeholder={question.placeholder || `Enter your ${question.question_text.toLowerCase()}`}
          disabled
          className="opacity-75"
        />
      )
    
    case 'textarea':
      return (
        <Textarea 
          placeholder={question.placeholder || `Enter your ${question.question_text.toLowerCase()}`}
          disabled
          className="opacity-75 min-h-[100px]"
        />
      )
    
    case 'number':
      return (
        <Input 
          type="number"
          placeholder={question.placeholder || "Enter number"}
          disabled
          className="opacity-75"
        />
      )
    
    case 'date':
      return (
        <Input 
          type="date"
          disabled
          className="opacity-75"
        />
      )
    
    case 'select':
      return (
        <Select disabled>
          <SelectTrigger className="opacity-75">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options && Array.isArray(question.options) && question.options.map((option: any, index: number) => (
              <SelectItem key={index} value={option.value || option}>
                {option.label || option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    
    case 'multi_select':
      return (
        <div className="space-y-2">
          {question.options && Array.isArray(question.options) && question.options.slice(0, 3).map((option: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox disabled className="opacity-75" />
              <label className="text-sm text-gray-600">
                {option.label || option}
              </label>
            </div>
          ))}
          {question.options && Array.isArray(question.options) && question.options.length > 3 && (
            <div className="text-xs text-gray-500">
              ... and {question.options.length - 3} more options
            </div>
          )}
        </div>
      )
    
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox disabled className="opacity-75" />
          <label className="text-sm text-gray-600">
            {question.placeholder || 'Check if applicable'}
          </label>
        </div>
      )
    
    case 'file':
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center opacity-75">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <div className="text-sm text-gray-600">
            <span className="font-medium">Upload files</span>
            <p className="text-xs text-gray-500 mt-1">
              {question.allowed_file_types && question.allowed_file_types.length > 0 
                ? `Allowed: ${question.allowed_file_types.join(', ')}`
                : 'Various file types accepted'
              }
            </p>
            {question.max_file_size_mb && (
              <p className="text-xs text-gray-500">
                Max size: {question.max_file_size_mb}MB per file
              </p>
            )}
          </div>
        </div>
      )
    
    default:
      return (
        <Input 
          placeholder="Preview not available for this question type"
          disabled
          className="opacity-75"
        />
      )
  }
}

export function ApplicationFormPreview({ 
  program, 
  questions, 
  isLoading, 
  mode = 'applicant',
  onSave,
  onPublish,
  isSaving = false,
  hasUnsavedChanges = false
}: ApplicationFormPreviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="max-w-4xl mx-auto">
      {mode === 'admin' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Eye className="h-4 w-4" />
            <span className="font-medium">Admin Preview Mode</span>
            <span className="text-blue-600">•</span>
            <span>This is how applicants will see the application form</span>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-2xl">Application Form Preview</CardTitle>
          </div>
          {mode === 'admin' && (
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                  <AlertTriangle className="h-3 w-3" />
                  Unsaved Changes
                </Badge>
              )}
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Admin Preview Mode
              </Badge>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{program.title}</h2>
          <p className="text-sm text-gray-600">
            {mode === 'admin' 
              ? 'Preview of how applicants will see the application form'
              : 'This is how applicants will see the application form'
            }
          </p>
          {program.application_deadline && (
            <Badge variant="outline" className="text-xs">
              Deadline: {new Date(program.application_deadline).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        {sortedQuestions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Added</h3>
            <p className="text-sm">
              Add questions in the Questions tab to see the preview of your application form.
            </p>
          </div>
        ) : (
          <form className="space-y-8">
            {sortedQuestions.map((question, index) => {
              const Icon = getQuestionTypeIcon(question.question_type)
              
              return (
                <div key={question.id} className="space-y-3">
                  {/* Question Header */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-900 block">
                          {question.question_text}
                          {question.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        {question.help_text && (
                          <p className="text-xs text-gray-600 mt-1">
                            {question.help_text}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {question.question_type.replace('_', ' ')}
                        </Badge>
                        {question.category && (
                          <Badge variant="secondary" className="text-xs">
                            {question.category.title}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Input */}
                  <div className="pl-6">
                    {renderQuestionInput(question)}
                  </div>

                  {/* Conditional Logic Indicator */}
                  {question.depends_on_question_id && (
                    <div className="pl-6">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        Conditional question
                      </Badge>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Form Actions Preview */}
            <div className="border-t pt-8">
              {mode === 'admin' ? (
                <div className="bg-gray-50 -mx-8 -mb-8 px-8 py-6 rounded-b-lg border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-gray-900 mb-1">Admin Actions</p>
                      <p className="text-gray-600">
                        {hasUnsavedChanges 
                          ? "Save your changes before publishing the program." 
                          : "Save your changes or publish the program to make it available to applicants."
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {onSave && (
                        <Button 
                          onClick={onSave} 
                          variant={hasUnsavedChanges ? "default" : "outline"}
                          disabled={isSaving}
                          className="gap-2"
                        >
                          {isSaving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      )}
                      {onPublish && (
                        <Button 
                          onClick={onPublish} 
                          disabled={isSaving || hasUnsavedChanges}
                          className="gap-2"
                          variant={hasUnsavedChanges ? "outline" : "default"}
                        >
                          <FileText className="h-4 w-4" />
                          {program.status === 'draft' ? 'Publish Program' : 'Update Program'}
                        </Button>
                      )}
                    </div>
                  </div>
                  {hasUnsavedChanges && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-xs text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        You have unsaved changes. Save them before publishing to ensure applicants see your latest updates.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between">
                  <Button variant="outline" disabled className="opacity-75">
                    Save Draft
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" disabled className="opacity-75">
                      Previous
                    </Button>
                    <Button disabled className="opacity-75">
                      Submit Application
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </CardContent>
      </Card>
    </div>
  )
}