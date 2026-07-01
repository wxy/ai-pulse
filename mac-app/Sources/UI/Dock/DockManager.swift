import AppKit

/// Dock icon with a "gauge arc" overlay that fills as daily spend grows.
///
/// Arc colors: green (normal), orange (>1.5x daily avg), red (>3x).
/// The arc fills clockwise from the X-axis (3-o'clock position); a full circle
/// represents 3× the 30-day daily average.
final class DockManager {
    static let shared = DockManager()
    private var timer: Timer?
    private let baseIcon: NSImage = AppIconLoader.load()

    func start() {
        NSApp.applicationIconImage = baseIcon
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

                // Gauge arc fill = today / (avg × 3), capped at 100%
                let fillFraction: CGFloat
                let arcColor: NSColor
                if dailyAvg > 0 {
                    let ratio = todayCost / dailyAvg
                    let fill = min(CGFloat(ratio / 3.0), 1.0)
                    print("Dock: today=$\(String(format: "%.2f", todayCost)), avg=$\(String(format: "%.2f", dailyAvg)), ratio=\(String(format: "%.2f", ratio)), fill=\(String(format: "%.1f%%", fill*100))")
                    if ratio > 3 { fillFraction = fill; arcColor = .systemRed }
                    else if ratio > 1.5 { fillFraction = fill; arcColor = .systemOrange }
                    else { fillFraction = fill; arcColor = .systemGreen }
                } else {
                    fillFraction = 0; arcColor = .clear
                }

                NSApp.applicationIconImage = AppIconLoader.load(progress: Double(fillFraction))
            }
        }
    }

    /// Legacy arc drawing — replaced by AppIconLoader's squircle progress ring.
    private func iconWithArc(fill: CGFloat, color: NSColor) -> NSImage {
        return AppIconLoader.load(progress: Double(fill))
    }
}
