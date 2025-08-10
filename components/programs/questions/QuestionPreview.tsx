'use client'

import React, { useState } from 'react'
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
  AlignLeft,
  Eye,
  HelpCircle,
  Star
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

import type { 
  ApplicationQuestionWithRelations, 
  SelectOption, 
  QuestionType 
} from '@/types/questions'

interface QuestionPreviewProps {
  question: ApplicationQuestionWithRelations
}

// Question type icons mapping
const getQuestionTypeIcon = (type: QuestionType) => {
  const icons = {
    text: FileText,
    textarea: AlignLeft,
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

export function QuestionPreview({ question }: QuestionPreviewProps) {
  const [textValue, setTextValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([])
  const [checkboxValues, setCheckboxValues] = useState<string[]>([])
  const [numberValue, setNumberValue] = useState('')
  const [dateValue, setDateValue] = useState('')
  const [otherValue, setOtherValue] = useState('')
  const [showOther, setShowOther] = useState(false)

  const Icon = getQuestionTypeIcon(question.question_type)
  const options = (question.options as unknown as SelectOption[]) || []
  const hasOtherOption = question.allow_other && ['select', 'multi_select'].includes(question.question_type)

  const renderQuestionInput = () => {
    switch (question.question_type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
        return (
          <Input
            placeholder={question.placeholder || undefined}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            type={question.question_type === 'email' ? 'email' : 
                  question.question_type === 'url' ? 'url' : 
                  question.question_type === 'phone' ? 'tel' : 'text'}
            maxLength={question.max_length || undefined}
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={question.placeholder || undefined}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            maxLength={question.max_length || undefined}
            className="min-h-[120px]"
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            placeholder={question.placeholder || undefined}
            value={numberValue}
            onChange={(e) => setNumberValue(e.target.value)}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
          />
        )

      case 'select':
        return (
          <div className="space-y-3">
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {hasOtherOption && (
                  <SelectItem value="__other__">Other (please specify)</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {hasOtherOption && selectValue === '__other__' && (
              <Input
                placeholder="Please specify..."
                value={otherValue}
                onChange={(e) => setOtherValue(e.target.value)}
              />
            )}
          </div>
        )

      case 'multi_select':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.value} className="flex items-start space-x-2">
                  <Checkbox
                    id={`multi-${option.value}`}
                    checked={multiSelectValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMultiSelectValues([...multiSelectValues, option.value])
                      } else {
                        setMultiSelectValues(multiSelectValues.filter(v => v !== option.value))
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`multi-${option.value}`} className="text-sm font-normal cursor-pointer">
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {hasOtherOption && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="multi-other"
                    checked={showOther}
                    onCheckedChange={(checked) => setShowOther(checked === true)}
                  />
                  <Label htmlFor="multi-other" className="text-sm font-normal cursor-pointer">
                    Other (please specify)
                  </Label>
                </div>
              )}
            </div>
            
            {hasOtherOption && showOther && (
              <Input
                placeholder="Please specify..."
                value={otherValue}
                onChange={(e) => setOtherValue(e.target.value)}
              />
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-start space-x-2">
                <Checkbox
                  id={`check-${option.value}`}
                  checked={checkboxValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setCheckboxValues([...checkboxValues, option.value])
                    } else {
                      setCheckboxValues(checkboxValues.filter(v => v !== option.value))
                    }
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor={`check-${option.value}`} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                  {option.description && (
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )

      case 'file':
        return (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  {question.allowed_file_types && question.allowed_file_types.length > 0 && (
                    <>Allowed types: {question.allowed_file_types.join(', ')}</>
                  )}
                  {question.max_file_size_mb && (
                    <> • Max size: {question.max_file_size_mb}MB</>
                  )}
                  {question.max_files && (
                    <> • Max files: {question.max_files}</>
                  )}
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                Choose Files
              </Button>
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-sm text-gray-500">Preview not available for this question type</p>
          </div>
        )
    }
  }

  const getCharacterCount = () => {
    if (!['text', 'textarea'].includes(question.question_type) || !question.max_length) {
      return null
    }
    
    return (
      <div className="flex justify-between items-center text-xs mt-2">
        <span className="text-gray-500">
          {textValue.length} / {question.max_length} characters
        </span>
        {textValue.length > (question.max_length * 0.8) && (
          <span className={`font-medium ${
            textValue.length >= question.max_length ? 'text-red-500' : 'text-yellow-500'
          }`}>
            {textValue.length >= question.max_length ? 'Limit reached' : 'Approaching limit'}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Question Preview
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            See how this question will appear to applicants
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Eye className="h-3 w-3" />
          Preview Mode
        </Badge>
      </div>

      {/* Question Metadata */}
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="font-medium">Type:</span>
              <Badge variant="secondary">
                {question.question_type.replace('_', ' ')}
              </Badge>
            </div>
            
            {question.required && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">Required</span>
              </div>
            )}
            
            {/* TODO: Uncomment when is_system_question field is added
            {question.is_system_question && (
              <Badge variant="outline">System Question</Badge>
            )} */}
            
            {question.category && (
              <Badge variant="outline">{question.category.title}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Preview */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CardTitle className="text-lg leading-relaxed">
                {question.question_text}
                {question.required && (
                  <span className="text-red-500 ml-1" aria-label="Required">*</span>
                )}
              </CardTitle>
            </div>
            
            {question.help_text && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  {question.help_text}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {renderQuestionInput()}
          {getCharacterCount()}
          
          {/* Validation Rules Display */}
          {question.validation_rules && Object.keys(question.validation_rules).length > 0 && (
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium">Validation:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {(question.validation_rules as any)?.min_length && (
                  <li>Minimum {(question.validation_rules as any).min_length} characters</li>
                )}
                {(question.validation_rules as any)?.max_length && (
                  <li>Maximum {(question.validation_rules as any).max_length} characters</li>
                )}
                {(question.validation_rules as any)?.min && (
                  <li>Minimum value: {(question.validation_rules as any).min}</li>
                )}
                {(question.validation_rules as any)?.max && (
                  <li>Maximum value: {(question.validation_rules as any).max}</li>
                )}
                {(question.validation_rules as any)?.regex && (
                  <li>Must match pattern: {(question.validation_rules as any).regex}</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Question Type:</span>
              <p className="text-gray-600 dark:text-gray-400 capitalize">
                {question.question_type.replace('_', ' ')}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Required:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {question.required ? 'Yes' : 'No'}
              </p>
            </div>
            
            {question.max_length && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Character Limit:</span>
                <p className="text-gray-600 dark:text-gray-400">{question.max_length}</p>
              </div>
            )}
            
            {question.question_type === 'file' && question.allowed_file_types && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Allowed Files:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {question.allowed_file_types.join(', ')}
                </p>
              </div>
            )}
            
            {question.question_type === 'file' && question.max_file_size_mb && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Max File Size:</span>
                <p className="text-gray-600 dark:text-gray-400">{question.max_file_size_mb}MB</p>
              </div>
            )}
            
            {['select', 'multi_select'].includes(question.question_type) && question.allow_other && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Allow Other:</span>
                <p className="text-gray-600 dark:text-gray-400">Yes</p>
              </div>
            )}
          </div>
          
          {options.length > 0 && (
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Options:</span>
              <div className="mt-2 space-y-1">
                {options.map((option, index) => (
                  <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {option.label} {option.description && `(${option.description})`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}