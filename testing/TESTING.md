# RbxSync Testing Guide

This guide ensures all RbxSync features work correctly before release. Each test references the relevant documentation to verify both functionality AND docs accuracy.

## Quick Start

```bash
# Run all automated tests
cd /Users/marissacheves/rbxsync/testing
./scripts/run-all-tests.sh

# Or run individual test suites
./scripts/test-cli.sh
./scripts/test-migration.sh
./scripts/test-sync.sh
```

---

## Test Environment Setup

### Prerequisites
- Roblox Studio installed
- VS Code installed (optional, for extension tests)
- RbxSync CLI built: `cargo build --release`
- Plugin installed: `./target/release/rbxsync build-plugin --install`

### Test Projects Location
All test projects are in `/Users/marissacheves/rbxsync/testing/projects/`:

| Project | Purpose |
|---------|---------|
| `rojo-game/` | Rojo migration testing |
| `complex-game/` | Large extraction/sync testing |
| `simple-game/` | Basic functionality testing |
| `edge-cases/` | Unicode, special chars, deep nesting |

---

## Test Suite 1: CLI Commands

**Documentation Reference:** [CLI Commands](/docs/cli/commands.md)

### 1.1 Init Command
```bash
# Test: rbxsync init creates proper structure
cd /tmp && rm -rf test-init && mkdir test-init && cd test-init
rbxsync init --name "TestGame"

# Verify (all should exist):
[ -f "rbxsync.json" ] && echo "✅ rbxsync.json exists" || echo "❌ Missing rbxsync.json"
[ -d "src" ] && echo "✅ src/ exists" || echo "❌ Missing src/"
[ -f "sourcemap.json" ] && echo "✅ sourcemap.json exists" || echo "❌ Missing sourcemap.json"

# Verify config content
cat rbxsync.json | grep '"name": "TestGame"' && echo "✅ Name correct" || echo "❌ Name wrong"

# Cleanup
cd ~ && rm -rf /tmp/test-init
```

**Expected:** Creates rbxsync.json, src/, sourcemap.json
**Docs say:** "Creates `rbxsync.json` and the `src/` directory structure."

### 1.2 Serve Command (Foreground)
```bash
# Test: Server starts and responds
rbxsync serve --port 44756 &
SERVER_PID=$!
sleep 2

# Verify health endpoint
HEALTH=$(curl -s http://localhost:44756/health)
echo "$HEALTH" | grep '"status":"ok"' && echo "✅ Health OK" || echo "❌ Health failed"

# Cleanup
kill $SERVER_PID 2>/dev/null
```

**Expected:** Server responds with `{"status":"ok","version":"X.X.X"}`
**Docs say:** "The server runs on port 44755 by default."

### 1.3 Serve Command (Background)
```bash
# Test: Background mode works
rbxsync serve --background --port 44757

# Verify it's running
sleep 2
curl -s http://localhost:44757/health | grep '"status":"ok"' && echo "✅ Background server running" || echo "❌ Background server failed"

# Verify stop works
rbxsync stop
sleep 1
curl -s http://localhost:44757/health 2>&1 | grep -q "Connection refused" && echo "✅ Server stopped" || echo "❌ Server still running"
```

**Expected:** Server runs in background, stop command works
**Docs say:** "Run in background mode for a cleaner terminal"

### 1.4 Server Info Endpoint
```bash
# Test: Server info endpoint returns cwd
cd /tmp
rbxsync serve --background --port 44758
sleep 2

INFO=$(curl -s http://localhost:44758/rbxsync/server-info)
echo "$INFO" | grep '"cwd":"/tmp"' && echo "✅ CWD correct" || echo "❌ CWD wrong: $INFO"
echo "$INFO" | grep '"version"' && echo "✅ Version present" || echo "❌ Version missing"

rbxsync stop
```

**Expected:** Returns `{"cwd":"/tmp","version":"X.X.X"}`
**Docs say:** "The project path auto-populates from the server's working directory"

