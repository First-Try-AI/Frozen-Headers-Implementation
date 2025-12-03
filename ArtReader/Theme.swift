import SwiftUI

struct Theme {
    static let backgroundStart = Color(hex: "0c1445")
    static let backgroundEnd = Color(hex: "16213e")
    
    // New Colors for the "Web" aesthetic
    static let cardBackground = Color(hex: "1f2937")
    static let cardLabel = Color.gray
    
    static let text = Color.white
    static let accent = Color(hex: "fbbf24") // Primary Gold (#fbbf24)
    
    // Additional Highlight Colors (Rotated)
    static let highlightOrange = Color(hex: "FD5A1E")
    static let highlightBlue = Color(hex: "1E90FF")
    static let highlightWhite = Color(hex: "FFFFFF")
    
    static let buttonText = Color(hex: "1a1a1a") // Almost Black Text (#1a1a1a)
    
    // New Web-Parity Tokens migrated from InputView.swift
    static let accentGoldEnd = Color(hex: "f59e0b") // Secondary Gold for Button Gradient
    static let accentBorderGold = Color(hex: "d97706") // 2px Dark Gold Border
    
    // Overlay colors from InputView.swift's local definitions
    static let overlayBackground = Color(red: 26/255, green: 26/255, blue: 26/255, opacity: 0.92)
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

// MARK: - Component Styles

struct ArTButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        ArTButtonBody(configuration: configuration)
    }
    
    struct ArTButtonBody: View {
        let configuration: Configuration
        @Environment(\.isEnabled) private var isEnabled
        
        var body: some View {
            ZStack {
                // 1. Background
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        isEnabled
                        ? Color.black                           // ACTIVE: Black
                        : Color.white.opacity(0.1)              // INACTIVE: Translucent
                    )
                
                // 2. Border REMOVED per request
                
                // 3. Label
                configuration.label
                    .fontWeight(.bold)
                    .foregroundColor(
                        isEnabled
                        ? Theme.accent                          // ACTIVE: Gold Text
                        : Color.black.opacity(0.5)              // INACTIVE: Black Text (50%)
                    )
                    .opacity(configuration.isPressed ? 0.9 : 1.0)
            }
            .frame(height: 50)
        }
    }
}
