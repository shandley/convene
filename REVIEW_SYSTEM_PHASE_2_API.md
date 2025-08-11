# Review Configuration & Scoring System - Phase 2: API Development

**Implementation Date**: August 10, 2025  
**Status**: ✅ API Endpoints Completed - Ready for Frontend Integration

## Overview

Phase 2 implements comprehensive REST API endpoints for the Review Configuration & Scoring System. All endpoints include authentication, authorization, and proper error handling.

## API Endpoints Implemented

### 1. Review Settings Management

#### `GET /api/programs/[id]/review-settings`
- Fetches review settings for a specific program
- Returns settings with associated template if configured
- Returns `null` if no settings exist (not an error)

#### `POST /api/programs/[id]/review-settings`
- Creates review settings for a program
- Accepts all review configuration parameters
- Returns created settings with 201 status

#### `PUT /api/programs/[id]/review-settings`
- Updates existing review settings
- Supports partial updates
- Returns updated settings

#### `DELETE /api/programs/[id]/review-settings`
- Removes review settings for a program
- Returns success message

### 2. Review Criteria Management

#### `GET /api/programs/[id]/review-criteria`
- Fetches all criteria for a program
- Returns sorted by `sort_order`
- Includes all rubric definitions

#### `POST /api/programs/[id]/review-criteria`
- Creates new review criterion
- Auto-assigns `sort_order` if not provided
- Returns created criterion with 201 status

#### `PUT /api/programs/[id]/review-criteria`
- Bulk update for criteria (useful for reordering)
- Accepts array of criteria with updated sort orders
- Returns all updated criteria

#### Individual Criterion Operations:

#### `GET /api/programs/[id]/review-criteria/[criteriaId]`
- Fetches specific criterion details

#### `PUT /api/programs/[id]/review-criteria/[criteriaId]`
- Updates individual criterion
- Supports partial updates

#### `DELETE /api/programs/[id]/review-criteria/[criteriaId]`
- Deletes specific criterion

### 3. Review Templates

#### `GET /api/review-templates`
- Lists all available templates
- Supports filtering by:
  - `category` (workshop, conference, hackathon, etc.)
  - `is_active` (true/false)
- Returns sorted by name

#### `POST /api/review-templates`
- Creates new review template
- Automatically sets `created_by` to current user
- Returns created template with 201 status

#### `GET /api/review-templates/[templateId]`
- Fetches specific template with full criteria definition

#### `PUT /api/review-templates/[templateId]`
- Updates template configuration
- Supports partial updates

#### `DELETE /api/review-templates/[templateId]`
- Soft deletes template (sets `is_active` to false)
- Preserves template for historical reference

#### `POST /api/programs/[id]/apply-template`
- Applies a template to a program
- Creates all criteria from template
- Returns created criteria count and list
- Body: `{ templateId: "uuid" }`

### 4. Review Scoring

#### `GET /api/reviews/[reviewId]/scores`
- Fetches all scores for a review
- Includes criteria details
- Sorted by criteria order

#### `POST /api/reviews/[reviewId]/scores`
- Submits or updates review scores
- Supports bulk score submission
- Validates reviewer authorization
- Automatically:
  - Calculates weighted scores
  - Updates review status (in_progress/completed)
  - Updates application average score
- Body format:
```json
{
  "scores": [
    {
      "criteria_id": "uuid",
      "raw_score": 8.5,
      "rubric_level": "8-9",
      "score_rationale": "Strong technical background",
      "reviewer_confidence": 85
    }
  ]
}
```

#### `DELETE /api/reviews/[reviewId]/scores`
- Clears all scores for a review
- Resets review status to `not_started`
- Only allowed by assigned reviewer

### 5. Review Statistics

#### `GET /api/programs/[id]/review-stats`
- Comprehensive program review analytics
- Returns:
  - **Overview**: Total applications, reviews completed, average scores
  - **Rankings**: Applications ranked by weighted score
  - **Reviewer Workload**: Distribution of assignments per reviewer
- Uses database functions for efficient calculation

### 6. Reviewer Expertise

#### `GET /api/reviewers/[reviewerId]/expertise`
- Lists all expertise areas for a reviewer
- Sorted by proficiency level (highest first)

#### `POST /api/reviewers/[reviewerId]/expertise`
- Adds new expertise area
- Only allowed by admin or self
- Tracks specialization tags and experience

#### `PUT /api/reviewers/[reviewerId]/expertise`
- Updates expertise information
- Requires `expertiseId` in body
- Only allowed by admin or self

#### `DELETE /api/reviewers/[reviewerId]/expertise/[expertiseId]`
- Removes expertise entry
- Only allowed by admin or self

## Authentication & Authorization

All endpoints include:

1. **Authentication Check**:
   - Validates user session via Supabase Auth
   - Returns 401 if unauthorized

