# AI Pulse Monorepo 拆分设计

## 背景

当前 `ai-pulse` 仓库同时包含 Chrome 扩展（WXT + TypeScript/React）和 macOS 桌面应用（Swift/SwiftUI），后者位于 `mac-app/` 子目录。两个产品均已发布（Chrome Web Store + Mac App Store）。

拆分驱动因素：
- 共享代码极少（仅 98 行 `shared/pricing-catalog.json`）
- 技术栈完全不同（TypeScript/WXT vs Swift/Xcode/SPM）
- 构建系统、CI/CD、版本节奏相互独立
- macOS 应用"寄生"在扩展仓库的目录结构下，路径引用不自然
- 未来计划开发 iOS/Android 应用，不适合继续在同一个仓库堆积

## 目标架构

```
ai-pulse/              → Chrome 扩展（保留现有仓库）
ai-pulse-macos/        → macOS 桌面应用（从 mac-app/ 提级为新仓库）
ai-pulse-ios/          → 未来 iOS 应用（独立仓库）
ai-pulse-android/      → 未来 Android 应用（独立仓库）
ai-pulse-schemas/      → 未来共享数据协议（API 定义、数据模型、定价表）
```

每个仓库自主管理技术栈、版本号、构建系统、CI/CD。

## 拆分步骤

### 1. 准备工作

- 安装 `git-filter-repo`: `brew install git-filter-repo`
- 确保当前仓库 `git status` 干净，无未提交变更
- 如有 git tags，记录 `git tag -l` 以便后续在新仓库重建
- 备份仓库（可选但推荐）: `cp -r ai-pulse ai-pulse-backup`

### 2. 提取 macOS 应用仓库

```bash
git clone /Users/xingyuwang/develop/ai-pulse ai-pulse-macos
cd ai-pulse-macos
git filter-repo --subdirectory-filter mac-app/ --force
```

`git filter-repo` 效果：
- `mac-app/Sources/main.swift` → `Sources/main.swift`（完整保留 commit 历史、作者、时间戳）
- 所有仅涉及 `mac-app/` 之外的 commit 被自动移除
- 同时涉及两边的 commit 中，仅保留 `mac-app/` 部分
- 最终仓库约 86 个 commits（数量可能因重写而有微小差异，以实际为准）

### 3. 清理原仓库（Chrome 扩展）

```bash
cd ai-pulse
git rm -r mac-app/
git commit -m "chore: 移除 mac-app，已拆分为独立仓库 github.com/wxy/ai-pulse-macos"
```

`shared/pricing-catalog.json` 保留在原仓库供 Chrome 扩展使用。macOS 应用复制一份到新仓库。

### 4. 推送新仓库

在 GitHub 创建 `ai-pulse-macos` 空仓库（不要初始化 README），然后：

```bash
cd ai-pulse-macos
# filter-repo 会移除旧 remote，需要重新添加
git remote add origin git@github.com:wxy/ai-pulse-macos.git
git push -u origin main
# 如有 tags 需要推送: git push --tags
```

## 拆分后修改清单

### macOS 新仓库 (`ai-pulse-macos`)

#### Package.swift — libgit2 链接路径修复（关键）

**当前（硬编码绝对路径）：**

```swift
linkerSettings: [
    .unsafeFlags([
        "-L/Users/xingyuwang/develop/ai-pulse/mac-app/Libraries/libgit2/lib",
        "-Xlinker", "-rpath", "-Xlinker",
        "/Users/xingyuwang/develop/ai-pulse/mac-app/Libraries/libgit2/lib",
    ]),
]
```

**修改后：**

方案 A：移除 Package.swift 中的 linkerSettings，改在 Xcode 项目 Build Settings 中设置：
- `LIBRARY_SEARCH_PATHS` = `$(SRCROOT)/Libraries/libgit2/lib`
- `LD_RUNPATH_SEARCH_PATHS` = `@executable_path/../Libraries/libgit2/lib`

方案 B：如必须保留在 Package.swift，使用相对路径：
```swift
linkerSettings: [
    .unsafeFlags([
        "-LLibraries/libgit2/lib",
        "-Xlinker", "-rpath", "-Xlinker", "@executable_path/../Libraries/libgit2/lib",
    ]),
]
```

