# Repo Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split ai-pulse monorepo into two independent repos (Chrome extension + macOS app) with full git history preserved, then fix all path references and configs.

**Architecture:** Use `git filter-repo --subdirectory-filter` to extract mac-app/ into ai-pulse-macos with history intact and contents promoted to root. Then fix hardcoded paths, configs, and shared file references in both repos.

**Tech Stack:** git-filter-repo, Swift/SPM/Xcode (macOS), TypeScript/WXT (Chrome extension)

## Global Constraints

- Preserve all git commit history (authors, timestamps, messages) for both repos
- macOS app must build successfully in Xcode after split
- Chrome extension must pass `npm test && npm run build` after split
- Only shared code between the two is `pricing-catalog.json` (98 lines) — each repo gets its own copy

---

### Task 1: Extract macOS repo with git-filter-repo

**Files:**
- Create: `ai-pulse-macos/` (entire new repo at `/Users/xingyuwang/develop/ai-pulse-macos`)

**Interfaces:**
- Consumes: Current ai-pulse repo at `/Users/xingyuwang/develop/ai-pulse`
- Produces: Clean macOS repo at `/Users/xingyuwang/develop/ai-pulse-macos` with `Sources/`, `Package.swift`, etc. at root

- [ ] **Step 1: Verify git-filter-repo is installed**

Run: `which git-filter-repo`
Expected: `/opt/homebrew/bin/git-filter-repo` (or error — if error, run `brew install git-filter-repo`)

- [ ] **Step 2: Verify source repo is clean**

Run: `git -C /Users/xingyuwang/develop/ai-pulse status --porcelain`
Expected: empty output (no uncommitted changes)

- [ ] **Step 3: Clone and filter**

```bash
cd /Users/xingyuwang/develop
git clone /Users/xingyuwang/develop/ai-pulse ai-pulse-macos
cd ai-pulse-macos
git filter-repo --subdirectory-filter mac-app/ --force
```

Expected output: "New history written in X.Y seconds..." with no errors. Commits rewritten.

- [ ] **Step 4: Verify directory structure**

Run: `ls /Users/xingyuwang/develop/ai-pulse-macos/`
Expected: `Sources/`, `Package.swift`, `AIPulse/`, `Resources/`, `Libraries/`, `Tests/` — NO `mac-app/` subdirectory

- [ ] **Step 5: Verify commit history count**

Run: `git -C /Users/xingyuwang/develop/ai-pulse-macos log --oneline | wc -l`
Expected: approximately 80-90 commits (not vastly different from original 86)

- [ ] **Step 6: Verify a specific file has its history**

Run: `git -C /Users/xingyuwang/develop/ai-pulse-macos log --oneline -- Sources/main.swift | tail -3`
Expected: old commits from when main.swift was first added, not a single "initial commit"

- [ ] **Step 7: Commit** (no commit needed — filter-repo rewrites history in place)

---

### Task 2: Fix Xcode project.pbxproj absolute paths in macOS repo

**Files:**
- Modify: `/Users/xingyuwang/develop/ai-pulse-macos/AIPulse/AIPulse.xcodeproj/project.pbxproj`

**Interfaces:**
- Consumes: ai-pulse-macos repo from Task 1
- Produces: project.pbxproj with all paths relative to SRCROOT instead of hardcoded to xingyuwang's home directory

- [ ] **Step 1: Verify absolute paths exist after filter-repo**

Run: `grep -c "/Users/xingyuwang" /Users/xingyuwang/develop/ai-pulse-macos/AIPulse/AIPulse.xcodeproj/project.pbxproj`
Expected: outputs a count > 0 (8 lines in Debug + Release configs)

- [ ] **Step 2: Replace all absolute paths with Xcode build settings variables**

Run the following sed commands to fix the four types of absolute paths in the pbxproj:

```bash
cd /Users/xingyuwang/develop/ai-pulse-macos
PBX=AIPulse/AIPulse.xcodeproj/project.pbxproj

# 1. HEADER_SEARCH_PATHS — libgit2 headers
sed -i '' 's|/Users/xingyuwang/develop/ai-pulse/mac-app/Libraries/libgit2/include|$(SRCROOT)/Libraries/libgit2/include|g' "$PBX"

# 2. LIBRARY_SEARCH_PATHS (-L flag) — libgit2 dylib search path
sed -i '' 's|-L/Users/xingyuwang/develop/ai-pulse/mac-app/Libraries/libgit2/lib|-L$(SRCROOT)/Libraries/libgit2/lib|g' "$PBX"

# 3. LD_RUNPATH_SEARCH_PATHS — runtime dylib loading path
sed -i '' 's|/Users/xingyuwang/develop/ai-pulse/mac-app/Libraries/libgit2/lib|@executable_path/../Libraries/libgit2/lib|g' "$PBX"

# 4. SWIFT_INCLUDE_PATHS — Clibgit2 modulemap
sed -i '' 's|/Users/xingyuwang/develop/ai-pulse/mac-app/Sources/Clibgit2|$(SRCROOT)/Sources/Clibgit2|g' "$PBX"
```

