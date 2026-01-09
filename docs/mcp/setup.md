# MCP Setup

Configure Claude Desktop to use the RbxSync MCP server.

## Prerequisites

1. Build RbxSync with MCP support:
   ```bash
   cargo build --release
   ```

2. Locate the MCP binary:
   ```
   target/release/rbxsync-mcp
   ```

## Claude Desktop Configuration

Edit your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the RbxSync MCP server:

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

1. Restart Claude Desktop
2. Start a new conversation
3. Ask Claude: "What RbxSync tools do you have available?"

Claude should list the available MCP tools.

## Connecting to Studio

Before AI can use RbxSync tools:

1. Start the sync server: `rbxsync serve`
2. Open Studio with the RbxSync plugin
3. Connect the plugin to the server

Now Claude can control your Roblox development!

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
- Restart Claude Desktop after config changes
- Check config JSON syntax is valid
