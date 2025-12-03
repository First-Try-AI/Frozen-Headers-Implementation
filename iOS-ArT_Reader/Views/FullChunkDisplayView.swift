import SwiftUI
import UIKit

struct FullChunkDisplayView: View {
    @ObservedObject var sessionManager: SessionManager
    let chunk: AudioChunk
    
    @State private var selectedPageIndex: Int = 0
    @State private var textHeight: CGFloat = 200
    
    private var minimumWindowHeight: CGFloat {
        let font = UIFont.systemFont(ofSize: 32, weight: .bold)
        let threeLines = font.lineHeight * 3
        let spacing = CGFloat(8 * 2)
        let padding = CGFloat(40)
        return threeLines + spacing + padding
    }
    
    var body: some View {
        // REMOVED: Root GeometryReader which caused layout conflicts in FrozenPanelView
        ScrollView {
            VStack(spacing: 0) {
                
                // 1. TEXT CONTAINER
                FullChunkTextView(
                    chunk: chunk,
                    // CHANGED: Use Infinity width instead of geometry calculation
                    // The internal padding of the view will handle the insets
                    // Note: UIScreen.main is deprecated in newer iOS but safe for this single-window context
                    width: UIScreen.main.bounds.width - 40, 
                    selectedPageIndex: $selectedPageIndex,
                    dynamicHeight: $textHeight,
                    onCueRequest: { time in
                        AudioService.shared.seek(to: time)
                    }
                )
                .frame(height: max(textHeight, minimumWindowHeight), alignment: .top)
                .background(Theme.overlayBackground)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Theme.overlayBorder, lineWidth: 1)
                )
                .padding(.horizontal, 20)
                .padding(.top, 10) // Internal spacing (Card vs Scroll Top)
                
                Spacer().frame(height: 30)
                
                // 2. PLAY BUTTON
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
                                .foregroundColor(Theme.buttonText)
                            
                            Image(systemName: "play.fill")
                                .font(.caption)
                                .foregroundColor(Theme.buttonText)
                        }
                    }
                    .frame(height: 50)
                    .padding(.horizontal, 40) // Approximate 0.75 width visually
                }
                
                // 3. RESET BUTTON
                HStack {
                    Button(action: {
                        let impact = UIImpactFeedbackGenerator(style: .medium)
                        impact.impactOccurred()
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
                    Spacer()
                }
                .padding(.top, 30)
                .padding(.leading, 20)
                .padding(.bottom, 20)
                
            }
            .frame(maxWidth: .infinity)
            // REMOVED: minHeight constraint dependent on geometry
            .padding(.bottom, 100)
        }
        // FIXED: Updated for iOS 17+ syntax
        .onChange(of: chunk.chunkIndex) { _, _ in
            selectedPageIndex = 0
        }
        // FIXED: Updated for iOS 17+ syntax
        .onChange(of: textHeight) { _, newHeight in
            if newHeight > 0 {
                sessionManager.readerTextHeight = max(newHeight, minimumWindowHeight)
            }
        }
    }
}
