# 展示层对齐 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Dashboard charts, CPL positioning, menu bar display, and onboarding flow with PRODUCT_DESIGN.md v1.3.

**Architecture:** Split the merged cost+lines chart into two independent stacked-bar charts (cost chart + code change chart). Demote CPL from a prominent trend line to a small info card. Simplify menu bar to show only cost + added/deleted lines. Add repo selection step to onboarding.

**Tech Stack:** SwiftUI + Charts framework + GRDB/SQLite

## Global Constraints

- Do NOT modify existing StatsService method signatures — add new methods only
- Do NOT add/modify database tables
- All user-facing strings must go through `I18n.t()` with both `zh` and `en` entries
- Backward compatible — existing user settings must not be broken
- Menu bar model submenu uses B-grade balance data from `ApiPoller`, not A-grade token data

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `Sources/Store/StatsService.swift` | Modify | Add `ProviderDailyCost`, `DailyCodeChange` structs + 2 query methods |
| `Sources/Utils/I18n.swift` | Modify | Add ~20 new i18n keys, update ~5 existing keys |
| `Sources/UI/Dashboard/DashboardView.swift` | Refactor | Split charts, adjust cards, demote CPL |
| `Sources/UI/MenuBar/MenuBarController.swift` | Modify | Remove CPL/tokens, use B-grade provider data for submenu |
| `Sources/UI/Onboarding/OnboardingView.swift` | Modify | Insert Step 3 (repo selection) |

---

### Task 1: StatsService — Add provider-level cost and separate added/deleted queries

**Files:**
- Modify: `mac-app/Sources/Store/StatsService.swift`

**Interfaces:**
- Produces: `ProviderDailyCost` struct, `DailyCodeChange` struct, `providerDailyCosts(days:)`, `dailyCodeChanges(days:)`

The current `DailyStat` aggregates all costs into one `cost` field and only gives `netLines`. For per-provider cost charts and added/deleted stacked bars, we need two new query methods.

- [ ] **Step 1: Add `ProviderDailyCost` and `DailyCodeChange` structs after `Prediction`**

```swift
struct ProviderDailyCost: Identifiable {
    var id: String { "\(providerId)-\(Int(date.timeIntervalSince1970))" }
    let date: Date
    let providerId: String
    let cost: Double
}

struct DailyCodeChange: Identifiable {
    var id: Date { date }
    let date: Date
    let added: Int
    let deleted: Int
}
```

Insert after the `Prediction` struct (after line 35 in current file).

- [ ] **Step 2: Add `providerDailyCosts(days:)` method inside `StatsService` enum**

```swift
/// Daily cost grouped by provider_id for the cost chart.
static func providerDailyCosts(days: Int) async -> [ProviderDailyCost] {
    let cal = Calendar.current
    let todayStart = cal.startOfDay(for: Date())
    guard let start = cal.date(byAdding: .day, value: -(days - 1), to: todayStart) else { return [] }
    let startMs = Int64(start.timeIntervalSince1970 * 1000)
    let todayMs  = Int64(todayStart.timeIntervalSince1970 * 1000)

    do {
        let rows = try await AppDatabase.shared.read { db -> [Row] in
            try Row.fetchAll(db, sql: """
                SELECT (ts / 86400000) * 86400000 AS day_ts,
                       COALESCE(provider_id, 'unknown') AS pid,
                       COALESCE(SUM(cost_usd), 0) AS c
                FROM usage_event
                WHERE ts >= ? AND ts < ? AND (model IS NULL OR model != '<synthetic>')
                GROUP BY day_ts, pid ORDER BY day_ts, c DESC
                """, arguments: [startMs, todayMs + 86_400_000])
        }
        return rows.compactMap { r in
            guard let day: Int64 = r["day_ts"],
                  let pid: String = r["pid"],
                  let c: Double = r["c"],
                  c > 0 else { return nil }
            let date = Date(timeIntervalSince1970: Double(day) / 1000)
            return ProviderDailyCost(date: date, providerId: pid, cost: c)
        }
    } catch {
        print("StatsService.providerDailyCosts error: \(error)")
        return []
    }
}
```

- [ ] **Step 3: Add `dailyCodeChanges(days:)` method**

```swift
/// Daily added/deleted lines (separate, not net) for the code-change chart.
static func dailyCodeChanges(days: Int) async -> [DailyCodeChange] {
    let cal = Calendar.current
    let todayStart = cal.startOfDay(for: Date())
    guard let start = cal.date(byAdding: .day, value: -(days - 1), to: todayStart) else { return [] }
    let startMs = Int64(start.timeIntervalSince1970 * 1000)
    let todayMs  = Int64(todayStart.timeIntervalSince1970 * 1000)

    do {
        let rows = try await AppDatabase.shared.read { db -> [Row] in
            try Row.fetchAll(db, sql: """
                SELECT (ts / 86400000) * 86400000 AS day_ts,
                       COALESCE(SUM(added), 0) AS a,
                       COALESCE(SUM(deleted), 0) AS d
                FROM code_change
                WHERE is_merge = 0 AND ts >= ? AND ts < ?
                GROUP BY day_ts ORDER BY day_ts
                """, arguments: [startMs, todayMs + 86_400_000])
        }
        return rows.compactMap { r in
            guard let day: Int64 = r["day_ts"] else { return nil }
            let a: Int64 = r["a"] ?? 0
            let d: Int64 = r["d"] ?? 0
            let date = Date(timeIntervalSince1970: Double(day) / 1000)
            return DailyCodeChange(date: date, added: Int(a), deleted: Int(d))
        }
    } catch {
        print("StatsService.dailyCodeChanges error: \(error)")
        return []
    }
}
```

