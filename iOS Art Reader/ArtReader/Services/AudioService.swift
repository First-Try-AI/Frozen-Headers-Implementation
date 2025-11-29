import Foundation
import AVFoundation
import Combine

class AudioService: ObservableObject {
    static let shared = AudioService()
    
    @Published var isPlaying: Bool = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var currentWordIndex: Int = 0
    @Published var isLoading: Bool = false
    
    private var player: AVPlayer?
    private var timeObserver: Any?
    
    // Play a remote URL
    func play(url: URL) {
        // Cleanup old observer
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
        
        let playerItem = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: playerItem)
        
        // UPDATED: Refresh time set to 100ms (0.1s) per your web dev experience
        let interval = CMTime(seconds: 0.1, preferredTimescale: 600)
        timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            self?.currentTime = time.seconds
        }
        
        // Listen for item duration
        Task {
            if let duration = try? await playerItem.asset.load(.duration) {
                DispatchQueue.main.async {
                    self.duration = duration.seconds
                }
            }
        }
        
        player?.play()
        isPlaying = true
    }
    
    func pause() {
        player?.pause()
        isPlaying = false
    }
    
    func seek(to time: Double) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime, toleranceBefore: .zero, toleranceAfter: .zero)
        
        // Update local state immediately for UI responsiveness
        self.currentTime = time
    }
    
    // Calculates simple 0.0 - 1.0 progress
    var progress: Double {
        guard duration > 0 else { return 0 }
        return currentTime / duration
    }
}
