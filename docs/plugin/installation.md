# Plugin Installation

## Option 1: Build from Source (Recommended)

```bash
# From the rbxsync root directory
rbxsync build-plugin --install
```

This builds `RbxSync.rbxm` and copies it to your Studio plugins folder.

## Option 2: Manual Install

1. Build the plugin:
   ```bash
   rojo build plugin/default.project.json -o build/RbxSync.rbxm
   ```

2. Copy `build/RbxSync.rbxm` to:
   - **macOS**: `~/Documents/Roblox/Plugins/`
   - **Windows**: `%LOCALAPPDATA%\Roblox\Plugins\`

## Option 3: Creator Store

Coming soon - will be available on the Roblox Creator Store.

## Verify Installation

1. Open Roblox Studio
2. Look for the RbxSync button in the toolbar
3. If not visible, restart Studio

## Updating the Plugin

When new versions are released:

```bash
rbxsync update
```

This pulls the latest code and rebuilds the plugin. Restart Studio to load the update.

## Troubleshooting

### Plugin not showing in toolbar
- Ensure the file is in the correct plugins folder
- Restart Roblox Studio completely
- Check Studio's Output window for errors

### "Plugin failed to load" error
- Rebuild from source: `rbxsync build-plugin --install`
- Check for corrupted .rbxm file