- [ ] **Step 4: Build and verify compilation**

Run: `cd mac-app && swift build`
Expected: Compilation succeeds, no errors.

- [ ] **Step 5: Commit**

```bash
git add mac-app/Sources/Store/StatsService.swift
git commit -m "feat: add providerDailyCosts + dailyCodeChanges queries for new charts"
```

---

### Task 2: I18n — Add new strings and update existing ones

**Files:**
- Modify: `mac-app/Sources/Utils/I18n.swift`

**Interfaces:**
- Produces: New i18n keys consumed by Tasks 3-5

- [ ] **Step 1: Add new keys to `zh` dictionary**

Insert the following new keys into the `zh` dictionary (before the closing `]`):

```swift
"dashboard.cost_chart": "花费",
"dashboard.code_chart": "代码变化",
"dashboard.week_added_del": "本周增减行",
"dashboard.sub_daily": "订阅日均",
"dashboard.api_cost": "API 余额消耗",
"dashboard.sub_cost": "订阅均摊",
"dashboard.cost_footnote": "⚠️ 两类花费独立展示，不参与 CPL 计算",
"dashboard.cpl_card": "CPL（每千行成本）",
"dashboard.cpl_disclaimer": "按量计费 · 有日志 · 仅含 API Token 成本，不含订阅",
"dashboard.added": "新增",
"dashboard.deleted": "删除",
"dashboard.no_cpl_data": "暂无满足条件的 CPL 数据",
"menu.added": "新增",
"menu.deleted": "删除",
"menu.by_provider": "▸ 按 Provider",
"onboarding.step0": "欢迎",
"onboarding.step1": "侦测",
"onboarding.step2": "启用",
"onboarding.step3": "仓库",
"onboarding.step4": "完成",
"onboarding.repos_title": "选择要监控的 Git 仓库",
"onboarding.repos_hint": "自动扫描常用目录。可跳过，稍后在设置中配置。",
"onboarding.repos_scanning": "正在扫描…",
"onboarding.repos_count": "%d 个仓库",
"onboarding.skip": "跳过",
```

- [ ] **Step 2: Add new keys to `en` dictionary**

```swift
"dashboard.cost_chart": "Cost",
"dashboard.code_chart": "Code Changes",
"dashboard.week_added_del": "Week ±Lines",
"dashboard.sub_daily": "Sub Daily",
"dashboard.api_cost": "API Balance",
"dashboard.sub_cost": "Subscription",
"dashboard.cost_footnote": "⚠️ Costs shown independently. Not used for CPL.",
"dashboard.cpl_card": "CPL (Cost Per K Lines)",
"dashboard.cpl_disclaimer": "Metered · Has logs · API token cost only, excl. subscriptions",
"dashboard.added": "Added",
"dashboard.deleted": "Deleted",
"dashboard.no_cpl_data": "No CPL data available",
"menu.added": "added",
"menu.deleted": "deleted",
"menu.by_provider": "▸ By Provider",
"onboarding.step0": "Welcome",
"onboarding.step1": "Detect",
"onboarding.step2": "Enable",
"onboarding.step3": "Repos",
"onboarding.step4": "Done",
"onboarding.repos_title": "Select Git Repos to Monitor",
"onboarding.repos_hint": "Auto-scan common directories. You can skip and configure later in Settings.",
"onboarding.repos_scanning": "Scanning…",
"onboarding.repos_count": "%d repos",
"onboarding.skip": "Skip",
```

- [ ] **Step 3: Update existing keys that reference CPL or merged chart**

In `zh` dict:
```swift
// OLD:
"dashboard.cost_lines": "花费与净增行",
"dashboard.cpl_trend": "千行成本趋势",
"dashboard.avg_cpl": "千行成本",
"dashboard.total_lines": "净增行数",
// NEW:
"dashboard.cost_lines": "花费与净增行",  // keep for backward compat, not used in new UI
"dashboard.avg_cpl": "千行成本",         // keep for backward compat
"dashboard.total_lines": "净增行数",     // keep for backward compat
```

No existing keys need modification — we add new keys and stop using old ones in the views. The old keys remain for safety.

- [ ] **Step 4: Build and verify**

Run: `cd mac-app && swift build`
Expected: Compilation succeeds.

- [ ] **Step 5: Commit**

```bash
git add mac-app/Sources/Utils/I18n.swift
git commit -m "i18n: add keys for split charts, CPL card, provider menu, onboarding repos"
```

---

### Task 3: DashboardView — Split charts, adjust cards, demote CPL

**Files:**
- Modify: `mac-app/Sources/UI/Dashboard/DashboardView.swift`

**Interfaces:**
- Consumes: `ProviderDailyCost`, `DailyCodeChange`, `providerDailyCosts(days:)`, `dailyCodeChanges(days:)` from Task 1; new i18n keys from Task 2
- Produces: Refactored DashboardView with two independent charts, updated summary cards, CPL card

This is the core refactor. The key changes:

1. Replace `combinedChart` (line 205-283) with `costChart` + `codeChangeChart`
2. Update `summaryCards` — remove avg CPL, add "本周增减行" and "订阅日均"
3. Remove `cplChart` (line 287-339), add `cplInfoCard`
4. Reorganize `body` layout
5. Add new `@State` variables and `load()` logic

- [ ] **Step 1: Add new @State variables**

Replace the existing state variables (lines 5-13):

