import SwiftUI

struct FullChunkDisplayView: View {
    let chunk: AudioChunk
    let onPlayRequest: () -> Void
    
    @State private var selectedPageIndex: Int = 0
    @ObservedObject var audioService = AudioService.shared
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                
                // 1. TEXT CARD
                VStack(spacing: 0) {
                    FullChunkTextView(
                        chunk: chunk,
                        selectedPageIndex: $selectedPageIndex,
                        onCueRequest: { time in
                            AudioService.shared.seek(to: time)
                        }
                    )
                    // Important: Let it grow vertically, but not horizontally beyond parent
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(minHeight: 200)
                }
                .background(Theme.overlayBackground)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Theme.overlayBorder, lineWidth: 1)
                )
                // MARGIN MATCH: 16pt to match LoadingView.swift
                .padding(.horizontal, 16)
                .padding(.top, 10)
                
                // 2. SPACER
                Spacer().frame(height: 100)
            }
        }
        .onChange(of: chunk.chunkIndex) { _ in
            selectedPageIndex = 0
        }
    }
}
