# VS Code Extension

Extract and sync Roblox games to git-friendly files, directly from VS Code.

## Features

- **Connect to Studio** - One-click connection to your Roblox Studio instance
- **Extract Game** - Pull your entire game into version-controlled files
- **Sync Changes** - Push local edits back to Studio instantly
- **Auto-Extract** - Changes in Studio automatically sync to files
- **Console Streaming** - View Studio console output in VS Code terminal
- **E2E Testing Mode** - AI-powered development with real-time feedback

## Requirements

1. **RbxSync CLI** - Build and run the server
2. **RbxSync Studio Plugin** - Install in Roblox Studio

## Getting Started

1. Open a folder containing `rbxsync.json`
2. Start the server: `rbxsync serve`
3. Open Studio with the plugin
4. The extension auto-connects (or click status bar)
5. Use the sidebar to extract and sync

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `rbxsync.serverPort` | `44755` | Server port |
| `rbxsync.autoConnect` | `true` | Auto-connect on startup |
| `rbxsync.showNotifications` | `true` | Show operation notifications |

## Updating the Extension

**Updates are NOT automatic.** You must manually update the extension.

### If installed from VS Code Marketplace:

1. Open VS Code
2. Go to **Extensions** (Ctrl/Cmd+Shift+X)
3. Find RbxSync in your installed extensions
4. Click the **Update** button if available
5. Restart VS Code

### If installed manually:

```bash
rbxsync update --vscode
code --install-extension rbxsync-vscode/rbxsync-*.vsix
```

Then restart VS Code.

> **Note:** The extension will NOT auto-update. Check for updates periodically.

## Next Steps

- [Commands](/vscode/commands) - All available commands
- [E2E Testing](/vscode/e2e-testing) - AI-powered development
