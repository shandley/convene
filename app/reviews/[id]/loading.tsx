import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ReviewDetailLoading() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        {/* Application header skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-96" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Progress skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Content skeleton */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border">
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-64 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Skeleton key={j} className="h-10" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Comments skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>

              {/* Actions skeleton */}
              <div className="flex gap-4 justify-end">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}