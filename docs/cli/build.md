# Build Commands

RbxSync can compile your project to various Roblox formats.

## Output Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| Binary Place | `.rbxl` | Standard place file |
| Binary Model | `.rbxm` | Model/asset file |
| XML Place | `.rbxlx` | Human-readable place |
| XML Model | `.rbxmx` | Human-readable model |

## Basic Build

```bash
# Default: builds to build/MyGame.rbxl
rbxsync build

# Specify format
rbxsync build -f rbxm

# Specify output path
rbxsync build -o dist/game.rbxl
```

## Watch Mode

Automatically rebuild when files change:

```bash
rbxsync build --watch
```

Press `Ctrl+C` to stop watching.

## Plugin Build

Build directly to Studio's plugins folder:

```bash
rbxsync build --plugin MyPlugin.rbxm
```

This builds and copies to:
- **macOS**: `~/Documents/Roblox/Plugins/`
- **Windows**: `%LOCALAPPDATA%\Roblox\Plugins\`

## Build Output

```
Building project...
  Reading rbxsync.json
  Processing 1,247 instances
  Writing build/MyGame.rbxl
Done in 0.8s
```

## CI/CD Usage

For continuous integration:

```bash
# Build and check formatting
rbxsync fmt-project --check
rbxsync build -o artifacts/game.rbxl
```

Exit code is non-zero if build fails.
