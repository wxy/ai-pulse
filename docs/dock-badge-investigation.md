# Dock Badge Investigation

## Problem

The Dock badge (`NSDockTile.badgeLabel`) stopped rendering in the AI Pulse macOS app. The badge was confirmed working in earlier (non-sandboxed) builds, but after App Sandbox enablement and App Store Connect registration, the badge text no longer appeared in the Dock.

The green progress bar (drawn via `NSApp.applicationIconImage`) continued to work normally.

## Investigation Timeline

### Phase 1: Sandbox Hypothesis (Disproven)

Initial suspicion was that App Sandbox broke the badge, since the sandbox was enabled around the same time.

- **Commit `90a8d41`** (Jul 2): Sandbox wired into Xcode build
- **Commit `3120890`** (Jul 2): Diagnostic commit noted "badgeLabel set correctly but invisible under macOS 26 sandbox"

Testing disproved this: the badge was invisible even in non-sandboxed SPM builds (`swift build` / `make app`).

### Phase 2: CFBundleIconFile Hypothesis (Partially Correct, Ultimately Insufficient)

The `CFBundleIconFile` key in `Info.plist` appeared to be the root cause. Removing it made the badge render in minimal test apps.

However, this was not a viable fix because:
- App Store Connect validation **requires** `CFBundleIconFile` and a valid `.icns` file
- Removing `CFBundleIconFile` prevented Archive upload

### Phase 3: Incremental Isolation (The Critical Path)

A minimal test app was built to isolate each variable:

| Test | Setup | Badge |
|------|-------|-------|
| Raw binary | `swiftc`, no bundle, no deps | ✅ |
| `.app` bundle | Same binary, minimal Info.plist | ✅ |
| + AIPulse.icns/.png | No CFBundleIconFile in plist | ✅ |
| + AppIconLoader.load() | Custom 1024×1024 icon | ✅ |
| + Sandbox signing | `com.apple.security.app-sandbox` | ✅ |
| + GRDB linked | Statically linked | ✅ |
| + Clibgit2 linked | libgit2 dylib loaded | ✅ |
| + GRDB + Clibgit2 | Both deps together | ✅ |
| + All 33 AI Pulse source files | Full app code in CleanSPM | ✅ |

**Every individual factor was eliminated.** The badge worked in every isolation test regardless of sandbox, dependencies, custom icons, or Info.plist contents.

### Phase 4: Bundle ID — The Real Root Cause

The breakthrough came from swapping binaries between bundles:

| Binary | Bundle ID | Badge |
|--------|-----------|-------|
| CleanSPM (identical code) | `com.wxy.cleanspm` (never registered) | ✅ |
| CleanSPM (identical code) | `com.wxy.aipulse` (App Store registered) | ❌ |
| CleanSPM (identical code) | `com.wxy.aipulse2` (never registered) | ✅ |
| AI Pulse Xcode binary | `com.wxy.cleanspm` (never registered) | ✅ |
| AI Pulse Xcode binary | `com.wxy.aipulse` (App Store registered) | ❌ |

**Identical binaries** showed the badge with unregistered bundle IDs, and did NOT show it with `com.wxy.aipulse`.

After registering `com.wxy.ai-pulse` on App Store Connect, that bundle ID **also** stopped showing badges — confirming the pattern.

### Phase 5: Machine State Investigation

Various attempts to clear the cached state:
- `killall Dock` — did not fix
- Logout/login — did not fix
- `lsregister` reset — did not fix
- TCC database reset (`tccutil reset All`) — did not fix
- Launch Services database clear (`sudo rm -rf /var/db/lsd/*`) — did not fix

The badge-blocking state for App Store-registered bundle IDs persists across all known cache-clearing mechanisms on the developer's machine.

## Root Cause

**App Store Connect bundle ID registration** triggers macOS to cache configuration for that bundle ID on the developer's machine. This cache prevents `NSDockTile.badgeLabel` from rendering in the Dock. The exact mechanism is unknown (possibly Xcode's provisioning profile management, `appstored` daemon configuration, or App Store sandbox policy enforcement).

This behavior is specific to:
- The developer's machine where Xcode manages provisioning profiles for the registered bundle ID
- Bundle IDs that have been registered on App Store Connect

## Conclusion

- **No code changes are needed.** The `badgeLabel` API works correctly.
- **`CFBundleIconFile` must be kept** in `Info.plist` — it is required for App Store validation.
- **End users will see the badge normally.** They install the app fresh without any cached App Store Connect configuration.
- **For local development testing**, use a temporary bundle ID that hasn't been registered on App Store Connect.

## Recommendations

1. If future debugging of Dock badge visibility is needed, test with an unregistered bundle ID to eliminate this known issue.
2. Consider filing a Feedback Assistant report with Apple about App Store-registered bundle IDs blocking Dock badge rendering on development machines.
3. If Apple confirms this is intended behavior, consider drawing the badge text directly on the `applicationIconImage` (like the green progress bar) to guarantee badge visibility in all environments.
