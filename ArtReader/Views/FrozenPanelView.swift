import SwiftUI

// 1. The Preference Key (Internal)
struct FrozenHeaderHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        let next = nextValue()
        // If we have a non-zero value, favor it (max) to prevent collapse during transitions
        value = max(value, next)
    }
}

// 2. The Reusable Layout Container
struct FrozenPanelView<Header: View, Content: View>: View {
    let header: Header
    let content: Content
    
    // Initialize with a safe estimate (100pt) to prevent content jumping
    @State private var headerHeight: CGFloat = 100
    
    init(@ViewBuilder header: () -> Header, @ViewBuilder content: () -> Content) {
        self.header = header()
        self.content = content()
    }
    
    var body: some View {
        // CHANGED: Use Overlay instead of ZStack for the header.
        // This ensures the content establishes the base frame, and the header floats on top.
        content
            .padding(.top, headerHeight)
            .overlay(alignment: .top) {
                header
                    .background(
                        GeometryReader { geo in
                            Color.clear
                                .preference(key: FrozenHeaderHeightKey.self, value: geo.size.height)
                                // BACKUP MEASUREMENT: Direct change listener
                                .onChange(of: geo.size) { newSize in
                                    if newSize.height > 0 {
                                        // Update state asynchronously to avoid "modifying state during view update"
                                        DispatchQueue.main.async {
                                            if abs(self.headerHeight - newSize.height) > 0.5 {
                                                print("📏 [FrozenPanel] Direct Size Update: \(newSize.height)")
                                                self.headerHeight = newSize.height
                                            }
                                        }
                                    }
                                }
                        }
                    )
                    // Ensure the header sits physically on top
                    .zIndex(10)
            }
            // Update height from PreferenceKey (Primary Mechanism)
            .onPreferenceChange(FrozenHeaderHeightKey.self) { newHeight in
                print("📏 [FrozenPanel] Preference Change: \(newHeight)")
                if newHeight > 0 {
                    self.headerHeight = newHeight
                }
            }
            // CRITICAL: Ignore Safe Area so header can position itself at absolute top
            .ignoresSafeArea(edges: .top)
    }
}
