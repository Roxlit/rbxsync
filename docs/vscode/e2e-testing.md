# E2E Testing Mode

RbxSync's E2E (end-to-end) testing mode enables AI agents to run playtests and see console output in real-time.

## Overview

When E2E mode is enabled:
1. Console output streams to VS Code terminal
2. AI can see `print()`, `warn()`, and `error()` messages
3. Tests can be started/stopped programmatically
4. Errors are captured for automated debugging

## Enabling E2E Mode

In VS Code, run: `RbxSync: Toggle E2E Mode`

Or use the MCP server for programmatic control.

## Console Streaming

All Studio output appears in the VS Code terminal:

```
[INFO]  Player joined: Player1
[WARN]  Low memory warning
[ERROR] Script error on line 42
```

Messages are color-coded:
- **White** - print() info messages
- **Yellow** - warn() warnings
- **Red** - error() errors

## AI-Powered Workflow

This enables autonomous AI development:

1. **AI writes code** - Creates or modifies scripts
2. **AI syncs to Studio** - Pushes changes
3. **AI runs playtest** - Starts the test
4. **AI sees output** - Console streams to terminal
5. **AI fixes errors** - Reads errors and patches code
6. **AI iterates** - Repeats until tests pass

## MCP Integration

The MCP server provides tools for E2E testing:

```json
{
  "tool": "run_test",
  "arguments": {
    "mode": "play"
  }
}
```

See [MCP Tools](/mcp/tools) for full reference.

## Test Modes

| Mode | Description |
|------|-------------|
| `run` | Live playtest with streaming |
| `play` | Solo playtest (like F5) |
| `server` | Server simulation |

## Best Practices

1. **Clear console before tests** - Easier to parse output
2. **Use structured logging** - Makes AI parsing easier
3. **Add test assertions** - `error()` on failures
4. **Keep tests focused** - One behavior per test
