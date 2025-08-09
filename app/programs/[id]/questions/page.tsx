'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  Settings, 
  Eye, 
  FileText,
  FolderOpen,
  BarChart3,
  Download
} from 'lucide-react'

import { QuestionsService } from '@/lib/services/questions'
import { CategoriesService } from '@/lib/services/categories'
import { QuestionBuilder } from '@/components/programs/questions/QuestionBuilder'
import { CategoryManager } from '@/components/programs/questions/CategoryManager'
import { ApplicationFormPreview } from '@/components/programs/questions/ApplicationFormPreview'

import type { 
  ApplicationQuestionWithRelations, 
  QuestionCategory 
} from '@/types/questions'
import type { Tables } from '@/types/database.types'

type Program = Tables<'programs'>

interface ProgramQuestionsPageProps {
  params: Promise<{ id: string }>
}

export default function ProgramQuestionsPage({ params }: ProgramQuestionsPageProps) {
  const { user, loading } = useAuth()
  const [program, setProgram] = useState<Program | null>(null)
  const [questions, setQuestions] = useState<ApplicationQuestionWithRelations[]>([])
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [programLoading, setProgramLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('questions')
  const { toast } = useToast()

  const questionsService = new QuestionsService()
  const categoriesService = new CategoriesService()

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    getParams()
  }, [params])

  // Load program details
  useEffect(() => {
    if (!id || loading) return

    const loadProgram = async () => {
      try {
        setProgramLoading(true)
        const response = await fetch(`/api/programs/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Program not found')
            return
          }
          throw new Error('Failed to fetch program')
        }
        const data = await response.json()
        setProgram(data.program)
      } catch (err) {
        console.error('Error loading program:', err)
        setError('Failed to load program')
        toast({
          title: "Error",
          description: "Failed to load program details",
          variant: "destructive",
        })
      } finally {
        setProgramLoading(false)
      }
    }

    loadProgram()
  }, [id, loading, toast])

  // Load questions
  useEffect(() => {
    if (!id || loading) return

    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true)
        const fetchedQuestions = await questionsService.getQuestions(id)
        setQuestions(fetchedQuestions)
      } catch (err) {
        console.error('Error loading questions:', err)
        toast({
          title: "Error",
          description: "Failed to load questions",
          variant: "destructive",
        })
      } finally {
        setQuestionsLoading(false)
      }
    }

    loadQuestions()
  }, [id, loading, toast])

  // Load categories
  useEffect(() => {
    if (!id || loading) return

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        const fetchedCategories = await categoriesService.getCategories(id)
        setCategories(fetchedCategories)
      } catch (err) {
        console.error('Error loading categories:', err)
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        })
      } finally {
        setCategoriesLoading(false)
      }
    }

    loadCategories()
  }, [id, loading, toast])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleExportQuestions = async () => {
    try {
      const exportData = await questionsService.exportQuestions(id)
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${program?.title || 'program'}-questions.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Questions exported successfully",
      })
    } catch (err) {
      console.error('Error exporting questions:', err)
      toast({
        title: "Error",
        description: "Failed to export questions",
        variant: "destructive",
      })
    }
  }

  if (loading || programLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          </div>
          <div className="h-12 bg-gray-200 rounded w-96 animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {error || 'Program not found'}
          </h1>
          <Link href="/programs">
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Programs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const stats = {
    totalQuestions: questions.length,
    requiredQuestions: questions.filter(q => q.required).length,
    categorizedQuestions: questions.filter(q => q.category_id).length,
    totalCategories: categories.length,
    visibleCategories: categories.filter(c => c.is_visible).length,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/programs/${id}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Program
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Questions & Categories
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {program.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {questions.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleExportQuestions}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          <Link href={`/programs/${id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Program Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.totalQuestions}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Total Questions
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            {stats.requiredQuestions}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">
            Required
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {stats.categorizedQuestions}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            Categorized
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {stats.totalCategories}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">
            Categories
          </div>
        </div>
        
        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
            {stats.visibleCategories}
          </div>
          <div className="text-sm text-cyan-700 dark:text-cyan-300">
            Visible
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions" className="gap-2">
            <FileText className="h-4 w-4" />
            Questions ({stats.totalQuestions})
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories ({stats.totalCategories})
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Form Preview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="mt-6">
          <QuestionBuilder
            programId={id}
            questions={questions}
            onQuestionsChange={setQuestions}
            isLoading={questionsLoading}
          />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <CategoryManager
            programId={id}
            categories={categories}
            onCategoriesChange={setCategories}
            isLoading={categoriesLoading}
          />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-6">
          <ApplicationFormPreview
            questions={questions}
            categories={categories}
            programTitle={program.title}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}