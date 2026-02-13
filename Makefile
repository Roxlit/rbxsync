# RbxSync Makefile
# Streamlines building, testing, and installing all components.
#
# Usage:
#   make build       - Build all Rust crates (debug)
#   make release     - Build all Rust crates (release)
#   make install     - Build release + install CLI to PATH
#   make test        - Run all Rust tests
#   make clippy      - Run clippy lints
#   make check       - Run build + test + clippy
#   make plugin      - Build RbxSync.rbxm plugin
#   make vscode      - Build VS Code extension (.vsix)
#   make all         - Build everything (Rust + plugin + VS Code)
#   make clean       - Clean all build artifacts
#   make bench       - Run benchmarks

.PHONY: all build release install test clippy check plugin vscode clean bench fmt

# Default: build everything
all: release plugin vscode

# --- Rust ---

build:
	cargo build

release:
	cargo build --release

install: release
	cargo install --path rbxsync-cli --force

test:
	cargo test

clippy:
	cargo clippy -- -D warnings

fmt:
	cargo fmt

check: build test clippy

# --- Plugin ---

plugin: release
	./target/release/rbxsync build-plugin

# --- VS Code Extension ---

vscode:
	cd rbxsync-vscode && npm ci --silent && npm run build && npx vsce package

# --- Benchmarks ---

bench:
	cargo bench

# --- Docs ---

docs:
	cd docs && npm install && npm run build

# --- Clean ---

clean:
	cargo clean
	rm -f build/RbxSync.rbxm
	rm -f rbxsync-vscode/*.vsix
