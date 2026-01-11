# Installation

## Quick Install (Recommended)

Most users only need the **Studio Plugin** and optionally the **VS Code Extension**. No command line required!

### Studio Plugin

Install from the [Roblox Creator Store](https://create.roblox.com/store/asset/105132526235830/RbxSync) - one click, automatic updates.

### VS Code Extension (Optional)

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rbxsync.rbxsync) or search "RbxSync" in Extensions.

::: tip That's it!
With just the plugins installed, you can sync between Studio and your filesystem. The CLI is only needed for advanced features like `rbxsync init`, `rbxsync build`, or running the sync server manually.
:::

---

## Advanced: CLI Installation

The CLI provides additional features like project initialization, building `.rbxl` files, and running the sync server. Only install if you need these features.

### Prerequisites

::: details macOS / Linux
```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart your terminal, then verify:
rustc --version
cargo --version
```
:::

::: details Windows
**Step 1:** Install Visual Studio Build Tools (REQUIRED for Rust)
- Download from [visualstudio.microsoft.com/visual-cpp-build-tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Run the installer
- Select **"Desktop development with C++"** workload
- Complete the installation (this may take 10-15 minutes)

**Step 2:** Install Rust
- Download from [rustup.rs](https://rustup.rs)
- Run `rustup-init.exe`
- Follow the prompts (default options are fine)

**Step 3:** Restart your terminal (important!) and verify:
```powershell
rustc --version
cargo --version
```
:::

### Build from Source

::: code-group

```bash [macOS / Linux]
# Clone and build
git clone https://github.com/devmarissa/rbxsync
cd rbxsync
cargo build --release

# Add to PATH (choose one):
# Option 1: Copy to system bin
sudo cp target/release/rbxsync /usr/local/bin/

# Option 2: Add to your shell profile (~/.zshrc or ~/.bashrc)
export PATH="$PATH:/path/to/rbxsync/target/release"
```

```powershell [Windows]
# Clone and build (in PowerShell or Git Bash)
git clone https://github.com/devmarissa/rbxsync
cd rbxsync
cargo build --release

# The executable is now at: target\release\rbxsync.exe
```

:::

### Adding to PATH on Windows

After building, you need to add `rbxsync.exe` to your PATH so you can run it from anywhere.

**Option A: Add folder to PATH (Recommended)**
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click **Advanced** tab → **Environment Variables**
3. Under "User variables", select **Path** and click **Edit**
4. Click **New** and add the full path to your `target\release` folder, e.g.:
   ```
   C:\Users\YourName\rbxsync\target\release
   ```
5. Click **OK** on all dialogs
6. **Restart your terminal** (close and reopen PowerShell)

**Option B: Copy to a folder already in PATH**
```powershell
# Run PowerShell as Administrator
Copy-Item target\release\rbxsync.exe C:\Windows\System32\
```

### Verify Installation

```bash
rbxsync version
```

You should see the version number and update check.

---

## Alternative Plugin Installation

If you can't use the Creator Store, here are other options:

**Download from GitHub**
1. Download `RbxSync.rbxm` from [GitHub Releases](https://github.com/devmarissa/rbxsync/releases)
2. Copy to your plugins folder:
   - **macOS:** `~/Documents/Roblox/Plugins/`
   - **Windows:** `%LOCALAPPDATA%\Roblox\Plugins\`

   ::: tip Finding the Windows plugins folder
   Press `Win + R`, paste `%LOCALAPPDATA%\Roblox\Plugins\`, and press Enter.
   :::

**Build from source** (requires CLI installed)
```bash
rbxsync build-plugin --install
```

---

## Alternative VS Code Extension Installation

**Download from GitHub**
1. Download `rbxsync-*.vsix` from [GitHub Releases](https://github.com/devmarissa/rbxsync/releases)
2. In VS Code: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
3. Type "Extensions: Install from VSIX"
4. Select the downloaded `.vsix` file

**Build from source** (requires Node.js)
```bash
cd rbxsync-vscode
npm install
npm run package
code --install-extension rbxsync-*.vsix
```

---

## Troubleshooting

### Windows: 'rbxsync' is not recognized

This means the CLI isn't in your PATH. Either:
- Follow the "Adding to PATH on Windows" steps above
- Or use the full path: `.\target\release\rbxsync.exe version`

### Windows: Build fails with linker errors

Make sure you installed Visual Studio Build Tools with the "Desktop development with C++" workload. Restart your terminal after installation.

### Plugin not appearing in Studio

1. Make sure you installed from Creator Store OR copied the `.rbxm` to the correct plugins folder
2. Restart Roblox Studio completely
3. Check the Plugins tab in the ribbon - you should see "RbxSync"

---

## Next Steps

- [Quick Start](/getting-started/quick-start) - Create your first project
