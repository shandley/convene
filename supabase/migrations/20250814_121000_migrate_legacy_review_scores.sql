-- Migrate Legacy Review Scores to Structured Format
-- Created: 2025-08-14
-- This migration converts existing legacy JSONB scores to the new structured review_scores table

-- Insert structured scores from legacy reviews
INSERT INTO review_scores (
  review_id,
  criteria_id,
  raw_score,
  normalized_score,
  weight_applied,
  weighted_score,
  score_rationale,
  reviewer_confidence
)
SELECT 
  r.id as review_id,
  rc.id as criteria_id,
  CASE 
    WHEN rc.name = 'Technical Background' THEN COALESCE((r.criteria_scores->'technical_background')::numeric, 5)
    WHEN rc.name = 'Motivation and Goals' THEN COALESCE((r.criteria_scores->'motivation')::numeric, 4)
    WHEN rc.name = 'Learning Impact Potential' THEN COALESCE(
      (r.criteria_scores->'research_potential')::numeric,
      (r.criteria_scores->'fit_for_program')::numeric,
      4
    )
    WHEN rc.name = 'Communication Skills' THEN COALESCE((r.criteria_scores->'communication')::numeric, 4)
    ELSE 5
  END as raw_score,
  -- Normalize to 0-100 scale
  CASE 
    WHEN rc.name = 'Technical Background' THEN (COALESCE((r.criteria_scores->'technical_background')::numeric, 5) / 10.0 * 100)
    WHEN rc.name = 'Motivation and Goals' THEN (COALESCE((r.criteria_scores->'motivation')::numeric, 4) / 10.0 * 100)
    WHEN rc.name = 'Learning Impact Potential' THEN (COALESCE(
      (r.criteria_scores->'research_potential')::numeric,
      (r.criteria_scores->'fit_for_program')::numeric,
      4
    ) / 10.0 * 100)
    WHEN rc.name = 'Communication Skills' THEN (COALESCE((r.criteria_scores->'communication')::numeric, 4) / 10.0 * 100)
    ELSE 50
  END as normalized_score,
  rc.weight,
  -- Calculate weighted score (capped at 99.99 to avoid overflow)
  LEAST(
    CASE 
      WHEN rc.name = 'Technical Background' THEN (COALESCE((r.criteria_scores->'technical_background')::numeric, 5) / 10.0 * 100 * rc.weight)
      WHEN rc.name = 'Motivation and Goals' THEN (COALESCE((r.criteria_scores->'motivation')::numeric, 4) / 10.0 * 100 * rc.weight)
      WHEN rc.name = 'Learning Impact Potential' THEN (COALESCE(
        (r.criteria_scores->'research_potential')::numeric,
        (r.criteria_scores->'fit_for_program')::numeric,
        4
      ) / 10.0 * 100 * rc.weight)
      WHEN rc.name = 'Communication Skills' THEN (COALESCE((r.criteria_scores->'communication')::numeric, 4) / 10.0 * 100 * rc.weight)
      ELSE 50 * rc.weight
    END,
    99.99  -- Cap at 99.99 to prevent numeric overflow
  ) as weighted_score,
  'Migrated from legacy scoring system' as score_rationale,
  0.8 as reviewer_confidence
FROM reviews r
JOIN review_assignments ra ON r.assignment_id = ra.id
JOIN applications a ON ra.application_id = a.id
JOIN review_criteria rc ON rc.program_id = a.program_id
WHERE r.criteria_scores IS NOT NULL
  AND a.program_id = '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'
  AND rc.program_id = '547a66aa-87ec-4e01-83a5-d43d3a5edc5e'
ON CONFLICT (review_id, criteria_id) DO NOTHING;

-- Update the review assignments to reflect completion status
UPDATE review_assignments ra
SET 
  status = 'completed',
  completed_at = COALESCE(completed_at, NOW())
FROM reviews r
WHERE ra.id = r.assignment_id
  AND r.criteria_scores IS NOT NULL
  AND ra.status != 'completed';

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
  scores_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT review_id) INTO migrated_count
  FROM review_scores
  WHERE score_rationale LIKE 'Migrated from%';
  
  SELECT COUNT(*) INTO scores_count
  FROM review_scores
  WHERE score_rationale LIKE 'Migrated from%';
  
  RAISE NOTICE 'Successfully migrated % legacy reviews with % total scores to structured format', migrated_count, scores_count;
END $$;