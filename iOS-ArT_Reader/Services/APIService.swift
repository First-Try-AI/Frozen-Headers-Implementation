import Foundation
import Combine

class APIService: ObservableObject {
    static let shared = APIService()
    
    // Ensure this URL is correct and accessible from your device/simulator
    private let endpointURL = URL(string: "https://new-synth-service-pyh6ygakfa-uc.a.run.app/process-input")!
    
    func generateAudio(text: String) async throws -> AudioResponse {
        // Logging cleaned up per request
        // print("🚀 [APIService] Starting generation...")
        
        let cleanedText = cleanText(text)
        
        let payload = createPayload(text: cleanedText)
        
        var request = URLRequest(url: endpointURL)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        
        let encoder = JSONEncoder()
        
        do {
            let requestData = try encoder.encode(payload)
            request.httpBody = requestData
        } catch {
            // print("❌ [APIService] Encoding Error: \(error)")
            throw error
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse {
            guard httpResponse.statusCode == 200 else {
                // print("❌ [APIService] Server Error (Status \(httpResponse.statusCode))")
                throw URLError(.badServerResponse)
            }
        }
        
        let decoder = JSONDecoder()
        
        do {
            let result = try decoder.decode(AudioResponse.self, from: data)
            // print("✅ [APIService] Decoding Success! Session: \(result.sessionId ?? "Unknown")")
            return result
        } catch {
            // print("❌ [APIService] Decoding Error: \(error)")
            throw error
        }
    }
    
    // MARK: - Text Cleaning
    private func cleanText(_ input: String) -> String {
        var text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        text = text.replacingOccurrences(of: "\\*+", with: "", options: .regularExpression)
        text = text.replacingOccurrences(of: "\\[\\d+ tools? called\\]", with: "", options: .regularExpression)
        text = text.replacingOccurrences(of: "##([^\\s#])", with: "## $1", options: .regularExpression)
        text = text.replacingOccurrences(of: "##\\s+(.+?)(\\n|$)", with: "$1.$2", options: .regularExpression)
        text = text.replacingOccurrences(of: "##", with: "")
        text = text.replacingOccurrences(of: "\\{[^}]*\\}\\[emdash\\]\\{[^}]*\\}", with: " — ", options: .regularExpression)
        text = text.replacingOccurrences(of: "\\n\\s*\\n\\s*\\n", with: "\n\n", options: .regularExpression)
        text = text.replacingOccurrences(of: "([a-zA-Z])(\\s*)(\\n|$)", with: "$1.$3", options: .regularExpression)
        return text
    }
    
    private func createPayload(text: String) -> AudioRequestPayload {
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        let sessionId = "iOS-\(timestamp)"
        
        return AudioRequestPayload(
            userText: text,
            originalParams: OriginalParams(
                voiceGender: "shuffled",
                speakerMode: "readingRainbow",
                speed: 0.9,
                vlist: []
            ),
            sessionId: sessionId,
            customVoices: [],
            thresholds: Thresholds.defaults
        )
    }
}
