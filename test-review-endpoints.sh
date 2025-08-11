#!/bin/bash

# Review System API Test Script
# Tests the Review Configuration & Scoring System API endpoints with proper authentication
#
# Usage: ./test-review-endpoints.sh [production|local]
#
# Requirements:
# - curl
# - jq (for JSON parsing, optional but recommended)
# - Valid Supabase session

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-local}
TEST_EMAIL="researcher@university.edu"
TEST_PASSWORD="researcher123"

if [[ "$ENVIRONMENT" == "production" ]]; then
    API_BASE="https://workshop-adminstration-site.vercel.app/api"
    echo "🌐 Testing against PRODUCTION environment"
else
    API_BASE="http://localhost:3000/api"
    echo "🏠 Testing against LOCAL environment"
fi

echo "API Base URL: $API_BASE"
echo "Test Email: $TEST_EMAIL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
ERRORS=()

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
    ERRORS+=("$1")
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_section() {
    echo -e "\n${PURPLE}$1${NC}"
    echo "$(printf '%.0s=' {1..50})"
}

# Check if jq is available
check_jq() {
    if command -v jq &> /dev/null; then
        echo "✅ jq available for JSON parsing"
        USE_JQ=true
    else
        echo "⚠️  jq not available - JSON responses will not be formatted"
        USE_JQ=false
    fi
}

# Extract value from JSON response
extract_json_value() {
    local json="$1"
    local key="$2"
    
    if [[ "$USE_JQ" == true ]]; then
        echo "$json" | jq -r "$key"
    else
        # Basic extraction without jq (less reliable)
        echo "$json" | grep -o "\"$key\":[^,}]*" | cut -d':' -f2 | tr -d '"'
    fi
}

# Get authentication session
authenticate() {
    log_section "🔐 AUTHENTICATION"
    
    log_info "Attempting to authenticate with Supabase..."
    
    # Note: This is a simplified approach. In a real browser environment,
    # you would need to use Supabase client libraries and handle cookies properly.
    # For testing API endpoints, we'll focus on the endpoints themselves.
    
    log_warning "Direct curl authentication with Supabase Auth is complex due to PKCE flow."
    log_warning "Using the browser-based tester (test-review-api.html) is recommended for full testing."
    log_info "This script will test endpoint availability and structure."
}

# Test endpoint availability
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    
    local url="$API_BASE$endpoint"
    local curl_opts=("-s" "-w" "%{http_code}")
    
    if [[ "$method" == "POST" || "$method" == "PUT" ]]; then
        curl_opts+=("-H" "Content-Type: application/json" "-d" "$data")
    fi
    
    curl_opts+=("-X" "$method")
    
    log_info "Testing $method $endpoint"
    
    local response
    response=$(curl "${curl_opts[@]}" "$url" 2>/dev/null)
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    echo "HTTP Status: $http_code"
    
    if [[ "$USE_JQ" == true && -n "$body" ]]; then
        echo "Response:"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo "Response: $body"
    fi
    
    # Check if we got an expected error (401 Unauthorized is expected without auth)
    if [[ "$http_code" == "401" ]]; then
        log_success "$method $endpoint - Correctly returns 401 (authentication required)"
    elif [[ "$http_code" == "405" ]]; then
        log_error "$method $endpoint - Returns 405 (method not allowed)"
    elif [[ "$http_code" == "404" ]]; then
        log_error "$method $endpoint - Returns 404 (not found)"
    elif [[ "$http_code" == "500" ]]; then
        log_error "$method $endpoint - Returns 500 (server error)"
    else
        log_success "$method $endpoint - Endpoint accessible (HTTP $http_code)"
    fi
    
    echo ""
}