```swift
struct DashboardView: View {
    @State private var dailyStats: [DailyStat] = []
    @State private var providerCosts: [ProviderDailyCost] = []
    @State private var codeChanges: [DailyCodeChange] = []
    @State private var models: [ModelBreakdown] = []
    @State private var repos: [RepoBreakdown] = []
    @State private var prediction: Prediction?
    @State private var dayRange = 7
    @State private var costHoverDate: Date? = nil
    @State private var codeHoverDate: Date? = nil
    @State private var costHoverX: CGFloat = 0
    @State private var codeHoverX: CGFloat = 0
```

- [ ] **Step 2: Replace `body` with new layout**

```swift
var body: some View {
    VStack(spacing: 0) {
        HStack {
            Text(I18n.t("dashboard.title")).font(.title2).fontWeight(.bold)
            Spacer()
            Picker("", selection: $dayRange) {
                Text(I18n.t("dashboard.days_7")).tag(7)
                Text(I18n.t("dashboard.days_30")).tag(30)
            }.pickerStyle(.segmented).frame(width: 140)
        }
        .padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 8)

        ScrollView {
            VStack(spacing: 16) {
                summaryCards.padding(.horizontal, 20)

                if hasAGrade || !providerCosts.isEmpty {
                    costChart.padding(.horizontal, 20)
                    codeChangeChart.padding(.horizontal, 20)

                    // Bottom cards row
                    bottomCards.padding(.horizontal, 20)
                } else {
                    emptyStateCard.padding(.horizontal, 20)
                }
            }.padding(.bottom, 20)
        }
    }
    .frame(width: 680, height: 640)
    .background(Color(nsColor: .windowBackgroundColor))
    .task { await load() }
    .onChange(of: dayRange) { _, _ in Task { await load() } }
}
```

- [ ] **Step 3: Replace summaryCards**

```swift
var summaryCards: some View {
    HStack(spacing: 12) {
        card(title: I18n.t("dashboard.month_spent"),
             value: prediction.map { "$\(String(format: "%.2f", $0.monthSoFar))" } ?? "--")
        card(title: I18n.t("dashboard.month_projected"),
             value: prediction.map { "$\(String(format: "%.2f", $0.monthProjected))" } ?? "--")
        card(title: I18n.t("dashboard.week_added_del"),
             value: weekAddedDel())
        card(title: I18n.t("dashboard.sub_daily"),
             value: "$\(String(format: "%.2f", totalSubDaily()))")
    }
}

func weekAddedDel() -> String {
    let added = codeChanges.reduce(0) { $0 + $1.added }
    let deleted = codeChanges.reduce(0) { $0 + $1.deleted }
    return "+\(added)/-\(deleted)"
}

func totalSubDaily() -> Double {
    let subs = IntegrationRegistry.enabledCGrade()
    let days = Double(Calendar.current.range(of: .day, in: .month, for: Date())?.count ?? 30)
    var total: Double = 0
    for s in subs {
        let cfg = IntegrationRegistry.config(for: s.id)
        guard !cfg.subscriptionTier.isEmpty else { continue }
        if let tool = SubscriptionRegistry.tool(forName: toolName(for: s.id)),
           let tier = tool.tiers.first(where: { $0.label == cfg.subscriptionTier }) {
            total += tier.fee / days
        }
    }
    return total
}

func toolName(for id: String) -> String {
    switch id {
    case "cursor": return "Cursor"
    case "copilot": return "GitHub Copilot"
    case "windsurf": return "Windsurf"
    default: return id
    }
}
```

- [ ] **Step 4: Add `costChart` (replaces combinedChart)**

