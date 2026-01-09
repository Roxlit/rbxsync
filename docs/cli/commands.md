# CLI Commands

Complete reference for all RbxSync CLI commands.

## Core Commands

### init
Initialize a new RbxSync project.

```bash
rbxsync init [--name NAME]
```

Creates `rbxsync.json` and the `src/` directory structure.

### serve
Start the sync server.

```bash
rbxsync serve [--port PORT]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--port` | 44755 | Server port |

### stop
Stop the running server.

```bash
rbxsync stop
```

### status
Show connection status.

```bash
rbxsync status
```

### extract
Extract game from connected Studio to files.

```bash
rbxsync extract
```

Requires an active Studio connection.

### sync
Push local changes to Studio.

```bash
rbxsync sync [--path DIR]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--path` | Current dir | Project path |

## Build Commands

### build
Build project to Roblox format.

```bash
rbxsync build [OPTIONS]
```

| Option | Default | Description |
|--------|---------|-------------|
| `-f, --format` | rbxl | Output format: rbxl, rbxm, rbxlx, rbxmx |
| `-o, --output` | build/ | Output path |
| `--watch` | false | Watch for changes and rebuild |
| `--plugin` | - | Build directly to Studio plugins folder |

Examples:

```bash
# Build place file
rbxsync build

# Build model file
rbxsync build -f rbxm

# Build XML format
rbxsync build -f rbxlx

# Watch mode
rbxsync build --watch

# Build as plugin
rbxsync build --plugin MyPlugin.rbxm
```

### build-plugin
Build the RbxSync Studio plugin.

```bash
rbxsync build-plugin [--install]
```

| Option | Description |
|--------|-------------|
| `--install` | Copy to Studio plugins folder |

## Utility Commands

### sourcemap
Generate sourcemap.json for Luau LSP.

```bash
rbxsync sourcemap
```

### fmt-project
Format all .rbxjson files.

```bash
rbxsync fmt-project [--check]
```

| Option | Description |
|--------|-------------|
| `--check` | Check only, don't modify (for CI) |

### studio
Launch Roblox Studio.

```bash
rbxsync studio [file.rbxl]
```

### doc
Open documentation in browser.

```bash
rbxsync doc
```

## Update Commands

### version
Show version and git commit.

```bash
rbxsync version
```

### update
Pull latest changes and rebuild.

```bash
rbxsync update [OPTIONS]
```

| Option | Description |
|--------|-------------|
| `--vscode` | Also rebuild VS Code extension |
| `--no-pull` | Skip git pull, just rebuild |

This command:
1. Pulls latest from GitHub
2. Rebuilds the CLI
3. Rebuilds and installs the Studio plugin

Then restart Studio to load the updated plugin.
