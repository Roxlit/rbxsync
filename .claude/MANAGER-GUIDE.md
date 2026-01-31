# RbxSync Manager Guide

## Key Resources (Check First)

Before starting work, check these Linear documents for context:

```python
# List all org documents
list_documents(project: "Org")
```

| Document | Slug | Purpose |
|----------|------|---------|
| Product Roadmap | `95626ede2b8f` | Current version, sprint goals, backlog |
| Product Vision | `7754d759201a` | Why RbxSync exists, target users |
| Architecture Overview | `e5328598ea17` | System design, component relationships |
| Release Checklist | `5320d3608d73` | Pre-release steps |
| AI Agent Guidelines | `0685683745f1` | How AI agents should work with Linear |
| Smokestack Entity Structure | `2fb68bc66c86` | Org hierarchy (Smokestack > RbxSync) |
| Multi-Agent Architecture | `027a0e173566` | Agent hierarchy, handoff protocols |
| Key Metrics & KPIs | `f5787cb2423e` | What we track, review cadence |

### Quick Context Commands

```python
# Current sprint issues
list_issues(team: "RbxSync", cycle: "1")

# What's in progress
list_issues(team: "RbxSync", state: "In Progress")

# Recent updates to roadmap
get_document(id: "95626ede2b8f")
```

---

## Spawning Workers

**ALWAYS use worktrees** - even for single workers. This prevents accidents if you spawn another worker later.

### Standard Worker Prompt (Default)

```bash
claude "Read CLAUDE.md. DO NOT run ralph-loop.

ISSUE: RBXSYNC-XX - [title]

## Setup
cd /Users/marissacheves/rbxsync
git fetch origin
git worktree add /tmp/rbxsync-XX -b fix/rbxsync-XX-description origin/master
cd /tmp/rbxsync-XX

## Task
[task details]

## When Done
1. git add . && git commit -m 'fix: description (Fixes RBXSYNC-XX)'
2. git push -u origin fix/rbxsync-XX-description
3. gh pr create --title 'Fix: description' --body 'Fixes RBXSYNC-XX'
4. cd /Users/marissacheves/rbxsync && git worktree remove /tmp/rbxsync-XX
5. EXIT"
```

### Why Always Worktrees?

1. **Safe by default** - No conflicts even if you forget and spawn another worker
2. **Isolated changes** - Each worker has its own directory and branch
3. **Clean main repo** - Main rbxsync directory stays on master
4. **Easy cleanup** - `git worktree remove` cleans up completely

### CRITICAL: Keep Main Repo on Master

The main `/Users/marissacheves/rbxsync` directory must ALWAYS stay on `master`. If it drifts to a feature branch, builds won't include merged changes.

**After merging PRs, always run:**
```bash
cd /Users/marissacheves/rbxsync
git checkout master
git pull origin master
```

**Session start checklist:**
```bash
# Verify main repo is on master with latest
cd /Users/marissacheves/rbxsync
git checkout master
git pull origin master
git worktree list  # Should only show main repo
```

**If main repo is on wrong branch:**
```bash
git stash  # If needed
git checkout master
git pull origin master
```

---

## Branch Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Bug fix | `fix/rbxsync-XX-description` | `fix/rbxsync-71-terminal-reuse` |
| Feature | `feat/rbxsync-XX-description` | `feat/rbxsync-46-harness-tools` |
| Docs | `docs/rbxsync-XX-description` | `docs/rbxsync-63-mcp-reference` |
| Chore | `chore/rbxsync-XX-description` | `chore/rbxsync-67-warnings` |

---

## Linear MCP - Complete Usage Guide

### Issues

```python
# List issues by state/project/assignee
list_issues(team: "RbxSync", state: "Backlog", project: "Core Platform")
list_issues(team: "RbxSync", assignee: "me", state: "In Progress")

# Get full issue details
get_issue(id: "RBXSYNC-XX", includeRelations: true)

# Create issue with all metadata
create_issue(
    title: "Bug: Something is broken",
    team: "RbxSync",
    description: "## Problem\n...",
    labels: ["Bug", "server"],
    project: "Core Platform",
    priority: 2,  # 1=Urgent, 2=High, 3=Normal, 4=Low
    cycle: "1",   # Sprint number
    assignee: "me",
    blocks: ["RBXSYNC-YY"],
    relatedTo: ["RBXSYNC-ZZ"],
    links: [{"url": "https://github.com/.../pull/99", "title": "PR #99"}]
)

# Update issue
update_issue(
    id: "RBXSYNC-XX",
    state: "Done",
    cycle: "1",
    blocks: ["RBXSYNC-YY"],
    links: [{"url": "...", "title": "..."}]
)
```

### Comments (Progress Tracking)

```python
# Add progress comment
create_comment(
    issueId: "RBXSYNC-XX",
    body: "Started work. Found root cause in server.rs:450."
)

# Add completion comment
create_comment(
    issueId: "RBXSYNC-XX",
    body: "Completed via PR #99. Tested locally, CI passing."
)

# List comments on issue
list_comments(issueId: "RBXSYNC-XX")
```

### Documents

```python
# List all documents
list_documents(project: "Org", limit: 20)

# Get document by ID or slug
get_document(id: "95626ede2b8f")

# Create document
create_document(
    title: "Sprint 1 Retrospective",
    project: "Org",
    content: "## What went well\n...",
    icon: ":memo:"
)

# Update document (e.g., keep roadmap current)
update_document(
    id: "bc90b36b-...",
    content: "## Updated content..."
)
```

### Cycles (Sprints)

```python
# List cycles for team
list_cycles(teamId: "662de2f6-0d03-4b4d-823a-805442e62552")

# Assign issue to cycle
update_issue(id: "RBXSYNC-XX", cycle: "1")  # Sprint 1
```