```swift
// MARK: - Cost chart (API balance + subscription amortization, stacked)

var costChart: some View {
    VStack(alignment: .leading, spacing: 6) {
        Text(I18n.t("dashboard.cost_chart")).font(.headline)

        if providerCosts.isEmpty && IntegrationRegistry.enabledCGrade().isEmpty {
            Text(I18n.t("menu.no_usage")).foregroundColor(.secondary).padding(.vertical, 30)
        } else {
            ZStack(alignment: .topLeading) {
                Chart {
                    // Subscription amortization (bottom layer — constant per day)
                    ForEach(subDailyData(), id: \.id) { item in
                        BarMark(
                            x: .value("Date", item.date, unit: .day),
                            y: .value("Cost", item.cost)
                        )
                        .foregroundStyle(by: .value("Source", item.label))
                        .position(by: .value("Layer", "sub"))
                    }
                    // API balance consumption (top layer — variable per day)
                    ForEach(apiDailyData(), id: \.id) { item in
                        BarMark(
                            x: .value("Date", item.date, unit: .day),
                            y: .value("Cost", item.cost)
                        )
                        .foregroundStyle(by: .value("Source", item.label))
                        .position(by: .value("Layer", "api"))
                    }
                    if let hd = costHoverDate {
                        RuleMark(x: .value("Date", hd, unit: .day))
                            .foregroundStyle(.gray.opacity(0.3))
                    }
                }
                .chartXAxis {
                    AxisMarks(values: dateStride) { _ in
                        AxisValueLabel(format: dateLabelFormat, orientation: .horizontal)
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                    }
                }
                .chartYAxisLabel(I18n.t("dashboard.cost_usd"))
                .chartOverlay { proxy in
                    GeometryReader { geo in
                        Color.clear
                            .onContinuousHover { phase in
                                if case .active(let loc) = phase,
                                   let frame = proxy.plotFrame {
                                    let originX = geo[frame].origin.x
                                    let plotW = geo[frame].width
                                    let x = loc.x - originX
                                    guard x >= 0, x <= plotW else { costHoverDate = nil; return }
                                    costHoverX = x
                                    costHoverDate = proxy.value(atX: x)
                                } else { costHoverDate = nil }
                            }
                    }
                }
                .frame(height: 200)

                if let hd = costHoverDate {
                    costTooltip(for: hd)
                        .offset(x: min(max(costHoverX - 40, 0), 560), y: 0)
                }
            }
            Text(I18n.t("dashboard.cost_footnote"))
                .font(.caption2).foregroundColor(.secondary)
        }
    }
    .padding(16)
    .background(Color(nsColor: .quaternarySystemFill).opacity(0.3))
    .cornerRadius(10)
}

// MARK: Cost chart data helpers

struct ChartDataPoint: Identifiable {
    var id: String { "\(label)-\(Int(date.timeIntervalSince1970))" }
    let date: Date
    let label: String
    let cost: Double
}

func subDailyData() -> [ChartDataPoint] {
    let subs = IntegrationRegistry.enabledCGrade()
    guard !subs.isEmpty else { return [] }
    let days = Double(Calendar.current.range(of: .day, in: .month, for: Date())?.count ?? 30)
    let cal = Calendar.current
    let today = cal.startOfDay(for: Date())

    var result = [ChartDataPoint]()
    for offset in 0..<dayRange {
        guard let date = cal.date(byAdding: .day, value: -(dayRange - 1 - offset), to: today) else { continue }
        for s in subs {
            let cfg = IntegrationRegistry.config(for: s.id)
            guard !cfg.subscriptionTier.isEmpty else { continue }
            if let tool = SubscriptionRegistry.tool(forName: toolName(for: s.id)),
               let tier = tool.tiers.first(where: { $0.label == cfg.subscriptionTier }) {
                result.append(ChartDataPoint(date: date, label: s.displayName, cost: tier.fee / days))
            }
        }
    }
    return result
}

func apiDailyData() -> [ChartDataPoint] {
    // Group providerCosts by date and providerId, using provider displayName
    providerCosts.map { pc in
        let name = IntegrationRegistry.all.first(where: { $0.id == pc.providerId })?.displayName ?? pc.providerId
        return ChartDataPoint(date: pc.date, label: name, cost: pc.cost)
    }
}

func costTooltip(for date: Date) -> some View {
    let cal = Calendar.current
    let subs = subDailyData().filter { cal.isDate($0.date, inSameDayAs: date) }
    let apis = apiDailyData().filter { cal.isDate($0.date, inSameDayAs: date) }
    let totalCost = subs.reduce(0) { $0 + $1.cost } + apis.reduce(0) { $0 + $1.cost }

    return VStack(alignment: .leading, spacing: 2) {
        Text(date, format: .dateTime.month(.abbreviated).day()).font(.caption).fontWeight(.semibold)
        Text("$\(String(format: "%.2f", totalCost))").font(.caption2).monospacedDigit()
        ForEach(apis) { item in
            Text("  \(item.label): $\(String(format: "%.2f", item.cost))").font(.caption2).monospacedDigit()
        }
        ForEach(subs) { item in
            Text("  \(item.label): $\(String(format: "%.2f", item.cost))").font(.caption2).monospacedDigit()
        }
    }
    .padding(6).background(.regularMaterial).cornerRadius(6)
}
```

- [ ] **Step 5: Add `codeChangeChart` (replaces Lines portion of combinedChart)**

```swift
// MARK: - Code change chart (added + deleted stacked positive bars)

var codeChangeChart: some View {
    VStack(alignment: .leading, spacing: 6) {
        Text(I18n.t("dashboard.code_chart")).font(.headline)

        if codeChanges.allSatisfy({ $0.added == 0 && $0.deleted == 0 }) {
            Text(I18n.t("menu.no_usage")).foregroundColor(.secondary).padding(.vertical, 30)
        } else {
            ZStack(alignment: .topLeading) {
                Chart {
                    ForEach(paddedCodeChanges(), id: \.id) { d in
                        BarMark(
                            x: .value("Date", d.date, unit: .day),
                            y: .value("Lines", d.added)
                        )
                        .foregroundStyle(Color.green.opacity(0.7))
                        .position(by: .value("Type", I18n.t("dashboard.added")))
                    }
                    ForEach(paddedCodeChanges(), id: \.id) { d in
                        BarMark(
                            x: .value("Date", d.date, unit: .day),
                            y: .value("Lines", d.deleted)
                        )
                        .foregroundStyle(Color.orange.opacity(0.7))
                        .position(by: .value("Type", I18n.t("dashboard.deleted")))
                    }
                    if let hd = codeHoverDate {
                        RuleMark(x: .value("Date", hd, unit: .day))
                            .foregroundStyle(.gray.opacity(0.3))
                    }
                }
                .chartXAxis {
                    AxisMarks(values: dateStride) { _ in
                        AxisValueLabel(format: dateLabelFormat, orientation: .horizontal)
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                    }
                }
                .chartYAxisLabel(I18n.t("menu.lines"))
                .chartOverlay { proxy in
                    GeometryReader { geo in
                        Color.clear
                            .onContinuousHover { phase in
                                if case .active(let loc) = phase,
                                   let frame = proxy.plotFrame {
                                    let originX = geo[frame].origin.x
                                    let plotW = geo[frame].width
                                    let x = loc.x - originX
                                    guard x >= 0, x <= plotW else { codeHoverDate = nil; return }
                                    codeHoverX = x
                                    codeHoverDate = proxy.value(atX: x)
                                } else { codeHoverDate = nil }
                            }
                    }
                }
                .frame(height: 200)

                if let hd = codeHoverDate,
                   let pt = paddedCodeChanges().first(where: { Calendar.current.isDate($0.date, inSameDayAs: hd) }),
                   pt.added > 0 || pt.deleted > 0 {
                    codeTooltip(date: hd, added: pt.added, deleted: pt.deleted)
                        .offset(x: min(max(codeHoverX - 40, 0), 560), y: 0)
                }
            }
        }
    }
    .padding(16)
    .background(Color(nsColor: .quaternarySystemFill).opacity(0.3))
    .cornerRadius(10)
}

func paddedCodeChanges() -> [DailyCodeChange] {
    let cal = Calendar.current
    let today = cal.startOfDay(for: Date())
    var map = [Date: DailyCodeChange]()
    for c in codeChanges { map[cal.startOfDay(for: c.date)] = c }

    var result = [DailyCodeChange]()
    for offset in 0..<dayRange {
        guard let date = cal.date(byAdding: .day, value: -(dayRange - 1 - offset), to: today) else { continue }
        if let c = map[date] {
            result.append(c)
        } else {
            result.append(DailyCodeChange(date: date, added: 0, deleted: 0))
        }
    }
    return result
}

func codeTooltip(date: Date, added: Int, deleted: Int) -> some View {
    VStack(alignment: .leading, spacing: 2) {
        Text(date, format: .dateTime.month(.abbreviated).day()).font(.caption).fontWeight(.semibold)
        Text("+\(added) \(I18n.t("dashboard.added")) / -\(deleted) \(I18n.t("dashboard.deleted"))")
            .font(.caption2).monospacedDigit()
    }
    .padding(6).background(.regularMaterial).cornerRadius(6)
}
```

