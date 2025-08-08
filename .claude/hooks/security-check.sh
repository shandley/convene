#!/bin/bash

# Security Scan Hook
# Scans for security vulnerabilities and compliance issues

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
SECURITY_LOG="$PROJECT_DIR/.claude/security-scan.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILES_TO_SCAN="${1:-}"
ERRORS=0
WARNINGS=0
PASSED=0

# Function to print colored status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_header() {
    echo -e "\n${BOLD}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Initialize security log
echo "Security Scan - $(date '+%Y-%m-%d %H:%M:%S')" > "$SECURITY_LOG"
echo "================================================" >> "$SECURITY_LOG"

print_header "🔐 SECURITY SCAN"
print_info "Scanning project for security vulnerabilities"

# Function to scan for hardcoded credentials
scan_credentials() {
    print_header "🔑 Scanning for Hardcoded Credentials"
    
    CRED_FOUND=0
    
    # Define patterns to search for
    declare -a PATTERNS=(
        "api[_-]?key.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
        "secret.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
        "password.*=.*['\"][^'\"]{8,}['\"]"
        "token.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
        "private[_-]?key.*=.*['\"]"
        "AWS_SECRET_ACCESS_KEY"
        "GITHUB_TOKEN"
        "OPENAI_API_KEY"
        "DATABASE_URL.*postgres://"
        "mongodb\+srv://"
        "mysql://.*:.*@"
    )
    
    # Files to scan (exclude common safe patterns)
    FILES=$(find "$PROJECT_DIR" -type f \
        \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \
           -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/.next/*" \
        -not -path "*/dist/*" \
        -not -name "package-lock.json" \
        2>/dev/null)
    
    for pattern in "${PATTERNS[@]}"; do
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                if grep -qE "$pattern" "$file" 2>/dev/null; then
                    # Check if it's in .env.example (which is safe)
                    if [[ "$file" != *".env.example"* ]] && [[ "$file" != *".env.sample"* ]]; then
                        print_error "Potential credential in: $(basename "$file")"
                        echo "  └─ Pattern: $pattern" >> "$SECURITY_LOG"
                        CRED_FOUND=$((CRED_FOUND + 1))
                    fi
                fi
            fi
        done <<< "$FILES"
    done
    
    # Check for .env files in repository
    if [ -f "$PROJECT_DIR/.env" ]; then
        if [ -f "$PROJECT_DIR/.gitignore" ]; then
            if ! grep -q "^\.env$" "$PROJECT_DIR/.gitignore"; then
                print_error ".env file not in .gitignore!"
                CRED_FOUND=$((CRED_FOUND + 1))
            fi
        fi
    fi
    
    if [ $CRED_FOUND -eq 0 ]; then
        print_status "No hardcoded credentials detected"
    else
        print_error "Found $CRED_FOUND potential credential issues"
        print_info "Move credentials to environment variables"
    fi
}

# Function to check RLS policies
check_rls_policies() {
    print_header "🛡️ Checking Row Level Security (RLS)"
    
    if [ -d "$PROJECT_DIR/supabase/migrations" ]; then
        # Count tables and policies
        TABLES=$(grep -h "CREATE TABLE" "$PROJECT_DIR/supabase/migrations"/*.sql 2>/dev/null | wc -l | xargs)
        POLICIES=$(grep -h "CREATE POLICY" "$PROJECT_DIR/supabase/migrations"/*.sql 2>/dev/null | wc -l | xargs)
        RLS_ENABLES=$(grep -h "ALTER TABLE.*ENABLE ROW LEVEL SECURITY" "$PROJECT_DIR/supabase/migrations"/*.sql 2>/dev/null | wc -l | xargs)
        
        print_info "Tables found: $TABLES"
        print_info "RLS policies found: $POLICIES"
        print_info "Tables with RLS enabled: $RLS_ENABLES"
        
        if [ $TABLES -gt 0 ] && [ $POLICIES -eq 0 ]; then
            print_error "No RLS policies found for $TABLES tables!"
            print_info "Add RLS policies to protect data access"
        elif [ $TABLES -gt $RLS_ENABLES ]; then
            print_warning "Not all tables have RLS enabled"
            print_info "Tables: $TABLES, RLS enabled: $RLS_ENABLES"
        else
            print_status "RLS policies configured"
        fi
        
        # Check for overly permissive policies
        if grep -qE "CREATE POLICY.*FOR ALL.*TO (public|anon)" "$PROJECT_DIR/supabase/migrations"/*.sql 2>/dev/null; then
            print_warning "Found potentially permissive RLS policies (public/anon FOR ALL)"
            print_info "Review policies for appropriate restrictions"
        fi
    else
        print_info "No Supabase migrations found to check"
    fi
}

# Function to check API route protection
check_api_routes() {
    print_header "🌐 Checking API Route Protection"
    
    API_ISSUES=0
    
    # Check Next.js API routes
    if [ -d "$PROJECT_DIR/app/api" ]; then
        API_FILES=$(find "$PROJECT_DIR/app/api" -name "route.ts" -o -name "route.tsx" 2>/dev/null)
        
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                # Check for auth checks
                if ! grep -qE "(getSession|auth|authorized|requireAuth|middleware)" "$file"; then
                    print_warning "Potentially unprotected API route: $(basename "$(dirname "$file")")"
                    API_ISSUES=$((API_ISSUES + 1))
                fi
                
                # Check for rate limiting
                if ! grep -qE "(rateLimit|throttle|limiter)" "$file"; then
                    # Only warn for certain endpoints
                    if grep -qE "(POST|PUT|DELETE)" "$file"; then
                        print_info "No rate limiting detected in: $(basename "$(dirname "$file")")"
                    fi
                fi
            fi
        done <<< "$API_FILES"
    fi
    
    # Check for middleware.ts
    if [ ! -f "$PROJECT_DIR/middleware.ts" ] && [ ! -f "$PROJECT_DIR/src/middleware.ts" ]; then
        print_warning "No middleware.ts found for route protection"
        print_info "Consider adding middleware for authentication"
    else
        print_status "Middleware configuration found"
    fi
    
    if [ $API_ISSUES -eq 0 ]; then
        print_status "API routes appear protected"
    else
        print_warning "Found $API_ISSUES potentially unprotected routes"
    fi
}

# Function to check for SQL injection vulnerabilities
check_sql_injection() {
    print_header "💉 Checking for SQL Injection Risks"
    
    SQL_ISSUES=0
    
    # Check for string concatenation in SQL queries
    FILES=$(find "$PROJECT_DIR" -type f \
        \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/.next/*" \
        2>/dev/null)
    
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Check for dangerous SQL patterns
            if grep -qE "(query|execute|sql).*\+.*[\$\{]" "$file" 2>/dev/null || grep -qE "\`.*SELECT.*\\\$\{.*\}\`" "$file" 2>/dev/null; then
                print_error "Potential SQL injection risk in: $(basename "$file")"
                print_info "  └─ Use parameterized queries instead"
                SQL_ISSUES=$((SQL_ISSUES + 1))
            fi
        fi
    done <<< "$FILES"
    
    if [ $SQL_ISSUES -eq 0 ]; then
        print_status "No SQL injection risks detected"
    else
        print_error "Found $SQL_ISSUES potential SQL injection risks"
    fi
}

# Function to check CORS settings
check_cors() {
    print_header "🌍 Checking CORS Configuration"
    
    CORS_FOUND=false
    
    # Check for CORS configuration
    if grep -r "cors" "$PROJECT_DIR" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules > /dev/null 2>&1; then
        CORS_FOUND=true
        
        # Check for wildcard origins
        if grep -r "origin.*\*" "$PROJECT_DIR" --include="*.ts" --include="*.js" --exclude-dir=node_modules > /dev/null 2>&1; then
            print_warning "Wildcard CORS origin (*) detected"
            print_info "Consider restricting to specific domains"
        else
            print_status "CORS configuration found (no wildcards)"
        fi
    else
        print_info "No explicit CORS configuration found"
        print_info "Next.js handles CORS by default for API routes"
    fi
}

# Function to check environment variables
check_env_vars() {
    print_header "🔒 Checking Environment Variables"
    
    # Check if .env.local exists
    if [ -f "$PROJECT_DIR/.env.local" ]; then
        print_status ".env.local file exists"
        
        # Check for required Supabase vars
        REQUIRED_VARS=(
            "NEXT_PUBLIC_SUPABASE_URL"
            "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        )
        
        for var in "${REQUIRED_VARS[@]}"; do
            if ! grep -q "^$var=" "$PROJECT_DIR/.env.local"; then
                print_warning "Missing required env var: $var"
            fi
        done
        
        # Warn about service role key in client code
        if grep -r "SUPABASE_SERVICE_ROLE_KEY" "$PROJECT_DIR/app" "$PROJECT_DIR/components" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "server"; then
            print_error "Service role key used in client components!"
            print_info "Use service role only in server components"
        fi
    else
        print_warning ".env.local not found"
        print_info "Create .env.local with required variables"
    fi
    
    # Check .env.example
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        print_status ".env.example exists for reference"
    else
        print_info "Consider creating .env.example for documentation"
    fi
}

# Function to check dependencies for vulnerabilities
check_dependencies() {
    print_header "📦 Checking Dependencies"
    
    if [ -f "$PROJECT_DIR/package.json" ] && command -v npm &> /dev/null; then
        cd "$PROJECT_DIR"
        
        print_info "Running npm audit..."
        
        # Run npm audit
        AUDIT_OUTPUT=$(npm audit --json 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            # Parse vulnerabilities count
            VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
            
            if [ -n "$VULNS" ] && [ "$VULNS" -gt 0 ]; then
                HIGH=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | head -1 | cut -d: -f2)
                CRITICAL=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | head -1 | cut -d: -f2)
                
                if [ -n "$CRITICAL" ] && [ "$CRITICAL" -gt 0 ]; then
                    print_error "Critical vulnerabilities: $CRITICAL"
                fi
                if [ -n "$HIGH" ] && [ "$HIGH" -gt 0 ]; then
                    print_warning "High vulnerabilities: $HIGH"
                fi
                
                print_info "Run 'npm audit fix' to resolve"
            else
                print_status "No known vulnerabilities in dependencies"
            fi
        else
            print_warning "npm audit failed - check manually"
        fi
    else
        print_info "Skipping dependency audit (npm not available)"
    fi
}

# Function to check authentication implementation
check_authentication() {
    print_header "🔐 Checking Authentication Implementation"
    
    AUTH_SCORE=0
    
    # Check for auth provider
    if find "$PROJECT_DIR" -name "*.tsx" -o -name "*.ts" | xargs grep -l "createClient.*supabase" > /dev/null 2>&1; then
        print_status "Supabase auth client detected"
        AUTH_SCORE=$((AUTH_SCORE + 1))
    fi
    
    # Check for session management
    if grep -r "getSession\|useSession\|getUser" "$PROJECT_DIR" --include="*.tsx" --include="*.ts" --exclude-dir=node_modules > /dev/null 2>&1; then
        print_status "Session management implemented"
        AUTH_SCORE=$((AUTH_SCORE + 1))
    fi
    
    # Check for protected routes
    if grep -r "redirect\|authorized\|requireAuth" "$PROJECT_DIR/app" --include="*.tsx" --include="*.ts" > /dev/null 2>&1; then
        print_status "Protected routes detected"
        AUTH_SCORE=$((AUTH_SCORE + 1))
    else
        print_warning "No clear route protection found"
    fi
    
    # Check for password hashing (should not be in client)
    if grep -r "bcrypt\|argon2\|pbkdf2" "$PROJECT_DIR" --include="*.tsx" --include="*.ts" --exclude-dir=node_modules > /dev/null 2>&1; then
        print_info "Password hashing library detected"
        print_info "Ensure it's only used server-side"
    fi
    
    if [ $AUTH_SCORE -ge 2 ]; then
        print_status "Authentication appears properly implemented"
    else
        print_warning "Authentication implementation may be incomplete"
    fi
}

# Function to generate security report
generate_report() {
    print_header "📊 Security Report"
    
    TOTAL_CHECKS=$((PASSED + WARNINGS + ERRORS))
    
    # Calculate security score
    if [ $TOTAL_CHECKS -gt 0 ]; then
        SCORE=$((PASSED * 100 / TOTAL_CHECKS))
    else
        SCORE=0
    fi
    
    print_info "Security Score: ${SCORE}%"
    print_status "Passed: $PASSED checks"
    
    if [ $WARNINGS -gt 0 ]; then
        print_warning "Warnings: $WARNINGS"
    fi
    
    if [ $ERRORS -gt 0 ]; then
        print_error "Critical Issues: $ERRORS"
    fi
    
    # Save detailed report
    cat >> "$SECURITY_LOG" << EOF

## Summary
- Total Checks: $TOTAL_CHECKS
- Passed: $PASSED
- Warnings: $WARNINGS
- Errors: $ERRORS
- Security Score: ${SCORE}%

## Recommendations
EOF
    
    if [ $ERRORS -gt 0 ]; then
        echo "1. Address critical security issues immediately" >> "$SECURITY_LOG"
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo "2. Review and fix security warnings" >> "$SECURITY_LOG"
    fi
    
    echo "3. Run security scans regularly (weekly recommended)" >> "$SECURITY_LOG"
    echo "4. Keep dependencies updated with npm audit" >> "$SECURITY_LOG"
    
    print_info "Full report saved to: .claude/security-scan.log"
}

# Main execution
if [ -n "$FILES_TO_SCAN" ]; then
    print_info "Scanning specific files: $FILES_TO_SCAN"
else
    print_info "Scanning entire project"
fi

# Run security checks
scan_credentials
check_rls_policies
check_api_routes
check_sql_injection
check_cors
check_env_vars
check_dependencies
check_authentication

# Generate report
generate_report

# Final decision
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -gt 0 ]; then
    print_error "Security scan failed - critical issues found!"
    print_info "Review the security log for details"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    print_warning "Security scan completed with warnings"
    print_info "Consider addressing the warnings"
    exit 0
else
    print_status "Security scan passed - no issues found!"
    exit 0
fi