import AppKit

/// Dock icon with a green progress bar along the rounded-rect border that
/// fills as daily spend grows.
///
/// The bar starts at top-center and fills clockwise; a full loop represents
/// 3× the 30-day daily average.
final class DockManager {
    static let shared = DockManager()
    private var timer: Timer?
    private let baseIcon: NSImage = AppIconLoader.load()

    func start() {
        refresh()
        timer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            self?.refresh()
        }
    }

    func stop() { timer?.invalidate(); timer = nil }

    /// 30-day rolling daily average — only counts days with actual cost
    private func rollingDailyAvg() async -> Double {
        let stats = await StatsService.dailyStats(days: 30)
        let daysWithCost = stats.filter { $0.cost > 0.001 }
        guard !daysWithCost.isEmpty else { return 0 }
        let total = daysWithCost.reduce(0.0) { $0 + $1.cost }
        return total / Double(daysWithCost.count)
    }

    private func refresh() {
        Task {
            let stats = await StatsService.dailyStats(days: 1)
            let todayCost = stats.first?.cost ?? 0
            let dailyAvg = await rollingDailyAvg()

            await MainActor.run {
                let tile = NSApp.dockTile

                guard todayCost > 0.001 else {
                    tile.badgeLabel = nil
                    NSApp.applicationIconImage = self.baseIcon
                    return
                }
                tile.badgeLabel = "$\(String(format: "%.2f", todayCost))"

                // Green bar fills the icon border as today's spend approaches
                // 3× the 30-day daily average (capped at 100%).
                let fillFraction: CGFloat
                if dailyAvg > 0 {
                    let ratio = todayCost / dailyAvg
                    fillFraction = min(CGFloat(ratio / 3.0), 1.0)
                } else {
                    fillFraction = 0
                }

                NSApp.applicationIconImage = AppIconLoader.load(progress: Double(fillFraction))
            }
        }
    }
}
