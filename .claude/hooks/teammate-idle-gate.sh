#!/bin/bash
# Quality gate: prevents teammates from going idle if their code doesn't compile.
# If Rust files were changed and cargo build fails, keep the teammate working (exit 2).
CWD="${CLAUDE_PROJECT_DIR:-.}"
if git -C "$CWD" diff --name-only HEAD 2>/dev/null | grep -qE '\.(rs|toml)$'; then
  if ! cargo build --manifest-path "$CWD/Cargo.toml" 2>&1 | tail -5; then
    echo "cargo build failed. Fix compilation errors before stopping." >&2
    exit 2
  fi
fi
exit 0