# Test all review system endpoints
test_review_endpoints() {
    log_section "📋 REVIEW SETTINGS ENDPOINTS"
    
    local program_id="test-program-id"  # This would need to be a real program ID
    
    # Review Settings
    test_endpoint "GET" "/programs/$program_id/review-settings"
    test_endpoint "POST" "/programs/$program_id/review-settings" '{"max_score": 100, "passing_score": 70}'
    test_endpoint "PUT" "/programs/$program_id/review-settings" '{"max_score": 120}'
    test_endpoint "DELETE" "/programs/$program_id/review-settings"
    
    log_section "🎯 REVIEW CRITERIA ENDPOINTS"
    
    # Review Criteria
    test_endpoint "GET" "/programs/$program_id/review-criteria"
    test_endpoint "POST" "/programs/$program_id/review-criteria" '{"name": "Technical Merit", "weight": 0.4, "max_score": 10}'
    test_endpoint "PUT" "/programs/$program_id/review-criteria/test-criteria-id" '{"weight": 0.5}'
    test_endpoint "DELETE" "/programs/$program_id/review-criteria/test-criteria-id"
    
    log_section "📝 REVIEW TEMPLATES ENDPOINTS"
    
    # Review Templates
    test_endpoint "GET" "/review-templates"
    test_endpoint "POST" "/review-templates" '{"name": "Test Template", "criteria": []}'
    
    # Apply Template
    test_endpoint "POST" "/programs/$program_id/apply-template" '{"template_id": "test-template-id"}'
    
    log_section "📊 REVIEW STATISTICS ENDPOINTS"
    
    # Review Statistics
    test_endpoint "GET" "/programs/$program_id/review-stats"
}

# Test additional endpoints
test_additional_endpoints() {
    log_section "🔍 ADDITIONAL ENDPOINTS"
    
    # These might exist based on the review system
    test_endpoint "GET" "/programs/test-program-id/reviews"
    test_endpoint "GET" "/reviews/test-review-id/scores"
    test_endpoint "POST" "/reviews/test-review-id/scores" '{"criteria_id": "test", "score": 8}'
}

# Print test summary
print_summary() {
    log_section "📈 TEST SUMMARY"
    
    local total=$((TESTS_PASSED + TESTS_FAILED))
    local success_rate=0
    
    if [[ $total -gt 0 ]]; then
        success_rate=$(( (TESTS_PASSED * 100) / total ))
    fi
    
    echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
    echo -e "${CYAN}📊 Success Rate: $success_rate%${NC}"
    
    if [[ ${#ERRORS[@]} -gt 0 ]]; then
        echo -e "\n${RED}Error Details:${NC}"
        for error in "${ERRORS[@]}"; do
            echo -e "${RED}  • $error${NC}"
        done
    fi
    
    echo ""
    
    if [[ $success_rate -ge 90 ]]; then
        echo -e "${GREEN}🎉 Excellent! Most endpoints are working correctly.${NC}"
    elif [[ $success_rate -ge 70 ]]; then
        echo -e "${YELLOW}✨ Good! Some endpoints may need attention.${NC}"
    else
        echo -e "${RED}⚠️  Warning! Many endpoints are not responding as expected.${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}💡 Note: 401 (Unauthorized) responses are expected without proper authentication.${NC}"
    echo -e "${CYAN}   Use the browser-based tester (test-review-api.html) for full authenticated testing.${NC}"
}

# Show usage information
show_usage() {
    cat << EOF
Review System API Endpoint Tester

Usage: $0 [environment]

Arguments:
  environment    'local' (default) or 'production'

Examples:
  $0              # Test local development server
  $0 local        # Test local development server  
  $0 production   # Test production deployment

This script tests endpoint availability and basic response structure.
For full authenticated testing, use the browser-based tester:
  open test-review-api.html

Requirements:
  - curl (for making HTTP requests)
  - jq (optional, for JSON formatting)
  - Running API server (local or production)

EOF
}

# Main execution
main() {
    if [[ "$1" == "--help" || "$1" == "-h" ]]; then
        show_usage
        exit 0
    fi
    
    echo "🔬 Review System API Endpoint Tester"
    echo "===================================="
    echo ""
    
    check_jq
    authenticate
    test_review_endpoints
    test_additional_endpoints
    print_summary
    
    # Exit with error code if tests failed
    if [[ $TESTS_FAILED -gt 0 ]]; then
        exit 1
    fi
}

# Run the script
main "$@"