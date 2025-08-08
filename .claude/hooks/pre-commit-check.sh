#!/bin/bash

# Pre-Commit Validation Hook
# Runs checks before git commits to ensure code quality

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null)
ERRORS=0
WARNINGS=0
CHECKS_PASSED=0

# Function to print colored status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
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

# Check if we have staged files
if [ -z "$STAGED_FILES" ]; then
    print_info "No staged files to check"
    exit 0
fi

print_header "🔍 PRE-COMMIT VALIDATION"
print_info "Checking $(echo "$STAGED_FILES" | wc -l | xargs) staged files"

# Function to check TypeScript files
check_typescript() {
    local TS_FILES=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' || true)
    
    if [ -n "$TS_FILES" ]; then
        print_header "📘 TypeScript Validation"
        
        if [ -f "$PROJECT_DIR/tsconfig.json" ] && command -v npx &> /dev/null; then
            # Run type checking
            print_info "Running type check..."
            
            cd "$PROJECT_DIR"
            TYPE_CHECK_OUTPUT=$(npx tsc --noEmit 2>&1)
            TYPE_CHECK_EXIT=$?
            
            if [ $TYPE_CHECK_EXIT -eq 0 ]; then
                print_status "TypeScript: No type errors found"
            else
                ERROR_COUNT=$(echo "$TYPE_CHECK_OUTPUT" | grep -c "error TS" || echo 0)
                print_error "TypeScript: $ERROR_COUNT type errors found"
                
                # Show first 5 errors
                echo "$TYPE_CHECK_OUTPUT" | grep "error TS" | head -5 | while read -r line; do
                    echo "  └─ $line"
                done
                
                if [ $ERROR_COUNT -gt 5 ]; then
                    print_info "  ... and $((ERROR_COUNT - 5)) more errors"
                fi
            fi
        else
            print_warning "TypeScript config not found or npx not available"
        fi
    fi
}

# Function to check for console.log statements
check_console_logs() {
    local JS_FILES=$(echo "$STAGED_FILES" | grep -E '\.(js|jsx|ts|tsx)$' || true)
    
    if [ -n "$JS_FILES" ]; then
        print_header "🚫 Console.log Detection"
        
        CONSOLE_COUNT=0
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                COUNT=$(grep -c "console\.\(log\|error\|warn\|debug\)" "$file" 2>/dev/null || echo 0)
                if [ $COUNT -gt 0 ]; then
                    CONSOLE_COUNT=$((CONSOLE_COUNT + COUNT))
                    print_warning "Found $COUNT console statements in $file"
                fi
            fi
        done <<< "$JS_FILES"
        
        if [ $CONSOLE_COUNT -eq 0 ]; then
            print_status "No console statements found"
        else
            print_warning "Total console statements: $CONSOLE_COUNT"
            print_info "Consider using a proper logging library"
        fi
    fi
}

# Function to check for secrets and API keys
check_secrets() {
    print_header "🔐 Security Check"
    
    SECRETS_FOUND=0
    
    # Common patterns for secrets
    PATTERNS=(
        "api[_-]?key.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
        "secret.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
        "password.*=.*['\"][^'\"]{8,}['\"]"
        "token.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
        "PRIVATE_KEY"
        "AWS_SECRET"
        "DATABASE_URL.*postgres://"
    )
    
    for pattern in "${PATTERNS[@]}"; do
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                if grep -qiE "$pattern" "$file" 2>/dev/null; then
                    print_error "Potential secret found in $file"
                    SECRETS_FOUND=$((SECRETS_FOUND + 1))
                fi
            fi
        done <<< "$STAGED_FILES"
    done
    
    # Check for .env files
    if echo "$STAGED_FILES" | grep -qE "\.env($|\.)" ; then
        print_error ".env file is staged for commit!"
        SECRETS_FOUND=$((SECRETS_FOUND + 1))
    fi
    
    if [ $SECRETS_FOUND -eq 0 ]; then
        print_status "No secrets or API keys detected"
    else
        print_error "Found $SECRETS_FOUND potential security issues"
        print_info "Remove sensitive data before committing"
    fi
}

# Function to check Supabase migrations
check_migrations() {
    local MIGRATION_FILES=$(echo "$STAGED_FILES" | grep -E 'supabase/migrations/.*\.sql$' || true)
    
    if [ -n "$MIGRATION_FILES" ]; then
        print_header "🗄️ Migration Validation"
        
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                print_info "Checking migration: $(basename "$file")"
                
                # Check for dangerous operations
                if grep -qiE "(DROP\s+(TABLE|DATABASE|SCHEMA)|DELETE\s+FROM.*WHERE\s*;|TRUNCATE)" "$file"; then
                    print_error "Dangerous operation detected in $file"
                    print_info "  └─ Contains DROP, DELETE without WHERE, or TRUNCATE"
                fi
                
                # Check for missing IF EXISTS clauses
                if grep -qiE "CREATE\s+(TABLE|INDEX|FUNCTION)" "$file" && ! grep -qiE "IF\s+NOT\s+EXISTS" "$file"; then
                    print_warning "Migration may fail if objects exist: $file"
                    print_info "  └─ Consider adding IF NOT EXISTS clauses"
                fi
                
                # Check for RLS policies
                if grep -qiE "CREATE\s+TABLE" "$file" && ! grep -qiE "CREATE\s+POLICY" "$file"; then
                    print_warning "New table without RLS policies: $file"
                    print_info "  └─ Remember to add Row Level Security"
                fi
                
                # Basic SQL syntax check
                if ! grep -qE ";$" "$file"; then
                    print_error "Migration may have syntax error: $file"
                    print_info "  └─ Missing semicolon at end of file"
                fi
            fi
        done <<< "$MIGRATION_FILES"
        
        if [ $ERRORS -eq 0 ]; then
            print_status "Migrations validated successfully"
        fi
    fi
}

