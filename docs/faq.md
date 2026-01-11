# Frequently Asked Questions

## Installation

### Windows: "linker `link.exe` not found" error

This error means you need to install the Visual Studio Build Tools before building RbxSync.

**Solution:**
1. Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Run the installer
3. Select **"Desktop development with C++"**
4. Complete installation and restart your terminal
5. Try `cargo build --release` again

::: tip Alternative: Use GNU toolchain
If you prefer not to install Visual Studio Build Tools, you can use the GNU toolchain:
```powershell
rustup default stable-x86_64-pc-windows-gnu
```
This requires [MSYS2](https://www.msys2.org/) with `pacman -S mingw-w64-x86_64-toolchain`
:::

### macOS: "command not found: rbxsync"

The binary isn't in your PATH. Either:
- Copy it: `cp target/release/rbxsync /usr/local/bin/`
- Or use the full path: `./target/release/rbxsync`

### Windows: "rbxsync is not recognized"

Add the binary to your PATH:
```powershell
# PowerShell as Admin:
Copy-Item target\release\rbxsync.exe C:\Windows\System32\
```
Or add `C:\path\to\rbxsync\target\release` to your PATH environment variable.

## Sync Issues

### Changes not syncing to Studio

1. **Check connection status** - The plugin widget should show green "Connected"
2. **Verify the path** - Make sure the project path in the plugin matches your actual project folder
3. **Restart the server** - Run `rbxsync stop` then `rbxsync serve`
4. **Check HttpService** - In Studio: Game Settings → Security → Allow HTTP Requests

### Script content not updating

If the plugin says "syncCreate success" but the script content doesn't change:

1. **Check for name mismatches** - The file name should match the instance name in Studio
2. **Try a full sync** - Run `rbxsync sync` from the CLI
3. **Delete and recreate** - Sometimes deleting the script in Studio and syncing again helps

### "Parent not found" errors

This usually means the parent folder doesn't exist in Studio. Make sure:
- The full path hierarchy exists in Studio
- Service names match (e.g., `ReplicatedStorage` not `replicatedstorage`)

## Plugin Issues

### Plugin not showing in Studio

1. **Restart Studio** - Always restart after installing/updating the plugin
2. **Check plugin folder** - Verify `RbxSync.rbxm` exists in:
   - macOS: `~/Documents/Roblox/Plugins/`
   - Windows: `%LOCALAPPDATA%\Roblox\Plugins\`
3. **Rebuild the plugin** - Run `rbxsync build-plugin --install`

### Plugin widget not appearing

1. Go to **View** menu in Studio
2. Look for **RbxSync** in the plugin widgets
3. Click to enable it

### "HttpService is not allowed" error

1. Open Studio's **Game Settings**
2. Go to **Security**
3. Enable **Allow HTTP Requests**

## Build Issues

### "Unknown property type" errors

Run `rbxsync fmt-project` to fix JSON formatting issues, or check the `.rbxjson` file for typos in property types.

### Build produces empty file

Make sure you have a valid `rbxsync.json` in your project root with the correct structure:
```json
{
  "name": "MyGame",
  "tree": {
    "$path": "src"
  }
}
```

## Performance

### Server using high CPU

The file watcher may be monitoring too many files. Add unnecessary directories to `.gitignore` or create a `.rbxsyncignore` file.

### Sync is slow for large games

Large games with many instances take longer to sync. Consider:
- Using selective sync for specific folders
- Breaking up large services into smaller modules

## Updating

### How do I update RbxSync?

```bash
rbxsync update
```

This pulls the latest code, rebuilds the CLI, and reinstalls the plugin. Remember to restart Studio after updating.

### How do I update the VS Code extension?

```bash
rbxsync update --vscode
code --install-extension rbxsync-vscode/rbxsync-1.0.0.vsix
```

Then restart VS Code.

## Still having issues?

1. Check the [Troubleshooting](/troubleshooting) guide
2. Run with debug logging: `RUST_LOG=debug rbxsync serve`
3. Join our Discord for help
4. [Open an issue on GitHub](https://github.com/devmarissa/rbxsync/issues)
