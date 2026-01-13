# RbxSync Testing

This directory contains everything needed to test RbxSync before releases.

## Quick Start

```bash
# Run all automated tests
./scripts/run-all-tests.sh
```

## Test Projects

| Project | Purpose | Features Tested |
|---------|---------|-----------------|
| `rojo-game/` | Migration from Rojo | `rbxsync migrate`, treeMapping |
| `simple-game/` | Basic sync operations | Extract, sync, file creation |
| `complex-game/` | Advanced features | Custom mappings, large projects |
| `edge-cases/` | Edge cases | Unicode, deep nesting, large files |

## Test Scripts

| Script | What it tests | Requires Studio? |
|--------|---------------|------------------|
| `test-cli.sh` | All CLI commands | No |
| `test-migration.sh` | Rojo migration | No |
| `test-docs.sh` | Documentation accuracy | No |
| `run-all-tests.sh` | Runs all above | No |

## Manual Tests Required

Some tests require Roblox Studio interaction. See `TESTING.md` for:

- Plugin sync tests (Studio ↔ Files)
- Auto-connect toggle
- Optimization stats panel
- File watcher behavior

## Pre-Release Checklist

```bash
# 1. Run automated tests
./scripts/run-all-tests.sh

# 2. Manual tests in Studio (see TESTING.md)
#    - Open Studio
#    - Connect to simple-game project
#    - Test sync both directions
#    - Test plugin settings

# 3. Verify version
rbxsync version
```

## Adding Tests

When adding new features:

1. Add automated test to relevant `test-*.sh` script
2. Add manual test steps to `TESTING.md`
3. Add test data to appropriate project in `projects/`
4. Update documentation and reference in tests
