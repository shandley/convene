#!/bin/bash

# Error Recovery Hook
# Triggers on critical errors to save work and provide diagnostics

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ERROR_MSG="${1:-Unknown error}"
ERROR_CODE="${2:-1}"
RECOVERY_DIR="$PROJECT_DIR/.claude/recovery"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RECOVERY_FILE="$RECOVERY_DIR/recovery_${TIMESTAMP}.md"

# Function to print colored status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1" >&2
}

print_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1" >&2
}

print_header() {
    echo -e "\n${BOLD}$1${NC}" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
}

# Create recovery directory
mkdir -p "$RECOVERY_DIR"

print_header "🚨 ERROR RECOVERY HOOK ACTIVATED"
print_error "Error detected: $ERROR_MSG"
print_info "Error code: $ERROR_CODE"

# Function to save current work state
save_work_state() {
    print_header "💾 Saving Work State"
    
    # Create recovery file
    cat > "$RECOVERY_FILE" << EOF
# Error Recovery Report
**Timestamp**: $(date '+%Y-%m-%d %H:%M:%S')
**Error**: $ERROR_MSG
**Error Code**: $ERROR_CODE

## Environment
- Working Directory: $PROJECT_DIR
- User: $(whoami)
- Shell: $SHELL
- Node Version: $(node --version 2>/dev/null || echo "N/A")
- NPM Version: $(npm --version 2>/dev/null || echo "N/A")

## Git Status at Error
\`\`\`
$(git status --short 2>/dev/null || echo "Not a git repository")
\`\`\`

## Recent Git Commits
\`\`\`
$(git log --oneline -5 2>/dev/null || echo "No commits available")
\`\`\`

## Modified Files (Last 10)
\`\`\`
$(find "$PROJECT_DIR" -type f -mmin -60 -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" 2>/dev/null | head -10 | sed "s|$PROJECT_DIR/||g")
\`\`\`

## Open Ports
\`\`\`
$(lsof -i -P -n | grep LISTEN | grep -E ':(3000|8005|5432)' 2>/dev/null || echo "No relevant ports detected")
\`\`\`

## Recovery Actions Taken
EOF
    
    print_status "Recovery file created: recovery_${TIMESTAMP}.md"
}

# Function to check and recover database state
check_database_recovery() {
    print_header "🗄️ Database Recovery Check"
    
    # Check if Supabase is accessible
    if command -v supabase &> /dev/null; then
        # Check Supabase status
        SUPABASE_STATUS=$(cd "$PROJECT_DIR" && supabase status 2>&1 | head -5)
        if [ $? -eq 0 ]; then
            print_status "Supabase connection active"
            echo "- ✓ Supabase connection verified" >> "$RECOVERY_FILE"
        else
            print_warning "Supabase connection issues detected"
            echo "- ⚠ Supabase connection failed" >> "$RECOVERY_FILE"
            
            # Attempt to restart Supabase
            print_info "Attempting to restart Supabase..."
            cd "$PROJECT_DIR" && supabase start > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                print_status "Supabase restarted successfully"
                echo "- ✓ Supabase restarted" >> "$RECOVERY_FILE"
            fi
        fi
    fi
}

# Function to save uncommitted changes
save_uncommitted_changes() {
    print_header "📦 Saving Uncommitted Changes"
    
    if command -v git &> /dev/null && [ -d "$PROJECT_DIR/.git" ]; then
        # Check for uncommitted changes
        if ! git diff --quiet || ! git diff --cached --quiet; then
            # Create a WIP stash
            STASH_MSG="WIP: Error recovery $(date '+%Y-%m-%d %H:%M:%S')"
            git stash push -m "$STASH_MSG" > /dev/null 2>&1
            
            if [ $? -eq 0 ]; then
                print_status "Changes stashed: '$STASH_MSG'"
                echo "- ✓ Uncommitted changes stashed" >> "$RECOVERY_FILE"
                echo "  Restore with: git stash pop" >> "$RECOVERY_FILE"
            else
                print_warning "Could not stash changes"
                # Try to create a patch file instead
                git diff > "$RECOVERY_DIR/uncommitted_${TIMESTAMP}.patch"
                print_info "Patch file created: uncommitted_${TIMESTAMP}.patch"
                echo "- ℹ Patch file created: uncommitted_${TIMESTAMP}.patch" >> "$RECOVERY_FILE"
            fi
        else
            print_info "No uncommitted changes to save"
        fi
    fi
}

# Function to check for common issues and suggest fixes
diagnose_common_issues() {
    print_header "🔍 Diagnosing Common Issues"
    
    SUGGESTIONS=""
    
    # Check if node_modules exists
    if [ ! -d "$PROJECT_DIR/node_modules" ]; then
        print_warning "node_modules directory not found"
        SUGGESTIONS="${SUGGESTIONS}\n- Run: npm install"
    fi
    
    # Check if .env.local exists
    if [ ! -f "$PROJECT_DIR/.env.local" ]; then
        print_warning ".env.local file not found"
        SUGGESTIONS="${SUGGESTIONS}\n- Create .env.local with required environment variables"
    fi
    
    # Check for port conflicts
    if lsof -i :3000 > /dev/null 2>&1; then
        print_info "Port 3000 is in use"
        SUGGESTIONS="${SUGGESTIONS}\n- Kill process on port 3000: lsof -ti:3000 | xargs kill -9"
    fi
    
    if lsof -i :8005 > /dev/null 2>&1; then
        print_info "Port 8005 is in use"
        SUGGESTIONS="${SUGGESTIONS}\n- Kill process on port 8005: lsof -ti:8005 | xargs kill -9"
    fi
    
    # Check for TypeScript errors
    if [ -f "$PROJECT_DIR/tsconfig.json" ]; then
        TS_ERRORS=$(cd "$PROJECT_DIR" && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo 0)
        if [ "$TS_ERRORS" -gt 0 ]; then
            print_warning "TypeScript errors detected: $TS_ERRORS"
            SUGGESTIONS="${SUGGESTIONS}\n- Fix TypeScript errors: npm run type-check"
        fi
    fi
    
    # Write suggestions to recovery file
    if [ -n "$SUGGESTIONS" ]; then
        echo -e "\n## Suggested Recovery Actions" >> "$RECOVERY_FILE"
        echo -e "$SUGGESTIONS" >> "$RECOVERY_FILE"
        
        print_info "Recovery suggestions added to report"
    else
        print_status "No immediate issues detected"
    fi
}

# Function to create diagnostic snapshot
create_diagnostic_snapshot() {
    print_header "📸 Creating Diagnostic Snapshot"
    
    SNAPSHOT_FILE="$RECOVERY_DIR/snapshot_${TIMESTAMP}.json"
    
    # Create JSON snapshot
    cat > "$SNAPSHOT_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "error": {
    "message": "$ERROR_MSG",
    "code": "$ERROR_CODE"
  },
  "environment": {
    "node_version": "$(node --version 2>/dev/null || echo 'N/A')",
    "npm_version": "$(npm --version 2>/dev/null || echo 'N/A')",
    "working_dir": "$PROJECT_DIR"
  },
  "git": {
    "branch": "$(git branch --show-current 2>/dev/null || echo 'N/A')",
    "last_commit": "$(git log -1 --format='%h %s' 2>/dev/null || echo 'N/A')",
    "uncommitted_files": $(git status --short 2>/dev/null | wc -l || echo 0)
  },
  "processes": {
    "npm_running": $(pgrep -f "npm" > /dev/null && echo "true" || echo "false"),
    "next_running": $(pgrep -f "next" > /dev/null && echo "true" || echo "false")
  }
}
EOF
    
    print_status "Diagnostic snapshot saved: snapshot_${TIMESTAMP}.json"
    echo "- ✓ Diagnostic snapshot created" >> "$RECOVERY_FILE"
}

# Function to attempt auto-recovery
attempt_auto_recovery() {
    print_header "🔧 Attempting Auto-Recovery"
    
    case "$ERROR_MSG" in
        *"npm"*|*"package"*)
            print_info "Package-related error detected"
            print_info "Clearing npm cache..."
            npm cache clean --force > /dev/null 2>&1
            echo "- ✓ NPM cache cleared" >> "$RECOVERY_FILE"
            ;;
        
        *"port"*|*"EADDRINUSE"*)
            print_info "Port conflict detected"
            print_info "Killing processes on development ports..."
            lsof -ti:3000 | xargs kill -9 2>/dev/null
            lsof -ti:8005 | xargs kill -9 2>/dev/null
            echo "- ✓ Development ports cleared" >> "$RECOVERY_FILE"
            ;;
        
        *"migration"*|*"database"*)
            print_info "Database-related error detected"
            print_warning "Manual database recovery may be required"
            echo "- ⚠ Database recovery needed - check backups" >> "$RECOVERY_FILE"
            ;;
        
        *)
            print_info "No automatic recovery available for this error type"
            ;;
    esac
}

# Main execution
save_work_state
save_uncommitted_changes
check_database_recovery
diagnose_common_issues
create_diagnostic_snapshot
attempt_auto_recovery

# Final summary
print_header "📊 Recovery Summary"

RECOVERY_SIZE=$(wc -c < "$RECOVERY_FILE" | xargs)
print_status "Recovery report: $(basename "$RECOVERY_FILE") ($RECOVERY_SIZE bytes)"

# Count recovery actions
ACTIONS_TAKEN=$(grep -c "✓" "$RECOVERY_FILE" 2>/dev/null || echo 0)
WARNINGS=$(grep -c "⚠" "$RECOVERY_FILE" 2>/dev/null || echo 0)

print_info "Actions completed: $ACTIONS_TAKEN"
if [ "$WARNINGS" -gt 0 ]; then
    print_warning "Warnings: $WARNINGS"
fi

print_info "Recovery directory: $RECOVERY_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
print_status "Error recovery completed"

# Return appropriate exit code
if [ "$ACTIONS_TAKEN" -gt 0 ]; then
    exit 0
else
    exit 1
fi