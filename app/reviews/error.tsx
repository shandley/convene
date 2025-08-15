'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ReviewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Reviews page error:', error)
  }, [error])

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Error Loading Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Sorry, we encountered an error while loading your reviews. This might be a temporary issue.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left text-sm">
              <summary className="cursor-pointer text-red-600 font-medium mb-2">
                Error Details (Development)
              </summary>
              <pre className="bg-red-50 p-2 rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2 justify-center">
            <Button
              onClick={reset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}