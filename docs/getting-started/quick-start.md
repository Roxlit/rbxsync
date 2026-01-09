# Quick Start

Get your first project syncing in under 5 minutes.

## Initialize Project

```bash
rbxsync init --name MyGame
```

This creates a project structure:

```
MyGame/
├── rbxsync.json          # Project configuration
├── src/                  # Instance tree
│   ├── Workspace/
│   ├── ReplicatedStorage/
│   ├── ServerScriptService/
│   └── ...
└── sourcemap.json        # For Luau LSP
```

## Start the Server

```bash
rbxsync serve
```

The server runs on port 44755 by default.

## Connect Studio

1. Open Roblox Studio
2. Restart Studio if you just installed the plugin
3. Click the RbxSync button in the toolbar
4. Enter your project path (e.g., `/Users/you/MyGame`)
5. Click **Connect**

You should see a green connection indicator.

## Extract Your Game

If you have an existing game, click **Extract** in the plugin to convert it to files:

1. Open your existing game in Studio
2. Connect to RbxSync
3. Click **Extract**
4. Your entire game is now version-controlled files

## Sync Changes

Edit files in VS Code. Changes sync to Studio automatically when connected.

Or manually sync:

```bash
rbxsync sync
```

## What's Next?

- [CLI Commands](/cli/commands) - Full command reference
- [File Formats](/file-formats/) - Understand .luau and .rbxjson files
- [E2E Testing](/vscode/e2e-testing) - AI-powered development
