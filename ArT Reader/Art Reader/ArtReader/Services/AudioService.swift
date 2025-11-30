import Foundation
import AVFoundation
import Combine

class AudioService: ObservableObject {
    static let shared = AudioService()
    
    // Publishers
    @Published var isPlaying: Bool = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var isLoading: Bool = false
    
    // Notification for SessionManager
    let didFinishPlaying = PassthroughSubject<Void, Never>()
    
    private var player: AVPlayer?
    private var timeObserver: Any?
    private var cancellables = Set<AnyCancellable>()
    
    // Track current URL to enable Resume
    private var currentURL: URL?
    
    // Caching
    private let fileManager = FileManager.default
    private lazy var cacheDirectory: URL = {
        let paths = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)
        let cacheDir = paths[0].appendingPathComponent("AudioCache")
        if !fileManager.fileExists(atPath: cacheDir.path) {
            try? fileManager.createDirectory(at: cacheDir, withIntermediateDirectories: true)
        }
        return cacheDir
    }()
    
    init() {
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("❌ [AudioService] Audio Session Error: \(error)")
        }
    }
    
    // MARK: - Playback Control
    
    func play(url: URL) {
        // RESUME LOGIC: If same URL and player exists, just play
        if let current = currentURL, current == url, let player = player {
            if player.timeControlStatus != .playing {
                player.play()
                isPlaying = true
            }
            return
        }
        
        Task { @MainActor in
            isLoading = true
            
            // 1. Resolve URL (Cache or Remote)
            let fileURL: URL
            if let cached = getCachedURL(for: url), fileManager.fileExists(atPath: cached.path) {
                // print("📂 [AudioService] Playing from cache: \(cached.lastPathComponent)")
                fileURL = cached
            } else {
                // print("⬇️ [AudioService] Downloading: \(url.lastPathComponent)")
                do {
                    fileURL = try await downloadAndCache(url: url)
                } catch {
                    // REMOVED: Streaming fallback.
                    // If download fails, we stop.
                    print("⚠️ [AudioService] Download failed: \(error)")
                    isLoading = false
                    return
                }
            }
            
            // 2. Setup Player
            setupPlayer(with: fileURL, originalURL: url)
            
            // 3. Play
            player?.play()
            isPlaying = true
            isLoading = false
        }
    }
    
    private func setupPlayer(with url: URL, originalURL: URL) {
        // Cleanup
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
        NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: nil)
        
        let item = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: item)
        currentURL = originalURL
        
        // Time Observer (High precision for Karaoke)
        let interval = CMTime(seconds: 0.05, preferredTimescale: 600)
        timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            self?.currentTime = time.seconds
            
            // Log occasionally (e.g. every second) to avoid spam
            if Int(time.seconds * 20) % 20 == 0 {
                print("LOG: Audio Playback Time: \(String(format: "%.2f", time.seconds))s")
            }
        }
        
        // End Notification
        NotificationCenter.default.addObserver(self, selector: #selector(playerDidFinishPlaying), name: .AVPlayerItemDidPlayToEndTime, object: item)
        
        // Duration
        Task {
            if let duration = try? await item.asset.load(.duration) {
                await MainActor.run {
                    self.duration = duration.seconds
                }
            }
        }
    }
    
    @objc private func playerDidFinishPlaying() {
        DispatchQueue.main.async {
            self.isPlaying = false
            self.currentTime = 0
            self.didFinishPlaying.send()
        }
    }
    
    func pause() {
        player?.pause()
        isPlaying = false
    }
    
    func seek(to time: Double) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime, toleranceBefore: .zero, toleranceAfter: .zero)
        currentTime = time
    }
    
    // MARK: - Caching Logic
    
    private func getCachedURL(for url: URL) -> URL? {
        let filename = url.lastPathComponent
        return cacheDirectory.appendingPathComponent(filename)
    }
    
    private func downloadAndCache(url: URL) async throws -> URL {
        let destination = cacheDirectory.appendingPathComponent(url.lastPathComponent)
        
        // If exists, return
        if fileManager.fileExists(atPath: destination.path) {
            return destination
        }
        
        let (tempURL, _) = try await URLSession.shared.download(from: url)
        try fileManager.moveItem(at: tempURL, to: destination)
        return destination
    }
    
    // Helper for Timestamps (if needed)
    func fetchTimestamps(url: URL) async throws -> Data {
        // We can cache JSON too
        if let cached = getCachedURL(for: url), fileManager.fileExists(atPath: cached.path) {
            return try Data(contentsOf: cached)
        }
        let destination = cacheDirectory.appendingPathComponent(url.lastPathComponent)
        let (tempURL, _) = try await URLSession.shared.download(from: url)
        try fileManager.moveItem(at: tempURL, to: destination)
        return try Data(contentsOf: destination)
    }
    
    var progress: Double {
        guard duration > 0 else { return 0 }
        return currentTime / duration
    }
}