- [ ] **Step 6: Add `cplInfoCard` (replaces cplChart) and `bottomCards`**

```swift
// MARK: - CPL info card (demoted from trend chart to small window)

var cplInfoCard: some View {
    let cplRepos = repos.filter { $0.netLines > 0 && $0.cost > 0 }
    return VStack(alignment: .leading, spacing: 8) {
        Text(I18n.t("dashboard.cpl_card")).font(.headline)
        if cplRepos.isEmpty {
            Text(I18n.t("dashboard.no_cpl_data"))
                .font(.caption).foregroundColor(.secondary)
        } else {
            ForEach(cplRepos.prefix(5)) { r in
                HStack {
                    Text(r.repo).font(.caption).lineLimit(1)
                    Spacer()
                    Text("$\(String(format: "%.2f", r.costPerLine))/\(I18n.t("menu.per_line"))")
                        .font(.caption).monospacedDigit()
                }
            }
        }
        Text("ℹ️ \(I18n.t("dashboard.cpl_disclaimer"))")
            .font(.caption2).foregroundColor(.secondary)
    }
    .padding(16)
    .frame(maxWidth: .infinity)
    .background(Color(nsColor: .quaternarySystemFill).opacity(0.3))
    .cornerRadius(10)
}

// MARK: - Bottom cards row

var bottomCards: some View {
    HStack(alignment: .top, spacing: 16) {
        apiBalanceCard
        subscriptionCard
        if hasAGrade {
            cplInfoCard
        } else {
            cplGuidanceCard
        }
    }
}

// MARK: - Empty state (no integrations)

var emptyStateCard: some View {
    VStack(spacing: 12) {
        Image(systemName: "fuelpump").font(.system(size: 32)).foregroundColor(.secondary)
        Text("AI Pulse").font(.headline)
        Text("在 设置 → 集成 中启用工具后，这里将显示花费与代码变化图表。")
            .font(.caption).foregroundColor(.secondary).multilineTextAlignment(.center)
    }
    .padding(24).frame(maxWidth: .infinity)
    .background(Color(nsColor: .quaternarySystemFill).opacity(0.3))
    .cornerRadius(10)
}
```

- [ ] **Step 7: Remove old code**

Delete the following from DashboardView:
- `combinedChart` (lines 205-283)
- `cplChart` (lines 287-339)
- `leftAxis`, `rightAxis`, `lineScaleFactor`, `lineAxisMax`, `lineAxisValues`, `rightAxisValues` (lines 170-203)
- `tooltipView` (lines 436-443) — replaced by `costTooltip` and `codeTooltip`
- `cplTooltipView` (lines 445-451) — no longer needed
- `niceStep`, `nextNiceStep` (lines 400-420) — no longer needed
- `hoverDate`, `cplHoverDate`, `cplHoverX`, `hoverX` state variables (replaced by new ones)

- [ ] **Step 8: Update `load()` method**

```swift
func load() async {
    let raw = await StatsService.dailyStats(days: dayRange)
    dailyStats = padStats(raw, days: dayRange)
    providerCosts = await StatsService.providerDailyCosts(days: dayRange)
    codeChanges = await StatsService.dailyCodeChanges(days: dayRange)
    models = await StatsService.modelBreakdown()
    repos = await StatsService.repoBreakdown()
    prediction = await StatsService.prediction()
}
```

- [ ] **Step 9: Keep remaining helpers unchanged**

Preserve: `hasAGrade`, `cplGuidanceCard`, `subscriptionCard`, `apiBalanceCard`, `estimatedDailySub`, `modelSection`, `repoSection`, `card`, `padStats`, `dateStride`, `dateLabelFormat`, `avgCPL`, `totalLines`