- [ ] **Step 3: Verify no remaining absolute paths**

Run: `grep -n "/Users/xingyuwang" /Users/xingyuwang/develop/ai-pulse-macos/AIPulse/AIPulse.xcodeproj/project.pbxproj`
Expected: no output

- [ ] **Step 4: Verify the replacements look correct**

Run: `grep -n "SRCROOT\|executable_path" /Users/xingyuwang/develop/ai-pulse-macos/AIPulse/AIPulse.xcodeproj/project.pbxproj`
Expected:
- 2x `$(SRCROOT)/Libraries/libgit2/include` (Debug + Release)
- 2x `-L$(SRCROOT)/Libraries/libgit2/lib`
- 2x `@executable_path/../Libraries/libgit2/lib`
- 2x `$(SRCROOT)/Sources/Clibgit2`

- [ ] **Step 5: Commit**

```bash
git -C /Users/xingyuwang/develop/ai-pulse-macos add AIPulse/AIPulse.xcodeproj/project.pbxproj
git -C /Users/xingyuwang/develop/ai-pulse-macos commit -m "fix: 用 $(SRCROOT) 替换 project.pbxproj 中的硬编码绝对路径"
```

---

### Task 3: Fix Package.swift libgit2 paths in macOS repo

**Files:**
- Modify: `/Users/xingyuwang/develop/ai-pulse-macos/Package.swift:23-28`

**Interfaces:**
- Consumes: ai-pulse-macos repo from Task 2
- Produces: Package.swift with relative libgit2 paths that work from any machine

- [ ] **Step 1: Read current state**

Run: `grep -n "L/Users\|rpath.*Users" /Users/xingyuwang/develop/ai-pulse-macos/Package.swift`
Expected: lines containing hardcoded `/Users/xingyuwang/develop/ai-pulse/mac-app/` paths

- [ ] **Step 2: Replace linkerSettings with relative paths**

Open `/Users/xingyuwang/develop/ai-pulse-macos/Package.swift` and replace the linkerSettings block. The current block is:

```swift
            linkerSettings: [
                .unsafeFlags([
                    "-L/Users/xingyuwang/develop/ai-pulse/mac-app/Libraries/libgit2/lib",
                    "-Xlinker", "-rpath", "-Xlinker", "/Users/xingyuwang/develop/ai-pulse/mac-app/Libraries/libgit2/lib",
                ]),
            ]
```

Replace with:

```swift
            linkerSettings: [
                .unsafeFlags([
                    "-LLibraries/libgit2/lib",
                    "-Xlinker", "-rpath", "-Xlinker", "@executable_path/../Libraries/libgit2/lib",
                ]),
            ]
```

- [ ] **Step 3: Verify no remaining absolute paths**

Run: `grep -n "xingyuwang\|/Users/" /Users/xingyuwang/develop/ai-pulse-macos/Package.swift`
Expected: no output (all user-specific paths removed)

- [ ] **Step 4: Commit**

```bash
git -C /Users/xingyuwang/develop/ai-pulse-macos add Package.swift
git -C /Users/xingyuwang/develop/ai-pulse-macos commit -m "fix: 用相对路径替换 Package.swift 中 libgit2 的硬编码绝对路径"
```

---

### Task 4: Migrate pricing-catalog.json to macOS repo

**Files:**
- Create: `/Users/xingyuwang/develop/ai-pulse-macos/Resources/pricing-catalog.json`
- Modify: `/Users/xingyuwang/develop/ai-pulse-macos/Sources/Ingest/PricingCatalog.swift:33-53`

**Interfaces:**
- Consumes: ai-pulse-macos repo from Task 3
- Produces: PricingManager loads catalog from `Resources/` via Bundle.main, with `../shared/` paths cleaned up

