# macOS 26 App Icon Regeneration

## Context

- macOS 26 (announced WWDC 2025) replaced the superellipse/squircle Dock icon mask with a standard **rounded rectangle**: **185.4px corner radius on a 1024×1024 canvas** (≈18.1%).
- Our app currently has a **square** `AIPulse.png` master artwork and a stale `AIPulse.icns` generated from an older icon version.
- `AppIconLoader.swift` still uses `cornerFraction = 0.2285` (the pre-macOS-26 HIG figure) for its progress-arc geometry, so the arc doesn't match the actual system mask.

## Design Decisions

1. **Square PNG stays square.** `AIPulse.png` is the runtime artwork — `AppIconLoader` draws it inside the HIG safe zone. macOS applies the rounded-rect mask automatically in the Dock. The source PNG should NOT be pre-rounded so the art isn't double-cropped.
2. **`.icns` gets rounded.** The `.icns` is used by Finder, Launchpad, and other contexts that don't apply the Dock mask. Those need baked-in rounded corners matching macOS 26.
3. **Corner radius: 185.4px** (official macOS 26 value), ratio `185.4/1024 ≈ 0.18105`.

## Implementation Plan

### 1. Fix `AppIconLoader.swift`
- Change `cornerFraction` from `0.2285` → `185.4 / 1024` (≈0.18105)
- Update comment to reference macOS 26 standard

### 2. Generate rounded iconset + .icns
- Apply rounded-rect mask (185.4px radius) to a copy of `AIPulse.png` → `icon_512x512@2x.png` (1024×1024)
- Downscale to all 10 standard sizes with the rounded mask preserved
- Package into `AIPulse.icns` via `iconutil`

### 3. Create generation script
- `mac-app/scripts/generate-icons.sh`
- Reproducible: input = `Resources/AIPulse.png`, output = `AIPulse.iconset/` + `AIPulse.icns`

## Files Touched

| File | Action |
|---|---|
| `mac-app/Sources/UI/Shared/AppIconLoader.swift` | Fix `cornerFraction` |
| `mac-app/Resources/AIPulse.icns` | Regenerate |
| `mac-app/Resources/AIPulse.iconset/*` | Regenerate all 10 PNGs |
| `mac-app/scripts/generate-icons.sh` | **New** — reproducible icon pipeline |
