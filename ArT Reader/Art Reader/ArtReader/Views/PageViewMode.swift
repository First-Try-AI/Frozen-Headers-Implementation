import SwiftUI

struct PageViewMode: View {
    @ObservedObject var sessionManager: SessionManager
    let chunk: AudioChunk
    let currentWordIndex: Int
    
    // Removed onPauseRequest as we now use AudioControlsView which uses sessionManager
    
    init(sessionManager: SessionManager, chunk: AudioChunk, currentWordIndex: Int) {
        self.sessionManager = sessionManager
        self.chunk = chunk
        self.currentWordIndex = currentWordIndex
    }
    
    var activePage: ChunkPage? {
        let pages = chunk.computedPages
        return pages.first { page in
            // FIX: Safely unwrap words array using optional chaining
            if let first = page.words?.first?.index, let last = page.words?.last?.index {
                return currentWordIndex >= first && currentWordIndex <= last
            }
            return false
        }
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
                        // Ensure we always scroll to top when page changes
                        .onChange(of: activePage?.pageIndex) {
                             withAnimation {
                                 proxy.scrollTo("MainTextField", anchor: .top)
                             }
                        }
                        .onChange(of: activePage?.pageIndex) {
                            if let index = activePage?.pageIndex {
                                print("LOG: PageViewMode changed to page \(index)")
                            }
                        }
                    }
                }
                
                Spacer()
                
                // Audio Controls (Replaces simple Pause button)
                // Listening Mode: Left and Right buttons present but grayed out (inactive)
                AudioControlsView(
                    sessionManager: sessionManager,
                    isLeftDisabled: true,
                    isRightDisabled: true
                )
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
        // If activePage is nil, we return empty string or maybe a placeholder?
        // Returning empty string is safer than wrong text.
        guard let page = activePage else { return AttributedString("") }
        
        var attributed = AttributedString("")
        let pageWords = page.words ?? []
        
        for wordObj in pageWords {
            var wordContainer = AttributedString(wordObj.word)
            
            if wordObj.index == currentWordIndex {
                // ACTIVE WORD HIGHLIGHTING: Gold
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
