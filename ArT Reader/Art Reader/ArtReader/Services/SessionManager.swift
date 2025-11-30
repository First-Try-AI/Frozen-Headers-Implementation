import Foundation
import Combine
import SwiftUI

enum SessionState: Equatable {
    case writing
    case processing
    case reading   // Visual Review (Full Text)
    case listening // Cinematic Playback (Karaoke/Pages)
    
    // Helper to check if we are in a "Reader" context (either reading or listening)
    var isReaderContext: Bool {
        switch self {
        case .reading, .listening: return true
        default: return false
        }
    }
}

class SessionManager: ObservableObject {
    // Shared Instance (Optional, but using @StateObject in ContentView is better pattern)
    // keeping it simple as a plain ObservableObject owned by ContentView for now unless shared access is needed elsewhere
    
    // Core State
    @Published var state: SessionState = .writing
    @Published var currentResponse: AudioResponse?
    @Published var currentChunkIndex: Int = 0
    @Published var errorMessage: String?
    
    // Dependencies
    private let apiService = APIService.shared
    private let audioService = AudioService.shared
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupAudioBindings()
    }
    
    private func setupAudioBindings() {
        // Sync Session State with Audio Playback
        audioService.$isPlaying
            .sink { [weak self] isPlaying in
                guard let self = self else { return }
                
                // Only transition if we are already in a reader context
                // We don't want to accidentally switch to .listening if we are in .writing (unlikely, but safe)
                if self.state.isReaderContext {
                    if isPlaying {
                        self.state = .listening
                    } 
                    // REMOVED: else { self.state = .reading }
                    // Goal: Stay in .listening (PageViewMode) when paused.
                    // User manually returns to reading mode via UI.
                }
            }
            .store(in: &cancellables)
            
        // Handle Auto-Play next chunk
        audioService.didFinishPlaying
            .sink { [weak self] in
                self?.nextChunk()
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Actions
    
    func submit(text: String) {
        // 1. Update State
        withAnimation {
            state = .processing
            errorMessage = nil
        }
        
        // 2. API Call
        Task {
            do {
                let response = try await apiService.generateAudio(text: text)
                
                await MainActor.run {
                    self.currentResponse = response
                    self.currentChunkIndex = 0
                    // Reset Audio Service just in case
                    self.audioService.pause() // Ensure we start paused (Reading Mode)
                    withAnimation {
                        self.state = .reading
                    }
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    // Error handling strategy: Stay in processing? Go back to writing? 
                    // Usually go back to input or show error overlay. 
                    // For now, let's go back to writing with the error.
                    withAnimation {
                        self.state = .writing
                    }
                }
            }
        }
    }
    
    func reset() {
        audioService.pause()
        currentResponse = nil
        currentChunkIndex = 0
        errorMessage = nil
        withAnimation {
            state = .writing
        }
    }
    
    // MARK: - Playback Controls
    
    func togglePlayback() {
        if audioService.isPlaying {
            audioService.pause()
        } else {
            playCurrentChunk()
        }
    }
    
    func playCurrentChunk() {
        guard let response = currentResponse,
              response.chunks.indices.contains(currentChunkIndex) else { return }
        
        let chunk = response.chunks[currentChunkIndex]
        
        // REMOVED: Timestamp fetching fallback.
        // We rely on the API to provide valid `pages` in the response.
        
        // Now Play Audio
        if let url = URL(string: chunk.audioUrl) {
            audioService.play(url: url)
        }
    }
    
    func nextChunk() {
        guard let response = currentResponse else { return }
        if currentChunkIndex < response.chunks.count - 1 {
            currentChunkIndex += 1
            playCurrentChunk()
        } else {
            // End of playlist
            audioService.pause()
        }
    }
    
    func previousChunk() {
        if currentChunkIndex > 0 {
            currentChunkIndex -= 1
            if state == .listening {
                playCurrentChunk()
            }
        }
    }
    
    func setChunkIndex(_ index: Int) {
        guard let response = currentResponse, response.chunks.indices.contains(index) else { return }
        currentChunkIndex = index
        if state == .listening {
             playCurrentChunk()
        }
    }
    
    // MARK: - State Management
    
    func resetChunkState() {
        // "Back to reader view of current chunk"
        // Stop audio, reset time to 0, ensure we are in Reading Mode (not Listening)
        // This effectively resets the experience for the current text.
        print("LOG: Resetting chunk state (Back to Reader View)")
        audioService.pause()
        audioService.seek(to: 0)
        
        withAnimation {
            state = .reading
        }
    }
}
