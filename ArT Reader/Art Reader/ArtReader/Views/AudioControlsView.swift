import SwiftUI

struct AudioControlsView: View {
    @ObservedObject var sessionManager: SessionManager
    
    // We observe AudioService directly for button state to be reactive
    @ObservedObject private var audioService = AudioService.shared
    
    // Configurable Actions & Icons (Optional)
    // If nil, defaults to Previous/Next Chunk logic
    var leftButtonAction: (() -> Void)? = nil
    var leftButtonIcon: String = "backward.fill"
    
    var rightButtonAction: (() -> Void)? = nil
    var rightButtonIcon: String = "forward.fill"
    
    // Explicit Disable Flags (Overrides logic)
    var isLeftDisabled: Bool = false
    var isRightDisabled: Bool = false
    
    var body: some View {
        HStack(spacing: 20) {
            
            // LEFT BUTTON (Previous / Custom)
            Button(action: {
                if let action = leftButtonAction {
                    action()
                } else {
                    sessionManager.previousChunk()
                }
            }) {
                Image(systemName: leftButtonIcon)
                    .font(.title2)
                    .foregroundColor(Theme.text.opacity(0.8))
                    .frame(width: 44, height: 44)
            }
            .disabled(shouldDisableLeft)
            .opacity(shouldDisableLeft ? 0.3 : 1.0)
            
            // CENTER PLAY/PAUSE (Gold Gradient)
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
                    
                    HStack(spacing: 8) {
                        Image(systemName: audioService.isPlaying ? "pause.fill" : "play.fill")
                            .font(.headline)
                        Text(audioService.isPlaying ? "Pause" : "Play")
                            .fontWeight(.bold)
                    }
                    .foregroundColor(Theme.buttonText)
                }
                .frame(height: 50)
                // Expand horizontally but keep within reason
                .frame(maxWidth: 160)
            }
            
            // RIGHT BUTTON (Next / Custom)
            Button(action: {
                if let action = rightButtonAction {
                    action()
                } else {
                    sessionManager.nextChunk()
                }
            }) {
                Image(systemName: rightButtonIcon)
                    .font(.title2)
                    .foregroundColor(Theme.text.opacity(0.8))
                    .frame(width: 44, height: 44)
            }
            // Disable if at end (only if default action)
            .disabled(shouldDisableRight)
            .opacity(shouldDisableRight ? 0.3 : 1.0)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 30) // Safe area padding
        .padding(.top, 10)
        .background(Color.black.opacity(0.8).blur(radius: 10)) // Subtle background for controls
    }
    
    private var shouldDisableLeft: Bool {
        if isLeftDisabled { return true }
        if leftButtonAction != nil { return false } // Custom action is enabled unless explicitly disabled
        return sessionManager.currentChunkIndex == 0
    }
    
    private var shouldDisableRight: Bool {
        if isRightDisabled { return true }
        if rightButtonAction != nil { return false } // Custom action is enabled unless explicitly disabled
        guard let response = sessionManager.currentResponse else { return true }
        return sessionManager.currentChunkIndex >= (response.chunks.count - 1)
    }
}
