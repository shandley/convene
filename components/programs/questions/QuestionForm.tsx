'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Plus, 
  Minus, 
  Save, 
  X, 
  HelpCircle,
  Settings,
  FileText,
  Hash,
  Calendar,
  Mail,
  Link,
  Phone,
  Upload,
  CheckSquare,
  List
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

import type { 
  ApplicationQuestionWithRelations, 
  QuestionType,
  CreateQuestionRequest,
  SelectOption,
  ValidationRules
} from '@/types/questions'
import { QuestionTypeSelector } from './QuestionTypeSelector'

// Form schema
const questionFormSchema = z.object({
  question_text: z.string().min(1, 'Question text is required').max(500, 'Question text must be less than 500 characters'),
  question_type: z.enum(['text', 'textarea', 'select', 'multi_select', 'checkbox', 'file', 'number', 'date', 'email', 'url', 'phone']),
  help_text: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  max_length: z.number().min(1).max(10000).optional(),
  options: z.array(z.object({
    value: z.string().min(1, 'Option value is required'),
    label: z.string().min(1, 'Option label is required'),
    description: z.string().optional(),
  })).optional(),
  allowed_file_types: z.array(z.string()).optional(),
  max_file_size_mb: z.number().min(1).max(100).optional(),
  max_files: z.number().min(1).max(10).optional(),
  allow_other: z.boolean().optional(),
  randomize_options: z.boolean().optional(),
  validation_rules: z.object({
    min_length: z.number().optional(),
    max_length: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    regex: z.string().optional(),
    regex_message: z.string().optional(),
  }).optional(),
})

type QuestionFormData = z.infer<typeof questionFormSchema>

interface QuestionFormProps {
  programId: string
  question?: ApplicationQuestionWithRelations | null
  onSave: (question: ApplicationQuestionWithRelations) => void
  onCancel: () => void
}

const FILE_TYPE_OPTIONS = [
  { value: '.pdf', label: 'PDF (.pdf)' },
  { value: '.doc', label: 'Word Document (.doc)' },
  { value: '.docx', label: 'Word Document (.docx)' },
  { value: '.txt', label: 'Text File (.txt)' },
  { value: '.jpg', label: 'JPEG Image (.jpg)' },
  { value: '.jpeg', label: 'JPEG Image (.jpeg)' },
  { value: '.png', label: 'PNG Image (.png)' },
  { value: '.gif', label: 'GIF Image (.gif)' },
  { value: '.xlsx', label: 'Excel Spreadsheet (.xlsx)' },
  { value: '.xls', label: 'Excel Spreadsheet (.xls)' },
]

