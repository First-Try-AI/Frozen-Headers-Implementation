import SwiftUI

struct ReaderView: View {
    let response: AudioResponse
    @ObservedObject var audioService: AudioService
    
    // State
    @State private var currentChunkIndex = 0
    // NOTE: selectedPageIndex removed here because FullChunkDisplayView manages it internally
    
    var body: some View {
        ZStack {
            // 1. Background
            Image("AppBackground")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                
                // 2. Header (Progress)
                ProgressHeaderView(
                    totalChunks: response.chunks.count,
                    currentChunkIndex: $currentChunkIndex,
                    isPlaying: audioService.isPlaying,
                    progress: audioService.progress
                )
                .padding(.top, 60)
                .padding(.bottom, 10)
                
                // 3. Content Area
                ZStack {
                    if audioService.isPlaying {
                        // Playing Mode: "Reading Rainbow"
                        PageViewMode(
                            chunk: response.chunks[currentChunkIndex],
                            currentWordIndex: computedCurrentWordIndex,
                            onPauseRequest: {
                                audioService.pause()
                            }
                        )
                        .transition(.opacity.animation(.easeInOut))
                        
                    } else {
                        // Reading Mode: The Wrapper View
                        // (Handles scrolling, card styling, and page selection internally)
                        FullChunkDisplayView(
                            chunk: response.chunks[currentChunkIndex],
                            onPlayRequest: {
                                playCurrentChunk(autoPlay: true)
                            }
                        )
                        .transition(.opacity.animation(.easeInOut))
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // 4. Footer Removed (Duplicate Play Button is gone)
            }
        }
        .onDisappear {
            audioService.pause()
        }
        .onChange(of: currentChunkIndex) { _ in
            playCurrentChunk(autoPlay: false)
        }
    }
    
    // MARK: - Logic
    
    // Calculates which word is currently active based on audio timestamp
    private var computedCurrentWordIndex: Int {
        let chunk = response.chunks[currentChunkIndex]
        let currentTime = audioService.currentTime
        
        // Scan pages to find the word active at this timestamp
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
    
    private func playCurrentChunk(autoPlay: Bool) {
        let chunk = response.chunks[currentChunkIndex]
        if let url = URL(string: chunk.audioUrl) {
            if autoPlay {
                audioService.play(url: url)
            }
        }
    }
}
