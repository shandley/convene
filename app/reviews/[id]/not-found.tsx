import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ReviewNotFound() {
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
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <FileQuestion className="h-6 w-6 text-gray-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Review Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              The review you're looking for doesn't exist or you don't have permission to access it.
            </p>
            
            <p className="text-sm text-gray-500">
              This might happen if the review was removed or if you're not assigned as a reviewer for this application.
            </p>

            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/reviews">
                  View My Reviews
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}