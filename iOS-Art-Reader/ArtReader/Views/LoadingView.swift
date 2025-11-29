import SwiftUI
import Combine

struct LoadingView: View {
    @State private var timeRemaining = 15
    @State private var currentStepText = "Smoothing timing so words land naturally."
    @State private var stepIndex = 0
    @State private var showExtendedWait = false
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    let steps: [(text: String, duration: Double)] = [
        ("Smoothing timing so words land naturally.", 2.0),
        ("Leveling gain for calm, even loudness.", 2.0),
        ("Steadying stress patterns for easier follow.", 2.0),
        ("Reducing jitter and shimmer artifacts.", 2.0),
        ("Placing micro‑pauses to reset attention.", 2.0),
        ("Balancing sibilants and plosives for clarity.", 2.0),
        ("Aligning breaths and sentence endings.", 2.0),
        ("Final polish and handoff.", 1.0)
    ]
    
    var body: some View {
        VStack(spacing: 0) {
            
            // 1. HEADER
            AppHeaderView(isActive: true)
            
            // 2. SCROLLABLE CARD CONTENT
            ScrollView {
                VStack(spacing: 40) {
                    
                    // A. LOADING MESSAGE (Moved to Top)
                    Text(currentStepText)
                        .font(.body)
                        .foregroundColor(Theme.accent)
                        .multilineTextAlignment(.center)
                        .frame(height: 40)
                        .transition(.opacity)
                        .id("stepText\(stepIndex)")
                    
                    // B. TIMER BLOCK (Moved Below)
                    VStack(spacing: 8) {
                        
                        // 1. The Time Digits
                        Text(timerString)
                            .font(.system(size: 48, weight: .semibold))
                            .foregroundColor(Theme.accent)
                        
                        // 2. The Label
                        HStack(spacing: 6) {
                            Image(systemName: "timer")
                            Text("ESTIMATED TIME")
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(Theme.cardLabel)
                        .tracking(1.0)
                    }
                }
                .padding(.vertical, 40)
                .padding(.horizontal, 20)
                // FIXED: Force the stack to fill the available width
                .frame(maxWidth: .infinity)
                
                // --- THE "OVERLAY" STYLING ---
                .background(Theme.overlayBackground)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Theme.overlayBorder, lineWidth: 1)
                )
                // -----------------------------
                .padding(.horizontal, 16)
                .padding(.top, 10)
            }
        }
        .ignoresSafeArea(edges: .top)
        .onAppear {
            runScriptedSteps()
        }
        .onReceive(timer) { _ in
            if timeRemaining > 0 {
                timeRemaining -= 1
            } else {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    showExtendedWait = true
                }
            }
        }
    }
    
    var timerString: String {
        if showExtendedWait {
            return "…few more seconds"
        }
        return String(format: "00:%02d", timeRemaining)
    }
    
    func runScriptedSteps() {
        guard stepIndex < steps.count else { return }
        let currentStep = steps[stepIndex]
        currentStepText = currentStep.text
        
        DispatchQueue.main.asyncAfter(deadline: .now() + currentStep.duration) {
            if stepIndex < steps.count - 1 {
                withAnimation(.easeInOut(duration: 0.3)) {
                    stepIndex += 1
                }
                runScriptedSteps()
            }
        }
    }
}
