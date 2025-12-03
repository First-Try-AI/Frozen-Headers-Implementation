import Foundation
import Combine
import SwiftUI
import UIKit

// MARK: - Session State Enum
enum SessionState: Equatable {
    case writing
    case processing
    case reading
    case listening
    
    var isReaderContext: Bool {
        switch self {
        case .reading, .listening: return true
        default: return false
        }
    }
}

class SessionManager: ObservableObject {
    
    // MARK: - Core State
    @Published var state: SessionState = .writing
    @Published var currentResponse: AudioResponse?
    @Published var currentChunkIndex: Int = 0 {
        didSet {
            updateHeightForCurrentChunk()
        }
    }
    @Published var errorMessage: String?
    
    // PLAYBACK PERFORMANCE (DELEGATED TO PLAYBACKVIEWMODEL)
    // Removed @Published var activeWordIndex: Int = 0
    let playbackViewModel = ArtPlaybackViewModel()
    
    // LAYOUT SYNCHRONIZATION
    @Published var readerTextHeight: CGFloat = 400
    
    // MARK: - Dependencies
    internal let apiService = APIService.shared
    internal let audioService = AudioService.shared
    
    // DYNAMIC HEIGHTS
    @Published var maxPageHeight: CGFloat = 400
    // Removed chunkHeights dictionary
    
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    init() {
        setupAudioBindings()
        // Removed setupPerformanceOptimization()
    }
    
    private func setupAudioBindings() {
        audioService.$isPlaying
            .sink { [weak self] isPlaying in
                guard let self = self else { return }
                if self.state.isReaderContext {
                    if isPlaying {
                        self.state = .listening
                    }
                }
            }
            .store(in: &cancellables)
            
        audioService.didFinishPlaying
            .sink { [weak self] in
                self?.nextChunk()
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Actions
    
    func submit(text: String) {
        withAnimation {
            state = .processing
            errorMessage = nil
        }
        
        Task {
            do {
                let response = try await apiService.generateAudio(text: text)
                
                await MainActor.run {
                    self.currentResponse = response
                    self.precalculateChunkHeights(for: response)
                    
                    self.currentChunkIndex = 0
                    self.audioService.pause()
                    
                    // Update VM
                    if let firstChunk = response.chunks.first {
                        self.playbackViewModel.setContext(chunk: firstChunk)
                    }
                    
                    withAnimation {
                        self.state = .reading
                    }
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    withAnimation {
                        self.state = .writing
                    }
                }
            }
        }
    }
    
    func reset() {
        audioService.reset() // CHANGED: Explicit reset
        currentResponse = nil
        currentChunkIndex = 0
        errorMessage = nil
        // activeWordIndex = 0 (Removed)
        playbackViewModel.setContext(chunk: nil)
        
        readerTextHeight = 400
        withAnimation {
            state = .writing
        }
    }
    
    // MARK: - Layout Calculation
    
    private func precalculateChunkHeights(for response: AudioResponse) {
        // SIMPLIFIED LOGIC: Constant Height Cap
        // This eliminates "NaN" errors and instability from complex text measurement.
        let screenHeight = UIScreen.main.bounds.height
        
        // Safety check
        guard screenHeight > 0, !screenHeight.isNaN else {
             // Fallback default
             self.readerTextHeight = 400
             self.maxPageHeight = 400
             return
        }
        
        let fixedHeight = screenHeight * 0.65
        
        self.readerTextHeight = fixedHeight
        self.maxPageHeight = fixedHeight
        
        print("LOG: Set Fixed Reader Height to: \(fixedHeight)")
    }
    
    private func updateHeightForCurrentChunk() {
        // No-op: Height is now constant.
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
        
        // Update VM Context
        playbackViewModel.setContext(chunk: chunk)
        
        if audioService.currentTime < 0.1 {
            playbackViewModel.activeWordIndex = 0
        }
        
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
            finishSession()
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
    
    private func finishSession() {
        print("LOG: [SessionManager] End of playback reached. Pausing for 7 seconds.")
        
        // 1. Force highlight to the LAST word of the current chunk
        if let response = currentResponse,
           response.chunks.indices.contains(currentChunkIndex),
           let lastPage = response.chunks[currentChunkIndex].pages?.last,
           let lastWord = lastPage.words?.last {
            self.playbackViewModel.forceIndex(lastWord.index)
        }
        
        // 2. 7-Second Delay before returning to Reader Mode
        DispatchQueue.main.asyncAfter(deadline: .now() + 7.0) {
            self.audioService.pause()
            self.audioService.seek(to: 0)
            
            withAnimation(.easeInOut(duration: 0.5)) {
                self.state = .reading
                self.currentChunkIndex = 0
                self.playbackViewModel.activeWordIndex = 0
            }
        }
    }
    
    func resetChunkState() {
        audioService.pause()
        audioService.seek(to: 0)
        playbackViewModel.activeWordIndex = 0
        
        withAnimation {
            state = .reading
        }
    }
}
