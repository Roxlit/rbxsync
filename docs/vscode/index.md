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

## Next Steps

- [Commands](/vscode/commands) - All available commands
- [E2E Testing](/vscode/e2e-testing) - AI-powered development
