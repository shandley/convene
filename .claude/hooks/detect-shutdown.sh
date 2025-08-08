#!/bin/bash

# Enhanced Shutdown Detection Hook with Visual Feedback
# This script runs on UserPromptSubmit to detect shutdown-related keywords

# ANSI color codes for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
USER_MESSAGE="$1"
TRIGGER_FILE="$PROJECT_DIR/.claude/.audit-trigger"
SESSION_FILE="$PROJECT_DIR/.claude/.session-info"

# Function to print colored status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1" >&2
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1" >&2
}

print_header() {
    echo -e "\n${BOLD}$1${NC}" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
}

# Convert to lowercase for case-insensitive matching
MESSAGE_LOWER=$(echo "$USER_MESSAGE" | tr '[:upper:]' '[:lower:]')

# Check for shutdown/closing keywords
SHUTDOWN_KEYWORDS=(
    "closing claude"
    "shut down"
    "shutdown"
    "goodbye"
    "signing off"
    "done for today"
    "done for now"
    "closing down"
    "see you later"
    "bye"
    "ttyl"
    "audit claude.md"
    "prune claude.md"
)

# Function to track session information
track_session_info() {
    # Create session info file if it doesn't exist
    if [ ! -f "$SESSION_FILE" ]; then
        echo "SESSION_START=$(date +%s)" > "$SESSION_FILE"
        echo "SESSION_START_TIME=$(date '+%Y-%m-%d %H:%M:%S')" >> "$SESSION_FILE"
    fi
    
    # Update last activity
    echo "LAST_ACTIVITY=$(date +%s)" >> "$SESSION_FILE"
    echo "LAST_MESSAGE=\"$1\"" >> "$SESSION_FILE"
}

# Track this interaction
track_session_info "$USER_MESSAGE"

# Check if any shutdown keyword is present
DETECTED=false
for keyword in "${SHUTDOWN_KEYWORDS[@]}"; do
    if [[ "$MESSAGE_LOWER" == *"$keyword"* ]]; then
        DETECTED=true
        
        print_header "🔍 SHUTDOWN DETECTION"
        print_status "Shutdown keyword detected: '$keyword'"
        
        # Create trigger file for the Stop hook
        touch "$TRIGGER_FILE"
        echo "$keyword" > "$TRIGGER_FILE"
        
        # Store session end time
        echo "SESSION_END=$(date +%s)" >> "$SESSION_FILE"
        echo "SESSION_END_TIME=$(date '+%Y-%m-%d %H:%M:%S')" >> "$SESSION_FILE"
        echo "SHUTDOWN_KEYWORD=$keyword" >> "$SESSION_FILE"
        
        print_info "Session information saved"
        print_warning "CLAUDE.md audit will be triggered at session end"
        
        # Calculate session duration if start exists
        if [ -f "$SESSION_FILE" ]; then
            SESSION_START=$(grep "^SESSION_START=" "$SESSION_FILE" | cut -d= -f2)
            SESSION_END=$(date +%s)
            if [ -n "$SESSION_START" ]; then
                DURATION=$((SESSION_END - SESSION_START))
                HOURS=$((DURATION / 3600))
                MINUTES=$(((DURATION % 3600) / 60))
                print_info "Session duration: ${HOURS}h ${MINUTES}m"
            fi
        fi
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        break
    fi
done

# Silent tracking for non-shutdown messages
if [ "$DETECTED" = false ]; then
    # Just track the activity silently
    :
fi