export function QuestionForm({ programId, question, onSave, onCancel }: QuestionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>(
    question?.question_type || 'text'
  )

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question_text: question?.question_text || '',
      question_type: question?.question_type || 'text',
      help_text: question?.help_text || '',
      placeholder: question?.placeholder || '',
      required: question?.required ?? true,
      max_length: question?.max_length || undefined,
      options: (question?.options as SelectOption[]) || [],
      allowed_file_types: question?.allowed_file_types || [],
      max_file_size_mb: question?.max_file_size_mb || 10,
      max_files: question?.max_files || 1,
      allow_other: question?.allow_other || false,
      randomize_options: question?.randomize_options || false,
      validation_rules: (question?.validation_rules as any) || {},
    },
  })

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: 'options',
  })

  // Update selected type when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'question_type' && value.question_type) {
        setSelectedQuestionType(value.question_type as QuestionType)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const requiresOptions = ['select', 'multi_select', 'checkbox'].includes(selectedQuestionType)
  const isFileType = selectedQuestionType === 'file'
  const isTextType = ['text', 'textarea'].includes(selectedQuestionType)
  const isNumberType = selectedQuestionType === 'number'
  const isDateType = selectedQuestionType === 'date'

  const onSubmit = async (data: QuestionFormData) => {
    setIsLoading(true)
    
    try {
      // Create the question request object
      const questionData: CreateQuestionRequest = {
        question_text: data.question_text,
        question_type: data.question_type,
        help_text: data.help_text || undefined,
        placeholder: data.placeholder || undefined,
        required: data.required,
        max_length: data.max_length,
        options: requiresOptions ? data.options : undefined,
        allowed_file_types: isFileType ? data.allowed_file_types : undefined,
        max_file_size_mb: isFileType ? data.max_file_size_mb : undefined,
        max_files: isFileType ? data.max_files : undefined,
        allow_other: requiresOptions ? data.allow_other : undefined,
        randomize_options: requiresOptions ? data.randomize_options : undefined,
        validation_rules: data.validation_rules || {},
      }

      // Make API call to save question
      const endpoint = question 
        ? `/api/programs/${programId}/questions/${question.id}` 
        : `/api/programs/${programId}/questions`
      
      const method = question ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save question')
      }

      const { question: savedQuestion } = await response.json()
      onSave(savedQuestion)
    } catch (error) {
      console.error('Error saving question:', error)
      // TODO: Show toast error message
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {question ? 'Edit Question' : 'Add New Question'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure the question details and validation rules.
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="gap-2">
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Question Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Type</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="question_type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <QuestionTypeSelector
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!!question}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Basic Question Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="question_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter your question..."
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormDescription>
                      The main question text that applicants will see.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="help_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Help Text</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Provide additional context or instructions..."
                        className="min-h-[60px]"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional help text to provide additional context or instructions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!requiresOptions && !isFileType && (
                <FormField
                  control={form.control}
                  name="placeholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder Text</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Enter your response here..."
                        />
                      </FormControl>
                      <FormDescription>
                        Placeholder text shown in the input field.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Required Question</FormLabel>
                      <FormDescription>
                        Applicants must answer this question to submit their application.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Options for Select/Multi-select/Checkbox */}
          {requiresOptions && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Answer Options</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendOption({ value: '', label: '', description: '' })}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {optionFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`options.${index}.value`}>Value *</Label>
                          <Input
                            {...form.register(`options.${index}.value`)}
                            placeholder="option_value"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`options.${index}.label`}>Display Label *</Label>
                          <Input
                            {...form.register(`options.${index}.label`)}
                            placeholder="Option Label"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`options.${index}.description`}>Description</Label>
                        <Input
                          {...form.register(`options.${index}.description`)}
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {optionFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <List className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No options added yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Option" to get started.</p>
                  </div>
                )}

                {selectedQuestionType !== 'checkbox' && (
                  <div className="space-y-4 pt-4 border-t">
                    <FormField
                      control={form.control}
                      name="allow_other"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Allow "Other" Option</FormLabel>
                            <FormDescription>
                              Includes an "Other" option with a text field for custom responses.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="randomize_options"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Randomize Option Order</FormLabel>
                            <FormDescription>
                              Display options in random order for each applicant.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* File Upload Configuration */}
          {isFileType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">File Upload Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowed_file_types"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowed File Types</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {FILE_TYPE_OPTIONS.map((fileType) => (
                          <label
                            key={fileType.value}
                            className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={field.value?.includes(fileType.value) || false}
                              onChange={(e) => {
                                const currentTypes = field.value || []
                                if (e.target.checked) {
                                  field.onChange([...currentTypes, fileType.value])
                                } else {
                                  field.onChange(currentTypes.filter(type => type !== fileType.value))
                                }
                              }}
                            />
                            <span className="text-sm">{fileType.label}</span>
                          </label>
                        ))}
                      </div>
                      <FormDescription>
                        Select the file types that applicants can upload.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="max_file_size_mb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max File Size (MB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum file size in megabytes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_files"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Number of Files</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of files allowed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Text Validation */}
          {isTextType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Text Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="max_length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Character Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10000"
                          placeholder="e.g., 500"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of characters allowed in the response.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {question ? 'Update Question' : 'Create Question'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}