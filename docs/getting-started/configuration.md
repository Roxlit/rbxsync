# Project Configuration

The `rbxsync.json` file configures your project settings.

## Basic Configuration

```json
{
  "name": "MyGame",
  "tree": "./src",
  "assets": "./assets"
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `name` | Project folder name | Display name for the project |
| `tree` | `./src` | Path to the instance tree |
| `assets` | `./assets` | Path for binary assets (meshes, images, sounds) |

## Custom Directory Mapping

Use `treeMapping` to customize how DataModel paths map to filesystem paths. This is useful for:
- Matching existing Rojo project structures
- Using shorter directory names
- Organizing code by feature instead of service

```json
{
  "name": "MyGame",
  "tree": "./src",
  "treeMapping": {
    "ServerScriptService": "src/server",
    "ReplicatedStorage": "src/shared",
    "StarterPlayer/StarterPlayerScripts": "src/client",
    "Workspace/Maps": "src/maps"
  }
}
```

With this configuration:
- Scripts in `src/server/` sync to `ServerScriptService`
- Scripts in `src/shared/` sync to `ReplicatedStorage`
- Scripts in `src/client/` sync to `StarterPlayer.StarterPlayerScripts`

## Extraction Configuration

Control how games are extracted:

```json
{
  "config": {
    "extractBinaryAssets": true,
    "binaryAssetTypes": ["Mesh", "Image", "Sound", "Animation"],
    "excludeServices": ["CoreGui", "CorePackages"],
    "excludeClasses": [],
    "scriptSourceMode": "external",
    "terrainMode": "voxelData",
    "csgMode": "assetReference",
    "chunkSize": 1000
  }
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `extractBinaryAssets` | `true` | Extract meshes, images, sounds |
| `binaryAssetTypes` | All | Types to extract |
| `excludeServices` | CoreGui, etc. | Services to skip |
| `excludeClasses` | `[]` | Classes to skip |
| `scriptSourceMode` | `external` | `external` (files) or `inline` (in .rbxjson) |
| `terrainMode` | `voxelData` | `voxelData`, `propertiesOnly`, or `skip` |
| `csgMode` | `assetReference` | `assetReference`, `localMesh`, or `skip` |
| `chunkSize` | 1000 | Max instances per extraction batch |

## Sync Configuration

```json
{
  "sync": {
    "mode": "bidirectional",
    "conflictResolution": "prompt",
    "autoSync": false,
    "watchPaths": ["./src"]
  }
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `mode` | `bidirectional` | `push`, `pull`, or `bidirectional` |
| `conflictResolution` | `prompt` | `prompt`, `keepLocal`, `keepRemote`, `autoMerge` |
| `autoSync` | `false` | Auto-sync on file changes |
| `watchPaths` | `["./src"]` | Paths to watch for changes |

## Migrating from Rojo

If you have an existing Rojo project, migrate automatically:

```bash
rbxsync migrate
```

This reads your `default.project.json` and creates an equivalent `rbxsync.json` with matching directory mappings.

Example Rojo project:

```json
{
  "name": "MyGame",
  "tree": {
    "$className": "DataModel",
    "ServerScriptService": { "$path": "src/server" },
    "ReplicatedStorage": { "$path": "src/shared" }
  }
}
```

Converts to:

```json
{
  "name": "MyGame",
  "tree": "./src",
  "treeMapping": {
    "ServerScriptService": "src/server",
    "ReplicatedStorage": "src/shared"
  }
}
```

Your Rojo files are preserved—you can use both tools side-by-side during migration.

## Full Example

```json
{
  "name": "AwesomeGame",
  "tree": "./src",
  "assets": "./assets",
  "treeMapping": {
    "ServerScriptService": "src/server",
    "ReplicatedStorage": "src/shared",
    "StarterPlayer/StarterPlayerScripts": "src/client",
    "StarterGui": "src/ui"
  },
  "config": {
    "extractBinaryAssets": true,
    "scriptSourceMode": "external",
    "terrainMode": "voxelData"
  },
  "sync": {
    "mode": "bidirectional",
    "autoSync": false
  }
}
```
