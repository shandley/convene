'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ReviewDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Review detail error:', error)
  }, [error])

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/reviews"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reviews
        </Link>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Error Loading Review
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Sorry, we encountered an error while loading this review. This might be because:
            </p>
            
            <ul className="text-sm text-gray-600 text-left space-y-1">
              <li>• The review doesn't exist or has been removed</li>
              <li>• You don't have permission to access this review</li>
              <li>• There's a temporary server issue</li>
            </ul>
            
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
                asChild
              >
                <Link href="/reviews">
                  Back to Reviews
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}