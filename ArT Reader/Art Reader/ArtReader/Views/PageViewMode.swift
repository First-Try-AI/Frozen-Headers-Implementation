import SwiftUI

struct PageViewMode: View {
    @ObservedObject var sessionManager: SessionManager
    let chunk: AudioChunk
    let currentWordIndex: Int
    let activeColor: Color
    
    // Observe AudioService for dynamic button text
    @ObservedObject private var audioService = AudioService.shared
    
    init(sessionManager: SessionManager, chunk: AudioChunk, currentWordIndex: Int, activeColor: Color = Theme.accent) {
        self.sessionManager = sessionManager
        self.chunk = chunk
        self.currentWordIndex = currentWordIndex
        self.activeColor = activeColor
    }
    
    var activePage: ChunkPage? {
        let pages = chunk.computedPages
        return pages.first { page in
            if let first = page.words?.first?.index, let last = page.words?.last?.index {
                return currentWordIndex >= first && currentWordIndex <= last
            }
            return false
        }
    }
    
    var body: some View {
        GeometryReader { geometry in // Need geometry for width calculation
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
                .frame(height: sessionManager.readerTextHeight)
                .animation(.easeInOut, value: sessionManager.readerTextHeight)
                .padding(.horizontal, 20)
                
                // CONTROLS SPACING
                Spacer().frame(height: 30)
                
                // AUDIO CONTROL (Single Gold Button)
                // Replaced AudioControlsView with the specific Play/Pause button style
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
                    // Match FullChunkDisplayView: 75% Width
                    .frame(width: geometry.size.width * 0.75)
                }
                .padding(.bottom, 0)
                
                Spacer()
            }
        }
    }
    
    // ... [Rest of file remains unchanged] ...
    
    @ViewBuilder
    private func wordView(for wordObj: PageWord) -> some View {
        let state = getWordState(wordIndex: wordObj.index, currentIndex: currentWordIndex)
        
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
        case active
        case lookahead
        case lookback
        case inactive
        
        var opacity: Double {
            switch self {
            case .active: return 1.0
            case .lookahead, .lookback: return 0.55
            case .inactive: return 0.3
            }
        }
    }
    
    private func getWordState(wordIndex: Int, currentIndex: Int) -> WordState {
        if wordIndex == currentIndex {
            return .active
        }
        if wordIndex > currentIndex && wordIndex <= currentIndex + 2 {
            return .lookahead
        }
        if wordIndex < currentIndex && wordIndex >= currentIndex - 1 {
            return .lookback
        }
        return .inactive
    }
}
