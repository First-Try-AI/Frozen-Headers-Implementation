import Foundation

// MARK: - Request Payload

struct AudioRequestPayload: Codable, Equatable {
    let userText: String
    let originalParams: OriginalParams
    let sessionId: String
    let customVoices: [String]
    let thresholds: Thresholds
}

struct OriginalParams: Codable, Equatable {
    let voiceGender: String
    let speakerMode: String
    let speed: Double
    let vlist: [String]
}

struct Thresholds: Codable, Equatable {
    let breakPauseFirst: Int
    let breakPauseSecond: Int
    let usePrimary: Bool
    let useSecondary: Bool
    
    static let defaults = Thresholds(
        breakPauseFirst: 100,
        breakPauseSecond: 70,
        usePrimary: true,
        useSecondary: false
    )
}

// MARK: - Response Payload

struct AudioResponse: Codable, Equatable {
    let success: Bool?
    let sessionId: String?
    let totalChunks: Int?
    let chunks: [AudioChunk]
    let summary: AudioSummary?
}

struct AudioChunk: Codable, Identifiable, Equatable {
    var id: Int { chunkIndex }
    
    let chunkIndex: Int
    let inputText: String?
    let originalText: String?
    let audioUrl: String
    let timestampsUrl: String?
    let letterTimestampsUrl: String?
    let wordCount: Int
    let totalDuration: Double
    let voiceUsed: String?
    let pagination: PaginationInfo?
    
    let pages: [ChunkPage]?
    let fullChunkDisplay: FullChunkDisplay?
}

struct AudioSummary: Codable, Equatable {
    let totalWords: Int
    let totalDuration: Double
    let totalPageBreaks: Int
}

struct PaginationInfo: Codable, Equatable {
    let totalBreaks: Int
    let totalWords: Int
    let totalPages: Int
}

// MARK: - Page Structures

struct ChunkPage: Codable, Equatable {
    let pageIndex: Int
    let startTime: Double
    let endTime: Double
    let wordCount: Int
    let words: [PageWord]?
    
    // Backend sends "startTime" and "endTime", so no CodingKeys needed.
}

struct PageWord: Codable, Equatable {
    let word: String
    let index: Int
    let startTime: Double
    let endTime: Double
    
    // Backend sends "start" and "end" (timestamp-module.js)
    enum CodingKeys: String, CodingKey {
        case word, index
        case startTime = "start"
        case endTime = "end"
    }
}

// MARK: - Display Elements

struct FullChunkDisplay: Codable, Equatable {
    let displayElements: [DisplayElement]
    let originalText: String
    let totalWords: Int
    let chunkIndex: Int
}

struct DisplayElement: Codable, Equatable {
    let type: String
    let content: String?
    let word: String?
    let startTime: Double?
    let endTime: Double?
    let wordIndex: Int?
    let bullet: String?
    let number: String?
    
    var text: String {
        return word ?? content ?? ""
    }
    
    // FIXED: Removed CodingKeys.
    // Backend sends "startTime" and "endTime" (index.js), so we must match them directly.
}

extension AudioChunk {
    var computedPages: [ChunkPage] {
        return pages ?? []
    }
}
