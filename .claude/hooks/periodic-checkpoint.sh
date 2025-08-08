#!/bin/bash

# Progress Checkpoint Hook
# Runs periodically to save work progress and clean up

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
CHECKPOINT_DIR="$PROJECT_DIR/.claude/checkpoints"
SESSION_FILE="$PROJECT_DIR/.claude/.session-info"
CHECKPOINT_FILE="$PROJECT_DIR/.claude/.last-checkpoint"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TODO_FILE="$PROJECT_DIR/.claude/.todo-state"

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

# Create checkpoint directory
mkdir -p "$CHECKPOINT_DIR"

print_header "⏱️ PROGRESS CHECKPOINT"
print_info "Time: $(date '+%Y-%m-%d %H:%M:%S')"

# Function to check if checkpoint is needed
should_checkpoint() {
    # Check if enough time has passed since last checkpoint
    if [ -f "$CHECKPOINT_FILE" ]; then
        LAST_CHECKPOINT=$(cat "$CHECKPOINT_FILE" 2>/dev/null || echo 0)
        CURRENT_TIME=$(date +%s)
        TIME_DIFF=$((CURRENT_TIME - LAST_CHECKPOINT))
        
        # Checkpoint every 30 minutes (1800 seconds)
        if [ $TIME_DIFF -lt 1800 ]; then
            MINUTES_LEFT=$(((1800 - TIME_DIFF) / 60))
            print_info "Next checkpoint in $MINUTES_LEFT minutes"
            return 1
        fi
    fi
    
    return 0
}

# Function to calculate session duration
get_session_duration() {
    if [ -f "$SESSION_FILE" ]; then
        SESSION_START=$(grep "^SESSION_START=" "$SESSION_FILE" | cut -d= -f2)
        if [ -n "$SESSION_START" ]; then
            CURRENT_TIME=$(date +%s)
            DURATION=$((CURRENT_TIME - SESSION_START))
            HOURS=$((DURATION / 3600))
            MINUTES=$(((DURATION % 3600) / 60))
            echo "${HOURS}h ${MINUTES}m"
        else
            echo "Unknown"
        fi
    else
        echo "No session"
    fi
}

# Function to save work in progress
save_wip() {
    print_header "💾 Saving Work in Progress"
    
    if command -v git &> /dev/null && [ -d "$PROJECT_DIR/.git" ]; then
        cd "$PROJECT_DIR"
        
        # Check if there are existing stashes (safety check)
        EXISTING_STASHES=$(git stash list | wc -l | xargs)
        if [ "$EXISTING_STASHES" -gt 0 ]; then
            print_warning "Found $EXISTING_STASHES existing stashes"
            print_info "Consider reviewing: git stash list"
        fi
        
        # Check for uncommitted changes
        if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
            # Create WIP branch name
            WIP_BRANCH="wip/checkpoint-${TIMESTAMP}"
            CURRENT_BRANCH=$(git branch --show-current)
            
            print_info "Current branch: $CURRENT_BRANCH"
            
            # Stash changes with descriptive message
            STASH_MSG="Checkpoint: $(date '+%Y-%m-%d %H:%M:%S')"
            git stash push -m "$STASH_MSG" --include-untracked > /dev/null 2>&1
            STASH_RESULT=$?
            
            if [ $STASH_RESULT -eq 0 ]; then
                print_status "Changes stashed: '$STASH_MSG'"
                
                # Save the stash reference for recovery
                STASH_REF=$(git stash list | head -1 | cut -d: -f1)
                
                # Create WIP branch and apply stash
                git checkout -b "$WIP_BRANCH" > /dev/null 2>&1
                
                # Apply stash to WIP branch (not pop, to keep it in stash list)
                git stash apply "$STASH_REF" > /dev/null 2>&1
                
                # Create WIP commit
                git add -A > /dev/null 2>&1
                git commit -m "WIP: Checkpoint $(date '+%Y-%m-%d %H:%M:%S')

Session duration: $(get_session_duration)
Auto-checkpoint created by periodic-checkpoint.sh" > /dev/null 2>&1
                
                if [ $? -eq 0 ]; then
                    COMMIT_HASH=$(git rev-parse --short HEAD)
                    print_status "WIP commit created: $COMMIT_HASH"
                    print_info "  └─ Branch: $WIP_BRANCH"
                fi
                
                # Switch back to original branch
                git checkout "$CURRENT_BRANCH" > /dev/null 2>&1
                
                # Restore working directory from stash
                # Use apply instead of pop to avoid losing the stash if it fails
                git stash apply "$STASH_REF" > /dev/null 2>&1
                RESTORE_RESULT=$?
                
                if [ $RESTORE_RESULT -eq 0 ]; then
                    # Successfully restored, now drop the stash
                    git stash drop "$STASH_REF" > /dev/null 2>&1
                    print_status "Working directory restored"
                else
                    # Failed to restore cleanly, try to recover
                    print_warning "Could not restore stash cleanly, recovering files..."
                    
                    # Get list of files from the WIP branch
                    git diff --name-only "$CURRENT_BRANCH" "$WIP_BRANCH" | while read -r file; do
                        # Restore each file from WIP branch
                        git checkout "$WIP_BRANCH" -- "$file" 2>/dev/null
                    done
                    
                    print_status "Files recovered from WIP branch"
                    print_info "  └─ Stash kept for manual recovery if needed: $STASH_REF"
                fi
            else
                print_info "No changes to checkpoint"
            fi
        else
            print_info "No uncommitted changes to save"
        fi
        
        # Count and optionally clean old WIP branches
        WIP_COUNT=$(git branch | grep -c "wip/checkpoint-" || echo 0)
        if [ $WIP_COUNT -gt 5 ]; then
            print_warning "You have $WIP_COUNT WIP branches"
            
            # Clean up old WIP branches (older than 7 days)
            OLD_BRANCHES=$(git for-each-ref --format='%(refname:short) %(committerdate:unix)' refs/heads/wip/checkpoint-* | \
                while read branch timestamp; do
                    AGE=$(($(date +%s) - timestamp))
                    if [ $AGE -gt 604800 ]; then # 7 days in seconds
                        echo "$branch"
                    fi
                done)
            
            if [ -n "$OLD_BRANCHES" ]; then
                print_info "Cleaning old WIP branches (>7 days):"
                echo "$OLD_BRANCHES" | while read -r branch; do
                    git branch -D "$branch" > /dev/null 2>&1
                    print_info "  └─ Deleted: $branch"
                done
            fi
        fi
    fi
}

