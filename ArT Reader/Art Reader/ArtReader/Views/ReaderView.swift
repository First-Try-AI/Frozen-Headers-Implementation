import SwiftUI

struct ReaderView: View {
    @ObservedObject var sessionManager: SessionManager
    
    // NOTE: We still observe audioService for Play/Pause state and Progress in the header.
    @ObservedObject private var audioService = AudioService.shared
    
    var body: some View {
        ZStack {
            // LAYER 1: Header (and Progress)
            // Sits at zIndex(3) so it is physically on top, but we scope the
            // dimming/taps ONLY to the header content, not the empty space below.
            VStack(spacing: 0) {
                
                // HEADER CONTENT WRAPPER
                VStack(spacing: 0) {
                    // CHANGED: Set to .inactive per latest UX requirement
                    // Recedes to "Ghost Mode" during playback/reading
                    AppHeaderView(state: .inactive)
                    
                    if let response = sessionManager.currentResponse {
                        ProgressHeaderView(
                            totalChunks: response.chunks.count,
                            currentChunkIndex: $sessionManager.currentChunkIndex,
                            isPlaying: audioService.isPlaying,
                            progress: audioService.progress,
                            isInPlaybackMode: sessionManager.state == .listening,
                            onHeaderTap: handleHeaderTap
                        )
                        .padding(.top, 0)
                        .padding(.bottom, 10)
                    }
                }
                // 1. Capture taps specifically on the header area
                .contentShape(Rectangle())
                .onTapGesture {
                    handleHeaderTap()
                }
                // 2. Visual Dimming (Scoped ONLY to this block)
                .overlay(
                    Group {
                        if sessionManager.state == .listening {
                            Color.black.opacity(audioService.isPlaying ? 0.85 : 0.75)
                                .allowsHitTesting(false)
                                .animation(.easeInOut(duration: 0.3), value: audioService.isPlaying)
                        }
                    }
                )
                
                // Pushes the header block to the top.
                Spacer()
            }
            .zIndex(3)
            
            // LAYER 2: Dimming Layer (Background Context)
            // Sits behind the text (zIndex 1 vs 2), creating the immersive effect.
            if sessionManager.state == .listening {
                Color.black.opacity(0.85)
                    .ignoresSafeArea()
                    .transition(.opacity.animation(.easeInOut))
                    .zIndex(1)
            }
            
            // LAYER 3: Content (Text + Controls)
            VStack(spacing: 0) {
                Spacer()
                    .frame(height: 160) // Fixed top anchor
                
                ZStack {
                    if let chunk = currentChunk {
                        if sessionManager.state == .listening {
                            // Immersive Mode
                            PageViewMode(
                                sessionManager: sessionManager,
                                chunk: chunk,
                                currentWordIndex: sessionManager.activeWordIndex,
                                activeColor: currentHighlightColor
                            )
                            .transition(.opacity.animation(.easeInOut))
                            
                        } else {
                            // Reading Mode
                            FullChunkDisplayView(
                                sessionManager: sessionManager,
                                chunk: chunk
                            )
                            .transition(.opacity.animation(.easeInOut))
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .zIndex(2)
        }
        .ignoresSafeArea(edges: .top)
        .onChange(of: sessionManager.currentChunkIndex) { _ in
            if sessionManager.state == .listening {
               sessionManager.playCurrentChunk()
            }
        }
        // SWIPE NAVIGATION (Reader Mode Only)
        .gesture(
            DragGesture()
                .onEnded { value in
                    guard sessionManager.state == .reading else { return }
                    
                    let horizontalAmount = value.translation.width
                    let verticalAmount = value.translation.height
                    
                    if abs(horizontalAmount) > abs(verticalAmount) {
                        if horizontalAmount < -50 {
                            sessionManager.nextChunk()
                        } else if horizontalAmount > 50 {
                            sessionManager.previousChunk()
                        }
                    }
                }
        )
    }
    
    // MARK: - Interaction Logic
    
    private func handleHeaderTap() {
        if sessionManager.state == .listening {
            print("LOG: [Navigation] Header tapped. Returning to Reader Mode.")
            let impactMed = UIImpactFeedbackGenerator(style: .medium)
            impactMed.impactOccurred()
            
            sessionManager.state = .reading
            audioService.pause()
        }
    }
    
    // MARK: - Helpers
    
    private var currentChunk: AudioChunk? {
        guard let response = sessionManager.currentResponse,
              response.chunks.indices.contains(sessionManager.currentChunkIndex) else { return nil }
        return response.chunks[sessionManager.currentChunkIndex]
    }
    
    private var currentHighlightColor: Color {
        let index = sessionManager.currentChunkIndex % 4
        switch index {
        case 0: return Theme.accent // Gold
        case 1: return Theme.highlightOrange
        case 2: return Theme.highlightBlue
        case 3: return Theme.highlightWhite
        default: return Theme.accent
        }
    }
}
