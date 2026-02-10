#!/bin/bash
# Quality gate: prevents task completion unless build + test + clippy all pass.
CWD="${CLAUDE_PROJECT_DIR:-.}"
[ ! -f "$CWD/Cargo.toml" ] && exit 0
if ! git -C "$CWD" diff --name-only HEAD 2>/dev/null | grep -qE '\.(rs|toml)$'; then
  exit 0
fi
cargo build --manifest-path "$CWD/Cargo.toml" 2>&1 | tail -5 || { echo "cargo build failed" >&2; exit 2; }
cargo test --manifest-path "$CWD/Cargo.toml" 2>&1 | tail -10 || { echo "cargo test failed" >&2; exit 2; }
cargo clippy --manifest-path "$CWD/Cargo.toml" -- -D warnings 2>&1 | tail -10 || { echo "cargo clippy failed" >&2; exit 2; }
exit 0
