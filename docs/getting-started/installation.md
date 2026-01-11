# Installation

RbxSync requires three components:
1. **CLI** - Runs the sync server (required)
2. **Studio Plugin** - Connects Roblox Studio to the server
3. **VS Code Extension** - Optional, provides editor integration

---

## 1. Install CLI (Required)

The CLI runs the sync server that bridges Studio and your filesystem.

::: details macOS / Linux
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart terminal, then clone and build
git clone https://github.com/devmarissa/rbxsync
cd rbxsync
cargo build --release

# Add to PATH
sudo cp target/release/rbxsync /usr/local/bin/

# Verify
rbxsync version
```
:::

::: details Windows (Step by Step)

### Step 1: Install Visual Studio Build Tools

1. Download from [visualstudio.microsoft.com/visual-cpp-build-tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Run the installer
3. Select **"Desktop development with C++"** workload
4. Click Install (takes 10-15 minutes)

### Step 2: Install Rust

1. Download from [rustup.rs](https://rustup.rs)
2. Run `rustup-init.exe`
3. Follow prompts (default options are fine)
4. **Close and reopen your terminal** (important!)

### Step 3: Build RbxSync

Open PowerShell and run:

```powershell
git clone https://github.com/devmarissa/rbxsync
cd rbxsync
cargo build --release
```

### Step 4: Add to PATH

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click the **Advanced** tab
3. Click **Environment Variables**
4. Under "User variables for [YourName]", find and select **Path**
5. Click **Edit**
6. Click **New**
7. Paste the full path to your `target\release` folder, for example:
   ```
   C:\Users\YourName\rbxsync\target\release
   ```
8. Click **OK** on all three dialogs
9. **Close and reopen PowerShell**

### Step 5: Verify

```powershell
rbxsync version
```

You should see the version number and an update check.

::: warning 'rbxsync' is not recognized?
If you get this error, the PATH wasn't set correctly. Double-check Step 4, or use the full path:
```powershell
.\target\release\rbxsync.exe version
```
:::

:::

---

## 2. Install Studio Plugin

Choose one option:

**Option A: Roblox Creator Store (Recommended)**

Install from the [Roblox Creator Store](https://create.roblox.com/store/asset/105132526235830/RbxSync) - one click, automatic updates.

**Option B: Download from GitHub**

1. Download `RbxSync.rbxm` from [GitHub Releases](https://github.com/devmarissa/rbxsync/releases)
2. Copy to your plugins folder:
   - **macOS:** `~/Documents/Roblox/Plugins/`
   - **Windows:** `%LOCALAPPDATA%\Roblox\Plugins\`

::: tip Finding the Windows plugins folder
Press `Win + R`, paste `%LOCALAPPDATA%\Roblox\Plugins\`, and press Enter.
:::

**Option C: Build from source**

```bash
rbxsync build-plugin --install
```

---

## 3. Install VS Code Extension (Optional)

**Option A: VS Code Marketplace (Recommended)**

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rbxsync.rbxsync) or search "RbxSync" in the Extensions panel.

The extension will automatically run `rbxsync serve` when you connect.

**Option B: Download from GitHub**

1. Download `rbxsync-*.vsix` from [GitHub Releases](https://github.com/devmarissa/rbxsync/releases)
2. In VS Code: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
3. Type "Extensions: Install from VSIX"
4. Select the downloaded `.vsix` file

---

## Troubleshooting

### Windows: 'rbxsync' is not recognized

The CLI isn't in your PATH. Either:
- Follow the "Add to PATH" steps above carefully
- Or use the full path: `.\target\release\rbxsync.exe`

### Windows: Build fails with linker errors

Make sure you installed Visual Studio Build Tools with the **"Desktop development with C++"** workload. Restart your terminal after installation.

### Windows: cargo not found

Restart your terminal after installing Rust. If it still doesn't work, run the Rust installer again.

### Plugin not appearing in Studio

1. Restart Roblox Studio completely (not just the place)
2. Check the Plugins tab in the ribbon
3. If using manual install, verify the `.rbxm` file is in the correct plugins folder

### Server won't start

- Check if port 44755 is already in use: `lsof -i :44755` (Mac) or `netstat -an | findstr 44755` (Windows)
- Try stopping existing server: `rbxsync stop`

---

## Next Steps

- [Quick Start](/getting-started/quick-start) - Create your first project
