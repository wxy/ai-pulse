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

    static func drawSquircleIcon(artwork: NSImage?, progress: Double, size: CGFloat) -> NSImage {
        let img = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            let squircle = squirclePath(in: rect)
            squircle.addClip()

            // White background
            NSColor.white.setFill()
            squircle.fill()

            // Artwork
            if let art = artwork {
                let inset = size * 0.03
                art.draw(in: rect.insetBy(dx: inset, dy: inset))
            }

            // Progress arc — always draw a sliver to confirm visibility
            let p = CGFloat(min(max(progress, 0.05), 1))
            let arcPath = NSBezierPath()
            let arcInset = size * 0.05
            drawSquircleArc(path: arcPath, in: rect.insetBy(dx: arcInset, dy: arcInset), fraction: p)
            NSColor.systemGreen.setStroke()
            arcPath.lineWidth = size * 0.05
            arcPath.lineCapStyle = .round
            arcPath.stroke()

            // Border
            let border = squirclePath(in: rect.insetBy(dx: 3, dy: 3))
            NSColor(white: 0.80, alpha: 1).setStroke()
            border.lineWidth = size * 0.03
            border.stroke()

            return true
        }
        return img
    }

    /// Draw a partial squircle arc from 12 o'clock clockwise, covering `fraction` of the perimeter.
    private static func drawSquircleArc(path: NSBezierPath, in rect: CGRect, fraction: CGFloat) {
        let w = rect.width; let h = rect.height
        let cx = rect.midX; let cy = rect.midY
        let rx = w / 2; let ry = h / 2
        let n: CGFloat = 4.0
        let totalSteps = 360
        let arcSteps = max(Int(CGFloat(totalSteps) * fraction), 2)

        // Start at top (θ = -π/2)
        for i in 0...arcSteps {
            let theta = -CGFloat.pi / 2 + CGFloat(i) * 2 * .pi / CGFloat(totalSteps)
            let cosT = abs(cos(theta)); let sinT = abs(sin(theta))
            let denom = pow(pow(cosT, n) + pow(sinT, n), 1.0 / n)
            let x = denom > 0 ? rx * cosT / denom * (cos(theta) >= 0 ? 1 : -1) : 0
            let y = denom > 0 ? ry * sinT / denom * (sin(theta) >= 0 ? 1 : -1) : 0
            let pt = NSPoint(x: cx + x, y: cy + y)
            if i == 0 { path.move(to: pt) }
            else { path.line(to: pt) }
        }
    }

    // MARK: - Squircle path (x^4 + y^4 = r^4)

    private static func squirclePath(in rect: CGRect) -> NSBezierPath {
        let path = NSBezierPath()
        let w = rect.width; let h = rect.height
        let cx = rect.midX; let cy = rect.midY
        let rx = w / 2; let ry = h / 2
        let n: CGFloat = 4.0
        let steps = 120
        path.move(to: NSPoint(x: cx + rx, y: cy))
        for i in 1...steps {
            let theta = CGFloat(i) * 2 * .pi / CGFloat(steps)
            let cosT = abs(cos(theta)); let sinT = abs(sin(theta))
            let denom = pow(pow(cosT, n) + pow(sinT, n), 1.0 / n)
            let x = denom > 0 ? rx * cosT / denom * (cos(theta) >= 0 ? 1 : -1) : 0
            let y = denom > 0 ? ry * sinT / denom * (sin(theta) >= 0 ? 1 : -1) : 0
            path.line(to: NSPoint(x: cx + x, y: cy + y))
        }
        path.close()
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
