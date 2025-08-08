#!/bin/bash

# Enhanced Startup Prime Hook with Detailed Feedback
# This script runs at session start to prime Claude with comprehensive project context
# Always runs on every session start to ensure Claude has the latest context

# ANSI color codes for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
CLAUDE_MD="$PROJECT_DIR/CLAUDE.md"
PRIME_REQUEST="$PROJECT_DIR/.claude/.prime-request"

# Track success/failure
ERRORS=0
WARNINGS=0

# Function to print colored status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
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

# Function to check if CLAUDE.md exists and has content
check_claude_md() {
    if [ -f "$CLAUDE_MD" ] && [ -s "$CLAUDE_MD" ]; then
        FILE_SIZE=$(wc -c < "$CLAUDE_MD" | xargs)
        LINE_COUNT=$(wc -l < "$CLAUDE_MD" | xargs)
        print_status "Found CLAUDE.md ($LINE_COUNT lines, $FILE_SIZE bytes)"
        return 0
    elif [ -f "$CLAUDE_MD" ]; then
        print_warning "CLAUDE.md exists but is empty"
        return 1
    else
        print_warning "CLAUDE.md not found at $CLAUDE_MD"
        return 1
    fi
}

# Function to get git status summary
get_git_status() {
    if command -v git &> /dev/null && [ -d "$PROJECT_DIR/.git" ]; then
        BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
        UNCOMMITTED=$(git status --short 2>/dev/null | wc -l | xargs)
        LAST_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null || echo "No commits")
        print_status "Git repository detected: Branch '$BRANCH'" >&2
        if [ "$UNCOMMITTED" -gt 0 ]; then
            print_info "  └─ $UNCOMMITTED uncommitted changes" >&2
        fi
        # Return value for prime request (to stdout)
        echo "Git: Branch '$BRANCH' | $UNCOMMITTED uncommitted changes | Last: $LAST_COMMIT"
    else
        print_warning "Not a git repository" >&2
        # Return value for prime request (to stdout)
        echo "Git: Not a git repository"
    fi
}

# Function to get recent file changes
get_recent_changes() {
    # Find files modified in last 24 hours, excluding .git and node_modules
    RECENT=$(find "$PROJECT_DIR" -type f -mtime -1 \
        -not -path "*/\.git/*" \
        -not -path "*/node_modules/*" \
        -not -path "*/\.next/*" \
        -not -path "*/.claude/*" \
        2>/dev/null | head -10 | sed "s|$PROJECT_DIR/||g")
    
    if [ -n "$RECENT" ]; then
        FILE_COUNT=$(echo "$RECENT" | wc -l | xargs)
        print_status "Recent changes: $FILE_COUNT files modified (last 24h)" >&2
    else
        print_info "No files modified in the last 24 hours" >&2
    fi
    
    echo "$RECENT"
}

# Function to detect available subagents from Task tool description
get_available_subagents() {
    # These are the subagents available in the Task tool with their MCP server mappings
    cat << 'EOF'
   - general-purpose: Complex research and multi-step tasks
     MCP: All servers (Supabase, Vercel, Playwright, Context7, IDE)
   
   - statusline-setup: Configure Claude Code status line
     MCP: IDE server for VS Code integration
   
   - supabase-auth-specialist: Authentication and authorization with Supabase
     MCP: Supabase server (auth operations, user management)
   
   - git-workflow-specialist: Git repository management and commit strategies
     MCP: None (uses native git commands)
   
   - supabase-database-architect: Database schemas, migrations, RLS policies
     MCP: Supabase server (tables, migrations, SQL execution, advisors)
   
   - nextjs-convene-builder: Next.js 14 App Router features for Convene
     MCP: Vercel server (deployments, project management)
   
   - react-form-architect: Forms with React Hook Form and Zod
     MCP: IDE server (diagnostics, code completion)
   
   - shadcn-ui-architect: UI/UX with shadcn/ui and Tailwind CSS
     MCP: Playwright server (UI testing, browser automation)
   
   - convene-platform-coordinator: High-level orchestration for Convene
     MCP: All servers for comprehensive coordination
EOF
}

# Function to check MCP server status
check_mcp_servers() {
    # Check if MCP servers are configured
    if [ -f "$PROJECT_DIR/.mcp.json" ]; then
        # Parse the .mcp.json to list configured servers
        SERVERS=$(grep -E '"(supabase|vercel|playwright|context7|ide)":' "$PROJECT_DIR/.mcp.json" 2>/dev/null | sed 's/.*"\([^"]*\)":.*/\1/' | tr '\n' ', ' | sed 's/, $//')
        
        if [ -n "$SERVERS" ]; then
            SERVER_COUNT=$(echo "$SERVERS" | tr ',' '\n' | wc -l | xargs)
            print_status "MCP servers configured: $SERVER_COUNT found" >&2
            print_info "  └─ $SERVERS" >&2
            echo "MCP Servers: $SERVERS configured"
        else
            print_warning "MCP configuration found but no servers detected" >&2
            echo "MCP Configuration: Found but no servers detected"
        fi
    else
        print_warning "MCP configuration not found (.mcp.json missing)" >&2
        echo "MCP Configuration: Not found"
    fi
}

