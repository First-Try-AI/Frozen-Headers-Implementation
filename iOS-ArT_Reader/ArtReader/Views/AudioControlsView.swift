import SwiftUI

struct AudioControlsView: View {
    @ObservedObject var sessionManager: SessionManager
    @ObservedObject private var audioService = AudioService.shared
    
    // Configurable Actions & Icons
    var leftButtonAction: (() -> Void)? = nil
    var leftButtonIcon: String = "backward.fill"
    
    var rightButtonAction: (() -> Void)? = nil
    var rightButtonIcon: String = "forward.fill"
    
    // Explicit Disable Flags
    var isLeftDisabled: Bool = false
    var isRightDisabled: Bool = false
    
    var body: some View {
        HStack(spacing: 40) {
            
            // LEFT BUTTON
            Button(action: {
                if let action = leftButtonAction { action() }
                else { sessionManager.previousChunk() }
            }) {
                Image(systemName: leftButtonIcon)
                    .font(.title3)
                    .foregroundColor(Theme.text.opacity(0.8))
                    .frame(width: 44, height: 44)
            }
            .disabled(shouldDisableLeft)
            .opacity(shouldDisableLeft ? 0.3 : 1.0)
            
            // CENTER PLAY/PAUSE
            // Uses shared style to enforce 125pt height
            Button(action: {
                sessionManager.togglePlayback()
            }) {
                HStack(spacing: 6) {
                    Text(audioService.isPlaying ? "Pause" : "Play")
                        .font(.headline)
                        .fontWeight(.bold)
                    
                    Image(systemName: audioService.isPlaying ? "pause.fill" : "play.fill")
                        .font(.caption)
                }
                .frame(maxWidth: .infinity) // Fill available width
            }
            .buttonStyle(TranslucentLargeButtonStyle()) // <--- NEW STYLE
            
            // RIGHT BUTTON
            Button(action: {
                if let action = rightButtonAction { action() }
                else { sessionManager.nextChunk() }
            }) {
                Image(systemName: rightButtonIcon)
                    .font(.title3)
                    .foregroundColor(Theme.text.opacity(0.8))
                    .frame(width: 44, height: 44)
            }
            .disabled(shouldDisableRight)
            .opacity(shouldDisableRight ? 0.3 : 1.0)
        }
        .padding(.horizontal, 20)
    }
    
    private var shouldDisableLeft: Bool {
        if isLeftDisabled { return true }
        if leftButtonAction != nil { return false }
        return sessionManager.currentChunkIndex == 0
    }
    
    private var shouldDisableRight: Bool {
        if isRightDisabled { return true }
        if rightButtonAction != nil { return false }
        guard let response = sessionManager.currentResponse else { return true }
        return sessionManager.currentChunkIndex >= (response.chunks.count - 1)
    }
}
