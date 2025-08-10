'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Check, 
  X, 
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
  Package,
  Star,
  Users,
  Sparkles
} from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

import type { 
  QuestionTemplate, 
  QuestionCategoryType, 
  QuestionType, 
  ApplicationQuestionWithRelations,
  CreateFromTemplateRequest
} from '@/types/questions'

interface QuestionTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  programId: string
  onQuestionsAdded: (questions: ApplicationQuestionWithRelations[]) => void
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

// Category configuration
const CATEGORY_CONFIG = {
  personal_info: {
    label: 'Personal Info',
    description: 'Basic personal and contact information',
    icon: Users,
    color: 'bg-blue-50 border-blue-200'
  },
  background: {
    label: 'Background',
    description: 'Educational and professional background',
    icon: FileText,
    color: 'bg-green-50 border-green-200'
  },
  experience: {
    label: 'Experience',
    description: 'Work experience and skills',
    icon: Star,
    color: 'bg-purple-50 border-purple-200'
  },
  essays: {
    label: 'Essays',
    description: 'Personal statements and essays',
    icon: AlignLeft,
    color: 'bg-orange-50 border-orange-200'
  },
  preferences: {
    label: 'Preferences',
    description: 'Preferences and choices',
    icon: CheckSquare,
    color: 'bg-pink-50 border-pink-200'
  },
  documents: {
    label: 'Documents',
    description: 'File uploads and documents',
    icon: Upload,
    color: 'bg-cyan-50 border-cyan-200'
  },
  custom: {
    label: 'Custom',
    description: 'Custom and specialized questions',
    icon: Sparkles,
    color: 'bg-gray-50 border-gray-200'
  }
} as const

interface TemplateCardProps {
  template: QuestionTemplate
  isSelected: boolean
  onSelect: (template: QuestionTemplate) => void
  onPreview: (template: QuestionTemplate) => void
}

