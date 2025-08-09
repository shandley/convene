#!/bin/bash
# Claude Monitor instrumentation hook
export CLAUDE_MONITOR_DIR="/Users/scotthandley/Code/claude-monitor"
export CLAUDE_SESSION_ID="${CLAUDE_SESSION_ID:-$(date +%s)}"
export HOOK_NAME="task-begin-hook.sh"

# Call the monitor hook with appropriate context
"/Users/scotthandley/Code/claude-monitor/hooks/monitor-hook.sh" "task-begin-hook.sh" "$@"

# Always exit successfully
exit 0