# Function to update todo state
update_todo_state() {
    print_header "📋 TODO State Update"
    
    # Check for changes in project files that might affect todos
    RECENT_CHANGES=$(find "$PROJECT_DIR" -type f -mmin -30 \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/.next/*" \
        -not -path "*/.claude/*" \
        2>/dev/null | wc -l | xargs)
    
    if [ $RECENT_CHANGES -gt 0 ]; then
        print_info "Files changed in last 30 minutes: $RECENT_CHANGES"
        
        # Save current todo state (would be populated by TodoWrite tool)
        if [ -f "$TODO_FILE" ]; then
            cp "$TODO_FILE" "$CHECKPOINT_DIR/todos_${TIMESTAMP}.json"
            print_status "TODO state saved"
        fi
    else
        print_info "No recent file changes"
    fi
}

# Function to refresh MCP connections
check_mcp_health() {
    print_header "🔌 MCP Server Health Check"
    
    if [ -f "$PROJECT_DIR/.mcp.json" ]; then
        # Check Supabase MCP
        if grep -q "supabase" "$PROJECT_DIR/.mcp.json"; then
            if command -v supabase &> /dev/null; then
                if supabase status > /dev/null 2>&1; then
                    print_status "Supabase MCP: Active"
                else
                    print_warning "Supabase MCP: Not responding"
                    print_info "  └─ Run: supabase start"
                fi
            fi
        fi
        
        # Check Vercel MCP
        if grep -q "vercel" "$PROJECT_DIR/.mcp.json"; then
            if command -v vercel &> /dev/null; then
                print_status "Vercel MCP: Available"
            fi
        fi
    else
        print_info "No MCP servers configured"
    fi
}

# Function to clean temporary files
cleanup_temp() {
    print_header "🧹 Cleaning Temporary Files"
    
    CLEANED=0
    
    # Clean old checkpoint files (older than 7 days)
    if [ -d "$CHECKPOINT_DIR" ]; then
        OLD_CHECKPOINTS=$(find "$CHECKPOINT_DIR" -type f -mtime +7 2>/dev/null | wc -l | xargs)
        if [ $OLD_CHECKPOINTS -gt 0 ]; then
            find "$CHECKPOINT_DIR" -type f -mtime +7 -delete 2>/dev/null
            print_status "Removed $OLD_CHECKPOINTS old checkpoint files"
            CLEANED=$((CLEANED + OLD_CHECKPOINTS))
        fi
    fi
    
    # Clean Next.js cache if it's too large
    if [ -d "$PROJECT_DIR/.next" ]; then
        NEXT_SIZE=$(du -sm "$PROJECT_DIR/.next" 2>/dev/null | cut -f1)
        if [ "$NEXT_SIZE" -gt 500 ]; then
            print_warning ".next cache is large: ${NEXT_SIZE}MB"
            print_info "  └─ Run 'npm run clean' if builds are slow"
        fi
    fi
    
    # Clean node_modules if requested
    if [ "$1" = "--deep-clean" ]; then
        if [ -d "$PROJECT_DIR/node_modules" ]; then
            print_warning "Deep clean requested - clearing node_modules"
            rm -rf "$PROJECT_DIR/node_modules"
            print_info "  └─ Run 'npm install' to restore"
            CLEANED=$((CLEANED + 1))
        fi
    fi
    
    if [ $CLEANED -eq 0 ]; then
        print_info "No cleanup needed"
    else
        print_status "Cleaned $CLEANED items"
    fi
}

# Function to generate progress summary
generate_summary() {
    print_header "📊 Progress Summary"
    
    # Session duration
    DURATION=$(get_session_duration)
    print_info "Session duration: $DURATION"
    
    # Git statistics
    if command -v git &> /dev/null && [ -d "$PROJECT_DIR/.git" ]; then
        # Commits in session
        if [ -f "$SESSION_FILE" ]; then
            SESSION_START_TIME=$(grep "^SESSION_START_TIME=" "$SESSION_FILE" | cut -d= -f2)
            if [ -n "$SESSION_START_TIME" ]; then
                COMMITS=$(git log --since="$SESSION_START_TIME" --oneline 2>/dev/null | wc -l | xargs)
                print_info "Commits this session: $COMMITS"
            fi
        fi
        
        # Files changed
        CHANGED_FILES=$(git diff --name-only 2>/dev/null | wc -l | xargs)
        STAGED_FILES=$(git diff --cached --name-only 2>/dev/null | wc -l | xargs)
        
        if [ $CHANGED_FILES -gt 0 ] || [ $STAGED_FILES -gt 0 ]; then
            print_info "Uncommitted changes: $CHANGED_FILES files"
            print_info "Staged files: $STAGED_FILES"
        fi
    fi
    
    # Memory usage
    if command -v node &> /dev/null; then
        NODE_PROCS=$(pgrep -f node | wc -l | xargs)
        if [ $NODE_PROCS -gt 0 ]; then
            print_info "Node processes running: $NODE_PROCS"
        fi
    fi
    
    # Create summary file
    SUMMARY_FILE="$CHECKPOINT_DIR/summary_${TIMESTAMP}.md"
    cat > "$SUMMARY_FILE" << EOF
# Progress Checkpoint Summary
**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Session Duration**: $DURATION

## Activity
- Files recently modified: $RECENT_CHANGES
- Uncommitted changes: $CHANGED_FILES
- Staged files: $STAGED_FILES

## System Status
- Working directory: $PROJECT_DIR
- Current branch: $(git branch --show-current 2>/dev/null || echo "N/A")
- Node processes: $NODE_PROCS

## Next Checkpoint
- Scheduled in 30 minutes
EOF
    
    print_status "Summary saved: summary_${TIMESTAMP}.md"
}

# Function to check system resources
check_resources() {
    print_header "💻 System Resources"
    
    # Check disk space
    DISK_USAGE=$(df -h "$PROJECT_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        print_error "Disk usage critical: ${DISK_USAGE}%"
    elif [ "$DISK_USAGE" -gt 80 ]; then
        print_warning "Disk usage high: ${DISK_USAGE}%"
    else
        print_status "Disk usage: ${DISK_USAGE}%"
    fi
    
    # Check memory on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        MEMORY_PRESSURE=$(memory_pressure | grep "System-wide memory free percentage" | awk '{print $5}' | sed 's/%//')
        if [ -n "$MEMORY_PRESSURE" ]; then
            if [ "$MEMORY_PRESSURE" -lt 10 ]; then
                print_warning "Memory pressure high (${MEMORY_PRESSURE}% free)"
            else
                print_status "Memory available: ${MEMORY_PRESSURE}%"
            fi
        fi
    fi
}

# Main execution
if ! should_checkpoint; then
    # Not time for checkpoint yet
    exit 0
fi

print_info "Running periodic checkpoint..."

# Run checkpoint tasks
save_wip
update_todo_state
check_mcp_health
cleanup_temp "$1"
check_resources
generate_summary

# Update last checkpoint time
echo "$(date +%s)" > "$CHECKPOINT_FILE"

print_header "✅ CHECKPOINT COMPLETE"
print_status "Next checkpoint in 30 minutes"
print_info "Checkpoint data saved to: $CHECKPOINT_DIR"

# Show any important warnings
if [ -f "$SESSION_FILE" ]; then
    DURATION=$(get_session_duration)
    # Extract hours from duration
    HOURS=$(echo "$DURATION" | sed 's/h.*//')
    
    if [ "$HOURS" -ge 4 ]; then
        print_warning "You've been working for $DURATION - consider taking a break!"
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2

exit 0