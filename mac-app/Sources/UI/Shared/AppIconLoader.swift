import AppKit

enum AppIconLoader {
    static func load(progress: Double = 0) -> NSImage {
        let artwork = findArtwork()
        return drawSquircleIcon(artwork: artwork, progress: progress, size: 1024)
    }

    static func uiImage(size: CGFloat) -> NSImage {
        let img = load()
        let resized = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            img.draw(in: rect)
            return true
        }
        return resized
    }

    /// macOS 26 standard sizes on a 1024×1024 canvas
    private static let canvasSize: CGFloat = 1024
    private static let cornerRadius: CGFloat = 185.4  // official macOS 26 squircle radius
    private static let contentInset: CGFloat = 100    // 824×824 content area

    static func drawSquircleIcon(artwork: NSImage?, progress: Double, size: CGFloat) -> NSImage {
        let scale = size / canvasSize
        let cr = cornerRadius * scale
        let inset = contentInset * scale

        let img = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            let squircle = NSBezierPath(roundedRect: rect, xRadius: cr, yRadius: cr)
            squircle.addClip()

            // White background
            NSColor.white.setFill()
            squircle.fill()

            // Artwork — 824×824 content area
            if let art = artwork {
                art.draw(in: rect.insetBy(dx: inset, dy: inset))
            }

            // Progress arc along the rounded-rect perimeter
            let p = CGFloat(min(max(progress, 0.05), 1))
            let arcInset = size * 0.045
            let arcRect = rect.insetBy(dx: arcInset, dy: arcInset)
            let arcCr = cr - arcInset
            let arcPath = progressArc(in: arcRect, cornerRadius: max(arcCr, 0), fraction: p)
            NSColor.systemGreen.setStroke()
            arcPath.lineWidth = size * 0.05
            arcPath.lineCapStyle = .round
            arcPath.stroke()

            // Border
            let border = NSBezierPath(roundedRect: rect.insetBy(dx: 3 * scale, dy: 3 * scale), xRadius: cr - 3 * scale, yRadius: cr - 3 * scale)
            NSColor(white: 0.80, alpha: 1).setStroke()
            border.lineWidth = size * 0.03
            border.stroke()

            return true
        }
        return img
    }

    /// Arc along a rounded rectangle perimeter, from 3 o'clock clockwise.
    private static func progressArc(in rect: CGRect, cornerRadius cr: CGFloat, fraction: CGFloat) -> NSBezierPath {
        let path = NSBezierPath()
        let perimeter = 2 * (rect.width + rect.height - 4 * cr) + 2 * .pi * cr
        let totalLength = fraction * perimeter
        var remaining = totalLength

        // Start at 3 o'clock = right edge midpoint
        let startX = rect.maxX
        let startY = rect.midY
        path.move(to: NSPoint(x: startX, y: startY))

        // Walk around the perimeter: right edge → bottom-right corner → bottom edge → ...
        // We walk LEFT along the top? Actually from 3 o'clock going clockwise:
        // 3 o'clock → go DOWN along right edge → bottom-right corner → LEFT along bottom → ...
        // Actually: 3 o'clock is at (right, midY). Clockwise means going DOWN the right edge.
        struct Segment { let from: CGPoint; let to: CGPoint; let corner: CGPoint?; let cornerStart: CGFloat; let cornerEnd: CGFloat }
        let r = rect.origin; let w = rect.width; let h = rect.height
        let segments: [Segment] = [
            // Right edge, top→bottom (from 3 o'clock going down = from midY to bottom)
            Segment(from: CGPoint(x: r.x + w, y: r.y + h/2), to: CGPoint(x: r.x + w, y: r.y + h - cr), corner: nil, cornerStart: 0, cornerEnd: 0),
            // Bottom-right corner
            Segment(from: CGPoint(x: r.x + w, y: r.y + h - cr), to: CGPoint(x: r.x + w - cr, y: r.y + h), corner: CGPoint(x: r.x + w - cr, y: r.y + h - cr), cornerStart: 0, cornerEnd: .pi/2),
            // Bottom edge, right→left
            Segment(from: CGPoint(x: r.x + w - cr, y: r.y + h), to: CGPoint(x: r.x + cr, y: r.y + h), corner: nil, cornerStart: 0, cornerEnd: 0),
            // Bottom-left corner
            Segment(from: CGPoint(x: r.x + cr, y: r.y + h), to: CGPoint(x: r.x, y: r.y + h - cr), corner: CGPoint(x: r.x + cr, y: r.y + h - cr), cornerStart: .pi/2, cornerEnd: .pi),
            // Left edge, bottom→top
            Segment(from: CGPoint(x: r.x, y: r.y + h - cr), to: CGPoint(x: r.x, y: r.y + cr), corner: nil, cornerStart: 0, cornerEnd: 0),
            // Top-left corner
            Segment(from: CGPoint(x: r.x, y: r.y + cr), to: CGPoint(x: r.x + cr, y: r.y), corner: CGPoint(x: r.x + cr, y: r.y + cr), cornerStart: .pi, cornerEnd: 3 * .pi / 2),
            // Top edge, left→right
            Segment(from: CGPoint(x: r.x + cr, y: r.y), to: CGPoint(x: r.x + w - cr, y: r.y), corner: nil, cornerStart: 0, cornerEnd: 0),
            // Top-right corner
            Segment(from: CGPoint(x: r.x + w - cr, y: r.y), to: CGPoint(x: r.x + w, y: r.y + cr), corner: CGPoint(x: r.x + w - cr, y: r.y + cr), cornerStart: 3 * .pi / 2, cornerEnd: 2 * .pi),
            // Right edge, top→center (back to 3 o'clock)
            Segment(from: CGPoint(x: r.x + w, y: r.y + cr), to: CGPoint(x: r.x + w, y: r.y + h/2), corner: nil, cornerStart: 0, cornerEnd: 0),
        ]

        for seg in segments {
            guard remaining > 0 else { break }
            if let corner = seg.corner {
                let arcLen = .pi/2 * cr
                if remaining >= arcLen {
                    path.appendArc(withCenter: corner, radius: cr, startAngle: seg.cornerStart * 180 / .pi, endAngle: seg.cornerEnd * 180 / .pi, clockwise: true)
                    remaining -= arcLen
                } else {
                    let sweep = (remaining / arcLen) * .pi/2
                    path.appendArc(withCenter: corner, radius: cr, startAngle: seg.cornerStart * 180 / .pi, endAngle: (seg.cornerStart + sweep) * 180 / .pi, clockwise: true)
                    remaining = 0
                }
            } else {
                let dist = hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y)
                if remaining >= dist {
                    path.line(to: seg.to)
                    remaining -= dist
                } else {
                    let t = remaining / dist
                    path.line(to: NSPoint(x: seg.from.x + (seg.to.x - seg.from.x) * t, y: seg.from.y + (seg.to.y - seg.from.y) * t))
                    remaining = 0
                }
            }
        }
        return path
    }

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
