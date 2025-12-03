import SwiftUI

// 1. The Preference Key (Internal)
struct FrozenHeaderHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
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
        ZStack(alignment: .top) {
            
            // LAYER 1: The Header (Floating on top)
            header
                // Measure the height of the header
                .background(
                    GeometryReader { geo in
                        Color.clear.preference(key: FrozenHeaderHeightKey.self, value: geo.size.height)
                            .onAppear {
                                print("🔍 [FrozenPanel] Header GeometryReader appeared. Size: \(geo.size)")
                            }
                            .onChange(of: geo.size) { newSize in
                                print("🔍 [FrozenPanel] Header Size Changed: \(newSize)")
                            }
                    }
                )
                .zIndex(10) // Always physically on top
            
            // LAYER 2: The Content
            content
                // Push content down by the header's EXACT height
                .padding(.top, headerHeight)
                .zIndex(1)
        }
        // Update height instantly
        .onPreferenceChange(FrozenHeaderHeightKey.self) { newHeight in
            // LOGGING ENABLED
            print("📏 [FrozenPanel] Preference Change: \(newHeight)")
            if newHeight > 0 {
                self.headerHeight = newHeight
            } else {
                print("⚠️ [FrozenPanel] Received 0 height! currentHeaderHeight is: \(self.headerHeight)")
            }
        }
        .ignoresSafeArea(edges: .top)
    }
}
