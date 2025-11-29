import SwiftUI

// High-level states for the application flow
// Now conforms to Equatable because AudioResponse is Equatable
enum AppPhase: Equatable {
    case input
    case loading
    case reader(AudioResponse) // Carries the data to the next view
}

struct ContentView: View {
    @StateObject private var audioService = AudioService()
    @State private var appPhase: AppPhase = .input
    
    // Diagnostic State
    @State private var errorMessage: String?
    @State private var showError: Bool = false
    
    var body: some View {
        ZStack {
            // Global Background
            Image("AppBackground")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .ignoresSafeArea()
            
            // State Switching
            switch appPhase {
            case .input:
                // NOTE: InputView needs to accept this closure.
                // If you get an error here, you need to update InputView to accept 'onGenerate'.
                InputView(onGenerate: handleGeneration)
                    .transition(.opacity)
                
            case .loading:
                LoadingView()
                    .transition(.opacity)
                
            case .reader(let response):
                ReaderView(response: response, audioService: audioService)
                    .transition(.move(edge: .trailing))
            }
        }
        .animation(.easeInOut(duration: 0.5), value: appPhase)
        // ERROR ALERT: Displays why the return failed
        .alert("Generation Failed", isPresented: $showError, actions: {
            Button("OK", role: .cancel) { }
        }, message: {
            Text(errorMessage ?? "An unknown error occurred.")
        })
    }
    
    // The "Bridge" Function
    func handleGeneration(text: String) {
        // 1. Immediate UI update
        withAnimation {
            appPhase = .loading
        }
        
        // 2. Perform Network Request
        Task {
            do {
                let response = try await APIService.shared.generateAudio(text: text)
                
                // 3. Success: Move to Reader
                DispatchQueue.main.async {
                    withAnimation {
                        appPhase = .reader(response)
                    }
                }
            } catch {
                print("Error: \(error)")
                
                // 4. Failure: Capture error, show alert, go back
                DispatchQueue.main.async {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                    
                    withAnimation {
                        appPhase = .input
                    }
                }
            }
        }
    }
}