### Projects

```python
# List projects
list_projects(team: "RbxSync")

# Get project details
get_project(query: "Core Platform")

# Create project
create_project(
    name: "v1.4 Release",
    team: "RbxSync",
    description: "...",
    state: "planned"
)
```

### Labels

```python
# List labels
list_issue_labels(team: "RbxSync")

# Create label
create_issue_label(
    name: "needs-review",
    color: "#FF6B6B",
    teamId: "662de2f6-0d03-4b4d-823a-805442e62552"
)
```

### Users

```python
# List users
list_users(team: "RbxSync")

# Get user (for assignment)
get_user(query: "me")
```

---

## Manager Workflows

### When Starting Work on Issue

1. **Update issue status**
   ```python
   update_issue(id: "RBXSYNC-XX", state: "In Progress", assignee: "me")
   ```

2. **Add start comment**
   ```python
   create_comment(issueId: "RBXSYNC-XX", body: "Manager starting work on this issue.")
   ```

### When Worker Completes PR

1. **Add PR link to issue**
   ```python
   update_issue(
       id: "RBXSYNC-XX",
       links: [{"url": "https://github.com/Smokestack-Games/rbxsync/pull/99", "title": "PR #99"}]
   )
   ```

2. **Add completion comment**
   ```python
   create_comment(issueId: "RBXSYNC-XX", body: "PR #99 merged. Issue resolved.")
   ```

3. **Mark issue done**
   ```python
   update_issue(id: "RBXSYNC-XX", state: "Done")
   ```

### Weekly Roadmap Update

1. **Update Product Roadmap document**
   ```python
   update_document(id: "bc90b36b-3ecd-449b-8171-506b73743592", content: "...")
   ```

2. **Review cycle progress**
   ```python
   list_issues(team: "RbxSync", cycle: "1", state: "Done")  # Completed
   list_issues(team: "RbxSync", cycle: "1", state: "In Progress")  # Active
   ```

### Sprint Planning

1. **Assign issues to cycle**
   ```python
   update_issue(id: "RBXSYNC-69", cycle: "1")
   update_issue(id: "RBXSYNC-70", cycle: "1")
   ```

2. **Set priorities**
   ```python
   update_issue(id: "RBXSYNC-69", priority: 2)  # High
   ```

3. **Add dependencies**
   ```python
   update_issue(id: "RBXSYNC-51", blockedBy: ["RBXSYNC-69"])
   ```

---

## Project IDs (for Linear)

| Project | ID |
|---------|-----|
| Core Platform | `74667d23-559f-41df-a4e7-8809e67a303f` |
| AI Integration | `2d9c033d-d5e4-44d0-b144-1708e77396de` |
| Developer Experience | `ef8ba027-7466-46f6-8d13-92358965630e` |
| Commercialization | `e7cfd4f3-2cbe-4def-a4f2-52c1d83f8ad1` |
| Growth | `09168854-0b5f-40b4-bc9b-32a604978a3f` |
| Org | `06654db7-d197-4118-848a-43fce7911d04` |
| Bug Bash | `0ba9a594-da64-4c8b-9373-bf7d6ecd765f` |
| v1.2 Release | `43d74dea-92d4-48d6-9210-85b79305a14e` |

## Cycle IDs

| Cycle | ID | Dates |
|-------|-----|-------|
| Sprint 1 | `d3732880-921c-4318-86a8-118bd28809da` | Jan 19 - Feb 2 |
| Sprint 2 | `b46cb82d-64e9-4066-a74d-56a209aeea1a` | Feb 2 - Feb 16 |

## Team ID
- RbxSync: `662de2f6-0d03-4b4d-823a-805442e62552`

---

## Key Documents in Linear

| Document | Slug | Purpose |
|----------|------|---------|
| Product Roadmap | `95626ede2b8f` | Overall roadmap, update weekly |
| Product Vision | `7754d759201a` | Why RbxSync exists |
| Architecture Overview | `e5328598ea17` | System design |
| Release Checklist | `5320d3608d73` | Pre-release steps |
| AI Agent Guidelines | `0685683745f1` | How AI should work |
| v1.2 Release Roadmap | `74c8b598838a` | Historical |

---

## GitHub Commands

```bash
# List open PRs
gh pr list --state open

# View PR details
gh pr view XX

# Merge PR (squash)
gh pr merge XX --squash --admin

# Check CI status
gh pr checks XX

# List worktrees
git worktree list

# Clean up stale worktree
git worktree remove /tmp/rbxsync-XX --force
```

---

## Worker State Tracking

Keep `.claude/state/workers.json` updated:

```json
{
  "active_workers": [
    {"issue": "RBXSYNC-XX", "task": "Description", "worktree": "/tmp/rbxsync-XX"}
  ],
  "pending_merge": [
    {"issue": "RBXSYNC-YY", "pr": 99}
  ],
  "completed_this_session": [
    {"issue": "RBXSYNC-ZZ", "pr": 98, "merged": true}
  ]
}
```

---

## Checklist: Full Linear Utilization

When creating/updating issues, always consider:

- [ ] **State** - Backlog → In Progress → Done
- [ ] **Project** - Which project does this belong to?
- [ ] **Cycle** - Assign to current sprint if planned for it
- [ ] **Priority** - 1=Urgent, 2=High, 3=Normal, 4=Low
- [ ] **Labels** - Bug, Feature, Improvement, Chore, Documentation + component
- [ ] **Assignee** - Who's working on it?
- [ ] **Relations** - blocks, blockedBy, relatedTo, duplicateOf
- [ ] **Links** - PR URLs, external references
- [ ] **Comments** - Progress updates, handoff notes

---

*Last updated: 2026-01-18*