### 1.5 Version Command
```bash
# Test: Version displays correctly
VERSION_OUTPUT=$(rbxsync version)
echo "$VERSION_OUTPUT" | grep -E "^rbxsync [0-9]+\.[0-9]+\.[0-9]+" && echo "✅ Version format OK" || echo "❌ Version format wrong"
```

---

## Test Suite 2: Migration

**Documentation Reference:** [Configuration - Migrating from Rojo](/docs/getting-started/configuration.md)

### 2.1 Basic Rojo Migration
```bash
# Use test project
cd /Users/marissacheves/rbxsync/testing/projects/rojo-game
rm -f rbxsync.json  # Clean slate

# Run migration
rbxsync migrate

# Verify rbxsync.json created
[ -f "rbxsync.json" ] && echo "✅ rbxsync.json created" || echo "❌ Migration failed"

# Verify mappings
cat rbxsync.json | grep '"ServerScriptService": "src/server"' && echo "✅ SSS mapping correct" || echo "❌ SSS mapping wrong"
cat rbxsync.json | grep '"ReplicatedStorage": "src/shared"' && echo "✅ RS mapping correct" || echo "❌ RS mapping wrong"
cat rbxsync.json | grep '"StarterPlayer/StarterPlayerScripts": "src/client"' && echo "✅ Client mapping correct" || echo "❌ Client mapping wrong"
```

**Expected:** Creates rbxsync.json with correct treeMapping
**Docs say:** "This reads your `default.project.json` and creates an equivalent `rbxsync.json`"

### 2.2 Migration --force Flag
```bash
cd /Users/marissacheves/rbxsync/testing/projects/rojo-game

# First migration
rbxsync migrate --force

# Modify the file
echo '{"name":"Modified"}' > rbxsync.json

# Try without --force (should fail)
rbxsync migrate 2>&1 | grep -q "already exists" && echo "✅ Blocked without --force" || echo "❌ Should have blocked"

# Try with --force (should succeed)
rbxsync migrate --force
cat rbxsync.json | grep '"name": "RojoTestGame"' && echo "✅ --force overwrote" || echo "❌ --force failed"
```

**Expected:** Without --force fails, with --force succeeds
**Docs say:** "Use --force to overwrite existing rbxsync.json"

### 2.3 Migration Path Option
```bash
# Test --path option
cd /tmp
rbxsync migrate --path /Users/marissacheves/rbxsync/testing/projects/rojo-game --force

# Should have created in rojo-game, not /tmp
[ ! -f "/tmp/rbxsync.json" ] && echo "✅ Didn't create in /tmp" || echo "❌ Created in wrong location"
[ -f "/Users/marissacheves/rbxsync/testing/projects/rojo-game/rbxsync.json" ] && echo "✅ Created in correct path" || echo "❌ Missing from correct path"
```

---

## Test Suite 3: Sync & Extraction

**Documentation Reference:** [Plugin Usage](/docs/plugin/usage.md)

### 3.1 Manual Sync Test (Requires Studio)

**Setup:**
1. Start server: `cd /Users/marissacheves/rbxsync/testing/projects/simple-game && rbxsync serve`
2. Open Roblox Studio (new place)
3. Connect plugin to `testing/projects/simple-game`

**Test Steps:**

| # | Action | Expected | Verify |
|---|--------|----------|--------|
| 1 | Create Script in ServerScriptService | File appears in `src/ServerScriptService/` | `ls src/ServerScriptService/` |
| 2 | Name it "TestScript" | File named `TestScript.server.luau` | Check filename |
| 3 | Add code: `print("Hello")` | File contains the code | `cat src/ServerScriptService/TestScript.server.luau` |
| 4 | Delete the script | File removed from disk | `ls src/ServerScriptService/` |
| 5 | Create ModuleScript | File ends in `.luau` (no .server/.client) | Check filename |
| 6 | Create LocalScript | File ends in `.client.luau` | Check filename |

