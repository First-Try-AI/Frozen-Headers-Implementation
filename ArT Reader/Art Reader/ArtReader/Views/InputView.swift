import SwiftUI

struct InputView: View {
    // 1. Accepts a function from the parent (ContentView)
    var onGenerate: (String) -> Void
    
    @State private var inputText: String = ""
    @FocusState private var isInputFocused: Bool
    
    // Limits
    let functionalLimit = 13000
    
    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 0) {
                
                // 1. CUSTOM APP TITLE BLOCK
                // AppHeaderView has 60pt top padding. We ensure this VStack ignores safe area top
                // so the 60pt is from the absolute top of the screen.
                AppHeaderView(isActive: !inputText.isEmpty)
                
                // 2. THE FORM / TEXT EDITOR
                // We use a ZStack to create the "Expandable" feeling
                ZStack(alignment: .topLeading) {
                    
                    if inputText.isEmpty {
                        // Placeholder Text (Mimicking the "Paste text here" request, but implicit)
                        Text("Paste text here...")
                            .foregroundColor(.white.opacity(0.5))
                            .padding(.top, 8) // Match TextField padding if possible
                            .padding(.leading, 5)
                            .allowsHitTesting(false)
                    }
                    
                    TextEditor(text: $inputText)
                        .font(.body)
                        .focused($isInputFocused)
                        .scrollContentBackground(.hidden) // Remove default gray background
                        .background(Color.clear)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .onChange(of: inputText) { _, newValue in
                            if newValue.count > functionalLimit {
                                inputText = String(newValue.prefix(functionalLimit))
                            }
                        }
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                
                // Character Count Overlay (Bottom Right of the input area)
                HStack {
                    Spacer()
                    Text("\(inputText.count) / \(functionalLimit)")
                        .foregroundColor(.gray)
                        .font(.caption)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 10)
                
                // 3. GENERATE AUDIO BUTTON (Moved to Bottom)
                if !inputText.isEmpty {
                    Button(action: {
                        // Dismiss keyboard first
                        isInputFocused = false
                        onGenerate(inputText)
                    }) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(
                                    LinearGradient(
                                        gradient: Gradient(colors: [Theme.accent, Theme.accentGoldEnd]),
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Theme.accentBorderGold, lineWidth: 2)
                            
                            HStack(spacing: 8) {
                                Text("Generate Audio")
                                    .fontWeight(.bold)
                                Image(systemName: "play.circle.fill")
                            }
                            .foregroundColor(Theme.buttonText)
                        }
                        .frame(height: 50)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30) // Bottom padding for button
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .background(
                Image("AppBackground")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
            )
            .preferredColorScheme(.dark)
            .tint(Theme.accent)
            .toolbar(.hidden, for: .navigationBar)
            .onAppear {
                print("LOG: InputView appeared")
            }
        }
    }
}
