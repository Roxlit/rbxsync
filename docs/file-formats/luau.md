# .luau Scripts

Scripts are stored as plain Luau files with naming conventions that determine their script type.

## Naming Conventions

| Extension | Script Type | Runs On |
|-----------|-------------|---------|
| `.server.luau` | Script | Server |
| `.client.luau` | LocalScript | Client |
| `.luau` | ModuleScript | Imported |

## Examples

### Server Script
`src/ServerScriptService/Main.server.luau`

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
    print("Welcome", player.Name)
end)
```

### Client Script
`src/StarterPlayer/StarterPlayerScripts/Client.client.luau`

```lua
local Players = game:GetService("Players")
local player = Players.LocalPlayer

print("Client loaded for", player.Name)
```

### Module Script
`src/ReplicatedStorage/Modules/Utils.luau`

```lua
local Utils = {}

function Utils.formatNumber(n)
    return string.format("%d", n)
end

return Utils
```

## Script Properties

Script properties (like `Enabled`, `RunContext`) are stored in a companion `.rbxjson` file:

```
ServerScriptService/
├── Main.server.luau      # Source code
└── Main.rbxjson          # Properties (optional)
```

`Main.rbxjson`:
```json
{
  "className": "Script",
  "properties": {
    "Enabled": { "type": "bool", "value": true }
  }
}
```

## Automatic Detection

When syncing:
- Files ending in `.server.luau` become `Script` instances
- Files ending in `.client.luau` become `LocalScript` instances
- Files ending in `.luau` (no prefix) become `ModuleScript` instances

The file name (without extension) becomes the instance name.
