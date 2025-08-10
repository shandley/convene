'use client'

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Plus, 
  Search, 
  Filter,
  GripVertical,
  Edit,
  Trash2,
  Eye,
  FileText,
  Hash,
  Calendar,
  Mail,
  Link,
  Phone,
  Upload,
  CheckSquare,
  List,
  ChevronRight,
  AlertCircle,
  Save,
  AlertTriangle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import type { 
  ApplicationQuestionWithRelations, 
  QuestionType, 
  QuestionCategoryType 
} from '@/types/questions'
import { QuestionsService } from '@/lib/services/questions'
import { QuestionForm } from './QuestionForm'
import { QuestionTemplateModal } from './QuestionTemplateModal'
import { QuestionPreview } from './QuestionPreview'

interface QuestionBuilderProps {
  programId: string
  questions: ApplicationQuestionWithRelations[]
  onQuestionsChange: (questions: ApplicationQuestionWithRelations[]) => void
  isLoading?: boolean
  onSave?: () => void
  isSaving?: boolean
  hasUnsavedChanges?: boolean
}

// Question type icons mapping
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

// Question type colors
const getQuestionTypeColor = (type: QuestionType) => {
  const colors = {
    text: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    textarea: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    select: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    multi_select: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    checkbox: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    file: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    number: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    date: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    email: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    url: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    phone: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  }
  return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

// Sortable Question Item Component
interface SortableQuestionItemProps {
  question: ApplicationQuestionWithRelations
  onEdit: (question: ApplicationQuestionWithRelations) => void
  onDelete: (questionId: string) => void
  onPreview: (question: ApplicationQuestionWithRelations) => void
  isDeleting?: boolean
}

function SortableQuestionItem({ question, onEdit, onDelete, onPreview, isDeleting = false }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = getQuestionTypeIcon(question.question_type)
  const typeColor = getQuestionTypeColor(question.question_type)

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : ''
      } ${isDeleting ? 'opacity-50' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder question"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>

          {/* Question Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <Badge variant="secondary" className={`text-xs ${typeColor}`}>
                {question.question_type.replace('_', ' ')}
              </Badge>
              {question.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
              {/* TODO: Uncomment when is_system_question field is added
              {question.is_system_question && (
                <Badge variant="outline" className="text-xs">
                  System
                </Badge>
              )} */}
            </div>
            
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
              {question.question_text}
            </h4>
            
            {question.help_text && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                {question.help_text}
              </p>
            )}

            {question.category && (
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="outline" className="text-xs">
                  {question.category.title}
                </Badge>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreview(question)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(question)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Question
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPreview(question)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(question.id)}
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting /* TODO: Also use question.is_system_question once field is added */}
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

export function QuestionBuilder({ 
  programId, 
  questions, 
  onQuestionsChange, 
  isLoading = false,
  onSave,
  isSaving = false,
  hasUnsavedChanges = false
}: QuestionBuilderProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategoryType | 'all'>('all')
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all')
  const [editingQuestion, setEditingQuestion] = useState<ApplicationQuestionWithRelations | null>(null)
  const [previewQuestion, setPreviewQuestion] = useState<ApplicationQuestionWithRelations | null>(null)
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const questionsService = new QuestionsService()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter questions based on search, category, and type
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.help_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.category?.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
                           question.category?.category_type === selectedCategory
    
    const matchesType = selectedType === 'all' || 
                       question.question_type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  const categories: { value: QuestionCategoryType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'personal_info', label: 'Personal Info' },
    { value: 'background', label: 'Background' },
    { value: 'experience', label: 'Experience' },
    { value: 'essays', label: 'Essays' },
    { value: 'preferences', label: 'Preferences' },
    { value: 'documents', label: 'Documents' },
    { value: 'custom', label: 'Custom' },
  ]

  const questionTypes: { value: QuestionType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'select', label: 'Single Select' },
    { value: 'multi_select', label: 'Multi Select' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'file', label: 'File Upload' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'phone', label: 'Phone' },
  ]

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id)
      const newIndex = questions.findIndex(q => q.id === over?.id)
      
      const reorderedQuestions = arrayMove(questions, oldIndex, newIndex).map((q, index) => ({
        ...q,
        order_index: index
      }))
      
      // Optimistic update
      onQuestionsChange(reorderedQuestions)
      
      try {
        setIsReordering(true)
        // Update order on server
        const reorderData = reorderedQuestions.map((q, index) => ({
          id: q.id,
          order_index: index,
          category_id: q.category_id
        }))
        
        await questionsService.reorderQuestions(programId, { questions: reorderData })
      } catch (error) {
        console.error('Failed to reorder questions:', error)
        // Revert on error
        onQuestionsChange(questions)
        // TODO: Show error toast
      } finally {
        setIsReordering(false)
      }
    }
  }

  const handleEditQuestion = (question: ApplicationQuestionWithRelations) => {
    setEditingQuestion(question)
    setShowNewQuestionForm(true)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(questionId)
      await questionsService.deleteQuestion(programId, questionId)
      
      // Remove from local state
      const updatedQuestions = questions.filter(q => q.id !== questionId)
      onQuestionsChange(updatedQuestions)
    } catch (error) {
      console.error('Failed to delete question:', error)
      // TODO: Show error toast
    } finally {
      setIsDeleting(null)
    }
  }

  const handleQuestionSaved = (savedQuestion: ApplicationQuestionWithRelations) => {
    if (editingQuestion) {
      // Update existing question
      const updatedQuestions = questions.map(q => 
        q.id === savedQuestion.id ? savedQuestion : q
      )
      onQuestionsChange(updatedQuestions)
    } else {
      // Add new question
      onQuestionsChange([...questions, savedQuestion])
    }
    
    setShowNewQuestionForm(false)
    setEditingQuestion(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Application Questions
            </h2>
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="h-3 w-3" />
                Unsaved Changes
              </Badge>
            )}
            {questions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {questions.length} question{questions.length === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage questions that applicants will answer when applying to this program.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onSave && hasUnsavedChanges && (
            <Button 
              onClick={onSave}
              variant="default"
              disabled={isSaving}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save Questions'}
            </Button>
          )}
          <Button 
            onClick={() => setShowTemplateModal(true)}
            variant="outline"
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Browse Templates
          </Button>
          <Button 
            onClick={() => {
              setEditingQuestion(null)
              setShowNewQuestionForm(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">You have unsaved changes</span>
              <span className="text-amber-600">•</span>
              <span>Save your changes to prevent losing your work</span>
            </div>
            {onSave && (
              <Button
                onClick={onSave}
                size="sm"
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Now'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as QuestionCategoryType | 'all')}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Select category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as QuestionType | 'all')}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <SelectValue placeholder="Select type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {questions.length === 0 ? 'No questions added yet' : 'No questions match your search'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              {questions.length === 0 
                ? 'Get started by adding questions or browsing templates.'
                : 'Try adjusting your search terms or filters.'
              }
            </p>
            {questions.length === 0 && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowTemplateModal(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Browse Templates
                </Button>
                <Button 
                  onClick={() => {
                    setEditingQuestion(null)
                    setShowNewQuestionForm(true)
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <SortableQuestionItem
                  key={question.id}
                  question={question}
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                  onPreview={setPreviewQuestion}
                  isDeleting={isDeleting === question.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Question Form Dialog */}
      <Dialog open={showNewQuestionForm} onOpenChange={setShowNewQuestionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
          </DialogHeader>
          <QuestionForm
            programId={programId}
            question={editingQuestion}
            onSave={handleQuestionSaved}
            onCancel={() => {
              setShowNewQuestionForm(false)
              setEditingQuestion(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Template Selection Modal */}
      <QuestionTemplateModal
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        programId={programId}
        onQuestionsAdded={(newQuestions) => {
          onQuestionsChange([...questions, ...newQuestions])
        }}
      />

      {/* Question Preview Dialog */}
      <Dialog open={!!previewQuestion} onOpenChange={(open) => !open && setPreviewQuestion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Question Preview</DialogTitle>
          </DialogHeader>
          {previewQuestion && (
            <QuestionPreview question={previewQuestion} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}