# Function to get project stats
get_project_stats() {
    if [ -d "$PROJECT_DIR/src" ] || [ -d "$PROJECT_DIR/app" ]; then
        TSX_COUNT=$(find "$PROJECT_DIR" -name "*.tsx" -not -path "*/node_modules/*" 2>/dev/null | wc -l | xargs)
        TS_COUNT=$(find "$PROJECT_DIR" -name "*.ts" -not -path "*/node_modules/*" 2>/dev/null | wc -l | xargs)
        TOTAL_COUNT=$((TSX_COUNT + TS_COUNT))
        if [ "$TOTAL_COUNT" -gt 0 ]; then
            print_status "Project files: $TSX_COUNT .tsx, $TS_COUNT .ts files" >&2
        fi
        echo "Project: $TSX_COUNT .tsx files, $TS_COUNT .ts files"
    fi
}

# Start of execution
print_header "🚀 CLAUDE STARTUP HOOK - SESSION PRIMING"
print_info "Working Directory: $PROJECT_DIR"

# Main execution - always prime if CLAUDE.md exists
if check_claude_md; then
    print_header "📊 Gathering Project Context"
    
    # Gather dynamic context (functions print to stderr, return to stdout)
    GIT_STATUS=$(get_git_status)
    MCP_STATUS=$(check_mcp_servers)
    PROJECT_STATS=$(get_project_stats)
    RECENT_FILES=$(get_recent_changes)
    
    print_header "📝 Creating Prime Request"
    
    # Create enhanced prime request
    cat > "$PRIME_REQUEST" << EOF
SESSION STARTUP: Enhanced project context loaded.

## Project Status
- $GIT_STATUS
- $MCP_STATUS
- $PROJECT_STATS

## Primary Context
Review CLAUDE.md for current project state, active development priorities, and essential context.

## Available Specialized Subagents
Use the Task tool to delegate to these specialized agents when appropriate:
$(get_available_subagents)

## Recently Modified Files (last 24h)
EOF
    
    if [ -n "$RECENT_FILES" ]; then
        echo "$RECENT_FILES" | while read -r file; do
            echo "   - $file" >> "$PRIME_REQUEST"
        done
    else
        echo "   No recent modifications" >> "$PRIME_REQUEST"
    fi
    
    cat >> "$PRIME_REQUEST" << 'EOF'

## Active Systems
- **Hooks**: CLAUDE.md audit system triggers on session end keywords
- **TodoWrite**: Use for task planning and tracking
- **MCP Servers Available**:
  * Supabase: Database operations, migrations, RLS, auth management
  * Vercel: Deployment management, project monitoring
  * Playwright: Browser automation, UI testing (if needed)
  * Context7: Library documentation retrieval (if needed)
  * IDE: VS Code integration, diagnostics (if needed)

## Quick Actions
1. Review CLAUDE.md for current development phase
2. Check uncommitted changes if any exist
3. Use TodoWrite for complex multi-step tasks
4. Delegate to specialized subagents when appropriate

Please acknowledge that you've reviewed the enhanced project context and are ready to continue development on the Convene workshop administration platform.
EOF
    
    if [ -f "$PRIME_REQUEST" ]; then
        print_status "Prime request created successfully"
        PRIME_SIZE=$(wc -c < "$PRIME_REQUEST" | xargs)
        PRIME_LINES=$(wc -l < "$PRIME_REQUEST" | xargs)
        print_info "  └─ Size: $PRIME_SIZE bytes, $PRIME_LINES lines"
        
        # Verify the file is readable
        if [ -r "$PRIME_REQUEST" ]; then
            print_status "Prime request is readable and ready for Claude"
        else
            print_error "Prime request created but not readable!"
        fi
    else
        print_error "Failed to create prime request file at $PRIME_REQUEST"
    fi
    
    print_header "✅ SESSION PRIMING COMPLETED"
    
    if [ "$ERRORS" -gt 0 ]; then
        print_error "Completed with $ERRORS errors"
    fi
    
    if [ "$WARNINGS" -gt 0 ]; then
        print_warning "Completed with $WARNINGS warnings"
    fi
    
    if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
        print_status "All checks passed successfully!"
    fi
    
    echo -e "\n${BOLD}Claude will receive comprehensive project context on first interaction.${NC}"
else
    print_header "⚠️  LIMITED SESSION PRIMING"
    print_info "Creating basic prime request with available context..."
    
    # Even without CLAUDE.md, provide basic context
    GIT_STATUS=$(get_git_status)
    
    cat > "$PRIME_REQUEST" << EOF
SESSION STARTUP: Basic context loaded (CLAUDE.md not found).

## Project Status
- $GIT_STATUS
- Working Directory: $PROJECT_DIR

## Available Specialized Subagents
$(get_available_subagents)

## Recommendation
Create a CLAUDE.md file in the project root to document:
- Project overview and goals
- Technology stack
- Current development phase
- Active tasks and priorities

This will enable comprehensive session priming for future sessions.
EOF
    
    if [ -f "$PRIME_REQUEST" ]; then
        print_status "Basic prime request created"
        PRIME_SIZE=$(wc -c < "$PRIME_REQUEST" | xargs)
        print_info "  └─ Size: $PRIME_SIZE bytes"
    else
        print_error "Failed to create prime request file"
    fi
    
    print_header "⚠️  SESSION PRIMING COMPLETED (LIMITED)"
    
    if [ "$ERRORS" -gt 0 ]; then
        print_error "Completed with $ERRORS errors"
    fi
    
    if [ "$WARNINGS" -gt 0 ]; then
        print_warning "Completed with $WARNINGS warnings"
    fi
    
    echo -e "\n${BOLD}💡 TIP: Create CLAUDE.md for full context loading${NC}"
fi

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Startup hook execution completed"
else
    echo -e "${RED}✗${NC} Startup hook completed with issues"
    exit 1
fi