# Releasing RbxSync

## Automated Release Process

Releases are handled by GitHub Actions. The workflow automatically builds the CLI, plugin, and creates a release with `RbxSync.rbxm` attached.

## How to Release

### 1. Make sure all changes are committed and pushed

```bash
git status  # should be clean
git push origin master
```

### 2. Create and push a version tag

```bash
git tag v1.0.X
git push origin v1.0.X
```

### 3. GitHub Actions takes over

The workflow will:
- Build the Rust CLI
- Build `RbxSync.rbxm` plugin
- Generate changelog from commits since last tag
- Create GitHub release with plugin attached

Watch progress: https://github.com/Smokestack-Games/rbxsync/actions

### 4. Deploy website and docs (manual for now)

```bash
cd website && vercel --prod
cd docs && npm run build && vercel --prod
```

### 5. Update hero badge on website (if needed)

Edit `website/index.html` line ~3003:
```html
<span class="shiny-text" data-text="Your release notes here">Your release notes here</span>
<span class="release-date">Jan XX</span>
```

### 6. Post update to DevForum (optional)

https://devforum.roblox.com/t/4238545

## Version Numbering

- `v1.0.X` - Patch releases (bug fixes, docs)
- `v1.X.0` - Minor releases (new features)
- `vX.0.0` - Major releases (breaking changes)
