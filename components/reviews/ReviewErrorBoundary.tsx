'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

interface ReviewErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  showDetails?: boolean
  onReset?: () => void
}

// Error fallback component
function ErrorFallback({ 
  error, 
  errorInfo, 
  onReset, 
  showDetails = false 
}: {
  error: Error | null
  errorInfo: string | null
  onReset?: () => void
  showDetails?: boolean
}) {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleRetry = () => {
    if (onReset) {
      onReset()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <CardTitle className="text-red-900">
              Something went wrong with the review system
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              We encountered an unexpected error while loading the review. This might be due to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Network connectivity issues</li>
                <li>Server maintenance</li>
                <li>Invalid review data</li>
                <li>Permission changes</li>
              </ul>
            </AlertDescription>
          </Alert>

          {showDetails && error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-800">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded-md text-sm font-mono text-red-800 overflow-auto">
                <div className="font-semibold">Error:</div>
                <div className="mb-2">{error.message}</div>
                {errorInfo && (
                  <>
                    <div className="font-semibold">Stack Trace:</div>
                    <pre className="whitespace-pre-wrap text-xs">{errorInfo}</pre>
                  </>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-wrap gap-3 pt-4">
            <Button 
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>

          <div className="pt-4 border-t border-red-200">
            <p className="text-sm text-red-700">
              If this problem persists, please contact support or try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export class ReviewErrorBoundary extends Component<ReviewErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ReviewErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ReviewErrorBoundary caught an error:', error, errorInfo)
    }

    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null
    })

    // Here you could send error reports to your monitoring service
    // Example: logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error)
    setError(error)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}

// Utility function to safely execute async operations
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  onError?: (error: Error) => void
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    console.error('Safe async operation failed:', error)
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)))
    }
    return fallback
  }
}

export default ReviewErrorBoundary