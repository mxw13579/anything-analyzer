# GitHub Actions Multi-Platform Build Design

**Date:** 2026-04-13
**Status:** Approved
**Project:** Anything Analyzer (anything-register)

## Goal

Set up GitHub Actions CI/CD to build Anything Analyzer for macOS (DMG), Windows (NSIS), and Linux (AppImage), enabling macOS distribution without requiring a local macOS environment.

## Constraints

- No Apple code signing or notarization (unsigned DMG)
- No auto-publish to npm or other registries
- pnpm as package manager
- Native dependency: `better-sqlite3` (requires per-platform compilation)

## Trigger Strategy

| Trigger | Behavior |
|---------|----------|
| `workflow_dispatch` | Manual trigger for testing builds |
| `push` tags matching `v*` | Auto-build + create GitHub Release with all platform artifacts |

## Build Matrix

| Platform | Runner | Architecture | Output |
|----------|--------|-------------|--------|
| Windows | `windows-latest` | x64 | `.exe` (NSIS installer) |
| macOS | `macos-latest` | arm64 (Apple Silicon) | `.dmg` |
| macOS | `macos-13` | x64 (Intel) | `.dmg` |
| Linux | `ubuntu-latest` | x64 | `.AppImage` |

### Why Two macOS Runners

- `macos-latest` resolves to an Apple Silicon (arm64) runner
- `macos-13` is the last Intel (x64) runner available on GitHub Actions
- Each runner builds its native architecture, avoiding cross-compilation complexity with `better-sqlite3`

## Build Pipeline (Per Platform)

1. **Checkout** — `actions/checkout@v4`
2. **Setup pnpm** — `pnpm/action-setup@v4`
3. **Setup Node.js 20** — `actions/setup-node@v4` with pnpm cache
4. **Install dependencies** — `pnpm install` (triggers `postinstall` → `electron-builder install-app-deps` for native module compilation)
5. **Build** — `pnpm run build` (electron-vite compiles main/preload/renderer)
6. **Package** — `npx electron-builder --publish never` (platform auto-detected from runner OS)
7. **Upload artifacts** — `actions/upload-artifact@v4` uploads `dist/` contents
8. **Release** (tag builds only) — `softprops/action-gh-release@v2` attaches installers to GitHub Release

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/build.yml` | Create | CI/CD workflow definition |
| `electron-builder.yml` | No change | Existing config already supports all three platforms |
| `package.json` | No change | Build scripts already correct |

## Unsigned macOS DMG Notes

Users downloading the unsigned DMG will encounter Gatekeeper warnings. To open:
- Right-click the `.dmg` → Open, or
- System Settings > Privacy & Security > click "Open Anyway"

This is standard behavior for unsigned macOS apps and cannot be avoided without an Apple Developer certificate ($99/year).

## Artifact Naming

electron-builder auto-generates artifact names based on `productName` and `version` from config:
- `Anything Analyzer Setup 2.0.0.exe`
- `Anything Analyzer-2.0.0.dmg` (arm64)
- `Anything Analyzer-2.0.0.dmg` (x64) — needs differentiation
- `Anything Analyzer-2.0.0.AppImage`

To distinguish macOS architectures, configure `artifactName` in `electron-builder.yml`:
```yaml
mac:
  artifactName: "${productName}-${version}-${arch}.${ext}"
```

This produces: `Anything Analyzer-2.0.0-arm64.dmg` and `Anything Analyzer-2.0.0-x64.dmg`.
