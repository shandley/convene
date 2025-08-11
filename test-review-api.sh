#!/bin/bash

# Test Review System API Endpoints
# Usage: ./test-review-api.sh

API_URL="https://workshop-adminstration-site.vercel.app/api"
EMAIL="researcher@university.edu"
PASSWORD="researcher123"

echo "🔐 Testing Review System APIs..."
echo "================================"

# Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# For local testing, we don't need auth tokens with cookies
echo "✅ Login successful (using cookie auth)"

# Get programs
echo -e "\n2. Getting programs..."
PROGRAMS=$(curl -s $API_URL/programs \
  -H "Cookie: $(echo $LOGIN_RESPONSE | grep -o 'set-cookie: [^;]*' | sed 's/set-cookie: //')")
echo "$PROGRAMS" | jq '.data[0] | {id, title}'

# Extract first program ID
PROGRAM_ID=$(echo "$PROGRAMS" | jq -r '.data[0].id')
echo "Using Program ID: $PROGRAM_ID"

# Create/Update review settings
echo -e "\n3. Creating review settings..."
SETTINGS_RESPONSE=$(curl -s -X POST $API_URL/programs/$PROGRAM_ID/review-settings \
  -H "Content-Type: application/json" \
  -d '{
    "enable_scoring": true,
    "scoring_type": "weighted",
    "max_score": 100,
    "min_reviewers": 2,
    "max_reviewers": 5,
    "allow_comments": true,
    "allow_reviewer_reassignment": true,
    "blind_review": false,
    "show_scores_to_reviewers": true,
    "require_score_consensus": false,
    "auto_calculate_final_score": true
  }')
echo "$SETTINGS_RESPONSE" | jq '.data | {enable_scoring, scoring_type, max_score}'

# Get review templates
echo -e "\n4. Getting review templates..."
TEMPLATES=$(curl -s $API_URL/review-templates)
echo "$TEMPLATES" | jq '.data | length' | xargs -I {} echo "Found {} templates"

# Get first template ID
TEMPLATE_ID=$(echo "$TEMPLATES" | jq -r '.data[0].id')
TEMPLATE_NAME=$(echo "$TEMPLATES" | jq -r '.data[0].name')
echo "Using Template: $TEMPLATE_NAME (ID: $TEMPLATE_ID)"

# Apply template
echo -e "\n5. Applying template to program..."
APPLY_RESPONSE=$(curl -s -X POST $API_URL/programs/$PROGRAM_ID/apply-template \
  -H "Content-Type: application/json" \
  -d "{\"templateId\":\"$TEMPLATE_ID\"}")
echo "$APPLY_RESPONSE" | jq '{message, criteriaCreated}'

# Get review criteria
echo -e "\n6. Getting review criteria..."
CRITERIA=$(curl -s $API_URL/programs/$PROGRAM_ID/review-criteria)
echo "$CRITERIA" | jq '.data | length' | xargs -I {} echo "Program has {} review criteria"
echo "$CRITERIA" | jq '.data[:2] | .[] | {name, weight, max_score}'

# Add custom criterion
echo -e "\n7. Adding custom criterion..."
CUSTOM_CRITERION=$(curl -s -X POST $API_URL/programs/$PROGRAM_ID/review-criteria \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Criterion",
    "description": "Testing the review criteria API",
    "weight": 0.15,
    "max_score": 10,
    "scoring_type": "numeric",
    "is_required": true,
    "help_text": "Rate from 1-10"
  }')
echo "$CUSTOM_CRITERION" | jq '.data | {id, name, weight}'

# Get review stats (will be empty initially)
echo -e "\n8. Getting review statistics..."
STATS=$(curl -s $API_URL/programs/$PROGRAM_ID/review-stats)
echo "$STATS" | jq '.data | {total_reviews, average_score, completion_rate}'

echo -e "\n✅ All API tests completed successfully!"
echo "================================"
echo "Next steps:"
echo "1. Create an application for this program"
echo "2. Assign reviewers to the application"
echo "3. Submit review scores"
echo "4. Check updated statistics"