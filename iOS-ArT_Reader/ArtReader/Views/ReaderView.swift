import SwiftUI

struct ReaderView: View {
    @ObservedObject var sessionManager: SessionManager
    
    var body: some View {
        // USES THE FROZEN PANEL LAYOUT
        FrozenPanelView {
            // SLOT 1: HEADER
            StandardFrozenHeader(
                state: .inactive,
                bottomContent: {
                    // CHANGED: Use ZStack/Opacity instead of 'if let' to keep the view hierarchy stable
                    ZStack {
                        if let response = sessionManager.currentResponse {
                            ProgressHeaderView(
                                playbackVM: sessionManager.playbackViewModel,
                                totalChunks: response.chunks.count,
                                currentChunkIndex: $sessionManager.currentChunkIndex,
                                isInPlaybackMode: sessionManager.state == .listening,
                                onHeaderTap: handleHeaderTap
                            )
                            // StandardFrozenHeader handles top/bottom padding now
                            .transition(.opacity)
                        } else {
                            // Placeholder to maintain some stability
                            Color.clear.frame(height: StandardFrozenHeaderConfig.navContentHeight)
                        }
                    }
                    .animation(.easeInOut(duration: 0.3), value: sessionManager.currentResponse != nil)
                },
                headerOverlay: {
                    HeaderDimmingOverlay(
                        playbackVM: sessionManager.playbackViewModel,
                        sessionState: sessionManager.state
                    )
                }
            )
            .contentShape(Rectangle())
            .onTapGesture { handleHeaderTap() }
        } content: {
            // SLOT 2: CONTENT
            // CHANGED: ZStack (Top Alignment) ensures views overlap during transition
            // so they "fade in together in sync" rather than popping layout.
            ZStack(alignment: .top) {
                if let chunk = currentChunk {
                    if sessionManager.state == .listening {
                        PageViewMode(
                            sessionManager: sessionManager,
                            playbackVM: sessionManager.playbackViewModel,
                            chunk: chunk,
                            activeColor: currentHighlightColor
                        )
                        // Allow SessionManager's withAnimation to control timing
                        .transition(.opacity)
                    } else {
                        FullChunkDisplayView(
                            sessionManager: sessionManager,
                            chunk: chunk
                        )
                        // Allow SessionManager's withAnimation to control timing
                        .transition(.opacity)
                    }
                }
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
        // REMOVED: Diagnostics GeometryReader
        
        // NEW: RESET BUTTON ANCHOR (Bottom Left)
        .overlay(alignment: .bottomLeading) {
            Button(action: {
                // Trigger the reset via SessionManager
                sessionManager.reset()
            }) {
                Image(systemName: "arrow.counterclockwise")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)                    // CHANGED: White Icon
                    .padding(14)
                    .background(Color.white.opacity(0.15))      // CHANGED: Translucent BG
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.5), lineWidth: 1) // CHANGED: White Border
                    )
                    // Removed heavy shadow for cleaner translucent look
            }
            // --- LOGGING UPDATE ---
            .background(
                GeometryReader { geo in
                    Color.clear.onAppear {
                        print("DEBUG: ReaderView Reset Button Size: \(geo.size)")
                    }
                }
            )
            // ----------------------
            .padding(.leading, 24)
            .padding(.bottom, 30)
        }
        .toolbar(.hidden, for: .navigationBar)
        // GESTURES
        .onChange(of: sessionManager.currentChunkIndex) { _, _ in
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
