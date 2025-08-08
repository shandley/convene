#!/bin/bash

# Manual CLAUDE.md Audit Trigger
# Run this script manually to trigger an audit: ./.claude/hooks/manual-audit.sh

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
CLAUDE_MD="$PROJECT_DIR/CLAUDE.md"
CLAUDE_ARCHIVE="$PROJECT_DIR/CLAUDE_ARCHIVE.md"

echo "Manual CLAUDE.md audit triggered"

# Create backup directory if it doesn't exist
mkdir -p "$PROJECT_DIR/.claude/backups"

# Backup current CLAUDE.md
if [ -f "$CLAUDE_MD" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    cp "$CLAUDE_MD" "$PROJECT_DIR/.claude/backups/CLAUDE_${TIMESTAMP}.md"
    echo "Backup created: .claude/backups/CLAUDE_${TIMESTAMP}.md"
fi

# Create audit request for Claude
cat > "$PROJECT_DIR/.claude/.audit-request" << 'EOF'
AUDIT REQUEST: Please perform a CLAUDE.md audit:

1. **Review CLAUDE.md** for:
   - Completed features that can be archived
   - Verbose sections that can be summarized
   - Outdated information
   - Redundant content

2. **Archive to CLAUDE_ARCHIVE.md**:
   - Add timestamp header for this archive
   - Move pruned content with context
   - Preserve important historical decisions

3. **Keep in CLAUDE.md**:
   - Current development phase and status
   - Active TODOs and next steps
   - Essential project context
   - Key architectural decisions still relevant
   - Quick reference information

4. **Format**:
   - Keep CLAUDE.md concise (target: <200 lines)
   - Use clear section headers
   - Focus on actionable information

Please perform this audit now and update both files accordingly.
EOF

echo "Audit request created. Claude will process this on next interaction."
echo "To trigger immediately, just send any message to Claude."