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
    
    // PLAYBACK PERFORMANCE
    @Published var activeWordIndex: Int = 0
    
    // LAYOUT SYNCHRONIZATION
    @Published var readerTextHeight: CGFloat = 400
    
    // MARK: - Dependencies
    internal let apiService = APIService.shared
    internal let audioService = AudioService.shared
    
    // DYNAMIC HEIGHTS
    @Published var maxPageHeight: CGFloat = 400
    private var chunkHeights: [Int: CGFloat] = [:]
    
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    init() {
        setupAudioBindings()
        setupPerformanceOptimization()
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
    
    private func setupPerformanceOptimization() {
        audioService.$currentTime
            .sink { [weak self] time in
                guard let self = self else { return }
                self.calculateActiveWordIndex(for: time)
            }
            .store(in: &cancellables)
    }
    
    private func calculateActiveWordIndex(for time: Double) {
        guard let response = currentResponse,
              response.chunks.indices.contains(currentChunkIndex) else { return }
        
        let chunk = response.chunks[currentChunkIndex]
        var foundIndex = 0
        
        if let pages = chunk.pages {
            for page in pages {
                if let words = page.words {
                    for word in words {
                        if time >= word.startTime && time <= word.endTime {
                            foundIndex = word.index
                            updateActiveWordIndex(foundIndex)
                            return
                        }
                    }
                }
            }
        }
        
        if time < 0.1 {
            updateActiveWordIndex(0)
        }
    }
    
    private func updateActiveWordIndex(_ newIndex: Int) {
        if activeWordIndex != newIndex {
            if Thread.isMainThread {
                self.activeWordIndex = newIndex
            } else {
                DispatchQueue.main.async {
                    self.activeWordIndex = newIndex
                }
            }
        }
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
        audioService.pause()
        currentResponse = nil
        currentChunkIndex = 0
        errorMessage = nil
        activeWordIndex = 0
        readerTextHeight = 400
        withAnimation {
            state = .writing
        }
    }
    
    // MARK: - Layout Calculation
    
    private func precalculateChunkHeights(for response: AudioResponse) {
        chunkHeights.removeAll()
        
        let font = UIFont.systemFont(ofSize: 32, weight: .bold)
        let screenWidth = UIScreen.main.bounds.width
        let horizontalPadding: CGFloat = 40
        let contentWidth = screenWidth - horizontalPadding
        
        let wordSpacing: CGFloat = 8
        let lineSpacing: CGFloat = 8
        let wordInnerPadding: CGFloat = 8
        let verticalContainerPadding: CGFloat = 40
        let screenHeight = UIScreen.main.bounds.height
        let maxHeightCap = screenHeight * 0.65
        
        for chunk in response.chunks {
            var maxCalculatedHeightForChunk: CGFloat = 0
            
            if let pages = chunk.pages {
                for page in pages {
                    guard let words = page.words else { continue }
                    
                    var currentLineWidth: CGFloat = 0
                    var numberOfLines: Int = 1
                    
                    for wordObj in words {
                        let attributes: [NSAttributedString.Key: Any] = [.font: font]
                        let wordSize = (wordObj.word as NSString).size(withAttributes: attributes)
                        let totalItemWidth = wordSize.width + wordInnerPadding
                        
                        if currentLineWidth + totalItemWidth > contentWidth {
                            numberOfLines += 1
                            currentLineWidth = totalItemWidth + wordSpacing
                        } else {
                            currentLineWidth += totalItemWidth + wordSpacing
                        }
                    }
                    
                    let textBlockHeight = (CGFloat(numberOfLines) * font.lineHeight) + (CGFloat(max(0, numberOfLines - 1)) * lineSpacing)
                    let totalPageHeight = textBlockHeight + verticalContainerPadding
                    
                    if totalPageHeight > maxCalculatedHeightForChunk {
                        maxCalculatedHeightForChunk = totalPageHeight
                    }
                }
            }
            
            let finalHeight = max(200, min(maxCalculatedHeightForChunk + 20, maxHeightCap))
            chunkHeights[chunk.chunkIndex] = finalHeight
        }
        
        print("LOG: Calculated Heights per Chunk: \(chunkHeights)")
    }
    
    private func updateHeightForCurrentChunk() {
        if let height = chunkHeights[currentChunkIndex] {
            withAnimation(.easeInOut(duration: 0.3)) {
                self.maxPageHeight = height
            }
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
        
        if audioService.currentTime < 0.1 {
            activeWordIndex = 0
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
        // This overrides the '0' that happens when audioService resets.
        if let response = currentResponse,
           response.chunks.indices.contains(currentChunkIndex),
           let lastPage = response.chunks[currentChunkIndex].pages?.last,
           let lastWord = lastPage.words?.last {
            self.activeWordIndex = lastWord.index
        }
        
        // 2. 7-Second Delay before returning to Reader Mode
        DispatchQueue.main.asyncAfter(deadline: .now() + 7.0) {
            self.audioService.pause()
            self.audioService.seek(to: 0)
            
            withAnimation(.easeInOut(duration: 0.5)) {
                self.state = .reading
                self.currentChunkIndex = 0
                self.activeWordIndex = 0
            }
        }
    }
    
    func resetChunkState() {
        audioService.pause()
        audioService.seek(to: 0)
        activeWordIndex = 0
        
        withAnimation {
            state = .reading
        }
    }
}