- [ ] **Step 10: Build and fix compilation errors**

Run: `cd mac-app && swift build`
Fix any compilation errors from the refactor.

- [ ] **Step 11: Commit**

```bash
git add mac-app/Sources/UI/Dashboard/DashboardView.swift
git commit -m "feat: split Dashboard charts — cost chart + code change chart, demote CPL to info card"
```

---

### Task 4: MenuBarController — Remove CPL, use provider data for submenu

**Files:**
- Modify: `mac-app/Sources/UI/MenuBar/MenuBarController.swift`

**Interfaces:**
- Consumes: `ApiPoller.shared.cachedBalance()`, `ProviderRegistry.all` from existing code; new i18n keys from Task 2

- [ ] **Step 1: Update `makeSummary` helper to remove CPL and tokens**

In `fetchStats()`, replace the `makeSummary` closure (around line 165):

```swift
func makeSummary(cnt: Int, cost: Double, added: Int, deleted: Int, label: String) -> String? {
    guard cnt > 0 || added > 0 || deleted > 0 else { return nil }
    let cS = cost > 0.0001 ? "$\(String(format: "%.2f", cost))" : "~$0"
    let linesStr = "+\(added)/-\(deleted) \(I18n.t("menu.lines"))"
    return "\(label) · \(cS) · \(linesStr)"
}
```

- [ ] **Step 2: Add added/deleted to daily/week queries and update `makeSummary` calls**

Add queries for today/this-week added/deleted lines alongside existing cost queries. Replace the `todaySum`/`weekSum` computation:

```swift
// --- Today added/deleted ---
let todayAdded: Int = try await AppDatabase.shared.read { db in
    try Int.fetchOne(db, sql: "SELECT COALESCE(SUM(added),0) FROM code_change WHERE is_merge = 0 AND ts >= ?", arguments: [todayStart]) ?? 0
}
let todayDeleted: Int = try await AppDatabase.shared.read { db in
    try Int.fetchOne(db, sql: "SELECT COALESCE(SUM(deleted),0) FROM code_change WHERE is_merge = 0 AND ts >= ?", arguments: [todayStart]) ?? 0
}

// --- This week added/deleted ---
let weekAdded: Int = try await AppDatabase.shared.read { db in
    try Int.fetchOne(db, sql: "SELECT COALESCE(SUM(added),0) FROM code_change WHERE is_merge = 0 AND ts >= ?", arguments: [weekStart]) ?? 0
}
let weekDeleted: Int = try await AppDatabase.shared.read { db in
    try Int.fetchOne(db, sql: "SELECT COALESCE(SUM(deleted),0) FROM code_change WHERE is_merge = 0 AND ts >= ?", arguments: [weekStart]) ?? 0
}

// Updated calls:
let todaySum = makeSummary(cnt: todayCnt, cost: todayCst ?? 0, added: todayAdded, deleted: todayDeleted, label: I18n.t("menu.today"))
let weekSum  = makeSummary(cnt: weekCnt,  cost: weekCst ?? 0,  added: weekAdded,  deleted: weekDeleted,  label: I18n.t("menu.this_week"))
```

- [ ] **Step 3: Replace model submenu with provider submenu using B-grade data**

Replace the existing model submenu section (lines 65-73) with:

```swift
// Provider submenu — B-grade balance data from ApiPoller
let bs = IntegrationRegistry.enabledBGrade()
if !bs.isEmpty {
    let m = NSMenuItem(title: I18n.t("menu.by_provider"), action: nil, keyEquivalent: "")
    let s = NSMenu()
    for b in bs {
        if let cached = ApiPoller.shared.cachedBalance(for: b.id),
           let bal = cached.balances.first {
            s.addItem(NSMenuItem(
                title: "\(b.displayName) · \(bal.currency) \(String(format: "%.2f", bal.totalBalance))",
                action: nil, keyEquivalent: ""
            ))
        }
    }
    if s.numberOfItems > 0 {
        m.submenu = s; self.menu.addItem(m)
    }
}
```

- [ ] **Step 4: Update repo submenu to show added/deleted instead of CPL**

Replace the repo submenu (lines 75-81) and update `RepoStat`:

```swift
private struct RepoStat { let name: String; let added: Int; let deleted: Int; let cost: Double
    var summary: String { "$\(String(format: "%.2f", cost)) · +\(added)/-\(deleted) \(I18n.t("menu.lines"))" } }
```

Update the repo submenu construction to use `added`/`deleted` from the query (the `rrRows` query already gets `added - deleted` as `l`; we need to change it to separate queries or adjust the approach):

```swift
// Query added/deleted separately per repo
let raRows: [Row] = try await AppDatabase.shared.read { db in
    try Row.fetchAll(db, sql: "SELECT repo_path AS p, COALESCE(SUM(added),0) AS a, COALESCE(SUM(deleted),0) AS d FROM code_change WHERE is_merge = 0 AND ts >= ? GROUP BY repo_path", arguments: [weekStart])
}
var repoAddDel: [String: (Int, Int)] = [:]
for r in raRows {
    let path: String = r["p"] ?? ""
    let a: Int64 = r["a"] ?? 0
    let d: Int64 = r["d"] ?? 0
    repoAddDel[path] = (Int(a), Int(d))
}

var repos: [RepoStat] = []
for (path, cost) in cbr {
    let (a, d) = repoAddDel[path] ?? (0, 0)
    guard a > 0 || d > 0, cost > 0 else { continue }
    repos.append(RepoStat(name: URL(fileURLWithPath: path).lastPathComponent, added: a, deleted: d, cost: cost))
}

// Build submenu
if !repos.isEmpty {
    let m = NSMenuItem(title: I18n.t("menu.by_repo"), action: #selector(self.openDashboard), keyEquivalent: "")
    m.target = self
    let s = NSMenu()
    for r in repos { s.addItem(NSMenuItem(title: "\(r.name) · \(r.summary)", action: nil, keyEquivalent: "")) }
    m.submenu = s; self.menu.addItem(m)
}
```

