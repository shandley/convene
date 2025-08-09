# Claude Code Hooks

This directory contains automated hooks that enhance your Claude Code development experience.

## Active Hooks

### ✅ Configured & Working

1. **startup-prime.sh** (SessionStart)
   - Runs when you start or resume a Claude session
   - Loads project context from CLAUDE.md
   - Checks git status, MCP servers, and recent changes
   - Creates a prime request for Claude's initial context

2. **detect-shutdown.sh** (UserPromptSubmit)
   - Monitors your messages for shutdown keywords
   - Triggers CLAUDE.md audit when you're ending a session
   - Keywords: "goodbye", "closing claude", "done for today", etc.

3. **audit-claude-md.sh** (Stop)
   - Automatically runs when session ends (if triggered by detect-shutdown)
   - Backs up and prepares CLAUDE.md for audit
   - Creates audit request for next session

4. **pre-commit-check.sh** (PreToolUse - git commit)
   - Validates code before git commits
   - Checks: TypeScript errors, console.logs, secrets, file sizes
   - Prevents commits with critical issues

5. **pre-migration.sh** (PreToolUse - migrations)
   - Safety checks before database migrations
   - Validates SQL, checks for dangerous operations
   - Creates backups and rollback scripts

### ⚠️ Available but Not Auto-Triggered

6. **security-check.sh**
   - Comprehensive security scanning
   - Run manually: `bash .claude/hooks/security-check.sh`

7. **manual-audit.sh**
   - Manually trigger CLAUDE.md audit
   - Run: `bash .claude/hooks/manual-audit.sh`

8. **on-error.sh**
   - Error recovery (no automatic error hooks in Claude Code)
   - Could be adapted for failure detection

9. **periodic-checkpoint.sh**
   - Work-in-progress checkpointing
   - Claude Code doesn't support timer-based hooks

## Hook Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [...],
    "UserPromptSubmit": [...],
    "PreToolUse": [...],
    "Stop": [...]
  }
}
```

## Testing Hooks

Test individual hooks:
```bash
# Test shutdown detection
bash .claude/hooks/detect-shutdown.sh "goodbye"

# Test audit
bash .claude/hooks/audit-claude-md.sh

# Run security scan
bash .claude/hooks/security-check.sh
```

Debug hook execution:
```bash
claude --debug
```

## Database Credentials

Database credentials have been moved to `.env.database` for security.
To use them:
```bash
source .env.database
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

## Maintenance

- Hooks create backups in `.claude/backups/`
- Old backups are automatically cleaned (keeps last 10)
- Session info stored in `.claude/.session-info`
- Audit requests in `.claude/.audit-request`

## Troubleshooting

If hooks aren't running:
1. Check `claude --debug` output
2. Verify `.claude/settings.json` syntax
3. Ensure scripts are executable: `chmod +x .claude/hooks/*.sh`
4. Check `$CLAUDE_PROJECT_DIR` is set correctly

## Adding New Hooks

1. Create script in `.claude/hooks/`
2. Make executable: `chmod +x your-hook.sh`
3. Add to `.claude/settings.json`
4. Test with `claude --debug`

Available hook events:
- SessionStart: Session begins
- UserPromptSubmit: User sends message
- PreToolUse: Before tool execution
- PostToolUse: After successful tool
- Stop: Main agent finishes
- SubagentStop: Subagent completes
- PreCompact: Before context compaction
- Notification: Permission requests/idle