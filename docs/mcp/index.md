# MCP Integration

RbxSync includes an MCP (Model Context Protocol) server for AI agent integration.

## Overview

The MCP server lets AI agents like Claude:
- Extract games to files
- Sync changes to Studio
- Run code in Studio
- Execute playtests
- See console output
- Manage git operations

## Quick Start

1. Build the MCP server:
   ```bash
   cargo build --release
   ```

2. Configure Claude Desktop (see [Setup](/mcp/setup))

3. Connect Studio to RbxSync

4. Claude can now control your Roblox development!

## Available Tools

| Tool | Description |
|------|-------------|
| `extract_game` | Extract game to files |
| `sync_to_studio` | Push changes to Studio |
| `run_code` | Execute Luau in Studio |
| `run_test` | Run playtest with output |
| `git_status` | Get repository status |
| `git_commit` | Commit changes |

See [Tools](/mcp/tools) for full reference.

## Use Cases

### Autonomous Development
AI writes code, tests it, sees errors, fixes them - all without human intervention.

### Code Review
AI can extract the game, analyze code, and suggest improvements.

### Automated Testing
Run test suites and parse output programmatically.

### Asset Management
Create and modify instances through AI commands.

## Next Steps

- [Setup](/mcp/setup) - Configure Claude Desktop
- [Tools](/mcp/tools) - Complete tool reference
