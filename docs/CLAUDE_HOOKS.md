# Claude Code Hooks Documentation

This project uses Claude Code hooks to automate CLAUDE.md maintenance and keep project documentation lean and focused.

## Overview

The hook system automatically detects when you're ending a Claude Code session and triggers an audit of the CLAUDE.md file, moving completed or outdated content to CLAUDE_ARCHIVE.md.

## Installed Hooks

### 1. SessionStart Hook (`startup-prime.sh`)
- **Triggers on**: Beginning of each Claude Code session
- **Purpose**: Primes Claude with project context from CLAUDE.md
- **Actions**:
  - Checks if CLAUDE.md exists
  - Creates prime request if not recently primed (1 hour cooldown)
  - Reminds Claude about available subagents and active hooks
  - Sets focus on current development priorities

### 2. UserPromptSubmit Hook (`detect-shutdown.sh`)
- **Triggers on**: Every user message
- **Purpose**: Detects shutdown keywords in user messages
- **Keywords monitored**:
  - "closing claude", "shut down", "shutdown"
  - "goodbye", "bye", "see you later"
  - "done for today", "done for now"
  - "audit claude.md", "prune claude.md"

### 3. Stop Hook (`audit-claude-md.sh`)
- **Triggers on**: After Claude finishes responding
- **Purpose**: Checks if shutdown was detected and creates audit request
- **Actions**:
  - Creates backup of current CLAUDE.md
  - Generates audit request for Claude to process

## How It Works

### Session Startup
1. **New session starts**: SessionStart hook runs automatically
2. **Context check**: Verifies CLAUDE.md exists and hasn't been primed recently
3. **Prime request**: Creates request for Claude to review project context
4. **Claude reviews**: On first message, Claude internalizes project state

### Session Shutdown
1. **During conversation**: The system monitors your messages for shutdown-related keywords
2. **When shutdown detected**: A trigger file is created
3. **After Claude responds**: The Stop hook checks for the trigger
4. **If triggered**: Creates an audit request for the next session

## Manual Audit

You can manually trigger an audit at any time:

```bash
./.claude/hooks/manual-audit.sh
```

This will:
1. Backup the current CLAUDE.md
2. Create an audit request
3. Claude will process it on your next message

## File Structure

```
.claude/
├── hooks/
│   ├── startup-prime.sh      # Primes context on session start
│   ├── detect-shutdown.sh    # Monitors for shutdown keywords
│   ├── audit-claude-md.sh    # Handles audit trigger
│   └── manual-audit.sh       # Manual audit trigger
├── backups/                   # Automatic CLAUDE.md backups
│   └── CLAUDE_YYYYMMDD_HHMMSS.md
├── settings.json              # Hook configuration
├── .last-prime               # Tracks last prime time
├── .prime-request            # Temporary prime request file
└── .audit-request            # Temporary audit request file
```

## Customization

### Adding Shutdown Keywords

Edit `.claude/hooks/detect-shutdown.sh` and add keywords to the `SHUTDOWN_KEYWORDS` array:

```bash
SHUTDOWN_KEYWORDS=(
    "your-custom-keyword"
    # ... existing keywords
)
```

### Modifying Audit Criteria

Edit the audit request template in either:
- `.claude/hooks/audit-claude-md.sh` (automatic)
- `.claude/hooks/manual-audit.sh` (manual)

## Backup Policy

- Automatic backups are created before each audit
- Stored in `.claude/backups/` with timestamp
- Format: `CLAUDE_YYYYMMDD_HHMMSS.md`
- Consider periodically cleaning old backups

## Troubleshooting

### Hooks Not Triggering

1. Check hooks are executable:
```bash
chmod +x .claude/hooks/*.sh
```

2. Verify settings.json is properly formatted:
```bash
cat .claude/settings.json | jq .
```

3. Test manual trigger:
```bash
./.claude/hooks/manual-audit.sh
```

### Audit Not Processing

If Claude doesn't process the audit request:
1. Check for `.claude/.audit-request` file
2. Send any message to Claude to trigger processing
3. Manually request: "Please check for and process any audit requests"

## Security Notes

- Hooks execute shell commands with your user permissions
- Only use trusted scripts in hooks
- Review hook commands before enabling
- Keep `.claude/` directory in version control for transparency

## Best Practices

1. **Regular Audits**: Let the automatic system work on session end
2. **Manual Audits**: Use for major milestone completions
3. **Review Archives**: Periodically review CLAUDE_ARCHIVE.md for useful context
4. **Backup Management**: Clean old backups monthly
5. **Keyword Tuning**: Adjust shutdown keywords based on your habits

## Disabling Hooks

To temporarily disable hooks, rename or remove:
```bash
mv .claude/settings.json .claude/settings.json.disabled
```

To permanently remove:
```bash
rm -rf .claude/hooks
rm .claude/settings.json
```

---

*Note: These hooks are project-specific and only affect this repository.*