推荐方案 A，因为 `$(SRCROOT)` 在 Xcode build settings 中是标准的项目根引用方式。

#### .gitignore — 替换为 Xcode/Swift 模板

当前 `.gitignore` 是 Chrome 扩展模板（`node_modules/`、`dist/`、`.wxt/`）。改为：

```
# Xcode
.build/
*.xcarchive
*.xcworkspace/xcuserdata/
*.xcodeproj/xcuserdata/
DerivedData/

# SPM
.build/
Packages/

# OS
.DS_Store
```

#### shared/pricing-catalog.json 迁移

mac-app 中 `PricingCatalog.swift`、`MenuBarController.swift` 等文件引用 `../shared/pricing-catalog.json`。需改为新仓库内的路径（如 `Resources/pricing-catalog.json`），并将文件复制到对应位置。

#### CI — 可选新建

原仓库 CI 只覆盖 Chrome 扩展（Node.js）。macOS 应用如需 CI，可添加 GitHub Actions 配置：
- `xcodebuild -scheme AIPulse build`
- `swift test`
- 桌面应用 CI 需要 macOS runner（`macos-latest`），且 sandbox/libgit2 依赖增加配置复杂度

#### .claude/ — 复制项目级配置

将原仓库 `.claude/settings.json` 和 `.claude/settings.local.json` 中与 mac-app 相关的部分复制到新仓库。

### Chrome 扩展原仓库 (`ai-pulse`)

#### .vscode/launch.json — 移除 Swift 配置

删除 `Debug AIPulse (mac-app)` 和 `Release AIPulse (mac-app)` 两个配置块，保留 Chrome 扩展的调试配置（如有）。

#### README.md — 更新描述

移除 mac-app 相关内容，突出 Chrome 扩展定位。添加指向 `ai-pulse-macos` 仓库的链接。

#### .gitignore — 无需改动

当前内容（`node_modules/`、`dist/`、`.wxt/`、`*.zip`、`.DS_Store`）恰好不涉及 mac-app。

#### CI (.github/workflows/ci.yml) — 无需改动

当前 CI 仅测试 Chrome 扩展（TypeScript + Vitest），不受拆分影响。

### 两个仓库都需要

| 项目 | 说明 |
|---|---|
| GitHub repo description | `ai-pulse`：Chrome extension for AI API usage monitoring |
| README.md 双向链接 | 各自 README 添加指向另一个仓库的链接 |

## 验证清单

拆分完成后逐项验证：

### macOS 新仓库
- [ ] `git log --oneline | wc -l` ≈ 86（与原 `mac-app/` 的 commit 数量匹配）
- [ ] `Sources/` 在仓库根目录（非 `mac-app/Sources/`）
- [ ] `Package.swift` 路径引用正确（无硬编码绝对路径）
- [ ] Xcode 中打开项目，Clean Build Folder，重新 Build 成功
- [ ] `swift test` 通过
- [ ] `pricing-catalog.json` 可正常加载
- [ ] .gitignore 不包含 `node_modules/` 等前端条目

### Chrome 扩展原仓库
- [ ] `mac-app/` 目录已删除
- [ ] `.vscode/launch.json` 不含 Swift 配置
- [ ] `npm ci && npm test && npm run build` 全部通过
- [ ] CI (GitHub Actions) 通过

## 未来多平台策略

当需要开发 iOS/Android 应用时：

1. 创建独立仓库 `ai-pulse-ios`、`ai-pulse-android`
2. 各平台使用各自原生技术栈（SwiftUI for iOS, Kotlin/Compose for Android）
3. 如果多个平台需要共享数据格式（如云端同步的 API 协议），创建 `ai-pulse-schemas` 仓库作为单一事实来源，包含：
   - JSON Schema / Protocol Buffers / OpenAPI 定义
   - 共享的定价数据（`pricing-catalog.json`）
   - 跨平台数据模型定义
4. 各平台仓库通过 Git submodule 或包管理器引用 schemas 仓库，版本化管理
5. schemas 仓库不是当前必须创建的——等到实际需要跨平台数据同步时再建立
