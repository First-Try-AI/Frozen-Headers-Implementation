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
            // USES THE NEW FROZEN PANEL LAYOUT
            FrozenPanelView {
                // SLOT 1: Header (Frozen)
                AppHeaderView(state: inputText.isEmpty ? .active : .inactive)
                    .animation(.easeInOut(duration: 0.5), value: inputText.isEmpty)
            } content: {
                // SLOT 2: Content (Scrollable)
                VStack(spacing: 30) {
                    
                    // INPUT SECTION
                    VStack(alignment: .leading, spacing: 0) {
                        
                        // Input Container
                        ZStack(alignment: .topLeading) {
                            ScrollView(showsIndicators: false) {
                                // Content ZStack
                                ZStack(alignment: .topLeading) {
                                    Color.clear
                                        .contentShape(Rectangle())
                                        .onTapGesture { isInputFocused = true }
                                    
                                    // 1. CUSTOM PLACEHOLDER
                                    if inputText.isEmpty && !isInputFocused {
                                        Text("Enter text to unlock knowledge...")
                                            .foregroundColor(.white)
                                            .opacity(1.0)
                                            .multilineTextAlignment(.center)
                                            .frame(maxWidth: .infinity, minHeight: minWindowHeight, alignment: .center)
                                            .padding(.horizontal, 20)
                                            .allowsHitTesting(false)
                                    }
                                    
                                    // 2. THE INPUT FIELD
                                    TextField("", text: $inputText, axis: .vertical)
                                        .font(.body)
                                        .foregroundColor(Theme.text)
                                        .focused($isInputFocused)
                                        .tint(Theme.accent)
                                        .multilineTextAlignment(.leading)
                                        .padding(.horizontal, 10)
                                        .padding(.top, 8)
                                        // FIXED: Replaced "return Color.clear" with standard onChange
                                        .background(
                                            GeometryReader { geo in
                                                Color.clear
                                                    .onAppear { self.contentHeight = geo.size.height }
                                                    .onChange(of: geo.size.height) { newHeight in
                                                        self.contentHeight = newHeight
                                                    }
                                            }
                                        )
                                        .onChange(of: inputText) { newValue in
                                            if newValue.count > functionalLimit {
                                                inputText = String(newValue.prefix(functionalLimit))
                                            }
                                        }
                                    
                                    // Scroll offset reader
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
                            
                            // SCROLL BAR LOGIC
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
                        .background(Color.black.opacity(isInputFocused ? 0.3 : 0.2))
                        .animation(.easeInOut(duration: 0.2), value: isInputFocused)
                        .cornerRadius(12)
                        .padding(.top, 10) // Space for the frozen header
                        
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
                        .buttonStyle(ArTButtonStyle())
                        .disabled(inputText.isEmpty)
                        .animation(.easeInOut(duration: 0.5), value: inputText.isEmpty)
                        .frame(width: geometry.size.width * 0.75)
                        .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                    }
                    .frame(height: 50)
                }
                .padding(.horizontal, 20)
                
                Spacer()
            }
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

// FIXED: Added the missing Key struct
struct ScrollOffsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}
