import SwiftUI
import UIKit

struct FullChunkDisplayView: View {
    @ObservedObject var sessionManager: SessionManager
    let chunk: AudioChunk
    
    @State private var selectedPageIndex: Int = 0
    @State private var textHeight: CGFloat = 200 // Default start
    
    // CALCULATED MINIMUM: 3 Lines of Text
    private var minimumWindowHeight: CGFloat {
        let font = UIFont.systemFont(ofSize: 32, weight: .bold)
        let threeLines = font.lineHeight * 3
        let spacing = CGFloat(8 * 2) // 2 spaces for 3 lines
        let padding = CGFloat(40)    // Standard vertical padding
        return threeLines + spacing + padding
    }
    
    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(spacing: 0) {
                    
                    // 1. TEXT CONTAINER (Self-Sizing with Floor)
                    FullChunkTextView(
                        chunk: chunk,
                        width: geometry.size.width - 40, // Padding 20*2
                        selectedPageIndex: $selectedPageIndex,
                        dynamicHeight: $textHeight, // BINDING
                        onCueRequest: { time in
                            AudioService.shared.seek(to: time)
                        }
                    )
                    .frame(height: max(textHeight, minimumWindowHeight))
                    
                    // Apply the Card Styling
                    .background(Theme.overlayBackground)
                    .cornerRadius(20)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Theme.overlayBorder, lineWidth: 1)
                    )
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                    
                    // 2. CONTROLS SPACING
                    Spacer().frame(height: 30)
                    
                    // 3. PLAY AUDIO BUTTON (Styled like InputView)
                    Button(action: {
                        sessionManager.state = .listening
                        sessionManager.playCurrentChunk()
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
                                Text("Play Audio")
                                    .fontWeight(.bold)
                                    .foregroundColor(Theme.buttonText) // Dark Text
                                
                                Image(systemName: "play.fill")
                                    .font(.caption)
                                    .foregroundColor(Theme.buttonText) // Dark Icon
                            }
                        }
                        .frame(height: 50)
                        // CHANGED: Fixed width to 75% of screen width
                        .frame(width: geometry.size.width * 0.75)
                    }
                    // Centered by default behavior of VStack
                    
                    // 4. RESET BUTTON (New Position)
                    // "Bottom Left"
                    HStack {
                        Button(action: {
                            // Haptic Feedback
                            let impact = UIImpactFeedbackGenerator(style: .medium)
                            impact.impactOccurred()
                            
                            // Reset
                            sessionManager.reset()
                        }) {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                                .padding(10)
                                .background(Color.white.opacity(0.15))
                                .clipShape(Circle())
                                .overlay(
                                    Circle()
                                        .stroke(Color.white.opacity(0.5), lineWidth: 1)
                                )
                        }
                        
                        Spacer() // Pushes button to the left
                    }
                    // CHANGED: Increased top padding to 30 to give space
                    .padding(.top, 30)
                    .padding(.leading, 20) // Align with card edge
                    .padding(.bottom, 20)  // Extra bottom padding for scroll space
                }
                .frame(maxWidth: .infinity)
                .frame(minHeight: geometry.size.height, alignment: .top)
            }
        }
        .onChange(of: chunk.chunkIndex) { _ in
            selectedPageIndex = 0
        }
        .onChange(of: textHeight) { newHeight in
            if newHeight > 0 {
                let effectiveHeight = max(newHeight, minimumWindowHeight)
                print("LOG: [Layout] Syncing Reader Height (Clamped): \(effectiveHeight)")
                sessionManager.readerTextHeight = effectiveHeight
            }
        }
        .onAppear {
            print("LOG: FullChunkDisplayView appeared")
        }
    }
}
