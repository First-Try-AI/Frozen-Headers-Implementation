import SwiftUI

struct ReaderView: View {
    @ObservedObject var sessionManager: SessionManager
    
    var body: some View {
        // USES THE FROZEN PANEL LAYOUT
        FrozenPanelView {
            // SLOT 1: HEADER
            VStack(spacing: 0) {
                AppHeaderView(state: .inactive)
                
                if let response = sessionManager.currentResponse {
                    ProgressHeaderView(
                        playbackVM: sessionManager.playbackViewModel,
                        totalChunks: response.chunks.count,
                        currentChunkIndex: $sessionManager.currentChunkIndex,
                        isInPlaybackMode: sessionManager.state == .listening,
                        onHeaderTap: handleHeaderTap
                    )
                    .padding(.top, 0)
                    .padding(.bottom, 10)
                }
            }
            .contentShape(Rectangle())
            .onTapGesture { handleHeaderTap() }
            .overlay(
                HeaderDimmingOverlay(
                    playbackVM: sessionManager.playbackViewModel,
                    sessionState: sessionManager.state
                )
            )
        } content: {
            // SLOT 2: CONTENT
            // CHANGED: Simplified hierarchy. Removed inner ZStack which was ambiguous.
            // Using VStack directly with Spacer logic similar to InputView.
            VStack(spacing: 0) {
                if let chunk = currentChunk {
                    if sessionManager.state == .listening {
                        PageViewMode(
                            sessionManager: sessionManager,
                            playbackVM: sessionManager.playbackViewModel,
                            chunk: chunk,
                            activeColor: currentHighlightColor
                        )
                        .transition(.opacity.animation(.easeInOut))
                    } else {
                        FullChunkDisplayView(
                            sessionManager: sessionManager,
                            chunk: chunk
                        )
                        .transition(.opacity.animation(.easeInOut))
                    }
                }
                
                // Ensure content pushes up if short (though FullChunkDisplayView scrolls)
                Spacer(minLength: 0)
            }
        }
        // BACKGROUND & DIMMING
        .background(
            ZStack {
                Image("AppBackground")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                
                if sessionManager.state == .listening {
                    Color.black.opacity(0.85)
                        .ignoresSafeArea()
                        .transition(.opacity.animation(.easeInOut))
                }
            }
        )
        // DIAGNOSTICS: Verify Layout Position
        .overlay(
            GeometryReader { geo -> Color in
                let globalY = geo.frame(in: .global).minY
                let safeArea = geo.safeAreaInsets.top
                print("📍 [ReaderView] Global Y: \(globalY) | Safe Area Top: \(safeArea)")
                return Color.clear
            }
            .allowsHitTesting(false)
        )
        .toolbar(.hidden, for: .navigationBar)
        // GESTURES
        .onChange(of: sessionManager.currentChunkIndex) { _ in
            if sessionManager.state == .listening {
               sessionManager.playCurrentChunk()
            }
        }
        .gesture(
            DragGesture()
                .onEnded { value in
                    guard sessionManager.state == .reading else { return }
                    if abs(value.translation.width) > abs(value.translation.height) {
                        if value.translation.width < -50 { sessionManager.nextChunk() }
                        else if value.translation.width > 50 { sessionManager.previousChunk() }
                    }
                }
        )
    }
    
    // MARK: - Helpers
    private func handleHeaderTap() {
        if sessionManager.state == .listening {
            let impactMed = UIImpactFeedbackGenerator(style: .medium)
            impactMed.impactOccurred()
            sessionManager.state = .reading
            sessionManager.audioService.pause()
        }
    }
    
    private var currentChunk: AudioChunk? {
        guard let response = sessionManager.currentResponse,
              response.chunks.indices.contains(sessionManager.currentChunkIndex) else { return nil }
        return response.chunks[sessionManager.currentChunkIndex]
    }
    
    private var currentHighlightColor: Color {
        let index = sessionManager.currentChunkIndex % 4
        switch index {
        case 0: return Theme.accent
        case 1: return Theme.highlightOrange
        case 2: return Theme.highlightBlue
        case 3: return Theme.highlightWhite
        default: return Theme.accent
        }
    }
}

struct HeaderDimmingOverlay: View {
    @ObservedObject var playbackVM: ArtPlaybackViewModel
    let sessionState: SessionState
    
    var body: some View {
        Group {
            if sessionState == .listening {
                Color.black.opacity(playbackVM.isPlaying ? 0.85 : 0.75)
                    .allowsHitTesting(false)
                    .animation(.easeInOut(duration: 0.3), value: playbackVM.isPlaying)
            }
        }
    }
}
