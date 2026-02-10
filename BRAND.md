# RbxSync Brand Voice Guide

> Reference for all copy — marketing site, docs, blog, social, changelogs.

## Voice

**Developer-to-developer.** We talk like an engineer explaining their favorite tool to a friend. Technical but not academic. Confident but not arrogant. We show, not sell.

### Traits

| Do | Don't |
|----|-------|
| Be direct and specific | Be vague or hedge |
| Use short, punchy sentences | Write long, winding paragraphs |
| State facts confidently | Use superlatives without proof |
| Talk about what it *does* | Talk about what it *could* do |
| Reference concrete features | Make abstract promises |
| Acknowledge competitors exist | Trash-talk competitors |
| Use second person ("your game") | Use corporate third person |

### Sentence Style

- **Short.** Average sentence: 8-15 words. Break long sentences in two.
- **Active voice.** "RbxSync extracts all properties" not "All properties are extracted by RbxSync."
- **Present tense.** "Changes sync automatically" not "Changes will sync automatically."
- **No filler.** Cut "basically", "simply", "just", "actually", "really", "very", "in order to".
- **No emojis** in any written content.

### Confidence Level

We make bold claims when we can back them up:

> "The only Roblox sync tool with native MCP integration."

This is a verifiable fact. We say it plainly.

We don't oversell what we can't prove:

> ~~"The best sync tool ever made"~~

If it's not measurable, don't claim it.

## Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| **Hero / landing page** | Bold, punchy, declarative | "Let Claude build your Roblox game." |
| **Feature descriptions** | Technical, specific, concise | "Captures ALL properties using Roblox API dump reflection." |
| **Docs / guides** | Practical, instructional, clear | "Run `rbxsync serve` to start the sync server." |
| **Blog posts** | Informed, conversational, grounded | "Something big is happening in Roblox development." |
| **Changelogs** | Factual, terse | "Fixed script timeout on large games (RBXSYNC-25)" |
| **Error messages** | Helpful, no blame | "Connection lost. Check that Studio's RbxSync plugin is active." |

## Positioning

### What we are

- The AI-native sync tool for Roblox Studio
- A professional-grade development tool
- The bridge between external editors and Studio
- Built for teams that use git

### What we are not

- A code completion plugin
- A chat assistant
- A Rojo clone (we go beyond what Rojo does)
- A toy or hobbyist tool

### Competitor references

- **Name competitors directly** when comparing features (Rojo, Argon, etc.)
- **Use comparison tables** with verifiable data
- **Never disparage** — let the feature matrix speak
- Frame as "what others don't do" not "why others are bad"

## Terminology

### Always use

| Term | Not |
|------|-----|
| two-way sync | bidirectional synchronization |
| sync tool | synchronization solution |
| AI-native | AI-powered (unless describing others) |
| MCP | Model Context Protocol (spell out on first use per page) |
| Studio | Roblox Studio (after first mention per page) |
| extract | export / dump / pull |
| properties | attributes / fields |

### Capitalization

- **RbxSync** — always CamelCase, never "rbxsync" in prose (CLI commands are lowercase: `rbxsync serve`)
- **Roblox Studio** — both words capitalized
- **MCP** — always uppercase
- **Luau** — capital L
- Feature names: lowercase unless proper nouns ("two-way sync", "console streaming")

## Blog Guidelines

- **Length:** 800-1200 words for standard posts
- **Structure:** Lead with what's happening, then where we fit, then what it means
- **Attribution:** "The RbxSync team" as author, not individual names
- **Links:** Always link to docs for technical claims. Link to external sources for news references.
- **Dates:** Full format — "February 10, 2026"
- **No calls to "buy"** — we're in free beta. CTAs point to docs, GitHub, or getting started guide.

## Visual Identity

- **Primary color:** `#c23c40` (RbxSync red)
- **Accent:** `#d4a438` (gold)
- **Font:** Inter
- **Logo:** Always use the official logo file (`logo.png`). No modifications.

---

*Last updated: February 10, 2026*