2. **Role-Based Access**:
   - Review settings/criteria: Program admin or creator
   - Templates: Authenticated users can view, admins can modify
   - Scoring: Only assigned reviewers
   - Expertise: Self or admin only

3. **Data Isolation**:
   - RLS policies enforce program-level access
   - Reviewers only see assigned reviews
   - No cross-program data leakage

## Error Handling

Consistent error response format:

```json
{
  "error": "Error message",
  "status": 400/401/403/404/500
}
```

Common status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (invalid data)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (authenticated but not authorized)
- `404`: Not Found
- `500`: Internal Server Error

## Usage Examples

### Creating Review Configuration for a Program

```javascript
// 1. Create review settings
const settings = await fetch('/api/programs/[id]/review-settings', {
  method: 'POST',
  body: JSON.stringify({
    min_reviews_per_application: 2,
    max_reviews_per_application: 3,
    scoring_method: 'weighted_average',
    blind_review: true,
    requires_consensus: true,
    consensus_threshold: 15,
    acceptance_threshold: 75,
    rejection_threshold: 40
  })
})

// 2. Apply a template OR create custom criteria
const template = await fetch('/api/programs/[id]/apply-template', {
  method: 'POST',
  body: JSON.stringify({
    templateId: 'template-uuid'
  })
})

// OR create custom criteria
const criterion = await fetch('/api/programs/[id]/review-criteria', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Technical Skills',
    description: 'Assessment of technical competency',
    scoring_type: 'numerical',
    weight: 1.5,
    max_score: 10,
    min_score: 0,
    is_required: true,
    rubric_definition: {
      '10': 'Exceptional',
      '8-9': 'Strong',
      '6-7': 'Good',
      '4-5': 'Basic',
      '2-3': 'Limited',
      '0-1': 'Insufficient'
    }
  })
})
```

### Submitting Review Scores

```javascript
const scores = await fetch('/api/reviews/[reviewId]/scores', {
  method: 'POST',
  body: JSON.stringify({
    scores: [
      {
        criteria_id: 'criteria-1',
        raw_score: 8,
        rubric_level: '8-9',
        score_rationale: 'Strong technical background with relevant experience',
        reviewer_confidence: 90
      },
      {
        criteria_id: 'criteria-2',
        raw_score: 7,
        rubric_level: '6-7',
        score_rationale: 'Good motivation, clear goals',
        reviewer_confidence: 85
      }
    ]
  })
})
```

### Getting Program Statistics

```javascript
const stats = await fetch('/api/programs/[id]/review-stats')
const data = await stats.json()

// data.overview: { total_applications, average_score, reviews_completed, ... }
// data.rankings: [{ application_id, average_score, rank }, ...]
// data.reviewerWorkload: [{ reviewer, total_assigned, completed }, ...]
```

## Performance Considerations

1. **Efficient Queries**:
   - Database functions handle complex calculations
   - Minimal N+1 query problems
   - Proper indexing on foreign keys

2. **Bulk Operations**:
   - Score submission supports multiple criteria at once
   - Criteria reordering uses bulk update
   - Template application creates all criteria in one operation

3. **Caching Opportunities**:
   - Templates are relatively static (good cache candidates)
   - Review settings change infrequently
   - Statistics can be cached with short TTL

## Security Features

1. **Input Validation**:
   - All endpoints validate required fields
   - Type checking on numeric values
   - Range validation for scores

2. **SQL Injection Prevention**:
   - Parameterized queries via Supabase client
   - No raw SQL construction

3. **Authorization Checks**:
   - Multi-level permission validation
   - Role verification before operations
   - Reviewer assignment validation

## Next Steps - Phase 3: Frontend Integration

Ready to implement:

1. **Review Settings UI**:
   - Tab in program edit page
   - Template selection dropdown
   - Criteria builder interface

2. **Reviewer Dashboard**:
   - Score submission forms
   - Rubric display
   - Progress tracking

3. **Analytics Dashboard**:
   - Review statistics visualization
   - Application rankings table
   - Reviewer workload charts

4. **Template Management**:
   - Admin interface for templates
   - Template preview
   - Template application wizard

## Testing Recommendations

1. **API Testing**:
   - Test authentication flows
   - Verify authorization boundaries
   - Test edge cases (empty data, invalid IDs)

2. **Integration Testing**:
   - Template application workflow
   - Score submission and calculation
   - Statistics generation

3. **Performance Testing**:
   - Load test with multiple concurrent reviewers
   - Test with large numbers of applications
   - Measure query performance

---

**Implementation Status**: ✅ **PHASE 2 COMPLETE**

All API endpoints are implemented and ready for frontend integration. The system provides comprehensive REST APIs for managing review configuration, scoring, and analytics.