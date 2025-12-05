import SwiftUI

struct InputView: View {
    var onGenerate: (String) -> Void
    
    @State private var inputText: String = ""
    @FocusState private var isInputFocused: Bool
    @State private var contentHeight: CGFloat = 0
    @State private var scrollPosition: CGFloat = 0
    
    let functionalLimit = 13000
    let minWindowHeight: CGFloat = 350
    let maxWindowHeight: CGFloat = 400
    
    var currentWindowHeight: CGFloat {
        if inputText.isEmpty { return minWindowHeight }
        return min(max(contentHeight, minWindowHeight), maxWindowHeight)
    }
    
    var body: some View {
        FrozenPanelView {
            StandardFrozenHeader(
                state: inputText.isEmpty ? .active : .inactive,
                bottomContent: {
                    Color.clear.frame(height: StandardFrozenHeaderConfig.navContentHeight)
                },
                headerOverlay: { EmptyView() }
            )
            .animation(.easeInOut(duration: 0.5), value: inputText.isEmpty)
        } content: {
            VStack(spacing: 0) {
                VStack(spacing: 30) {
                    
                    // INPUT SECTION
                    VStack(alignment: .leading, spacing: 0) {
                        ZStack(alignment: .topLeading) {
                            ScrollView(showsIndicators: false) {
                                ZStack(alignment: .topLeading) {
                                    Color.clear
                                        .contentShape(Rectangle())
                                        .onTapGesture { isInputFocused = true }
                                    
                                    if inputText.isEmpty && !isInputFocused {
                                        Text("Enter text to unlock knowledge...")
                                            .foregroundColor(.white)
                                            .opacity(1.0)
                                            .multilineTextAlignment(.center)
                                            .frame(maxWidth: .infinity, minHeight: minWindowHeight, alignment: .center)
                                            .padding(.horizontal, 20)
                                            .allowsHitTesting(false)
                                    }
                                    
                                    TextField("", text: $inputText, axis: .vertical)
                                        .font(.body)
                                        .foregroundColor(Theme.text)
                                        .focused($isInputFocused)
                                        .tint(Theme.accent)
                                        .multilineTextAlignment(.leading)
                                        .padding(.horizontal, 10)
                                        .padding(.top, 8)
                                        .background(
                                            GeometryReader { geo in
                                                Color.clear
                                                    .onAppear { self.contentHeight = geo.size.height }
                                                    .onChange(of: geo.size.height) { _, newHeight in
                                                        self.contentHeight = newHeight
                                                    }
                                            }
                                        )
                                        .onChange(of: inputText) { _, newValue in
                                            if newValue.count > functionalLimit {
                                                inputText = String(newValue.prefix(functionalLimit))
                                            }
                                        }
                                    
                                    GeometryReader { geo in
                                        Color.clear.preference(key: ScrollOffsetKey.self, value: geo.frame(in: .named("InputScrollArea")).minY)
                                    }
                                }
                                .frame(minHeight: currentWindowHeight)
                            }
                            .coordinateSpace(name: "InputScrollArea")
                            .frame(height: currentWindowHeight)
                            .onPreferenceChange(ScrollOffsetKey.self) { value in self.scrollPosition = value }
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
                        .background(Color.black.opacity(isInputFocused ? 0.3 : 0.2))
                        .animation(.easeInOut(duration: 0.2), value: isInputFocused)
                        .cornerRadius(12)
                        .padding(.top, 10)
                        
                        HStack {
                            Spacer()
                            Text("\(inputText.count) / \(functionalLimit)")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    
                    // BUTTON SECTION
                    Button(action: { onGenerate(inputText) }) {
                        Text("Generate Audio")
                    }
                    .buttonStyle(PrimaryLargeButtonStyle()) // <--- SHARED STYLE
                    .disabled(inputText.isEmpty)
                    .animation(.easeInOut(duration: 0.5), value: inputText.isEmpty)
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, 20)
                
                Spacer()
            }
        }
        .contentShape(Rectangle())
        .onTapGesture { isInputFocused = false }
        .background(
            Image("AppBackground").resizable().aspectRatio(contentMode: .fill).ignoresSafeArea()
        )
        .preferredColorScheme(.dark)
        .tint(Theme.accent)
        .toolbar(.hidden, for: .navigationBar)
    }
}

struct ScrollOffsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}
