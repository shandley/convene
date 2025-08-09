#!/bin/bash

# CLAUDE.md Audit Hook
# Automatically triggered when session ends with shutdown keywords

# ANSI color codes for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
CLAUDE_MD="$PROJECT_DIR/CLAUDE.md"
CLAUDE_ARCHIVE="$PROJECT_DIR/CLAUDE_ARCHIVE.md"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
AUDIT_REQUEST="$PROJECT_DIR/.claude/.audit-request"

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

print_header "📝 CLAUDE.MD AUDIT TRIGGERED"
print_info "Session end detected - performing CLAUDE.md audit"

# Check if CLAUDE.md exists
if [ ! -f "$CLAUDE_MD" ]; then
    print_warning "CLAUDE.md not found at $CLAUDE_MD"
    exit 0
fi

# Create backup directory if it doesn't exist
mkdir -p "$PROJECT_DIR/.claude/backups"

# Backup current CLAUDE.md
if [ -f "$CLAUDE_MD" ]; then
    BACKUP_FILE="$PROJECT_DIR/.claude/backups/CLAUDE_${TIMESTAMP}.md"
    cp "$CLAUDE_MD" "$BACKUP_FILE"
    print_status "Backup created: $(basename "$BACKUP_FILE")"
fi

# Get file statistics
CLAUDE_SIZE=$(wc -c < "$CLAUDE_MD" | xargs)
CLAUDE_LINES=$(wc -l < "$CLAUDE_MD" | xargs)

print_info "Current CLAUDE.md: $CLAUDE_LINES lines, $CLAUDE_SIZE bytes"

# Check if archive exists
if [ -f "$CLAUDE_ARCHIVE" ]; then
    ARCHIVE_SIZE=$(wc -c < "$CLAUDE_ARCHIVE" | xargs)
    print_info "Archive exists: $ARCHIVE_SIZE bytes"
else
    print_info "No archive file exists yet"
fi

# Create audit request for Claude to process
cat > "$AUDIT_REQUEST" << 'EOF'
# CLAUDE.MD AUDIT REQUEST

Please perform an automatic audit of CLAUDE.md:

## Audit Tasks:

1. **Review CLAUDE.md** for:
   - ✅ Completed features that can be archived
   - 📝 Verbose sections that can be summarized
   - 🗑️ Outdated information that should be removed
   - 🔄 Redundant content that can be consolidated

2. **Archive to CLAUDE_ARCHIVE.md**:
   - Add timestamp header: `## Archive: [Date]`
   - Move completed phase details
   - Preserve important historical decisions
   - Keep implementation notes for reference

3. **Keep in CLAUDE.md** (essentials only):
   - Current development status (1-2 lines)
   - Active development priorities (bulleted list)
   - Quick reference commands
   - Essential environment variables
   - Next immediate tasks
   - Key architectural decisions still relevant

4. **Target Metrics**:
   - CLAUDE.md: Keep under 100 lines
   - Focus on actionable, current information
   - Remove completed TODOs
   - Consolidate similar sections

5. **Format Requirements**:
   - Use clear, concise headers
   - Bullet points over paragraphs
   - Commands in code blocks
   - No duplicate information

Please perform this audit now and update both files.
EOF

print_status "Audit request created at: .claude/.audit-request"

# Check if we should trigger immediate processing
if [ "$1" = "--immediate" ]; then
    print_info "Immediate mode: Claude will process on next interaction"
else
    print_info "Audit will be processed at next session start"
fi

# Session statistics
if [ -f "$PROJECT_DIR/.claude/.session-info" ]; then
    print_header "📊 Session Statistics"
    
    # Extract session info
    SESSION_START=$(grep "^SESSION_START_TIME=" "$PROJECT_DIR/.claude/.session-info" | cut -d= -f2)
    SESSION_END_TIME=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ -n "$SESSION_START" ]; then
        print_info "Session started: $SESSION_START"
        print_info "Session ended: $SESSION_END_TIME"
    fi
    
    # Count git commits in this session
    if command -v git &> /dev/null && [ -d "$PROJECT_DIR/.git" ]; then
        COMMITS=$(git log --since="$SESSION_START" --oneline 2>/dev/null | wc -l | xargs)
        if [ "$COMMITS" -gt 0 ]; then
            print_status "Commits this session: $COMMITS"
        fi
    fi
fi

# Clean up old backups (keep last 10)
BACKUP_COUNT=$(ls -1 "$PROJECT_DIR/.claude/backups"/CLAUDE_*.md 2>/dev/null | wc -l | xargs)
if [ "$BACKUP_COUNT" -gt 10 ]; then
    print_info "Cleaning old backups (keeping last 10)..."
    ls -1t "$PROJECT_DIR/.claude/backups"/CLAUDE_*.md | tail -n +11 | xargs rm -f
    print_status "Old backups removed"
fi

print_header "✅ AUDIT HOOK COMPLETED"
print_status "CLAUDE.md will be audited in next session"
print_info "Manual trigger: bash .claude/hooks/manual-audit.sh"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2

exit 0