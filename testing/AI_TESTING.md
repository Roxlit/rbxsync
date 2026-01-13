# AI-Powered Testing Protocol

This document describes how Claude Code tests RbxSync functionality by reading documentation as the source of truth and validating that the software behaves accordingly.

## Quick Start

Say one of these to Claude:
- **"test the CLI"** - Run all CLI command tests
- **"test migration"** - Run migration command tests
- **"test plugin sync"** - Run plugin sync tests
- **"verify docs accuracy"** - Run all tests and report doc/behavior mismatches
- **"test all"** - Run every test spec

## How It Works

```
User: "test migration"
         ↓
Claude reads: docs/cli/commands.md (source of truth)
         ↓
Claude reads: testing/ai-specs/cli-migrate.yaml (test spec)
         ↓
For each claim in the spec:
  1. Execute setup commands
  2. Run the test command
  3. Validate assertions
  4. Compare to doc_quote
         ↓
Report: X passed, Y failed
For failures: quote doc, show actual, suggest fix
```

---

## Test Specification Format

Test specs are YAML files in `testing/ai-specs/` that reference documentation and define testable claims.

### Spec Structure

```yaml
name: Human-readable test suite name
doc_ref: docs/cli/commands.md#section
doc_ref_alt: docs/getting-started/quick-start.md  # optional

claims:
  - id: unique-test-id
    doc_quote: "Exact quote from documentation"
    test_type: bash | mcp | manual
    setup: |
      Optional setup commands
    command: The command to test
    assertions:
      - type: assertion_type
        # assertion-specific params
    cleanup: Optional cleanup commands
```

### Assertion Types

| Type | Description | Params |
|------|-------------|--------|
| `file_exists` | Check file/dir exists | `path` |
| `file_not_exists` | Check file/dir absent | `path` |
| `json_contains` | JSON has key with value | `path`, `key`, `value` |
| `json_field` | JSON field equals expected | `path`, `field`, `expected` |
| `output_contains` | Command output contains text | `text` |
| `output_matches` | Command output matches regex | `pattern` |
| `http_status` | HTTP response code | `url`, `expected` |
| `http_json` | JSON response has field | `url`, `field`, `expected` |

---

## Execution Protocol

### 1. Read Documentation First

Before running any test, read the referenced documentation file:
- Extract the exact text for each feature being tested
- Note version numbers, default values, option names
- Understand the context and expected behavior

### 2. Parse Test Specification

Load the YAML spec file and understand:
- What claims need to be tested
- What type of test each claim requires (bash/mcp/manual)
- What assertions must pass

### 3. Execute Each Test

For each claim in order:

```
1. Run setup commands (if any)
2. Execute the test command or action
3. Capture output and side effects
4. Check each assertion
5. Run cleanup commands (if any)
6. Record pass/fail with details
```

### 4. Validate Assertions

For each assertion:

**file_exists:**
```bash
[ -f "path" ] || [ -d "path" ]  # Check file or directory
```

**json_contains:**
```bash
cat path | grep '"key": "value"'  # Or use jq
```

**output_contains:**
```bash
echo "$OUTPUT" | grep -q "text"
```

**http_status:**
```bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" url)
[ "$STATUS" = "expected" ]
```

**http_json:**
```bash
curl -s url | jq -r ".field" | grep -q "expected"
```

### 5. Report Results

Format each test result:

```markdown
## Test: init-creates-config
**Doc says:** "Creates `rbxsync.json` and the `src/` directory structure."

**Result:** PASS

---

## Test: serve-default-port
**Doc says:** "The server runs on port 44755 by default."

**Result:** FAIL
**Expected:** Server on port 44755
**Actual:** Server started on port 0 (random)
**Recommendation:** Bug in code - fix serve command to use 44755
```

### 6. Final Summary

```markdown
## Test Summary

Total: 15 tests
Passed: 13
Failed: 2

### Failures:
1. serve-default-port - Server not using default port
2. migrate-force - --force flag not working

### Documentation Issues:
None detected

### Code Issues:
- serve command: Default port not applied correctly
- migrate command: --force flag ignored
```

