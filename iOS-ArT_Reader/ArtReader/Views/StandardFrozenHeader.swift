import SwiftUI

// Debug Configuration (Non-generic)
struct StandardFrozenHeaderConfig {
    // CHANGED: Disable debug visuals
    static let showDebugOverlays = false
    static let navContentHeight: CGFloat = 10
}

struct StandardFrozenHeader<BottomContent: View, HeaderOverlay: View>: View {
    
    let headerState: HeaderState
    let bottomContent: BottomContent
    let headerOverlay: HeaderOverlay
    
    init(
        state: HeaderState,
        @ViewBuilder bottomContent: () -> BottomContent,
        @ViewBuilder headerOverlay: () -> HeaderOverlay = { EmptyView() }
    ) {
        self.headerState = state
        self.bottomContent = bottomContent()
        self.headerOverlay = headerOverlay()
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // 1. Title Area
            AppHeaderView(state: headerState)
                // CENTRALIZED LAYOUT LOGIC
                // CHANGED: Increased from 70 to 80
                .padding(.top, 80)
                .overlay(
                    debugLabel("Title")
                )
                .border(StandardFrozenHeaderConfig.showDebugOverlays ? Color.red : Color.clear, width: StandardFrozenHeaderConfig.showDebugOverlays ? 1 : 0)
            
            // 2. Bottom Content (Nav Bar / Spacer)
            bottomContent
                // CHANGED: 10pt above, 15pt below
                .padding(.top, 10)
                .padding(.bottom, 15)
                .overlay(
                    debugLabel("Nav")
                )
                .border(StandardFrozenHeaderConfig.showDebugOverlays ? Color.blue : Color.clear, width: StandardFrozenHeaderConfig.showDebugOverlays ? 1 : 0)
        }
        .background(
            // Debug background for the whole header container
            StandardFrozenHeaderConfig.showDebugOverlays ? Color.green.opacity(0.1) : Color.clear
        )
        // MOVED: Overlay applies to the entire header stack (e.g. Dimming)
        .overlay(headerOverlay)
        // NEW: Total Size Label
        .overlay(
            Group {
                if StandardFrozenHeaderConfig.showDebugOverlays {
                    GeometryReader { geo in
                        ZStack(alignment: .topTrailing) {
                            Color.clear
                            Text("Total: \(Int(geo.size.height))")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .padding(4)
                                .background(Color.black.opacity(0.7))
                                .cornerRadius(4)
                                .padding(2)
                        }
                    }
                }
            }
        )
    }
    
    @ViewBuilder
    private func debugLabel(_ text: String) -> some View {
        if StandardFrozenHeaderConfig.showDebugOverlays {
            GeometryReader { geo in
                ZStack(alignment: .topLeading) {
                     Color.clear
                     Text("\(text): \(Int(geo.size.height))")
                        .font(.caption2)
                        .foregroundColor(.black)
                        .padding(2)
                        .background(Color.white.opacity(0.7))
                }
            }
            .allowsHitTesting(false)
        }
    }
}

// Convenience init for when no overlay is needed
extension StandardFrozenHeader where HeaderOverlay == EmptyView {
    init(
        state: HeaderState,
        @ViewBuilder bottomContent: () -> BottomContent
    ) {
        self.headerState = state
        self.bottomContent = bottomContent()
        self.headerOverlay = EmptyView()
    }
}
