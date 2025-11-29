import SwiftUI

struct Theme {
    static let backgroundStart = Color(hex: "0c1445")
    static let backgroundEnd = Color(hex: "16213e")
    
    // New Colors for the "Web" aesthetic
    static let cardBackground = Color(hex: "1f2937")
    static let cardLabel = Color.gray
    
    static let text = Color.white
    static let accent = Color(hex: "fbbf24") // Primary Gold (#fbbf24)
    
    // The previous Color.black was changed to the specific hex required by the design spec.
    static let buttonText = Color(hex: "1a1a1a") // Almost Black Text (#1a1a1a)
    
    // New Web-Parity Tokens migrated from InputView.swift
    static let accentGoldEnd = Color(hex: "f59e0b") // Secondary Gold for Button Gradient
    static let accentBorderGold = Color(hex: "d97706") // 2px Dark Gold Border
    
    // Overlay colors from InputView.swift's local definitions
    // Dark Overlay: Custom Color(red: 26/255, ...) at ~92% opacity
    static let overlayBackground = Color(red: 26/255, green: 26/255, blue: 26/255, opacity: 0.92)
    // Border: 1px solid Grey (rgba(107, 114, 128, 0.3))
    static let overlayBorder = Color(red: 107/255, green: 114/255, blue: 128/255, opacity: 0.3)
    
    static let gradient = LinearGradient(
        gradient: Gradient(colors: [backgroundStart, backgroundEnd]),
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