- [ ] **Step 1: Copy pricing-catalog.json to Resources/**

Run: `cp /Users/xingyuwang/develop/ai-pulse/shared/pricing-catalog.json /Users/xingyuwang/develop/ai-pulse-macos/Resources/pricing-catalog.json`

- [ ] **Step 2: Update PricingCatalog.swift search paths**

Open `/Users/xingyuwang/develop/ai-pulse-macos/Sources/Ingest/PricingCatalog.swift` and replace the `load()` method's searchPaths (lines 35-41).

Replace:

```swift
        let searchPaths = [
            Bundle.main.path(forResource: "pricing-catalog", ofType: "json"),
            "../shared/pricing-catalog.json",    // from mac-app/ (swift run cwd)
            "../../shared/pricing-catalog.json", // from .build/debug/
            "../../../../../../shared/pricing-catalog.json", // from .app bundle
            "./shared/pricing-catalog.json",
        ]
```

With:

```swift
        let searchPaths = [
            Bundle.main.path(forResource: "pricing-catalog", ofType: "json"),
            "../Resources/pricing-catalog.json",   // from .build/debug/ (swift run)
            "../../Resources/pricing-catalog.json", // from .build/release/
        ]
```

- [ ] **Step 3: Verify no remaining shared/ references**

Run: `grep -rn "shared/" /Users/xingyuwang/develop/ai-pulse-macos/Sources/ --include="*.swift"`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git -C /Users/xingyuwang/develop/ai-pulse-macos add Resources/pricing-catalog.json Sources/Ingest/PricingCatalog.swift
git -C /Users/xingyuwang/develop/ai-pulse-macos commit -m "fix: 迁移 pricing-catalog.json 到 Resources/，移除 ../shared/ 引用"
```

---

### Task 5: Replace .gitignore in macOS repo

**Files:**
- Modify: `/Users/xingyuwang/develop/ai-pulse-macos/.gitignore`

**Interfaces:**
- Consumes: ai-pulse-macos repo from Task 4
- Produces: .gitignore appropriate for Xcode/Swift project

- [ ] **Step 1: Read current .gitignore**

Run: `cat /Users/xingyuwang/develop/ai-pulse-macos/.gitignore`
Expected: Chrome extension template (`node_modules/`, `dist/`, `.wxt/`, `*.zip`, `.DS_Store`)

- [ ] **Step 2: Replace with Xcode/Swift template**

Overwrite `/Users/xingyuwang/develop/ai-pulse-macos/.gitignore` with:

```
# Xcode
.build/
*.xcarchive
*.xcworkspace/xcuserdata/
*.xcodeproj/xcuserdata/
DerivedData/

# SPM
Packages/

# OS
.DS_Store
```

- [ ] **Step 3: Add and commit**

```bash
git -C /Users/xingyuwang/develop/ai-pulse-macos add .gitignore
git -C /Users/xingyuwang/develop/ai-pulse-macos commit -m "chore: 替换 .gitignore 为 Xcode/Swift 模板"
```

---

### Task 6: Verify macOS repo builds

**Files:**
- (verification only, no file changes)

**Interfaces:**
- Consumes: ai-pulse-macos repo from Task 5
- Produces: Confirmed build success or documented failures

- [ ] **Step 1: Attempt SPM build (quick check)**

Run: `cd /Users/xingyuwang/develop/ai-pulse-macos && swift build 2>&1 | tail -20`
Expected: "Build complete!" OR specific linker errors about libgit2

If linker errors about libgit2: this is expected with `swift build` because the `-L` relative path may not resolve the same way as in Xcode. Proceed to Xcode build.

- [ ] **Step 2: Open in Xcode and build**

Run: `open /Users/xingyuwang/develop/ai-pulse-macos/AIPulse/AIPulse.xcodeproj`

In Xcode:
1. Product → Clean Build Folder (⇧⌘K)
2. Product → Build (⌘B)

Expected: Build succeeds. If build fails with path errors, check that:
- `LIBRARY_SEARCH_PATHS` in Build Settings → Linking includes `$(SRCROOT)/Libraries/libgit2/lib`
- `LD_RUNPATH_SEARCH_PATHS` includes `@executable_path/../Libraries/libgit2/lib`
- If these settings only exist in Package.swift (removed in Task 2), add them to the Xcode target's Build Settings

- [ ] **Step 3: Run tests**

In Xcode: Product → Test (⌘U)
Or from CLI: `cd /Users/xingyuwang/develop/ai-pulse-macos && swift test 2>&1 | tail -20`

Expected: Tests pass

---

### Task 7: Clean up Chrome extension repo — remove mac-app/

**Files:**
- Delete: `/Users/xingyuwang/develop/ai-pulse/mac-app/` (entire directory)
- Modify: `/Users/xingyuwang/develop/ai-pulse/.vscode/launch.json`

**Interfaces:**
- Consumes: Original ai-pulse repo
- Produces: Clean Chrome extension repo without macOS artifacts

- [ ] **Step 1: Remove mac-app/ directory**

```bash
cd /Users/xingyuwang/develop/ai-pulse
git rm -r mac-app/
```

- [ ] **Step 2: Commit the removal**

```bash
git -C /Users/xingyuwang/develop/ai-pulse commit -m "chore: 移除 mac-app，已拆分为独立仓库 github.com/wxy/ai-pulse-macos"
```

- [ ] **Step 3: Clean .vscode/launch.json — remove Swift configurations**

Open `/Users/xingyuwang/develop/ai-pulse/.vscode/launch.json`. The file currently contains only two Swift configurations. Replace the entire file content with:

```json
{
    "configurations": []
}
```

- [ ] **Step 4: Commit launch.json cleanup**

```bash
git -C /Users/xingyuwang/develop/ai-pulse add .vscode/launch.json
git -C /Users/xingyuwang/develop/ai-pulse commit -m "chore: 移除 .vscode/launch.json 中的 Swift 调试配置"
```

---

### Task 8: Verify Chrome extension repo

**Files:**
- (verification only, no file changes)

**Interfaces:**
- Consumes: Clean Chrome extension repo from Task 7
- Produces: Confirmed all tests and build pass

- [ ] **Step 1: Verify mac-app/ is gone**

Run: `ls /Users/xingyuwang/develop/ai-pulse/mac-app/ 2>&1`
Expected: "No such file or directory"

- [ ] **Step 2: Install dependencies**

Run: `cd /Users/xingyuwang/develop/ai-pulse && npm ci`
Expected: packages installed, no errors

- [ ] **Step 3: Run type check**

Run: `cd /Users/xingyuwang/develop/ai-pulse && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Run tests**

Run: `cd /Users/xingyuwang/develop/ai-pulse && npx vitest run`
Expected: all tests pass (72 tests)

- [ ] **Step 5: Run build**

Run: `cd /Users/xingyuwang/develop/ai-pulse && npx wxt build`
Expected: "BUILD: ✓ Built in X.Ys"

- [ ] **Step 6: Verify .vscode/launch.json has no Swift refs**

Run: `grep -i "swift\|mac-app" /Users/xingyuwang/develop/ai-pulse/.vscode/launch.json`
Expected: no output

---

### Task 9: Set up GitHub remote and push macOS repo

**Files:**
- (remote config only)

**Interfaces:**
- Consumes: Verified ai-pulse-macos repo from Task 6
- Produces: Remote on GitHub with full history pushed

- [ ] **Step 1: Create GitHub repo**

Go to https://github.com/new — create repository named `ai-pulse-macos`, DO NOT initialize with README/.gitignore/license (we want an empty repo to push our history into).

- [ ] **Step 2: Add remote and push**

```bash
git -C /Users/xingyuwang/develop/ai-pulse-macos remote add origin git@github.com:wxy/ai-pulse-macos.git
git -C /Users/xingyuwang/develop/ai-pulse-macos push -u origin main
```

- [ ] **Step 3: Verify remote history is intact**

Run: `gh repo view wxy/ai-pulse-macos --json defaultBranchRef --jq '.defaultBranchRef.target.history.totalCount'` (if `gh` is authenticated)
Or: visit the repo on GitHub and check the commit count

---

### Task 10: Final verification — both repos self-contained

**Files:**
- Modify: `/Users/xingyuwang/develop/ai-pulse/README.md` (add link to macOS repo)
- (no file changes in macOS repo for this task)

**Interfaces:**
- Consumes: Both repos in final state
- Produces: Confirmation that neither repo depends on the other

- [ ] **Step 1: Verify no cross-repo references remain**

```bash
# In macOS repo — should find zero references to ../shared/ or ai-pulse repo
grep -r "ai-pulse" /Users/xingyuwang/develop/ai-pulse-macos/Sources/ --include="*.swift" 2>/dev/null
grep -r "ai-pulse" /Users/xingyuwang/develop/ai-pulse-macos/Package.swift 2>/dev/null
```

Expected: no output from either command (except possibly in comments/documentation)

- [ ] **Step 2: Add cross-link to Chrome extension README**

Open `/Users/xingyuwang/develop/ai-pulse/README.md`. At the end, add:

```markdown
## Related

- [AI Pulse for macOS](https://github.com/wxy/ai-pulse-macos) — Desktop app with local code-aware cost tracking
```

- [ ] **Step 3: Add cross-link to macOS repo README**

If a README exists in the macOS repo (check with `ls /Users/xingyuwang/develop/ai-pulse-macos/README.md`), add:

```markdown
## Related

- [AI Pulse Chrome Extension](https://github.com/wxy/ai-pulse) — Browser extension for AI API usage monitoring
```

If no README exists in the macOS repo, skip this step (it can be added later).

- [ ] **Step 4: Commit README update**

```bash
git -C /Users/xingyuwang/develop/ai-pulse add README.md
git -C /Users/xingyuwang/develop/ai-pulse commit -m "docs: 添加 ai-pulse-macos 仓库链接"
```
