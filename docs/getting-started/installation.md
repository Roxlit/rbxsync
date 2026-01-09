# Installation

## 1. Build CLI from Source

```bash
git clone https://github.com/devmarissa/rbxsync
cd rbxsync
cargo build --release

# Add to PATH (optional)
cp target/release/rbxsync /usr/local/bin/
```

## 2. Install Studio Plugin

```bash
rbxsync build-plugin --install
```

The plugin will be installed to `~/Documents/Roblox/Plugins/RbxSync.rbxm`

## 3. Install VS Code Extension (Optional)

```bash
cd rbxsync-vscode
npm install
npm run build
npm run package

# Install the extension
code --install-extension rbxsync-1.0.0.vsix
```

Alternatively, in VS Code:
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type "Install from VSIX"
3. Select `rbxsync-1.0.0.vsix`

## Verify Installation

```bash
rbxsync version
```

You should see the version number and git commit hash.

## Next Steps

- [Quick Start](/getting-started/quick-start) - Create your first project
