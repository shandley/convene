'use client'

import React, { useState } from 'react'
import { 
  Eye,
  CheckCircle,
  Circle,
  AlertCircle,
  Star,
  Users,
  FileText,
  CheckSquare,
  Upload,
  Sparkles,
  ChevronRight
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'

import type { 
  ApplicationQuestionWithRelations, 
  QuestionCategory,
  QuestionCategoryType 
} from '@/types/questions'
import { QuestionPreview } from './QuestionPreview'

interface ApplicationFormPreviewProps {
  questions: ApplicationQuestionWithRelations[]
  categories: QuestionCategory[]
  programTitle: string
}

// Category type configuration
const CATEGORY_TYPE_CONFIG = {
  personal_info: {
    label: 'Personal Information',
    description: 'Basic personal and contact information',
    icon: Users,
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  background: {
    label: 'Background',
    description: 'Educational and professional background',
    icon: FileText,
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  experience: {
    label: 'Experience',
    description: 'Work experience and skills',
    icon: Star,
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  essays: {
    label: 'Essays & Statements',
    description: 'Personal statements and essay responses',
    icon: FileText,
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  preferences: {
    label: 'Preferences',
    description: 'Preferences and choices',
    icon: CheckSquare,
    color: 'bg-pink-50 border-pink-200 text-pink-800'
  },
  documents: {
    label: 'Supporting Documents',
    description: 'File uploads and documents',
    icon: Upload,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800'
  },
  custom: {
    label: 'Additional Information',
    description: 'Custom and specialized questions',
    icon: Sparkles,
    color: 'bg-gray-50 border-gray-200 text-gray-800'
  }
} as const

interface CategorySectionProps {
  category: QuestionCategory
  questions: ApplicationQuestionWithRelations[]
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

function CategorySection({ 
  category, 
  questions, 
  isCollapsed = false, 
  onToggleCollapse 
}: CategorySectionProps) {
  const typeConfig = CATEGORY_TYPE_CONFIG[category.category_type]
  const Icon = typeConfig.icon
  
  const requiredQuestions = questions.filter(q => q.required).length
  const totalQuestions = questions.length

  return (
    <Card className="mb-6">
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {category.title}
                  </CardTitle>
                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
                    </Badge>
                    {requiredQuestions > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {requiredQuestions} required
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {typeConfig.label}
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${
                  !isCollapsed ? 'rotate-90' : ''
                }`} />
              </div>
            </div>
            
            {category.instructions && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Instructions:</strong> {category.instructions}
                </p>
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  {index > 0 && <Separator className="my-6" />}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <QuestionPreview question={question} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function UncategorizedSection({ 
  questions, 
  isCollapsed = false, 
  onToggleCollapse 
}: { 
  questions: ApplicationQuestionWithRelations[]
  isCollapsed?: boolean
  onToggleCollapse?: () => void 
}) {
  const requiredQuestions = questions.filter(q => q.required).length
  const totalQuestions = questions.length

  return (
    <Card className="mb-6">
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    General Questions
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Questions not assigned to any category
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
                    </Badge>
                    {requiredQuestions > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {requiredQuestions} required
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${
                  !isCollapsed ? 'rotate-90' : ''
                }`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  {index > 0 && <Separator className="my-6" />}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <QuestionPreview question={question} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function ApplicationFormPreview({ 
  questions, 
  categories, 
  programTitle 
}: ApplicationFormPreviewProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Group questions by category
  const questionsByCategory = categories.reduce((acc, category) => {
    const categoryQuestions = questions
      .filter(q => q.category_id === category.id)
      .sort((a, b) => a.order_index - b.order_index)
    
    if (categoryQuestions.length > 0) {
      acc[category.id] = categoryQuestions
    }
    
    return acc
  }, {} as Record<string, ApplicationQuestionWithRelations[]>)

  // Get uncategorized questions
  const uncategorizedQuestions = questions
    .filter(q => !q.category_id)
    .sort((a, b) => a.order_index - b.order_index)

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId)
    } else {
      newCollapsed.add(sectionId)
    }
    setCollapsedSections(newCollapsed)
  }

  // Calculate stats
  const totalQuestions = questions.length
  const requiredQuestions = questions.filter(q => q.required).length
  const categorizedQuestions = Object.values(questionsByCategory).flat().length
  const completionRate = Math.round((categorizedQuestions / totalQuestions) * 100) || 0

  if (totalQuestions === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Eye className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No questions to preview
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Add questions to see how your application form will look to applicants.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Application for {programTitle}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please complete all sections of this application form. Required fields are marked with a star (*).
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-blue-500" />
            <span>{totalQuestions} total questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-red-500" />
            <span>{requiredQuestions} required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{categorizedQuestions} organized</span>
          </div>
        </div>

        {/* Progress */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-sm">
            <span>Organization Progress</span>
            <span>{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
          <p className="text-xs text-gray-500">
            {completionRate < 100 ? 
              `${totalQuestions - categorizedQuestions} questions need to be categorized` :
              'All questions are properly organized'
            }
          </p>
        </div>
      </div>

      {/* Application Sections */}
      <div className="max-w-4xl mx-auto">
        {/* Categorized Sections */}
        {categories
          .filter(category => category.is_visible && questionsByCategory[category.id])
          .sort((a, b) => a.order_index - b.order_index)
          .map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              questions={questionsByCategory[category.id]}
              isCollapsed={collapsedSections.has(category.id)}
              onToggleCollapse={() => toggleSection(category.id)}
            />
          ))}

        {/* Uncategorized Questions */}
        {uncategorizedQuestions.length > 0 && (
          <UncategorizedSection
            questions={uncategorizedQuestions}
            isCollapsed={collapsedSections.has('uncategorized')}
            onToggleCollapse={() => toggleSection('uncategorized')}
          />
        )}

        {/* Empty State */}
        {Object.keys(questionsByCategory).length === 0 && uncategorizedQuestions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No visible questions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Make sure your questions are assigned to visible categories.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="pt-6 border-t">
          <div className="flex items-center justify-between">
            <Button variant="outline" disabled>
              Save as Draft
            </Button>
            <Button disabled>
              Submit Application
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            This is a preview - form functionality is disabled
          </p>
        </div>
      </div>
    </div>
  )
}