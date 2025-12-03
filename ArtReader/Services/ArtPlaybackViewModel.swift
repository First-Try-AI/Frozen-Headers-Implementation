import Foundation
import Combine
import SwiftUI

class ArtPlaybackViewModel: ObservableObject {
    // High-frequency Published properties
    @Published var activeWordIndex: Int = 0
    @Published var progress: Double = 0.0
    
    // Playback State (Mirrored from AudioService to decouple Views)
    @Published var isPlaying: Bool = false
    
    // Dependencies
    private let audioService = AudioService.shared
    
    // Data Context
    private var currentChunk: AudioChunk?
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupBindings()
    }
    
    // Update the context when the chunk changes
    func setContext(chunk: AudioChunk?) {
        self.currentChunk = chunk
        // Reset state if chunk changes
        if chunk == nil {
            activeWordIndex = 0
            progress = 0.0
        }
    }
    
    private func setupBindings() {
        // Bind to AudioService time updates
        audioService.$currentTime
            .sink { [weak self] time in
                guard let self = self else { return }
                self.calculateState(for: time)
            }
            .store(in: &cancellables)
        
        // Bind to AudioService playback state
        audioService.$isPlaying
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isPlaying in
                self?.isPlaying = isPlaying
            }
            .store(in: &cancellables)
    }
    
    private func calculateState(for time: Double) {
        // 1. Calculate Progress
        if audioService.duration > 0 {
            self.progress = time / audioService.duration
        } else {
            self.progress = 0
        }
        
        // 2. Calculate Active Word
        guard let chunk = currentChunk else { return }
        
        // Optimization: Check if time is 0 (reset)
        if time < 0.1 {
            updateActiveWordIndex(0)
            return
        }
        
        // Find the word
        if let pages = chunk.pages {
            for page in pages {
                if let words = page.words {
                    for word in words {
                        if time >= word.startTime && time <= word.endTime {
                            updateActiveWordIndex(word.index)
                            return
                        }
                    }
                }
            }
        }
    }
    
    private func updateActiveWordIndex(_ newIndex: Int) {
        if activeWordIndex != newIndex {
            // Ensure UI updates happen on Main Thread
            if Thread.isMainThread {
                self.activeWordIndex = newIndex
            } else {
                DispatchQueue.main.async {
                    self.activeWordIndex = newIndex
                }
            }
        }
    }
    
    // Helper to force specific index (e.g. at end of session)
    func forceIndex(_ index: Int) {
        self.activeWordIndex = index
    }
}
