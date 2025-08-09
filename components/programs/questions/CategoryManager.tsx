'use client'

import React, { useState, useEffect } from 'react'
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
  Settings,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  FolderOpen,
  Folder,
  Users,
  FileText,
  Star,
  CheckSquare,
  Upload,
  Sparkles
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
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
  SelectValue 
} from '@/components/ui/select'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import type { QuestionCategory, QuestionCategoryType } from '@/types/questions'
import { CategoriesService, CreateCategoryRequest, UpdateCategoryRequest } from '@/lib/services/categories'

interface CategoryManagerProps {
  programId: string
  categories: QuestionCategory[]
  onCategoriesChange: (categories: QuestionCategory[]) => void
  isLoading?: boolean
}

// Category type configuration
const CATEGORY_TYPE_CONFIG = {
  personal_info: {
    label: 'Personal Info',
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
    label: 'Essays',
    description: 'Personal statements and essays',
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
    label: 'Documents',
    description: 'File uploads and documents',
    icon: Upload,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800'
  },
  custom: {
    label: 'Custom',
    description: 'Custom and specialized questions',
    icon: Sparkles,
    color: 'bg-gray-50 border-gray-200 text-gray-800'
  }
} as const

// Form schemas
const categorySchema = z.object({
  title: z.string().min(1, 'Category title is required'),
  description: z.string().optional(),
  category_type: z.enum([
    'personal_info', 'background', 'experience', 'essays', 
    'preferences', 'documents', 'custom'
  ]),
  instructions: z.string().optional(),
  is_visible: z.boolean().default(true),
  required_questions_count: z.coerce.number().min(0).optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

// Sortable Category Item Component
interface SortableCategoryItemProps {
  category: QuestionCategory
  onEdit: (category: QuestionCategory) => void
  onDelete: (categoryId: string) => void
  onToggleVisibility: (categoryId: string, visible: boolean) => void
  isDeleting?: boolean
}

function SortableCategoryItem({ 
  category, 
  onEdit, 
  onDelete, 
  onToggleVisibility, 
  isDeleting = false 
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const typeConfig = CATEGORY_TYPE_CONFIG[category.category_type]
  const Icon = typeConfig.icon

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : ''
      } ${isDeleting ? 'opacity-50' : ''} ${typeConfig.color}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-1 rounded-md hover:bg-white/50 transition-colors cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder category"
          >
            <GripVertical className="h-4 w-4 text-current" />
          </button>

          {/* Category Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-current flex-shrink-0" />
              <Badge variant="secondary" className="text-xs">
                {typeConfig.label}
              </Badge>
              {!category.is_visible && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hidden
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-sm font-medium text-current mb-1 line-clamp-1">
              {category.title}
            </CardTitle>
            
            {category.description && (
              <p className="text-xs text-current/70 line-clamp-2">
                {category.description}
              </p>
            )}

            {category.instructions && (
              <div className="mt-2 p-2 bg-white/30 rounded-md">
                <p className="text-xs text-current/80 line-clamp-1">
                  <strong>Instructions:</strong> {category.instructions}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleVisibility(category.id, !category.is_visible)}
              className="h-8 w-8 p-0 hover:bg-white/20"
            >
              {category.is_visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/20">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleVisibility(category.id, !category.is_visible)}>
                  {category.is_visible ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Category
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Category
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(category.id)}
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
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

// Category Form Component
interface CategoryFormProps {
  category?: QuestionCategory | null
  onSave: (data: CategoryFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

function CategoryForm({ category, onSave, onCancel, isLoading = false }: CategoryFormProps) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      title: category?.title || '',
      description: category?.description || '',
      category_type: category?.category_type || 'custom',
      instructions: category?.instructions || '',
      is_visible: category?.is_visible !== false,
      required_questions_count: category?.required_questions_count || 0,
    },
  })

  const selectedType = form.watch('category_type')
  const typeConfig = CATEGORY_TYPE_CONFIG[selectedType]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Personal Information" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CATEGORY_TYPE_CONFIG).map(([value, config]) => {
                      const Icon = config.icon
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {typeConfig.description}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Brief description of this category..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional description shown to applicants
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Instructions for completing this section..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional instructions shown above questions in this category
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="is_visible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Visible</FormLabel>
                    <FormDescription>
                      Show this category to applicants
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
              name="required_questions_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Questions</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum required questions (0 = no minimum)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {category ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {category ? 'Update Category' : 'Create Category'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export function CategoryManager({ 
  programId, 
  categories, 
  onCategoriesChange, 
  isLoading = false 
}: CategoryManagerProps) {
  const [editingCategory, setEditingCategory] = useState<QuestionCategory | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const categoriesService = new CategoriesService()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id)
      const newIndex = categories.findIndex(c => c.id === over?.id)
      
      const reorderedCategories = arrayMove(categories, oldIndex, newIndex).map((c, index) => ({
        ...c,
        order_index: index
      }))
      
      // Optimistic update
      onCategoriesChange(reorderedCategories)
      
      try {
        setIsReordering(true)
        await categoriesService.reorderCategories(
          programId, 
          reorderedCategories.map((c, index) => ({ id: c.id, order_index: index }))
        )
      } catch (error) {
        console.error('Failed to reorder categories:', error)
        // Revert on error
        onCategoriesChange(categories)
      } finally {
        setIsReordering(false)
      }
    }
  }

  const handleSave = async (data: CategoryFormData) => {
    try {
      setIsSaving(true)
      
      if (editingCategory) {
        // Update existing category
        const updatedCategory = await categoriesService.updateCategory(
          programId, 
          editingCategory.id, 
          data as UpdateCategoryRequest
        )
        
        const updatedCategories = categories.map(c => 
          c.id === updatedCategory.id ? updatedCategory : c
        )
        onCategoriesChange(updatedCategories)
      } else {
        // Create new category
        const newCategory = await categoriesService.createCategory(
          programId, 
          data as CreateCategoryRequest
        )
        
        onCategoriesChange([...categories, newCategory])
      }
      
      setShowForm(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('Failed to save category:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? All questions in this category will become uncategorized.')) {
      return
    }

    try {
      setIsDeleting(categoryId)
      await categoriesService.deleteCategory(programId, categoryId)
      
      const updatedCategories = categories.filter(c => c.id !== categoryId)
      onCategoriesChange(updatedCategories)
    } catch (error) {
      console.error('Failed to delete category:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleToggleVisibility = async (categoryId: string, visible: boolean) => {
    try {
      const updatedCategory = await categoriesService.updateCategory(
        programId, 
        categoryId, 
        { is_visible: visible }
      )
      
      const updatedCategories = categories.map(c => 
        c.id === updatedCategory.id ? updatedCategory : c
      )
      onCategoriesChange(updatedCategories)
    } catch (error) {
      console.error('Failed to toggle category visibility:', error)
    }
  }

  const handleEdit = (category: QuestionCategory) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleCreateDefault = async () => {
    try {
      setIsSaving(true)
      const defaultCategories = await categoriesService.createDefaultCategories(programId)
      onCategoriesChange([...categories, ...defaultCategories])
    } catch (error) {
      console.error('Failed to create default categories:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Question Categories
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Organize questions into categories for better applicant experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          {categories.length === 0 && (
            <Button 
              onClick={handleCreateDefault}
              variant="outline"
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Create Defaults
            </Button>
          )}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingCategory(null)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <CategoryForm
                category={editingCategory}
                onSave={handleSave}
                onCancel={() => setShowForm(false)}
                isLoading={isSaving}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No categories yet
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              Categories help organize questions and improve the applicant experience.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateDefault}
                variant="outline"
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Create Default Categories
              </Button>
              <Button 
                onClick={() => {
                  setEditingCategory(null)
                  setShowForm(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Custom Category
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {categories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                  isDeleting={isDeleting === category.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}