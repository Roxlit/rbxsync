#!/bin/bash
# Migration Test Suite
# Tests Rojo migration functionality

# Don't exit on error - we want to run all tests
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
CLI="$PROJECT_DIR/target/release/rbxsync"
TEST_PROJECTS="$PROJECT_DIR/testing/projects"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

info() {
    echo -e "${YELLOW}→${NC} $1"
}

echo "================================"
echo "RbxSync Migration Test Suite"
echo "================================"
echo ""

# Ensure CLI is built
if [ ! -f "$CLI" ]; then
    echo "CLI not found at $CLI"
    echo "Run: cargo build --release"
    exit 1
fi

# Clean up any existing rbxsync.json in rojo-game
rm -f "$TEST_PROJECTS/rojo-game/rbxsync.json"

# Test 1: Basic migration
info "Test 1: Basic Rojo migration"
cd "$TEST_PROJECTS/rojo-game"
$CLI migrate > /dev/null 2>&1

if [ -f "rbxsync.json" ]; then
    pass "Migration creates rbxsync.json"
else
    fail "Migration did not create rbxsync.json"
fi

# Test 2: Project name preserved
info "Test 2: Project name preserved"
if grep -q '"name": "RojoTestGame"' rbxsync.json; then
    pass "Project name preserved from Rojo config"
else
    fail "Project name not preserved"
fi

# Test 3: ServerScriptService mapping
info "Test 3: ServerScriptService mapping"
if grep -q '"ServerScriptService": "src/server"' rbxsync.json; then
    pass "ServerScriptService mapped correctly"
else
    fail "ServerScriptService mapping incorrect"
fi

# Test 4: Nested path mapping (StarterPlayerScripts)
info "Test 4: Nested path mapping"
if grep -q '"StarterPlayer/StarterPlayerScripts": "src/client"' rbxsync.json; then
    pass "Nested StarterPlayerScripts mapped correctly"
else
    fail "Nested path mapping incorrect"
fi

# Test 5: ReplicatedStorage/Shared mapping
info "Test 5: ReplicatedStorage/Shared mapping"
if grep -q '"ReplicatedStorage/Shared": "src/shared"' rbxsync.json; then
    pass "ReplicatedStorage/Shared mapped correctly"
else
    fail "ReplicatedStorage/Shared mapping incorrect"
fi

# Test 6: Migration refuses without --force
info "Test 6: Migration refuses to overwrite without --force"
OUTPUT=$($CLI migrate 2>&1 || true)
if echo "$OUTPUT" | grep -q "already exists"; then
    pass "Migration refuses without --force"
else
    fail "Migration should refuse without --force"
fi

# Test 7: Migration works with --force
info "Test 7: Migration works with --force"
echo '{"name":"WillBeOverwritten"}' > rbxsync.json
$CLI migrate --force > /dev/null 2>&1

if grep -q '"name": "RojoTestGame"' rbxsync.json; then
    pass "--force overwrites existing config"
else
    fail "--force did not overwrite"
fi

# Test 8: Migration with --path option
info "Test 8: Migration with --path option"
cd /tmp
rm -f "$TEST_PROJECTS/rojo-game/rbxsync.json"
$CLI migrate --path "$TEST_PROJECTS/rojo-game" > /dev/null 2>&1

if [ -f "$TEST_PROJECTS/rojo-game/rbxsync.json" ]; then
    pass "--path option works correctly"
else
    fail "--path option did not work"
fi

# Verify it didn't create in /tmp
if [ ! -f "/tmp/rbxsync.json" ]; then
    pass "Did not create config in wrong directory"
else
    fail "Created config in /tmp instead of target"
    rm -f /tmp/rbxsync.json
fi

# Summary
echo ""
echo "================================"
echo "Migration Test Results"
echo "================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    exit 1
fi
