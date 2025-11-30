import SwiftUI

struct ContentView: View {
    @StateObject private var sessionManager = SessionManager()
    
    // Alert Binding Helper
    private var isErrorPresented: Binding<Bool> {
        Binding(
            get: { sessionManager.errorMessage != nil },
            set: { if !$0 { sessionManager.errorMessage = nil } }
        )
    }
    
    var body: some View {
        ZStack {
            // Global Background
            Image("AppBackground")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .ignoresSafeArea()
            
            // State Switching
            switch sessionManager.state {
            case .writing:
                InputView(onGenerate: sessionManager.submit)
                    .transition(.opacity)
                
            case .processing:
                LoadingView()
                    .transition(.opacity)
                
            case .reading, .listening:
                // We pass the entire manager because ReaderView needs access to 
                // state, audio, response, and playback controls.
                if sessionManager.currentResponse != nil {
                     ReaderView(sessionManager: sessionManager)
                        .transition(.move(edge: .trailing))
                } else {
                    // Fallback should rarely happen if logic is correct
                    LoadingView()
                }
            }
        }
        .animation(.easeInOut(duration: 0.5), value: sessionManager.state)
        // ERROR ALERT
        .alert("Generation Failed", isPresented: isErrorPresented, actions: {
            Button("OK", role: .cancel) {
                sessionManager.reset()
            }
        }, message: {
            Text(sessionManager.errorMessage ?? "An unknown error occurred.")
        })
    }
}
