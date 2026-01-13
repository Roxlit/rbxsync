#!/bin/bash
# Documentation Verification Tests
# Verifies that documentation is accurate and links work

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
DOCS_DIR="$PROJECT_DIR/docs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️ WARN${NC}: $1"
    ((WARNINGS++))
}

info() {
    echo -e "${YELLOW}→${NC} $1"
}

echo "================================"
echo "Documentation Verification"
echo "================================"
echo ""

# Test 1: All documentation files exist
info "Test 1: Required documentation files exist"

REQUIRED_DOCS=(
    "getting-started/index.md"
    "getting-started/quick-start.md"
    "getting-started/configuration.md"
    "cli/index.md"
    "cli/commands.md"
    "plugin/index.md"
    "plugin/usage.md"
    "file-formats/index.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$DOCS_DIR/$doc" ]; then
        pass "Found: $doc"
    else
        fail "Missing: $doc"
    fi
done

# Test 2: CLI commands documented match actual commands
info "Test 2: CLI commands match documentation"
CLI="$PROJECT_DIR/target/release/rbxsync"

if [ -f "$CLI" ]; then
    # Get actual commands from help
    HELP_OUTPUT=$($CLI --help 2>&1)

    # Check key commands are in help
    for cmd in "init" "serve" "stop" "migrate" "build-plugin"; do
        if echo "$HELP_OUTPUT" | grep -q "$cmd"; then
            pass "Command '$cmd' in CLI help"
        else
            fail "Command '$cmd' not in CLI help"
        fi
    done

    # Check documentation mentions these commands
    COMMANDS_DOC="$DOCS_DIR/cli/commands.md"
    for cmd in "init" "serve" "stop" "migrate" "build-plugin"; do
        if grep -q "### $cmd" "$COMMANDS_DOC"; then
            pass "Command '$cmd' documented"
        else
            fail "Command '$cmd' not documented"
        fi
    done
else
    warn "CLI not built, skipping command verification"
fi

# Test 3: Check for broken internal links
info "Test 3: Internal link verification"

# Find all markdown links
cd "$DOCS_DIR"
BROKEN_LINKS=0

while IFS= read -r file; do
    # Extract links like [text](/path)
    while IFS= read -r link; do
        # Skip external links and anchors
        if [[ "$link" == http* ]] || [[ "$link" == "#"* ]]; then
            continue
        fi

        # Convert link to file path
        link_path="${link%.md}"
        link_path="${link_path#/}"

        # Check if file exists (try with and without index.md)
        if [ -f "$link_path.md" ] || [ -f "$link_path/index.md" ] || [ -d "$link_path" ]; then
            : # exists
        else
            warn "Broken link in $file: $link"
            ((BROKEN_LINKS++))
        fi
    done < <(grep -oE '\]\(/[^)]+\)' "$file" 2>/dev/null | sed 's/\](//' | sed 's/)//')
done < <(find . -name "*.md" -not -path "./node_modules/*")

if [ $BROKEN_LINKS -eq 0 ]; then
    pass "No broken internal links found"
else
    warn "Found $BROKEN_LINKS potentially broken links"
fi

# Test 4: Check version consistency
info "Test 4: Version consistency"

if [ -f "$CLI" ]; then
    CLI_VERSION=$($CLI version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    CARGO_VERSION=$(grep '^version = ' "$PROJECT_DIR/Cargo.toml" | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')

    if [ "$CLI_VERSION" = "$CARGO_VERSION" ]; then
        pass "CLI version ($CLI_VERSION) matches Cargo.toml ($CARGO_VERSION)"
    else
        fail "Version mismatch: CLI=$CLI_VERSION, Cargo=$CARGO_VERSION"
    fi
else
    warn "CLI not built, skipping version check"
fi

# Test 5: Check that new features are documented
info "Test 5: New features documented"

# Check for key feature documentation
FEATURES=(
    "background:serve --background"
    "migrate:rbxsync migrate"
    "treeMapping:treeMapping"
    "auto-connect:Auto-connect"
    "optimization:Optimization Stats"
)

for feature in "${FEATURES[@]}"; do
    name="${feature%%:*}"
    search="${feature#*:}"

    if grep -rq "$search" "$DOCS_DIR" --include="*.md" 2>/dev/null; then
        pass "Feature '$name' is documented"
    else
        fail "Feature '$name' not found in docs (search: $search)"
    fi
done

# Summary
echo ""
echo "================================"
echo "Documentation Test Results"
echo "================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    exit 1
fi
