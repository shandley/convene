# Review Components

This directory contains the UI components for the reviewer dashboard and scoring interface in the Convene platform.

## Components Overview

### Core Components

- **`ReviewCard`** - Card component displaying review assignment details with action buttons
- **`ReviewStatusBadge`** - Status indicator with color coding for review states
- **`ReviewStats`** - Dashboard statistics display with loading states
- **`ReviewProgress`** - Progress indicator for review completion
- **`ScoreCriterion`** - Individual scoring criterion with multiple scoring types

### Features

- **Multi-role Support**: Components respect user roles (reviewer access required)
- **Responsive Design**: Mobile-first responsive layouts using Tailwind CSS
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
- **Loading States**: Skeleton loaders for improved perceived performance
- **Multiple Scoring Types**: 
  - Numerical (0-10 scale)
  - Categorical (rubric-based levels)
  - Binary (meets/doesn't meet criteria)
- **Real-time Updates**: Components designed for live data updates

### Usage

```tsx
import { ReviewCard, ReviewStatusBadge, ReviewStats } from '@/components/reviews'

// In your page component
<ReviewStats stats={{ total: 10, inProgress: 3, completed: 6, overdue: 1 }} />
<ReviewCard review={reviewData} onStartReview={handleStartReview} />
<ReviewStatusBadge status="in_progress" />
```

## Pages

### `/reviews` - Reviewer Dashboard
- Statistics overview
- Filterable review list
- Search functionality
- Sort by due date, priority, status

### `/reviews/[id]` - Review Scoring Interface
- Tabbed interface (Application Details, Scoring, Previous Reviews)
- Criterion-based scoring with multiple input types
- Progress tracking
- Save draft and submit functionality
- Real-time score calculation

## Mock Data

Currently using mock data for development. Replace with actual API calls:

- Review assignments
- Application details
- Scoring criteria
- Review submission

## Next Steps

1. Connect to real review system APIs
2. Add notification badges for pending reviews
3. Implement real-time updates via WebSocket
4. Add export functionality for completed reviews
5. Enhance accessibility features