---

## Test Types

### bash Tests

For CLI commands that can be tested via shell:

```yaml
- id: init-creates-config
  test_type: bash
  command: rbxsync init --name "TestGame"
  assertions:
    - type: file_exists
      path: rbxsync.json
```

Execution:
1. Run command via Bash tool
2. Check file system for expected results
3. Validate command output

### mcp Tests

For functionality requiring Roblox Studio via MCP:

```yaml
- id: plugin-creates-script
  test_type: mcp
  setup_studio:
    - Create ServerScriptService.TestScript (Script)
  wait: 2000
  assertions:
    - type: file_exists
      path: src/ServerScriptService/TestScript.server.luau
```

Execution:
1. Use mcp__roblox-mcp__run_code to execute Luau in Studio
2. Wait for sync
3. Check file system for results

### manual Tests

For tests requiring human verification:

```yaml
- id: plugin-ui-buttons
  test_type: manual
  instructions: |
    1. Open Roblox Studio
    2. Click RbxSync toolbar button
    3. Verify Connect button is visible
    4. Verify Extract button is visible
```

Execution:
1. Display instructions to user
2. Ask for confirmation
3. Record user's response

---

## Running Tests

### Individual Spec

```
User: "run tests from cli-init.yaml"

Claude:
1. Read testing/ai-specs/cli-init.yaml
2. Read referenced docs
3. Execute all claims
4. Report results
```

### All CLI Tests

```
User: "test the CLI"

Claude:
1. Find all cli-*.yaml files in ai-specs/
2. Run each spec in order
3. Aggregate results
4. Report summary
```

### Full Test Suite

```
User: "test all"

Claude:
1. Find all *.yaml files in ai-specs/
2. Run specs in order:
   - CLI tests first
   - Plugin tests if Studio available
   - Config tests
3. Report comprehensive summary
```

### Doc Verification Mode

```
User: "verify docs accuracy"

Claude:
1. Run all tests
2. For each failure, analyze:
   - Is the doc wrong? (feature changed)
   - Is the code wrong? (bug)
3. Report documentation issues separately
4. Suggest doc updates or bug fixes
```

---

## Test Projects

Use existing test projects in `testing/projects/`:

| Project | Use For |
|---------|---------|
| `simple-game/` | Basic CLI and sync tests |
| `rojo-game/` | Migration tests |
| `complex-game/` | Tree mapping and advanced features |
| `edge-cases/` | Unicode, deep nesting, large files |

---

## Adding New Tests

When adding a new feature:

1. **Document it** in `docs/`
2. **Create test spec** in `testing/ai-specs/`
3. **Reference the docs** with `doc_ref` and `doc_quote`
4. **Define assertions** that validate the documented behavior

Template:

```yaml
name: New Feature Tests
doc_ref: docs/section/feature.md

claims:
  - id: feature-basic
    doc_quote: "The feature does X when Y."
    test_type: bash
    command: rbxsync feature --option
    assertions:
      - type: output_contains
        text: "Expected output"
```

---

## Troubleshooting

### Test Keeps Failing

1. Read the doc_quote carefully
2. Run the command manually
3. Check if behavior matches docs
4. If not, determine: doc issue or code issue?

### MCP Tests Not Working

1. Verify Roblox Studio is open
2. Verify RbxSync plugin is installed
3. Verify MCP server is running
4. Check Studio Output for errors

### Cleanup Not Running

If a test fails mid-execution, manually run cleanup:

```bash
rm -rf /tmp/test-*
rbxsync stop
```

---

## Best Practices

1. **Quote docs exactly** - Use the precise wording from documentation
2. **One claim per behavior** - Don't test multiple things in one claim
3. **Clean up always** - Ensure tests don't leave state behind
4. **Test negative cases** - Verify error handling matches docs
5. **Keep specs updated** - When docs change, update specs
