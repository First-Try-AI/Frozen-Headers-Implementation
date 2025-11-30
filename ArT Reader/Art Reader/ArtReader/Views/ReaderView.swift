import SwiftUI

struct ReaderView: View {
    @ObservedObject var sessionManager: SessionManager
    
    // CRITICAL FIX: Observe AudioService directly to trigger UI updates for karaoke
    @ObservedObject private var audioService = AudioService.shared
    
    var body: some View {
        ZStack {
            // Background is handled by ContentView
            
            VStack(spacing: 0) {
                
                // 1. GLOBAL TITLE (Persisted from InputView)
                AppHeaderView(isActive: true)
                
                // 2. Header (Progress)
                if let response = sessionManager.currentResponse {
                    ProgressHeaderView(
                        totalChunks: response.chunks.count,
                        currentChunkIndex: $sessionManager.currentChunkIndex,
                        isPlaying: audioService.isPlaying,
                        progress: audioService.progress,
                        onHeaderTap: {
                            // User wants to return to Full Chunk Display (Reading Mode)
                            // when tapping the nav bar.
                            if sessionManager.state == .listening {
                                sessionManager.state = .reading
                                audioService.pause()
                            }
                        }
                    )
                    // Adjusted padding as AppHeaderView handles the top spacing now
                    .padding(.top, 0)
                    .padding(.bottom, 10)
                }
                
                // 3. Content Area
                ZStack {
                    if let chunk = currentChunk {
                        if sessionManager.state == .listening {
                            // Playing Mode: "Reading Rainbow" (Karaoke)
                            PageViewMode(
                                sessionManager: sessionManager,
                                chunk: chunk,
                                currentWordIndex: computedCurrentWordIndex
                            )
                            .transition(.opacity.animation(.easeInOut))
                            
                        } else {
                            // Reading Mode: The Wrapper View
                            FullChunkDisplayView(
                                sessionManager: sessionManager,
                                chunk: chunk
                            )
                            .transition(.opacity.animation(.easeInOut))
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.bottom, 0) // Removed extra padding as controls are now internal
                
                // REMOVED: Global Audio Controls (Moved into child views)
            }
        }
        .onChange(of: sessionManager.currentChunkIndex) {
            if sessionManager.state == .listening {
               sessionManager.playCurrentChunk()
            }
        }
        .onAppear {
            print("LOG: ReaderView appeared")
        }
    }
    
    // MARK: - Helpers
    
    private var currentChunk: AudioChunk? {
        guard let response = sessionManager.currentResponse,
              response.chunks.indices.contains(sessionManager.currentChunkIndex) else { return nil }
        return response.chunks[sessionManager.currentChunkIndex]
    }
    
    private var computedCurrentWordIndex: Int {
        guard let chunk = currentChunk else { return 0 }
        let currentTime = audioService.currentTime
        
        if let pages = chunk.pages {
            for page in pages {
                if let words = page.words {
                    for word in words {
                        if currentTime >= word.startTime && currentTime <= word.endTime {
                            return word.index
                        }
                    }
                }
            }
        }
        return 0
    }
}