function TemplateCard({ template, isSelected, onSelect, onPreview }: TemplateCardProps) {
  const Icon = getQuestionTypeIcon(template.question_type)
  const categoryConfig = CATEGORY_CONFIG[template.category]

  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(template)}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Badge variant="secondary" className="text-xs">
                {template.question_type.replace('_', ' ')}
              </Badge>
              {template.is_system_template && (
                <Badge variant="outline" className="text-xs">
                  System
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onPreview(template)
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CardTitle className="text-sm font-medium line-clamp-2 mt-2">
          {template.title}
        </CardTitle>
        
        {template.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {template.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
            {template.question_text}
          </p>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {categoryConfig?.label}
              </Badge>
              {template.required && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-gray-500">
              <Users className="h-3 w-3" />
              <span>{template.usage_count}</span>
            </div>
          </div>
          
          {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function QuestionTemplateModal({ 
  open, 
  onOpenChange, 
  programId, 
  onQuestionsAdded 
}: QuestionTemplateModalProps) {
  const [templates, setTemplates] = useState<QuestionTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<QuestionTemplate[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategoryType | 'all'>('all')
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingQuestions, setIsAddingQuestions] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<QuestionTemplate | null>(null)

  // Load templates
  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open])

  // Filter templates
  useEffect(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = !searchTerm || 
                           template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (template.tags && Array.isArray(template.tags) && template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      const matchesType = selectedType === 'all' || template.question_type === selectedType
      
      return matchesSearch && matchesCategory && matchesType
    })

    // Sort by usage count and system templates first
    filtered.sort((a, b) => {
      if (a.is_system_template && !b.is_system_template) return -1
      if (!a.is_system_template && b.is_system_template) return 1
      return b.usage_count - a.usage_count
    })

    setFilteredTemplates(filtered)
  }, [templates, searchTerm, selectedCategory, selectedType])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        include_private: 'true'
      })
      
      const response = await fetch(`/api/programs/${programId}/questions/templates?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load templates')
      }
      
      const data = await response.json()
      setTemplates(data.templates)
    } catch (error) {
      console.error('Error loading templates:', error)
      // TODO: Show toast error message
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTemplateSelection = (template: QuestionTemplate) => {
    const newSelected = new Set(selectedTemplates)
    if (newSelected.has(template.id)) {
      newSelected.delete(template.id)
    } else {
      newSelected.add(template.id)
    }
    setSelectedTemplates(newSelected)
  }

  const handleAddSelectedQuestions = async () => {
    if (selectedTemplates.size === 0) return

    setIsAddingQuestions(true)
    try {
      const templateRequests: CreateFromTemplateRequest[] = Array.from(selectedTemplates).map(templateId => ({
        template_id: templateId,
      }))

      const response = await fetch(`/api/programs/${programId}/questions/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templates: templateRequests }),
      })

      if (!response.ok) {
        throw new Error('Failed to add questions from templates')
      }

      const data = await response.json()
      onQuestionsAdded(data.created_questions)
      onOpenChange(false)
      setSelectedTemplates(new Set())
    } catch (error) {
      console.error('Error adding questions:', error)
      // TODO: Show toast error message
    } finally {
      setIsAddingQuestions(false)
    }
  }

  const categories = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
    value: key as QuestionCategoryType,
    label: config.label,
    icon: config.icon
  }))

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Question Templates</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Browse and select from pre-built question templates to add to your program.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="browse" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="browse" className="gap-2">
                <Package className="h-4 w-4" />
                Browse Templates ({filteredTemplates.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse" className="flex-1 overflow-hidden flex flex-col space-y-4">
              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Category
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                      All Categories
                    </DropdownMenuItem>
                    <Separator />
                    {categories.map(category => {
                      const Icon = category.icon
                      return (
                        <DropdownMenuItem
                          key={category.value}
                          onClick={() => setSelectedCategory(category.value)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {category.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <List className="h-4 w-4" />
                      Type
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {questionTypes.map(type => (
                      <DropdownMenuItem
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                      >
                        {type.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Selected Count */}
              {selectedTemplates.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    onClick={() => setSelectedTemplates(new Set())}
                    variant="ghost"
                    size="sm"
                    className="text-blue-700 dark:text-blue-300"
                  >
                    Clear selection
                  </Button>
                </div>
              )}

              {/* Templates Grid */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No templates found
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Try adjusting your search terms or filters.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        isSelected={selectedTemplates.has(template.id)}
                        onSelect={toggleTemplateSelection}
                        onPreview={setPreviewTemplate}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSelectedTemplates(new Set(filteredTemplates.map(t => t.id)))}
              variant="outline"
              size="sm"
              disabled={filteredTemplates.length === 0}
            >
              Select All
            </Button>
            <Button
              onClick={() => setSelectedTemplates(new Set())}
              variant="outline"
              size="sm"
              disabled={selectedTemplates.size === 0}
            >
              Clear All
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSelectedQuestions}
              disabled={selectedTemplates.size === 0 || isAddingQuestions}
              className="gap-2"
            >
              {isAddingQuestions ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add {selectedTemplates.size} Question{selectedTemplates.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl">
            {previewTemplate && (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle>{previewTemplate.title}</DialogTitle>
                  {previewTemplate.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {previewTemplate.description}
                    </p>
                  )}
                </DialogHeader>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getQuestionTypeIcon(previewTemplate.question_type)({ className: "h-4 w-4" })}
                    <Badge variant="secondary">
                      {previewTemplate.question_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORY_CONFIG[previewTemplate.category]?.label}
                    </Badge>
                    {previewTemplate.required && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {previewTemplate.question_text}
                    </p>
                    {previewTemplate.help_text && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {previewTemplate.help_text}
                      </p>
                    )}
                  </div>
                  
                  {previewTemplate.tags && Array.isArray(previewTemplate.tags) && previewTemplate.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {previewTemplate.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}