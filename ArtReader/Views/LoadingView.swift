import SwiftUI
import Combine

struct LoadingView: View {
    @State private var timeRemaining = 15
    @State private var currentStepText = "Smoothing timing."
    @State private var stepIndex = 0
    @State private var showExtendedWait = false
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    let steps: [(text: String, duration: Double)] = [
        ("Smoothing timing.", 2.0),
        ("Leveling gain.", 2.0),
        ("Lowering cognitive load.", 2.0),
        ("Reducing jitter.", 2.0),
        ("Reseting attention.", 2.0),
        ("Getting the speakers ready.", 2.0),
    ]
    
    var body: some View {
        // NEW: Use the Frozen Panel Layout
        FrozenPanelView {
            // SLOT 1: Header
            VStack(spacing: 0) {
                AppHeaderView(state: .inactive)
            }
            // CHANGED: Adjusted padding to match new spec:
            // 15pt (spacing) + 8pt (bar height) = 23pt total reservation
            .padding(.bottom, 23)
            // VISUAL FIX: Add material background to create true "Frozen" effect
            .background(.ultraThinMaterial)
        } content: {
            // SLOT 2: Scrollable Content
            ScrollView {
                VStack(spacing: 40) {
                    
                    // A. TIMER BLOCK
                    VStack(spacing: 8) {
                        Text(timerString)
                            .font(.system(size: 48, weight: .semibold))
                            .foregroundColor(Theme.accent)
                        
                        HStack(spacing: 6) {
                            Image(systemName: "timer")
                            Text("ESTIMATED TIME")
                        }
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(Theme.cardLabel)
                        .tracking(1.0)
                    }
                    
                    // B. LOADING MESSAGE
                    Text(currentStepText)
                        .font(.body)
                        .foregroundColor(Theme.accent)
                        .multilineTextAlignment(.center)
                        .frame(height: 40)
                        .transition(.opacity)
                        .id("stepText\(stepIndex)")
                }
                .padding(.vertical, 40)
                .padding(.horizontal, 20)
                .frame(maxWidth: .infinity)
                
                // CARD STYLING
                .background(Theme.overlayBackground)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Theme.overlayBorder, lineWidth: 1)
                )
                .padding(.horizontal, 16)
                .padding(.top, 10) // Consistent top spacing
            }
        }
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
