import SwiftUI

struct FullChunkDisplayView: View {
    @ObservedObject var sessionManager: SessionManager
    let chunk: AudioChunk
    
    @State private var selectedPageIndex: Int = 0
    
    var body: some View {
        // Use GeometryReader to capture available width for the text view
        GeometryReader { geometry in
            // Re-added ScrollView to handle content that exceeds screen size,
            // while allowing shorter content to "hug" the top without filling the screen.
            ScrollView {
                VStack(spacing: 0) {
                    
                    // 1. TEXT CARD
                    VStack(spacing: 0) {
                        FullChunkTextView(
                            chunk: chunk,
                            width: geometry.size.width - 32, // Subtract padding (16*2)
                            selectedPageIndex: $selectedPageIndex,
                            onCueRequest: { time in
                                AudioService.shared.seek(to: time)
                            }
                        )
                        // No frame modifier here; it will size to intrinsic content
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
                    
                    // 2. SPACER (Controls flow with text, 40pt below per instruction 6)
                    Spacer().frame(height: 40)
                    
                    // 3. CONTROLS (Customized for Reading Mode)
                    // Left (<<): Grayed out (Disabled)
                    // Right (>>): Refresh icon (Reload Input)
                    AudioControlsView(
                        sessionManager: sessionManager,
                        
                        // Right Button Configuration (Must come before disable flags)
                        rightButtonAction: {
                            // "Refresh icon that reloads the input page fresh"
                            sessionManager.reset()
                        },
                        rightButtonIcon: "arrow.clockwise", // Refresh Icon
                        
                        // Disable Flags
                        isLeftDisabled: true
                    )
                    
                    // Extra bottom padding
                    Spacer().frame(height: 20)
                }
                // IMPORTANT: Force the VStack to take full width so TextView can calculate height
                .frame(maxWidth: .infinity)
                .frame(minHeight: geometry.size.height, alignment: .top) // Ensure ScrollView can scroll
            }
        }
        .onChange(of: chunk.chunkIndex) {
            selectedPageIndex = 0
        }
        .onAppear {
            print("LOG: FullChunkDisplayView appeared")
        }
    }
}
