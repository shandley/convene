#!/bin/bash
# Claude Monitor instrumentation hook
export CLAUDE_MONITOR_DIR="/Users/scotthandley/Code/claude-monitor"
export CLAUDE_SESSION_ID="${CLAUDE_SESSION_ID:-$(date +%s)}"
export HOOK_NAME="session-start-hook.sh"

# Call the monitor hook with appropriate context
"/Users/scotthandley/Code/claude-monitor/hooks/monitor-hook.sh" "session-start-hook.sh" "$@"

# Always exit successfully
exit 0
