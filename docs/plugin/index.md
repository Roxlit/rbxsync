# Studio Plugin

The RbxSync Studio plugin enables two-way sync between Roblox Studio and your file system.

## Features

- **Connect to Server** - Link to RbxSync server with one click
- **Extract Game** - Export all instances to version-controlled files
- **Sync from Files** - Push file changes to Studio
- **Auto-Extract** - Automatically extract changes made in Studio
- **Console Capture** - Stream print/warn/error to VS Code terminal

## Quick Start

1. Install the plugin: `rbxsync build-plugin --install`
2. Start the server: `rbxsync serve`
3. Open Studio and restart to load the plugin
4. Click RbxSync in the toolbar
5. Enter project path and click Connect

## UI Overview

```
┌─────────────────────────┐
│  RBXSYNC               │
│  Studio ↔ VS Code      │
├─────────────────────────┤
│  ● Connected           │  ← Connection status
│  [Disconnect]          │
├─────────────────────────┤
│  PROJECT               │
│  /Users/you/MyGame  ▾  │  ← Project path
├─────────────────────────┤
│  [⬆ Extract] [⬇ Sync]  │  ← Main actions
├─────────────────────────┤
│  MyGame (12345)        │  ← Place info
│  1,247 instances       │
└─────────────────────────┘
```

## Connection States

| State | Indicator | Description |
|-------|-----------|-------------|
| Disconnected | Gray dot | Server not running |
| Connected | Green dot | Ready for sync |
| Syncing | Pulsing cyan | Operation in progress |

## Next Steps

- [Installation](/plugin/installation) - Detailed install options
- [Usage](/plugin/usage) - Auto-extract, console capture