- [ ] **Step 5: Remove `fmt` helper** (no longer needed for token formatting in summary, but keep if used elsewhere)

The `fmt` function at line 190-194 is no longer used — remove it.

- [ ] **Step 6: Remove old structs — `ModelStat`, old `RepoStat`**

Delete `ModelStat` (lines 97-98) and the old `RepoStat` (lines 99-100) entirely. Replace with updated versions:

```swift
private struct RepoStat { let name: String; let added: Int; let deleted: Int; let cost: Double
    var summary: String { "$\(String(format: "%.2f", cost)) · +\(added)/-\(deleted) \(I18n.t("menu.lines"))" } }
```

Delete `fmt` function (was line 190-194) — no longer needed since token display is removed.

Update the `Stats` struct to remove `models` and `netLines` (no longer needed):
```swift
private struct Stats { let todaySummary: String?; let weekSummary: String?; let repos: [RepoStat]; let hasActivity: Bool }
```

Update `hasActivity` computation (was line 180):
```swift
let hasActivity = weekCnt > 0 || !repos.isEmpty || weekAdded > 0 || weekDeleted > 0
```

- [ ] **Step 7: Build and verify**

Run: `cd mac-app && swift build`
Expected: Compilation succeeds.

- [ ] **Step 8: Commit**

```bash
git add mac-app/Sources/UI/MenuBar/MenuBarController.swift
git commit -m "feat: menu bar — remove CPL/tokens, use provider balance for submenu, show added/deleted"
```

---

### Task 5: OnboardingView — Insert Step 3 (repo selection)

**Files:**
- Modify: `mac-app/Sources/UI/Onboarding/OnboardingView.swift`

**Interfaces:**
- Consumes: Repo scanning logic from `SettingsView.ReposTab`, new i18n keys from Task 2
- Produces: 4-step onboarding with repo selection

- [ ] **Step 1: Add repo selection state variables**

```swift
struct OnboardingView: View {
    @State private var step = 0
    @State private var detectionResults: [(any Detectable, DetectionResult)] = []
    @State private var enabledIds: Set<String> = []
    // New: repo selection
    @State private var searchDirs: [String] = ["~/dev", "~/projects", "~/code"]
    @State private var discoveredRepos: [String] = []     // full paths
    @State private var selectedRepos: Set<String> = []
    @State private var isScanning = false
    private let repoDirsKey = "repo_search_dirs"
```

- [ ] **Step 2: Update step indicator from 3 dots to 4 dots**

```swift
// Step indicator
HStack(spacing: 4) {
    ForEach(0..<4, id: \.self) { i in
        Circle()
            .fill(i <= step ? Color.accentColor : Color.secondary.opacity(0.3))
            .frame(width: 8, height: 8)
    }
}.padding(.top, 20).padding(.bottom, 8)
```

- [ ] **Step 3: Update switch to include Step 3 and renumber Step 4**

```swift
Group {
    switch step {
    case 0: welcomeStep
    case 1: detectionStep
    case 2: reposStep     // NEW
    default: doneStep      // was step 2, now step 3
    }
}
.frame(maxWidth: .infinity, maxHeight: .infinity)
```

- [ ] **Step 4: Update navigation buttons**

```swift
// Navigation
HStack {
    if step > 0 {
        Button(I18n.t("onboarding.back")) { step -= 1 }
    }
    Spacer()
    if step < 3 {
        if step == 2 {
            // Repos step: allow skip
            Button(I18n.t("onboarding.skip")) { step += 1 }
                .padding(.trailing, 8)
        }
        Button(I18n.t("onboarding.next")) {
            if step == 2 { saveRepos() }
            step += 1
        }
    } else {
        Button(I18n.t("onboarding.close")) { close() }
    }
}
.padding(.horizontal, 24).padding(.bottom, 16)
```

- [ ] **Step 5: Add `reposStep` view**

```swift
// MARK: - Step 2: Repo selection

var reposStep: some View {
    VStack(alignment: .leading, spacing: 12) {
        Text(I18n.t("onboarding.repos_title")).font(.title3).fontWeight(.semibold)
        Text(I18n.t("onboarding.repos_hint"))
            .font(.caption).foregroundColor(.secondary)

        if isScanning {
            HStack {
                ProgressView().scaleEffect(0.8)
                Text(I18n.t("onboarding.repos_scanning")).font(.caption).foregroundColor(.secondary)
            }
            Spacer()
        } else if discoveredRepos.isEmpty {
            Text(I18n.t("repos.no_repos"))
                .foregroundColor(.secondary).padding()
            Spacer()
        } else {
            Text(String(format: I18n.t("onboarding.repos_count"), discoveredRepos.count))
                .font(.caption).foregroundColor(.secondary)

            ScrollView {
                VStack(spacing: 4) {
                    ForEach(discoveredRepos, id: \.self) { repo in
                        let name = URL(fileURLWithPath: repo).lastPathComponent
                        HStack {
                            Toggle(isOn: Binding(
                                get: { selectedRepos.contains(repo) },
                                set: { v in
                                    if v { selectedRepos.insert(repo) }
                                    else { selectedRepos.remove(repo) }
                                }
                            )) {}.toggleStyle(.checkbox)
                            Image(systemName: "chevron.left.forwardslash.chevron.right")
                                .foregroundColor(.secondary)
                            Text(name).font(.body)
                            Spacer()
                            Text(repo.replacingOccurrences(
                                of: FileManager.default.homeDirectoryForCurrentUser.path,
                                with: "~"))
                                .font(.caption2).foregroundColor(.secondary).lineLimit(1)
                        }
                        .padding(.vertical, 3)
                    }
                }
            }
        }
    }
    .padding(.horizontal, 24)
    .onAppear { scanRepos() }
}
```

