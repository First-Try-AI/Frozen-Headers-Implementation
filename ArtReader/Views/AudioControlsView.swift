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
        HStack(spacing: 40) { // Spacing between controls
            
            // LEFT BUTTON (Previous / Custom)
            Button(action: {
                if let action = leftButtonAction {
                    action()
                } else {
                    sessionManager.previousChunk()
                }
            }) {
                Image(systemName: leftButtonIcon)
                    .font(.title3) // Slightly smaller icon
                    .foregroundColor(Theme.text.opacity(0.8))
                    .frame(width: 44, height: 44)
                    // No background for these controls
            }
            .disabled(shouldDisableLeft)
            .opacity(shouldDisableLeft ? 0.3 : 1.0)
            
            // CENTER PLAY/PAUSE (Gold Link Style)
            // "Link in gold with black background (analogous to how the Page title starts)"
            Button(action: {
                sessionManager.togglePlayback()
            }) {
                HStack(spacing: 6) {
                    Text(audioService.isPlaying ? "Pause" : "Play")
                        .font(.headline) // Step down from Title size
                        .fontWeight(.bold)
                    
                    Image(systemName: audioService.isPlaying ? "pause.fill" : "play.fill")
                        .font(.caption)
                }
                .foregroundColor(Theme.accent) // Gold Text
                .padding(.vertical, 8)
                .padding(.horizontal, 16)
                .background(Color.black) // Black Background
                .cornerRadius(8)
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
                    .font(.title3)
                    .foregroundColor(Theme.text.opacity(0.8))
                    .frame(width: 44, height: 44)
            }
            // Disable if at end (only if default action)
            .disabled(shouldDisableRight)
            .opacity(shouldDisableRight ? 0.3 : 1.0)
        }
        // No container background
        .padding(.horizontal, 20)
        // Spacing handled by parent (PageViewMode)
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
