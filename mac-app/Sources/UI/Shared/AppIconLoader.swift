import AppKit

/// Shared helper to load AIPulse.png regardless of how the binary is run
/// (bare executable from .build/debug/ or proper .app bundle).
/// Generates a macOS-style squircle icon matching the system icon mask.
enum AppIconLoader {
    static func load() -> NSImage { _load() }

    /// Resized version for UI (SwiftUI Image)
    static func uiImage(size: CGFloat) -> NSImage {
        let img = _load()
        let resized = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            img.draw(in: rect)
            return true
        }
        return resized
    }

    private static func _load() -> NSImage {
        let artwork = findArtwork()
        return generateSquircleIcon(artwork: artwork, size: 1024)
    }

    private static func findArtwork() -> NSImage? {
        // .app bundle
        if let bundleImg = NSImage(contentsOf: Bundle.main.resourceURL?
            .appendingPathComponent("AIPulse.png") ?? URL(fileURLWithPath: "")) {
            return bundleImg
        }
        // Bare binary: search upward from binary location
        let binaryDir = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent()
        for depth in 1...4 {
            let up = (0..<depth).map { _ in ".." }.joined(separator: "/")
            if let img = NSImage(contentsOf: binaryDir.appendingPathComponent("\(up)/Resources/AIPulse.png")) {
                return img
            }
        }
        return nil
    }

    /// Generate a macOS-style squircle (superellipse) icon.
    /// Uses x^4 + y^4 = r^4 — matches system icon mask.
    static func generateSquircleIcon(artwork: NSImage?, size: CGFloat) -> NSImage {
        let img = NSImage(size: NSSize(width: size, height: size), flipped: false) { rect in
            // 1. Draw squircle background fill
            let squircle = squirclePath(in: rect)
            NSColor.controlAccentColor.setFill()
            squircle.fill()

            // 2. Draw artwork centered inside
            if let art = artwork {
                let inset = size * 0.22  // macOS icon content area inset
                let artRect = rect.insetBy(dx: inset, dy: inset)
                squircle.addClip()  // Clip artwork to squircle shape
                art.draw(in: artRect)
            }
            return true
        }
        return img
    }

    /// macOS-style superellipse (squircle): x^4 + y^4 = r^4.
    private static func squirclePath(in rect: CGRect) -> NSBezierPath {
        let path = NSBezierPath()
        let w = rect.width
        let h = rect.height
        let cx = rect.midX
        let cy = rect.midY
        let rx = w / 2
        let ry = h / 2
        let n: CGFloat = 4.0  // superellipse exponent (macOS icon shape)

        let steps = 120
        path.move(to: NSPoint(x: cx + rx, y: cy))
        for i in 1...steps {
            let theta = CGFloat(i) * 2 * .pi / CGFloat(steps)
            let cosT = abs(cos(theta))
            let sinT = abs(sin(theta))
            let denom = pow(pow(cosT, n) + pow(sinT, n), 1.0 / n)
            let x = denom > 0 ? rx * cosT / denom * (cos(theta) >= 0 ? 1 : -1) : rx * cos(theta)
            let y = denom > 0 ? ry * sinT / denom * (sin(theta) >= 0 ? 1 : -1) : ry * sin(theta)
            path.line(to: NSPoint(x: cx + x, y: cy + y))
        }
        path.close()
        return path
    }
}
