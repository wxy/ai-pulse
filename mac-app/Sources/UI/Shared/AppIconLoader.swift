import AppKit

enum AppIconLoader {
    static func load() -> NSImage {
        let artwork = findArtwork()
        return drawSquircleIcon(artwork: artwork, size: 1024)
    }

    static func uiImage(size: CGFloat) -> NSImage {
        let img = load()
        let resized = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            img.draw(in: rect)
            return true
        }
        return resized
    }

    // MARK: - Squircle icon (artwork + border)

    static func drawSquircleIcon(artwork: NSImage?, size: CGFloat) -> NSImage {
        let img = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            // Squircle clip
            let squircle = squirclePath(in: rect)
            squircle.addClip()

            // Background fill (white)
            NSColor.white.setFill()
            squircle.fill()

            // Artwork centered — large fill
            if let art = artwork {
                let inset = size * 0.08
                art.draw(in: rect.insetBy(dx: inset, dy: inset))
            }

            // Squircle border — thin gray
            let border = squirclePath(in: rect.insetBy(dx: 2, dy: 2))
            NSColor(white: 0.85, alpha: 1).setStroke()
            border.lineWidth = size * 0.015
            border.stroke()

            return true
        }
        return img
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
