import SwiftUI
import UIKit

struct FullChunkDisplayView: View {
    @ObservedObject var sessionManager: SessionManager
    let chunk: AudioChunk
    
    @State private var selectedPageIndex: Int = 0
    @State private var textHeight: CGFloat = 200
    
    // CHANGED: Fixed minimum height of 350pt per request
    private var minimumWindowHeight: CGFloat {
        return 350
    }
    
    var body: some View {
        // REMOVED: Root GeometryReader which caused layout conflicts in FrozenPanelView
        ScrollView {
            VStack(spacing: 0) {
                
                // 1. TEXT CONTAINER
                FullChunkTextView(
                    chunk: chunk,
                    // CHANGED: Use Infinity width instead of geometry calculation
                    // The internal padding of the view will handle the insets
                    // Note: UIScreen.main is deprecated in newer iOS but safe for this single-window context
                    width: UIScreen.main.bounds.width - 40,
                    selectedPageIndex: $selectedPageIndex,
                    dynamicHeight: $textHeight,
                    onCueRequest: { time in
                        AudioService.shared.seek(to: time)
                    }
                )
                .frame(height: max(textHeight, minimumWindowHeight), alignment: .top)
                .background(Theme.overlayBackground)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Theme.overlayBorder, lineWidth: 1)
                )
                .padding(.horizontal, 20)
                .padding(.top, 10) // Internal spacing (Card vs Scroll Top)
                
                Spacer().frame(height: 30)
                
                // 2. PLAY BUTTON
                Button(action: {
                    sessionManager.state = .listening
                    sessionManager.playCurrentChunk()
                }) {
                    HStack(spacing: 6) {
                        Text("Play Audio")
                        
                        Image(systemName: "play.fill")
                            .font(.caption)
                    }
                }
                .buttonStyle(PrimaryLargeButtonStyle())
                .padding(.horizontal, 40) // Approximate 0.75 width visually
                
                // REMOVED: Translucent Reset Button (Now handled in ReaderView)
                
            }
            .frame(maxWidth: .infinity)
            // REMOVED: minHeight constraint dependent on geometry
            .padding(.bottom, 100)
        }
        // FIXED: Updated for iOS 17+ syntax
        .onChange(of: chunk.chunkIndex) { _, _ in
            selectedPageIndex = 0
        }
        // FIXED: Updated for iOS 17+ syntax
        .onChange(of: textHeight) { _, newHeight in
            if newHeight > 0 {
                sessionManager.readerTextHeight = max(newHeight, minimumWindowHeight)
            }
        }
    }
}
