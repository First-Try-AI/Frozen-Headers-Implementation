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
                VStack(alignment: .leading, spacing: 4) {
                    Text("Attention, Retention, and Timing.")
                        .font(.system(size: 100, weight: .bold))
                        .minimumScaleFactor(0.01)
                        .lineLimit(1)
                        .foregroundColor(inputText.isEmpty ? Theme.accent : .white)
                        .opacity(inputText.isEmpty ? 1.0 : 0.8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                        .background(inputText.isEmpty ? Color.black : Color.clear)
                        .cornerRadius(8)
                        .shadow(
                            color: inputText.isEmpty ? .black.opacity(0.3) : .clear,
                            radius: 4, x: 0, y: 2
                        )
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 27)
                
                // 2. THE FORM
                Form {
                    Section {
                        ZStack(alignment: .topLeading) {
                            Color.clear
                                .frame(minHeight: 150, maxHeight: .infinity)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    isInputFocused = true
                                }
                            
                            TextField("Enter text to unlock knowledge...", text: $inputText, axis: .vertical)
                                .font(.body)
                                .focused($isInputFocused)
                                .frame(minHeight: 150)
                                .onChange(of: inputText) { newValue in
                                    if newValue.count > functionalLimit {
                                        inputText = String(newValue.prefix(functionalLimit))
                                    }
                                }
                        }
                        .listRowBackground(Color.black.opacity(0.2))
                        
                    } header: {
                        if inputText.isEmpty {
                            Text("Paste text.")
                                .foregroundColor(.white)
                                .opacity(0.75)
                        } else {
                            Button(action: {
                                onGenerate(inputText)
                            }) {
                                HStack(spacing: 6) {
                                    Text("Generate Audio")
                                        .fontWeight(.bold)
                                        .foregroundColor(Theme.accent)
                                    Image(systemName: "play.circle.fill")
                                        .foregroundColor(Theme.accent)
                                }
                                .padding(.vertical, 6)
                                .padding(.horizontal, 10)
                                .background(Color.black)
                                .cornerRadius(8)
                            }
                            .textCase(nil)
                            .font(.headline)
                        }
                    } footer: {
                        HStack {
                            Spacer()
                            Text("\(inputText.count) / \(functionalLimit)")
                                .foregroundColor(.gray)
                        }
                    }
                    
                    Section {
                        Button(action: {
                            // 2. Pass text to parent instead of calling API here
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
                                
                                Text("Generate Audio")
                                    .fontWeight(.bold)
                                    .foregroundColor(Theme.buttonText)
                            }
                            .frame(height: 50)
                        }
                        .disabled(inputText.isEmpty)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                    }
                }
                .scrollContentBackground(.hidden)
                .scrollDismissesKeyboard(.interactively)
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
        }
    }
}
