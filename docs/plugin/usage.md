# Plugin Usage

## First Time Setup

1. Start the RbxSync server: `rbxsync serve`
2. Open Roblox Studio
3. Click the RbxSync button in the toolbar
4. Enter your project path (e.g., `/Users/you/MyGame`)
5. Click **Connect**

## Extracting Your Game

Extract converts your entire game to files:

1. Open your game in Studio
2. Connect to RbxSync
3. Click **Extract**
4. Wait for extraction to complete
5. Your files appear in the `src/` folder

## Syncing Changes

When you edit files in VS Code, changes sync automatically.

To manually sync:
1. Click **Sync** in the plugin
2. Or run `rbxsync sync` in terminal

## Auto-Extract

When connected, changes you make in Studio automatically extract to files:

- Creating a new script
- Editing script source
- Deleting instances
- Modifying properties

Changes are debounced (300ms) to batch rapid edits.

### Tracked Services

Auto-extract monitors these services:
- Workspace
- ReplicatedStorage
- ReplicatedFirst
- ServerScriptService
- ServerStorage
- StarterGui
- StarterPack
- StarterPlayer
- Lighting
- SoundService

## Console Capture

When connected, all `print()`, `warn()`, and `error()` output streams to VS Code.

This enables:
- Real-time debugging
- AI agents seeing test output
- Remote error monitoring

## Button States

**Sync Button:**
- Idle: Gray background
- Syncing: Cyan with pulse
- Success: Brief green flash

**Extract Button:**
- Active: Cyan when connected
- Disabled: Dimmed when disconnected