- [ ] **Step 6: Add `scanRepos()` and `saveRepos()` methods**

```swift
func scanRepos() {
    let fm = FileManager.default
    var allRepos = Set<String>()
    for dir in searchDirs {
        let expanded = NSString(string: dir).expandingTildeInPath
        guard fm.fileExists(atPath: expanded),
              let e = fm.enumerator(at: URL(fileURLWithPath: expanded),
                                    includingPropertiesForKeys: [.isDirectoryKey],
                                    options: [.skipsHiddenFiles, .skipsPackageDescendants])
        else { continue }
        for case let url as URL in e {
            let git = url.appendingPathComponent(".git")
            var d: ObjCBool = false
            if fm.fileExists(atPath: git.path, isDirectory: &d), d.boolValue {
                allRepos.insert(url.path)
                e.skipDescendants()
            }
        }
    }
    discoveredRepos = allRepos.sorted()
    isScanning = false
}

func saveRepos() {
    // Save selected repos' parent directories to UserDefaults
    if !selectedRepos.isEmpty {
        var dirs = Set<String>()
        for repoPath in selectedRepos {
            let parent = URL(fileURLWithPath: repoPath).deletingLastPathComponent().path
            let short = parent.replacingOccurrences(
                of: FileManager.default.homeDirectoryForCurrentUser.path, with: "~")
            dirs.insert(short)
        }
        // Merge with existing dirs
        var existing = UserDefaults.standard.stringArray(forKey: repoDirsKey) ?? []
        for d in dirs where !existing.contains(d) {
            existing.append(d)
        }
        UserDefaults.standard.set(existing, forKey: repoDirsKey)
    }
}
```

- [ ] **Step 7: Update window size to accommodate 4th step**

In `OnboardingView.swift`, update the frame size:
```swift
.frame(width: 520, height: 480)  // was 440, slightly taller for repo list
```

In `AIPulseApp.swift` line 57, update window creation:
```swift
let w = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 520, height: 480),
                 styleMask: [.titled, .closable], backing: .buffered, defer: false)
```

In `SettingsView.swift` `GeneralTab` line 167, update re-open window:
```swift
let w = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 520, height: 480),
                 styleMask: [.titled, .closable], backing: .buffered, defer: false)
```

- [ ] **Step 8: Update `doneStep` wording to reflect flow change**

```swift
var doneStep: some View {
    VStack(spacing: 16) {
        Text("🎉").font(.system(size: 48))
        Text(I18n.t("onboarding.done_title")).font(.title2).fontWeight(.bold)
        Text(I18n.t("onboarding.done_msg"))
            .multilineTextAlignment(.center).foregroundColor(.secondary)
        if !selectedRepos.isEmpty {
            Text("\(selectedRepos.count) 个仓库已配置监控。")
                .font(.caption).foregroundColor(.secondary)
        }
        if detectionResults.contains(where: { $0.1.found && $0.0.grade == .A }) {
            Text(I18n.t("onboarding.done_cpl"))
                .font(.caption).foregroundColor(.secondary)
        }
    }
}
```

- [ ] **Step 9: Build and verify**

Run: `cd mac-app && swift build`
Expected: Compilation succeeds.

- [ ] **Step 10: Commit**

```bash
git add mac-app/Sources/UI/Onboarding/OnboardingView.swift mac-app/Sources/UI/Settings/SettingsView.swift
git commit -m "feat: onboarding Step 3 — repo selection with auto-scan and skip"
```

---

### Task 6: End-to-end verification

- [ ] **Step 1: Build and run the app**

```bash
cd mac-app && make run
```

- [ ] **Step 2: Manual verification checklist**

1. Dashboard opens with two separate charts — cost chart on top, code change chart below
2. Cost chart: subscription amortization (constant) on bottom layer, API costs (variable) on top layer
3. Code change chart: added (green) + deleted (orange) stacked positive bars, total = work volume
4. Summary cards: Month Spent / Month Projected / Week ±Lines / Sub Daily (no avg CPL)
5. CPL appears only as small info card in bottom row (no trend line chart)
6. No A-grade user: CPL guidance card shown instead
7. Menu bar: Today/This week show cost + added/deleted lines (no CPL, no tokens)
8. Menu bar: Provider submenu shows B-grade balance data
9. Menu bar: Repo submenu shows cost + added/deleted
10. Onboarding: 4 steps with repo selection as Step 3
11. Onboarding: Skip works for repo selection
12. Onboarding: Selected repos persist to UserDefaults
13. Language switch (zh/en) updates all strings
14. Subscription card and API balance card still work correctly

- [ ] **Step 3: Commit final fixes**

```bash
git add -A
git commit -m "chore: final verification fixes for display layer alignment"
```
