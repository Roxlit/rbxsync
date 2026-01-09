# Troubleshooting

Common issues and solutions.

## Server Issues

### Server won't start

**Symptom:** `rbxsync serve` fails or hangs.

**Solutions:**
1. Check if port is in use:
   ```bash
   lsof -i :44755
   ```
2. Stop existing server:
   ```bash
   rbxsync stop
   ```
3. Try a different port:
   ```bash
   rbxsync serve --port 44756
   ```

### Server starts but plugin can't connect

**Solutions:**
1. Verify server is running: `rbxsync status`
2. Check firewall settings
3. Ensure HttpService is enabled in Studio (Game Settings > Security)

## Plugin Issues

### Plugin not showing in toolbar

**Solutions:**
1. Restart Roblox Studio completely
2. Check plugin file exists:
   - **macOS**: `~/Documents/Roblox/Plugins/RbxSync.rbxm`
   - **Windows**: `%LOCALAPPDATA%\Roblox\Plugins\RbxSync.rbxm`
3. Rebuild and reinstall: `rbxsync build-plugin --install`

### "Not connected" error

**Solutions:**
1. Start the server: `rbxsync serve`
2. Check project path is correct in plugin
3. Enable HttpService in Game Settings > Security

### Changes not auto-extracting

**Solutions:**
1. Verify green connection indicator
2. Check changes are in tracked services
3. Look at VS Code output panel for errors
4. Restart connection

## Sync Issues

### Changes not syncing to Studio

**Solutions:**
1. Check connection status (green indicator)
2. Verify file is in `src/` directory
3. Check for syntax errors in .rbxjson files
4. Restart server and reconnect

### "Property not supported" error

**Solutions:**
1. Check property type is supported (see [Property Types](/file-formats/property-types))
2. Run `rbxsync fmt-project` to fix formatting
3. Verify JSON syntax is valid

## Build Issues

### Build fails with property errors

**Solutions:**
1. Format files: `rbxsync fmt-project`
2. Check the specific property in error message
3. Verify .rbxjson syntax

### Build output is empty

**Solutions:**
1. Check `rbxsync.json` exists
2. Verify `src/` directory has content
3. Check for parse errors in output

## VS Code Extension Issues

### Extension not activating

**Solutions:**
1. Check `rbxsync.json` exists in workspace
2. Reload VS Code window
3. Check extension is enabled

### Console not showing output

**Solutions:**
1. Enable E2E mode: `RbxSync: Toggle E2E Mode`
2. Open console: `RbxSync: Open Console`
3. Verify Studio plugin is connected

## Getting Help

If you're still stuck:

1. Check the [GitHub Issues](https://github.com/devmarissa/rbxsync/issues)
2. Join the [Discord server](https://discord.gg/rbxsync)
3. Run with debug logging:
   ```bash
   RUST_LOG=debug rbxsync serve
   ```
