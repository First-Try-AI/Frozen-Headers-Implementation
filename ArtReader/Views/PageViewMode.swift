import SwiftUI

struct PageViewMode: View {
    @ObservedObject var sessionManager: SessionManager
    @ObservedObject var playbackVM: ArtPlaybackViewModel
    
    let chunk: AudioChunk
    let activeColor: Color
    
    // Observe AudioService for dynamic button text
    @ObservedObject private var audioService = AudioService.shared
    
    init(sessionManager: SessionManager, playbackVM: ArtPlaybackViewModel, chunk: AudioChunk, activeColor: Color = Theme.accent) {
        self.sessionManager = sessionManager
        self.playbackVM = playbackVM
        self.chunk = chunk
        self.activeColor = activeColor
    }
    
    var activePage: ChunkPage? {
        let pages = chunk.computedPages
        let idx = playbackVM.activeWordIndex
        return pages.first { page in
            if let first = page.words?.first?.index, let last = page.words?.last?.index {
                return idx >= first && idx <= last
            }
            return false
        }
    }
    
    var body: some View {
        // REMOVED: Root GeometryReader
        VStack(spacing: 0) {

            // IMMERSIVE TEXT WINDOW
            VStack {
                ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        if let pageWords = activePage?.words {
                            if #available(iOS 16.0, *) {
                                FlowLayout(alignment: .center, spacing: 8) {
                                    ForEach(pageWords, id: \.index) { wordObj in
                                        wordView(for: wordObj)
                                    }
                                }
                                .padding(.horizontal, 20)
                                .padding(.vertical, 50)
                                .id("MainFlowField")
                            } else {
                                Text("Upgrade to iOS 16 for best experience")
                                    .foregroundColor(.white)
                            }
                        }
                    }
                    .onChange(of: activePage?.pageIndex) {
                        withAnimation {
                            proxy.scrollTo("MainFlowField", anchor: .top)
                        }
                    }
                }
            }
            // Use the shared reader height from sessionManager
            .frame(height: sessionManager.readerTextHeight)
            .animation(.easeInOut, value: sessionManager.readerTextHeight)
            .padding(.horizontal, 20)

            Spacer().frame(height: 30)

            // AUDIO CONTROL
            Button(action: {
                sessionManager.togglePlayback()
            }) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [Theme.accent, Theme.accentGoldEnd]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Theme.accentBorderGold, lineWidth: 2)

                    HStack(spacing: 6) {
                        Text(audioService.isPlaying ? "Pause Audio" : "Play Audio")
                            .fontWeight(.bold)
                            .foregroundColor(Theme.buttonText)
                        
                        Image(systemName: audioService.isPlaying ? "pause.fill" : "play.fill")
                            .font(.caption)
                            .foregroundColor(Theme.buttonText)
                    }
                }
                .frame(height: 50)
                // CHANGED: Use padding instead of fixed frame ratio
                .padding(.horizontal, 40)
            }
            .padding(.bottom, 0)

            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
    
    @ViewBuilder
    private func wordView(for wordObj: PageWord) -> some View {
        let state = getWordState(wordIndex: wordObj.index, currentIndex: playbackVM.activeWordIndex)
        
        Text(wordObj.word)
            .font(.system(size: 32, weight: .bold))
            .foregroundColor(state == .active ? activeColor : Theme.text)
            .opacity(state.opacity)
            .padding(.horizontal, 4)
            .background(state == .active ? Color.black : Color.clear)
            .cornerRadius(4)
            .scaleEffect(state == .active ? 1.13 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: state)
            .zIndex(state == .active ? 1 : 0)
    }
    
    enum WordState: Equatable {
        case active, lookahead, lookback, inactive
        var opacity: Double {
            switch self {
            case .active: return 1.0
            case .lookahead, .lookback: return 0.55
            case .inactive: return 0.3
            }
        }
    }
    
    private func getWordState(wordIndex: Int, currentIndex: Int) -> WordState {
        if wordIndex == currentIndex { return .active }
        if wordIndex > currentIndex && wordIndex <= currentIndex + 2 { return .lookahead }
        if wordIndex < currentIndex && wordIndex >= currentIndex - 1 { return .lookback }
        return .inactive
    }
}
