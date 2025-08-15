import { ReviewCard, type Review } from '@/components/reviews/ReviewCard'
import { Card, CardContent } from '@/components/ui/card'

interface ReviewsListProps {
  reviews: Review[]
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
          <p className="text-gray-600">
            You don't have any reviews assigned at the moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}