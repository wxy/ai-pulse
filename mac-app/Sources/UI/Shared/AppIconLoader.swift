import AppKit

enum AppIconLoader {
    /// Load the icon with an optional progress arc drawn along the perimeter.
    static func load(progress: Double = 0) -> NSImage {
        let artwork = findArtwork()
        return drawIcon(artwork: artwork, progress: progress)
    }

    static func uiImage(size: CGFloat) -> NSImage {
        let img = load()
        let resized = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            img.draw(in: rect)
            return true
        }
        return resized
    }

    /// macOS 26 applies a rounded-rect mask automatically (185.4px corner radius
    /// on a 1024×1024 canvas). We just draw content within the HIG safe zone.
    private static func drawIcon(artwork: NSImage?, progress: Double) -> NSImage {
        let size: CGFloat = 1024
        let safeInset: CGFloat = 32   // HIG safe zone
        let cornerFraction: CGFloat = 185.4 / 1024  // macOS 26 official rounded-rect radius

        let img = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            let safeRect = rect.insetBy(dx: safeInset, dy: safeInset)
            let cr = safeRect.width * cornerFraction

            // Background
            NSColor.white.setFill()
            rect.fill()

            // Artwork inside safe zone
            if let art = artwork {
                let artInset: CGFloat = 48
                art.draw(in: safeRect.insetBy(dx: artInset, dy: artInset))
            }

            // Progress arc
            if progress > 0.01 {
                let p = CGFloat(min(max(progress, 0), 1))
                let arcInset: CGFloat = 32
                let arcRect = safeRect.insetBy(dx: arcInset, dy: arcInset)
                let arcCr = cr - arcInset
                let arcPath = progressArc(in: arcRect, cornerRadius: max(arcCr, 0), fraction: p)
                NSColor.systemGreen.setStroke()
                arcPath.lineWidth = 20
                arcPath.lineCapStyle = .round
                arcPath.stroke()
            }

            return true
        }
        return img
    }

    // MARK: - Arc along rounded rect perimeter

    private static func progressArc(in rect: CGRect, cornerRadius cr: CGFloat, fraction: CGFloat) -> NSBezierPath {
        let path = NSBezierPath()
        let perimeter = 2 * (rect.width + rect.height - 4 * cr) + 2 * .pi * cr
        var remaining = fraction * perimeter

        let r = rect.origin; let w = rect.width; let h = rect.height
        let startX = r.x + w; let startY = r.y + h / 2
        path.move(to: NSPoint(x: startX, y: startY))

        let corners: [(CGPoint, CGFloat, CGFloat)] = [
            (CGPoint(x: r.x + w - cr, y: r.y + h - cr), 0, .pi / 2),
            (CGPoint(x: r.x + cr, y: r.y + h - cr), .pi / 2, .pi),
            (CGPoint(x: r.x + cr, y: r.y + cr), .pi, 3 * .pi / 2),
            (CGPoint(x: r.x + w - cr, y: r.y + cr), 3 * .pi / 2, 2 * .pi),
        ]
        let edges: [(CGPoint, CGPoint)] = [
            (CGPoint(x: r.x + w, y: r.y + h / 2), CGPoint(x: r.x + w, y: r.y + h - cr)),
            (CGPoint(x: r.x + w - cr, y: r.y + h), CGPoint(x: r.x + cr, y: r.y + h)),
            (CGPoint(x: r.x, y: r.y + h - cr), CGPoint(x: r.x, y: r.y + cr)),
            (CGPoint(x: r.x + cr, y: r.y), CGPoint(x: r.x + w - cr, y: r.y)),
            (CGPoint(x: r.x + w, y: r.y + cr), CGPoint(x: r.x + w, y: r.y + h / 2)),
        ]

        for i in 0..<4 {
            // Edge
            let edge = edges[i]
            let edgeLen = hypot(edge.to.x - edge.from.x, edge.to.y - edge.from.y)
            if remaining >= edgeLen {
                path.line(to: edge.to)
                remaining -= edgeLen
            } else if remaining > 0 {
                let t = remaining / edgeLen
                path.line(to: NSPoint(x: edge.from.x + (edge.to.x - edge.from.x) * t,
                                       y: edge.from.y + (edge.to.y - edge.from.y) * t))
                remaining = 0
            }
            // Corner
            let corner = corners[i]
            let arcLen = .pi / 2 * cr
            if remaining >= arcLen {
                path.appendArc(withCenter: corner.0, radius: cr,
                               startAngle: corner.1 * 180 / .pi,
                               endAngle: corner.2 * 180 / .pi, clockwise: true)
                remaining -= arcLen
            } else if remaining > 0 {
                let sweep = (remaining / arcLen) * .pi / 2
                path.appendArc(withCenter: corner.0, radius: cr,
                               startAngle: corner.1 * 180 / .pi,
                               endAngle: (corner.1 + sweep) * 180 / .pi, clockwise: true)
                remaining = 0
            }
            if remaining <= 0 { break }
        }
        // Last edge back to start
        if remaining > 0 {
            let last = edges[4]
            let lastLen = hypot(last.to.x - last.from.x, last.to.y - last.from.y)
            if remaining >= lastLen { path.line(to: last.to) }
            else {
                let t = remaining / lastLen
                path.line(to: NSPoint(x: last.from.x + (last.to.x - last.from.x) * t,
                                       y: last.from.y + (last.to.y - last.from.y) * t))
            }
        }
        return path
    }

    // MARK: - Artwork

    private static func findArtwork() -> NSImage? {
        if let bundleImg = NSImage(contentsOf: Bundle.main.resourceURL?
            .appendingPathComponent("AIPulse.png") ?? URL(fileURLWithPath: "")) {
            return bundleImg
        }
        let binaryDir = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent()
        for depth in 1...4 {
            let up = (0..<depth).map { _ in ".." }.joined(separator: "/")
            if let img = NSImage(contentsOf: binaryDir.appendingPathComponent("\(up)/Resources/AIPulse.png")) {
                return img
            }
        }
        return nil
    }
}
