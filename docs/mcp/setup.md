# MCP Setup

Configure your MCP client to use the RbxSync MCP server.

## Prerequisites

1. Build RbxSync with MCP support:
   ```bash
   cargo build --release
   ```

2. Locate the MCP binary:
   ```
   target/release/rbxsync-mcp
   ```

## MCP Client Configuration

Add the RbxSync MCP server to your client's configuration:

```json
{
  "mcpServers": {
    "rbxsync": {
      "command": "/path/to/rbxsync-mcp"
    }
  }
}
```

Replace `/path/to/rbxsync-mcp` with your actual path:

```json
{
  "mcpServers": {
    "rbxsync": {
      "command": "/Users/you/rbxsync/target/release/rbxsync-mcp"
    }
  }
}
```

## Verify Setup

1. Restart your MCP client
2. Start a new conversation
3. Ask: "What RbxSync tools do you have available?"

The AI should list the available MCP tools.

## Connecting to Studio

Before AI can use RbxSync tools:

1. Start the sync server: `rbxsync serve`
2. Open Studio with the RbxSync plugin
3. Connect the plugin to the server

Now your AI agent can control your Roblox development!

## Troubleshooting

### "MCP server not found"
- Check the path in config is correct
- Ensure the binary exists and is executable
- Try running the binary directly to test

### "Connection refused"
- Start the RbxSync server: `rbxsync serve`
- Connect the Studio plugin
- Check that port 44755 is not blocked

### Tools not appearing
- Restart your MCP client after config changes
- Check config JSON syntax is valid