**Docs say:** "Changes you make in Studio automatically extract to files"

### 3.2 File-to-Studio Sync Test

**Setup:** Same as 3.1

**Test Steps:**

| # | Action | Expected |
|---|--------|----------|
| 1 | Create `src/ServerScriptService/NewScript.server.luau` with content | Script appears in Studio |
| 2 | Edit the file content | Studio script updates |
| 3 | Delete the file | Script removed from Studio |
| 4 | Create folder `src/ReplicatedStorage/Utils/` with `_meta.rbxjson` | Folder appears in Studio |

### 3.3 Auto-Extract Deduplication Test

**Purpose:** Verify rapid changes don't cause duplicate extractions

**Test Steps:**
1. Connect to a project
2. In Studio, rapidly:
   - Create 5 scripts
   - Delete them all
   - Create 5 more
3. Watch Output window
4. **Verify:** Each path should only show "Queueing change" once per operation, not multiple times

**Docs say:** "Changes are debounced (300ms) to batch rapid edits"

---

## Test Suite 4: Plugin Features

**Documentation Reference:** [Plugin Usage - Settings](/docs/plugin/usage.md#plugin-settings)

### 4.1 Auto-Connect Toggle

**Test Steps:**
1. Open RbxSync plugin in Studio
2. Go to Settings
3. Check "Auto-connect on startup"
4. Close and reopen Roblox Studio
5. **Verify:** Plugin should automatically connect (if server is running)

**Test Negative Case:**
1. Uncheck "Auto-connect on startup"
2. Close and reopen Studio
3. **Verify:** Plugin should NOT auto-connect

**Docs say:** "Enable 'Auto-connect on startup' in settings to automatically connect when Studio opens"

### 4.2 Auto-Populate Project Path

**Test Steps:**
1. Start server in a specific directory: `cd /Users/marissacheves/rbxsync/testing/projects/simple-game && rbxsync serve`
2. Open Studio, open plugin
3. Clear the project path field
4. Click Connect
5. **Verify:** Path should auto-fill with `/Users/marissacheves/rbxsync/testing/projects/simple-game`

**Docs say:** "The project path auto-populates from the server's working directory"

### 4.3 Optimization Stats

**Test Steps:**
1. Open a game with various instance types (use `complex-game` project)
2. Connect plugin
3. Click "Show Optimization Stats"
4. **Verify:** Stats panel shows counts for:
   - Lights
   - Animations
   - Skinned Meshes
   - Sounds
   - Particles
   - MeshParts
   - Unions

**Docs say:** Lists all stat categories in documentation

---

## Test Suite 5: Configuration

**Documentation Reference:** [Configuration](/docs/getting-started/configuration.md)

### 5.1 Tree Mapping

**Test Steps:**
1. Use `complex-game` project which has custom treeMapping
2. Start server and connect
3. Create a script in `src/server/` (maps to ServerScriptService)
4. **Verify:** Script appears in ServerScriptService in Studio
5. Create a script in `src/client/` (maps to StarterPlayerScripts)
6. **Verify:** Script appears in StarterPlayer.StarterPlayerScripts

**Docs say:** "Scripts in `src/server/` sync to `ServerScriptService`"

### 5.2 Invalid Config Handling

**Test Steps:**
1. Create invalid rbxsync.json: `echo '{invalid json' > rbxsync.json`
2. Try to start server: `rbxsync serve`
3. **Verify:** Clear error message about invalid JSON

---

## Test Suite 6: Edge Cases

**Documentation Reference:** Various

### 6.1 Unicode Filenames
```bash
cd /Users/marissacheves/rbxsync/testing/projects/edge-cases
# Test project has scripts with unicode names
rbxsync serve &
sleep 2
# Sync should work with unicode
curl -s http://localhost:44755/health
kill %1
```

### 6.2 Deep Nesting (10+ levels)
```bash
# edge-cases project has deeply nested structure
# Verify extraction doesn't fail on deep paths
```

### 6.3 Large Files
```bash
# Test with a script containing 10,000+ lines
# Verify sync doesn't timeout or fail
```

### 6.4 Special Characters in Names
- Spaces: "My Script"
- Dots: "utils.helpers"
- Dashes: "my-module"

---

## Test Suite 7: Build Commands

**Documentation Reference:** [CLI Commands - Build](/docs/cli/commands.md)

### 7.1 Build Plugin
```bash
cd /Users/marissacheves/rbxsync
./target/release/rbxsync build-plugin

[ -f "build/RbxSync.rbxm" ] && echo "✅ Plugin built" || echo "❌ Plugin build failed"
```

### 7.2 Build Plugin with Install
```bash
./target/release/rbxsync build-plugin --install

PLUGIN_PATH="$HOME/Documents/Roblox/Plugins/RbxSync.rbxm"
[ -f "$PLUGIN_PATH" ] && echo "✅ Plugin installed" || echo "❌ Plugin not installed"
```

---

## Test Suite 8: Documentation Verification

### 8.1 All Code Examples Work

For each code example in the docs, verify it runs without error:

**File: docs/cli/commands.md**
```bash
# Test all bash examples in the docs
grep -A5 '```bash' /Users/marissacheves/rbxsync/docs/cli/commands.md | grep -v '```' | while read cmd; do
  # Skip comments and empty lines
  [[ "$cmd" =~ ^#.*$ ]] && continue
  [[ -z "$cmd" ]] && continue
  echo "Testing: $cmd"
done
```

### 8.2 All Links Work
```bash
# Check for broken internal links
cd /Users/marissacheves/rbxsync/docs
grep -roh '\](/[^)]*' . | sort -u | while read link; do
  path="${link#](}"
  # Convert to file path and check
  echo "Checking: $path"
done
```

---

## Automated Test Runner

Save time with the automated test scripts in `testing/scripts/`:

```bash
# Run everything
./testing/scripts/run-all-tests.sh

# Run specific suite
./testing/scripts/test-cli.sh
./testing/scripts/test-migration.sh
./testing/scripts/test-sync.sh      # Requires manual Studio interaction
./testing/scripts/test-docs.sh      # Verifies documentation
```

---

## Pre-Release Checklist

Before any release, complete this checklist:

### Automated Tests
- [ ] `./testing/scripts/test-cli.sh` passes
- [ ] `./testing/scripts/test-migration.sh` passes
- [ ] `./testing/scripts/test-docs.sh` passes
- [ ] `cargo test` passes (if unit tests exist)

### Manual Tests
- [ ] Test Suite 3.1 (Sync to files) - all 6 steps
- [ ] Test Suite 3.2 (Sync to Studio) - all 4 steps
- [ ] Test Suite 4.1 (Auto-connect) - both cases
- [ ] Test Suite 4.2 (Auto-populate path)
- [ ] Test Suite 4.3 (Optimization stats)

### Documentation
- [ ] All new features documented
- [ ] Code examples tested
- [ ] Version numbers updated in docs

### Final Verification
- [ ] `rbxsync version` shows correct version
- [ ] Plugin version matches CLI version
- [ ] Website comparison table is accurate

---

## Reporting Issues

If a test fails:

1. Note the test suite and step number
2. Copy the exact error message
3. Check if it's a test issue or actual bug
4. File GitHub issue with reproduction steps

---

## Adding New Tests

When adding features, add corresponding tests:

1. Add test steps to relevant suite in this file
2. Update test scripts if automatable
3. Add test data to appropriate project in `testing/projects/`
4. Reference the documentation section

Template:
```markdown
### X.X Feature Name

**Test Steps:**
1. Step one
2. Step two
3. **Verify:** Expected outcome

**Docs say:** "Quote from documentation"
```
