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
  AlertCircle
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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

import type { 
  ApplicationQuestionWithRelations, 
  QuestionType, 
  QuestionCategoryType 
} from '@/types/questions'
import { QuestionForm } from './QuestionForm'
import { QuestionTemplateModal } from './QuestionTemplateModal'
import { QuestionPreview } from './QuestionPreview'

interface QuestionBuilderProps {
  programId: string
  questions: ApplicationQuestionWithRelations[]
  onQuestionsChange: (questions: ApplicationQuestionWithRelations[]) => void
  isLoading?: boolean
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
}

function SortableQuestionItem({ question, onEdit, onDelete, onPreview }: SortableQuestionItemProps) {
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
      }`}
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
              {question.is_system_question && (
                <Badge variant="outline" className="text-xs">
                  System
                </Badge>
              )}
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
                  {question.category.name}
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
                  disabled={question.is_system_question}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
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
  isLoading = false 
}: QuestionBuilderProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategoryType | 'all'>('all')
  const [editingQuestion, setEditingQuestion] = useState<ApplicationQuestionWithRelations | null>(null)
  const [previewQuestion, setPreviewQuestion] = useState<ApplicationQuestionWithRelations | null>(null)
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter questions based on search and category
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.help_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
                           question.category?.name.toLowerCase().includes(selectedCategory)
    
    return matchesSearch && matchesCategory
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id)
      const newIndex = questions.findIndex(q => q.id === over?.id)
      
      const reorderedQuestions = arrayMove(questions, oldIndex, newIndex).map((q, index) => ({
        ...q,
        order_index: index
      }))
      
      onQuestionsChange(reorderedQuestions)
    }
  }

  const handleEditQuestion = (question: ApplicationQuestionWithRelations) => {
    setEditingQuestion(question)
    setShowNewQuestionForm(true)
  }

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId)
    onQuestionsChange(updatedQuestions)
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Application Questions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage questions that applicants will answer when applying to this program.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {categories.find(c => c.value === selectedCategory)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {categories.map(category => (
              <DropdownMenuItem
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
              >
                {category.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Question Form Dialog */}
      <Dialog open={showNewQuestionForm} onOpenChange={setShowNewQuestionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          {previewQuestion && (
            <QuestionPreview question={previewQuestion} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}