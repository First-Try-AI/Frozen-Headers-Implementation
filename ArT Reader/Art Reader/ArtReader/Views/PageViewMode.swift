import SwiftUI

struct PageViewMode: View {
    let chunk: AudioChunk
    let currentWordIndex: Int
    let onPauseRequest: () -> Void
    
    init(chunk: AudioChunk, currentWordIndex: Int, onPauseRequest: @escaping () -> Void) {
        self.chunk = chunk
        self.currentWordIndex = currentWordIndex
        self.onPauseRequest = onPauseRequest
    }
    
    var activePage: ChunkPage? {
        let pages = chunk.computedPages
        return pages.first { page in
            // FIX: Safely unwrap words array using optional chaining
            if let first = page.words?.first?.index, let last = page.words?.last?.index {
                return currentWordIndex >= first && currentWordIndex <= last
            }
            return false
        } ?? pages.first
    }
    
    var body: some View {
        ZStack {
            VStack {
                Spacer()
                
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(alignment: .center, spacing: 12) {
                            Text(reconstructedPageText)
                                .font(.system(size: 32, weight: .medium))
                                .multilineTextAlignment(.center)
                                .lineSpacing(8)
                                .id("MainTextField")
                                .animation(.easeInOut(duration: 0.3), value: activePage?.pageIndex)
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 50)
                    }
                }
                
                Spacer()
                
                Button(action: {
                    onPauseRequest()
                }) {
                    Image(systemName: "pause.circle.fill")
                        .font(.title)
                        .foregroundColor(Theme.cardLabel)
                }
                .padding(.bottom, 30)
            }
        }
        // MARK: - Overlay Card Style
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.overlayBackground)
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Theme.overlayBorder, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 0)
    }
    
    var reconstructedPageText: AttributedString {
        var attributed = AttributedString("")
        let pageWords = activePage?.words ?? []
        
        for wordObj in pageWords {
            var wordContainer = AttributedString(wordObj.word)
            
            if wordObj.index == currentWordIndex {
                wordContainer.foregroundColor = Theme.accent
                wordContainer.font = .system(size: 36, weight: .bold)
            } else {
                wordContainer.foregroundColor = Theme.text.opacity(0.5)
                wordContainer.font = .system(size: 32, weight: .regular)
            }
            
            attributed.append(wordContainer)
            attributed.append(AttributedString(" "))
        }
        return attributed
    }
}
