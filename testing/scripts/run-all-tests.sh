#!/bin/bash
# Run All Automated Tests
# This script runs all test suites that don't require manual interaction

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     RbxSync Automated Test Suite       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Ensure we have the release build
echo -e "${YELLOW}Building release binary...${NC}"
cd "$PROJECT_DIR"
cargo build --release 2>&1 | tail -1
echo ""

TOTAL_PASSED=0
TOTAL_FAILED=0
SUITES_PASSED=0
SUITES_FAILED=0

run_suite() {
    local name=$1
    local script=$2

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running: $name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if bash "$script"; then
        ((SUITES_PASSED++))
    else
        ((SUITES_FAILED++))
    fi
    echo ""
}

# Run test suites
run_suite "CLI Tests" "$SCRIPT_DIR/test-cli.sh"
run_suite "Migration Tests" "$SCRIPT_DIR/test-migration.sh"
run_suite "Documentation Tests" "$SCRIPT_DIR/test-docs.sh"

# Final summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Final Test Summary            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Test Suites Passed: ${GREEN}$SUITES_PASSED${NC}"
echo -e "Test Suites Failed: ${RED}$SUITES_FAILED${NC}"
echo ""

if [ $SUITES_FAILED -gt 0 ]; then
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Manual tests still required:"
    echo "  - Plugin sync tests (require Roblox Studio)"
    echo "  - Auto-connect tests"
    echo "  - Optimization stats tests"
    echo ""
    echo "See TESTING.md for manual test procedures."
    exit 1
else
    echo -e "${GREEN}✅ ALL AUTOMATED TESTS PASSED${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run manual tests in Roblox Studio (see TESTING.md)"
    echo "  2. Test plugin features: auto-connect, optimization stats"
    echo "  3. Verify sync works both directions"
    echo ""
fi
