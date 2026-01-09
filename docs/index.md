---
layout: home

hero:
  name: RbxSync
  text: Full Property Sync for Roblox
  tagline: Two-way sync between Studio and VS Code. Every instance, every property, version controlled.
  image:
    src: /logo.png
    alt: RbxSync
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: View on GitHub
      link: https://github.com/devmarissa/rbxsync

features:
  - icon: 🔄
    title: Two-Way Sync
    details: Changes in Studio automatically sync to files. Edit in VS Code, see changes in Studio instantly.
  - icon: 📦
    title: Full Property Extraction
    details: Captures ALL properties using API dump reflection. Parts, MeshParts, Attachments, Scripts. Every class, every property.
  - icon: 🤖
    title: AI Integration
    details: MCP server lets AI agents write code, run playtests, see console output, and iterate autonomously.
  - icon: ⚡
    title: One-Click Extract
    details: Convert any existing Roblox game to a git repository with a single click. No other tool does this.
  - icon: 🧪
    title: E2E Testing
    details: Run playtests from CLI, stream console output to terminal. Debug in real-time.
  - icon: 🛠️
    title: VS Code Extension
    details: Full IDE integration with commands, console streaming, and status indicators.
---

## Quick Start

```bash
# Install
git clone https://github.com/devmarissa/rbxsync
cd rbxsync && cargo build --release

# Initialize project
rbxsync init --name MyGame
rbxsync serve

# Install Studio plugin
rbxsync build-plugin --install
```

Then open Studio, connect the plugin, and start syncing.

## Why RbxSync?

| Feature | RbxSync | Rojo | Argon |
|---------|---------|------|-------|
| Two-way sync | ✅ | ❌ | ✅ |
| One-click extraction | ✅ | ❌ | ❌ |
| Full property preservation | ✅ | ❌ | ◐ |
| AI integration (MCP) | ✅ | ❌ | ❌ |
| E2E testing mode | ✅ | ❌ | ❌ |
