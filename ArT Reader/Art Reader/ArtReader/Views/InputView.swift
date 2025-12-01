import SwiftUI

struct InputView: View {
    var onGenerate: (String) -> Void
    
    @State private var inputText: String = ""
    @FocusState private var isInputFocused: Bool
    
    // SCROLL TRACKING STATE
    @State private var contentHeight: CGFloat = 0
    @State private var scrollPosition: CGFloat = 0
    
    // Limits
    let functionalLimit = 13000
    // Layout Constants
    let minWindowHeight: CGFloat = 150
    let maxWindowHeight: CGFloat = 400
    
    var currentWindowHeight: CGFloat {
        if inputText.isEmpty { return minWindowHeight }
        return min(max(contentHeight, minWindowHeight), maxWindowHeight)
    }
    
    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 0) {
                
                // 1. DYNAMIC HEADER
                // Logic: Active (Gold) when empty, Inactive (White) when user is working
                AppHeaderView(state: inputText.isEmpty ? .active : .inactive)
                    .animation(.easeInOut(duration: 0.5), value: inputText.isEmpty) // Smooth Transition
                
                // 2. STATIC CONTENT STACK
                VStack(spacing: 30) {
                    
                    // INPUT SECTION
                    VStack(alignment: .leading, spacing: 8) {
                        
                        Text("Paste text.")
                            .foregroundColor(.white)
                            .opacity(inputText.isEmpty ? 1.0 : 0.2)
                            .animation(.easeInOut(duration: 0.3), value: inputText.isEmpty)
                        
                        // Input Container
                        ZStack(alignment: .topLeading) {
                            ScrollView(showsIndicators: false) {
                                ZStack(alignment: .leading) {
                                    Color.clear
                                        .contentShape(Rectangle())
                                        .onTapGesture { isInputFocused = true }
                                    
                                    TextField("Enter text to unlock knowledge...", text: $inputText, axis: .vertical)
                                        .font(.body)
                                        .focused($isInputFocused)
                                        .multilineTextAlignment(.leading)
                                        .padding(.horizontal, 10)
                                        .background(
                                            GeometryReader { geo -> Color in
                                                DispatchQueue.main.async {
                                                    self.contentHeight = geo.size.height
                                                }
                                                return Color.clear
                                            }
                                        )
                                        .onChange(of: inputText) { newValue in
                                            if newValue.count > functionalLimit {
                                                inputText = String(newValue.prefix(functionalLimit))
                                            }
                                        }
                                    
                                    GeometryReader { geo in
                                        Color.clear
                                            .preference(
                                                key: ScrollOffsetKey.self,
                                                value: geo.frame(in: .named("InputScrollArea")).minY
                                            )
                                    }
                                }
                                .frame(minHeight: currentWindowHeight)
                            }
                            .coordinateSpace(name: "InputScrollArea")
                            .frame(height: currentWindowHeight)
                            .onPreferenceChange(ScrollOffsetKey.self) { value in
                                self.scrollPosition = value
                            }
                            .scrollDismissesKeyboard(.interactively)
                            
                            if contentHeight > maxWindowHeight {
                                let trackHeight = currentWindowHeight
                                let visibleRatio = maxWindowHeight / contentHeight
                                let thumbHeight = max(30, trackHeight * visibleRatio)
                                let scrollRatio = -scrollPosition / (contentHeight - maxWindowHeight)
                                let thumbOffset = max(0, min(trackHeight - thumbHeight, (trackHeight - thumbHeight) * scrollRatio))
                                
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(Theme.accent)
                                    .frame(width: 2, height: thumbHeight)
                                    .offset(y: thumbOffset)
                                    .padding(.leading, 2)
                            }
                        }
                        .padding(15)
                        .background(Color.black.opacity(0.2))
                        .cornerRadius(12)
                        
                        HStack {
                            Spacer()
                            Text("\(inputText.count) / \(functionalLimit)")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    
                    // BUTTON SECTION
                    GeometryReader { geometry in
                        Button(action: {
                            onGenerate(inputText)
                        }) {
                            Text("Generate Audio")
                        }
                        .buttonStyle(ArTButtonStyle()) // Uses Theme.swift logic
                        .disabled(inputText.isEmpty) // Triggers Inactive State in Theme
                        .animation(.easeInOut(duration: 0.5), value: inputText.isEmpty) // Smooth Transition for Button
                        .frame(width: geometry.size.width * 0.75)
                        .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                    }
                    .frame(height: 50)
                }
                .padding(.horizontal, 20)
                
                Spacer()
            }
            .ignoresSafeArea(edges: .top)
            .contentShape(Rectangle())
            .onTapGesture { isInputFocused = false }
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

struct ScrollOffsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}
