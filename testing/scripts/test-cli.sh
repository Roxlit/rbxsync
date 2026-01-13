#!/bin/bash
# CLI Test Suite
# Tests all CLI commands that don't require Studio

# Don't exit on error - we want to run all tests
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
CLI="$PROJECT_DIR/target/release/rbxsync"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
echo "RbxSync CLI Test Suite"
echo "================================"
echo ""

# Ensure CLI is built
if [ ! -f "$CLI" ]; then
    echo "CLI not found at $CLI"
    echo "Run: cargo build --release"
    exit 1
fi

# Test 1: Version command
info "Test 1: Version command"
VERSION_OUTPUT=$($CLI version 2>&1)
if echo "$VERSION_OUTPUT" | grep -qE "[Rr]bx[Ss]ync.*[0-9]+\.[0-9]+\.[0-9]+"; then
    pass "Version command outputs correct format"
else
    fail "Version command format incorrect: $VERSION_OUTPUT"
fi

# Test 2: Init command
info "Test 2: Init command"
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
$CLI init --name "TestProject" > /dev/null 2>&1

if [ -f "rbxsync.json" ]; then
    pass "Init creates rbxsync.json"
else
    fail "Init did not create rbxsync.json"
fi

if [ -d "src" ]; then
    pass "Init creates src directory"
else
    fail "Init did not create src directory"
fi

if grep -q '"name": "TestProject"' rbxsync.json; then
    pass "Init sets project name correctly"
else
    fail "Init did not set project name"
fi
rm -rf "$TEST_DIR"

# Test 3: Serve command (background mode)
info "Test 3: Serve command (background mode)"
# Kill any existing server first
$CLI stop > /dev/null 2>&1 || true
sleep 1

cd "$PROJECT_DIR"
$CLI serve --background > /dev/null 2>&1
sleep 2

HEALTH=$(curl -s http://localhost:44755/health 2>/dev/null || echo "failed")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    pass "Background server responds to health check"
else
    fail "Background server health check failed: $HEALTH"
fi

# Test 4: Server info endpoint
info "Test 4: Server info endpoint"
INFO=$(curl -s http://localhost:44755/rbxsync/server-info 2>/dev/null || echo "failed")
if echo "$INFO" | grep -q '"cwd"'; then
    pass "Server info returns cwd"
else
    fail "Server info missing cwd: $INFO"
fi

if echo "$INFO" | grep -q '"version"'; then
    pass "Server info returns version"
else
    fail "Server info missing version: $INFO"
fi

# Test 5: Stop command
info "Test 5: Stop command"
# Stop command finds and kills the process
$CLI stop > /dev/null 2>&1
sleep 2

# Check if server stopped
HEALTH=$(curl -s --connect-timeout 2 http://localhost:44755/health 2>&1 || echo "connection refused")
if echo "$HEALTH" | grep -qi "refused\|failed\|timed out\|error"; then
    pass "Stop command stops the server"
else
    # Server might still be running, try to kill it manually for cleanup
    pkill -f "rbxsync serve" 2>/dev/null || true
    fail "Stop command did not stop server: $HEALTH"
fi

# Test 6: Build plugin command
info "Test 6: Build plugin command"
cd "$PROJECT_DIR"
$CLI build-plugin > /dev/null 2>&1

if [ -f "build/RbxSync.rbxm" ]; then
    pass "Build plugin creates RbxSync.rbxm"
else
    fail "Build plugin did not create RbxSync.rbxm"
fi

# Summary
echo ""
echo "================================"
echo "CLI Test Results"
echo "================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    exit 1
fi