# Function to check linting
check_linting() {
    local JS_FILES=$(echo "$STAGED_FILES" | grep -E '\.(js|jsx|ts|tsx)$' || true)
    
    if [ -n "$JS_FILES" ] && [ -f "$PROJECT_DIR/.eslintrc.json" -o -f "$PROJECT_DIR/.eslintrc.js" ]; then
        print_header "🧹 ESLint Check"
        
        if command -v npx &> /dev/null; then
            cd "$PROJECT_DIR"
            
            # Run ESLint on staged files
            LINT_OUTPUT=$(echo "$JS_FILES" | xargs npx eslint --quiet 2>&1)
            LINT_EXIT=$?
            
            if [ $LINT_EXIT -eq 0 ]; then
                print_status "ESLint: No issues found"
            else
                LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c "error" || echo 0)
                LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -c "warning" || echo 0)
                
                if [ $LINT_ERRORS -gt 0 ]; then
                    print_error "ESLint: $LINT_ERRORS errors found"
                fi
                if [ $LINT_WARNINGS -gt 0 ]; then
                    print_warning "ESLint: $LINT_WARNINGS warnings found"
                fi
                
                print_info "Run 'npm run lint' to see details"
            fi
        else
            print_warning "npx not available for linting"
        fi
    fi
}

# Function to check CLAUDE.md updates
check_claude_md() {
    print_header "📝 Documentation Check"
    
    # Check if significant features were added but CLAUDE.md wasn't updated
    FEATURE_FILES=$(echo "$STAGED_FILES" | grep -E '(components|pages|app)/.*\.(tsx|ts)$' | wc -l | xargs)
    
    if [ $FEATURE_FILES -gt 5 ]; then
        if ! echo "$STAGED_FILES" | grep -q "CLAUDE.md"; then
            print_warning "Major changes detected but CLAUDE.md not updated"
            print_info "Consider updating project documentation"
        else
            print_status "CLAUDE.md is being updated"
        fi
    else
        print_status "Documentation check passed"
    fi
}

# Function to check file sizes
check_file_sizes() {
    print_header "📦 File Size Check"
    
    LARGE_FILES=0
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            FILE_SIZE=$(wc -c < "$file" | xargs)
            # Check if file is larger than 100KB
            if [ $FILE_SIZE -gt 102400 ]; then
                FILE_SIZE_KB=$((FILE_SIZE / 1024))
                print_warning "Large file: $file (${FILE_SIZE_KB}KB)"
                LARGE_FILES=$((LARGE_FILES + 1))
                
                # Extra warning for very large files (>1MB)
                if [ $FILE_SIZE -gt 1048576 ]; then
                    FILE_SIZE_MB=$((FILE_SIZE / 1048576))
                    print_error "Very large file: $file (${FILE_SIZE_MB}MB)"
                fi
            fi
        fi
    done <<< "$STAGED_FILES"
    
    if [ $LARGE_FILES -eq 0 ]; then
        print_status "All files are reasonable size"
    else
        print_info "Consider using Git LFS for large files"
    fi
}

# Function to check package.json changes
check_package_json() {
    if echo "$STAGED_FILES" | grep -q "package.json"; then
        print_header "📦 Package.json Validation"
        
        if [ -f "$PROJECT_DIR/package.json" ]; then
            # Check if package-lock.json is also staged
            if ! echo "$STAGED_FILES" | grep -q "package-lock.json"; then
                print_warning "package.json changed but package-lock.json not staged"
                print_info "Run 'npm install' and stage package-lock.json"
            else
                print_status "Package files synchronized"
            fi
            
            # Check for missing dependencies in package.json
            if command -v node &> /dev/null; then
                cd "$PROJECT_DIR"
                NODE_CHECK=$(node -e "const p=require('./package.json'); process.exit((!p.dependencies && !p.devDependencies) ? 1 : 0)" 2>&1)
                if [ $? -ne 0 ]; then
                    print_warning "package.json may be missing dependencies section"
                fi
            fi
        fi
    fi
}

# Run all checks
check_typescript
check_console_logs
check_secrets
check_migrations
check_linting
check_claude_md
check_file_sizes
check_package_json

# Final summary
print_header "📊 Validation Summary"

TOTAL_CHECKS=$((CHECKS_PASSED + WARNINGS + ERRORS))
print_info "Total checks performed: $TOTAL_CHECKS"
print_status "Passed: $CHECKS_PASSED"

if [ $WARNINGS -gt 0 ]; then
    print_warning "Warnings: $WARNINGS"
fi

if [ $ERRORS -gt 0 ]; then
    print_error "Errors: $ERRORS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_error "Commit blocked due to validation errors"
    print_info "Fix the errors above and try again"
    exit 1
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status "All validation checks passed!"
    print_info "Commit can proceed"
    exit 0
fi