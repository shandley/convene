#\!/bin/bash

# List of files to fix
files=(
  "app/api/reviewers/[reviewerId]/expertise/route.ts"
  "app/api/programs/[id]/review-criteria/route.ts"
  "app/api/programs/[id]/review-criteria/[criteriaId]/route.ts"
  "app/api/programs/[id]/review-stats/route.ts"
  "app/api/programs/[id]/review-settings/route.ts"
  "app/api/review-templates/[templateId]/route.ts"
  "app/api/reviews/[reviewId]/scores/route.ts"
)

for file in "${files[@]}"; do
  echo "Fixing $file..."
  
  # Fix the parameter type to Promise
  sed -i '' 's/{ params }: { params: { \([^}]*\) } }/{ params }: { params: Promise<{ \1 }> }/g' "$file"
  
  # Fix the parameter destructuring
  if [[ "$file" == *"[reviewerId]"* ]]; then
    sed -i '' 's/const { reviewerId } = params/const { reviewerId } = await params/g' "$file"
  elif [[ "$file" == *"[id]"* ]] && [[ "$file" == *"[criteriaId]"* ]]; then
    sed -i '' 's/const { id, criteriaId } = params/const { id, criteriaId } = await params/g' "$file"
  elif [[ "$file" == *"[id]"* ]]; then
    sed -i '' 's/const { id } = params/const { id } = await params/g' "$file"
    sed -i '' 's/const programId = params\.id/const { id: programId } = await params/g' "$file"
  elif [[ "$file" == *"[templateId]"* ]]; then
    sed -i '' 's/const { templateId } = params/const { templateId } = await params/g' "$file"
  elif [[ "$file" == *"[reviewId]"* ]]; then
    sed -i '' 's/const { reviewId } = params/const { reviewId } = await params/g' "$file"
  fi
done

echo "All files fixed\!"
