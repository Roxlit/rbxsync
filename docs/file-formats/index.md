# File Formats

RbxSync uses two file formats to represent Roblox instances.

## Overview

| Format | Extension | Use Case |
|--------|-----------|----------|
| Luau Scripts | `.luau` | Script source code |
| Instance Data | `.rbxjson` | Properties and metadata |

## Script Files

Scripts are stored as plain `.luau` files with naming conventions:

```
MyScript.server.luau  → Script (runs on server)
MyScript.client.luau  → LocalScript (runs on client)
MyScript.luau         → ModuleScript
```

See [.luau Scripts](/file-formats/luau) for details.

## Instance Files

Non-script instances use `.rbxjson` for full property preservation:

```json
{
  "className": "Part",
  "properties": {
    "Anchored": { "type": "bool", "value": true },
    "Size": { "type": "Vector3", "value": { "x": 4, "y": 1, "z": 2 } }
  }
}
```

See [.rbxjson Format](/file-formats/rbxjson) for details.

## Project Structure

```
MyGame/
├── rbxsync.json          # Project config
├── src/
│   ├── Workspace/
│   │   ├── Baseplate.rbxjson
│   │   └── SpawnLocation.rbxjson
│   ├── ServerScriptService/
│   │   └── Main.server.luau
│   ├── ReplicatedStorage/
│   │   └── Modules/
│   │       ├── _meta.rbxjson    # Folder metadata
│   │       └── Utils.luau
│   └── Lighting.rbxjson
└── sourcemap.json        # For Luau LSP
```

## Meta Files

Use `_meta.rbxjson` to set properties on folder instances:

```
src/
├── Workspace/
│   ├── _meta.rbxjson      # Properties for Workspace service
│   ├── Baseplate.rbxjson
│   └── SpawnLocation.rbxjson
```
