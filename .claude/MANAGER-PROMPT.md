# RbxSync Manager Prompt

Copy this to start a new manager session:

---

```
Read CLAUDE.md and .claude/MANAGER-GUIDE.md. You are the manager agent for RbxSync.

## Current State (as of 2026-01-16)

### Recently Completed
- Bug bash complete (20+ PRs merged)
- Harness system Phase 1-2 merged (PR #72)
- MCP run_code/insert_model restored with obfuscation
- AI testing docs merged (PR #75)
- License field fixed (PR #76)
- .claude/ removed from public repo (gitignored)

### Active Work
- PR #77 (file icons) - IN PROGRESS, do not interfere
- Workers may be running - check .claude/state/workers.json

### Linear Structure
Projects:
- Core Platform - server, plugin, sync engine
- AI Integration - harness, MCP, bot testing
- Developer Experience - VS Code, CLI, docs
- Commercialization - licensing, pricing strategy
- Growth - marketing, SEO, community
- Org - company docs

Sprint 1 (Jan 19 → Feb 2):
- RBXSYNC-46: Harness MCP tools (High)
- RBXSYNC-44: AI testing docs (High) ✅ DONE
- RBXSYNC-54: File icons (Medium) - IN PROGRESS
- RBXSYNC-48: Commercialization strategy (Medium)

### Key Commands
```bash
# Check workers
cat .claude/state/workers.json

# Check open PRs
gh pr list --state open

# Check Linear issues
# Use Linear MCP tools: list_issues, get_issue, update_issue

# Spawn worker
claude "Read CLAUDE.md. git pull origin master. DO NOT run ralph-loop.
ISSUE: RBXSYNC-XX - [title]
[task details]
When done: branch, commit, PR, report. Then EXIT."
```

### Manager Responsibilities
1. Track worker progress via .claude/state/workers.json
2. Review and merge PRs when ready
3. Update Linear issue status
4. Create issues for new work
5. Maintain sprint cycle
6. Don't interfere with active worker tasks

What would you like to work on?
```

---

## Quick Reference

### Spawning Workers
```bash
claude "Read CLAUDE.md. git pull origin master. DO NOT run ralph-loop.

ISSUE: RBXSYNC-XX - [title]

[detailed task description]

When done: branch, commit, PR, report. Then EXIT."
```

### Linear MCP Tools
- `list_issues` - Get issues by team/state/project
- `get_issue` - Get single issue details
- `create_issue` - Create new issue
- `update_issue` - Update status/project/cycle/priority
- `list_projects` - List all projects
- `list_cycles` - List sprint cycles

### GitHub Commands
```bash
gh pr list --state open
gh pr view XX
gh pr merge XX --squash --admin
gh issue list --state open
gh issue close XX --comment "reason"
```

### Project IDs (for Linear)
- Core Platform: 74667d23-559f-41df-a4e7-8809e67a303f
- AI Integration: 2d9c033d-d5e4-44d0-b144-1708e77396de
- Developer Experience: ef8ba027-7466-46f6-8d13-92358965630e
- Commercialization: e7cfd4f3-2cbe-4def-a4f2-52c1d83f8ad1
- Growth: 09168854-0b5f-40b4-bc9b-32a604978a3f

### Cycle 1 UUID
d3732880-921c-4318-86a8-118bd28809da
