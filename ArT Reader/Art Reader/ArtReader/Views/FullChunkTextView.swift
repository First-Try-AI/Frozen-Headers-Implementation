import SwiftUI
import UIKit

struct FullChunkTextView: UIViewRepresentable {
    let chunk: AudioChunk
    let width: CGFloat
    @Binding var selectedPageIndex: Int
    let onCueRequest: (Double) -> Void
    
    // MARK: - Internal Subclass
    class DynamicTextView: UITextView {
        
        override init(frame: CGRect, textContainer: NSTextContainer?) {
            super.init(frame: frame, textContainer: textContainer)
        }
        
        required init?(coder: NSCoder) {
            fatalError("init(coder:) has not been implemented")
        }
        
        override func layoutSubviews() {
            super.layoutSubviews()
            
            // Fallback: If bounds are somehow different from expected width
            let targetWidth = bounds.width - (textContainerInset.left + textContainerInset.right)
            if targetWidth > 0 && abs(textContainer.size.width - targetWidth) > 0.5 {
                textContainer.size.width = targetWidth
                invalidateIntrinsicContentSize()
            }
        }
        
        override var intrinsicContentSize: CGSize {
            // Calculate height based on content
            layoutManager.ensureLayout(for: textContainer)
            let usedRect = layoutManager.usedRect(for: textContainer)
            let totalHeight = usedRect.height + textContainerInset.top + textContainerInset.bottom
            return CGSize(width: UIView.noIntrinsicMetric, height: totalHeight)
        }
    }
    
    // MARK: - UIViewRepresentable
    func makeUIView(context: Context) -> UITextView {
        // 3. THE FIX: Explicitly opt-out of TextKit 2 (usingTextLayoutManager: false)
        let textView = DynamicTextView(usingTextLayoutManager: false)
        
        textView.isEditable = false
        textView.backgroundColor = .clear
        
        // DISABLE SCROLLING to allow intrinsic sizing
        textView.isScrollEnabled = false
        textView.showsVerticalScrollIndicator = false
        
        // CRITICAL FIX: Explicitly tell TextKit it has infinite height to calculate layout immediately.
        // This prevents the "0 height" initial render bug.
        textView.textContainer.heightTracksTextView = false
        textView.textContainer.size.height = .greatestFiniteMagnitude
        
        textView.textContainer.widthTracksTextView = true
        textView.textContainer.lineBreakMode = .byWordWrapping
        // Adjusted bottom inset to ensure last line is visible above corner radius/border if needed
        textView.textContainerInset = UIEdgeInsets(top: 20, left: 20, bottom: 40, right: 20)
        
        // Ensure the view resists collapsing
        textView.setContentCompressionResistancePriority(.required, for: .vertical)
        
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        tap.cancelsTouchesInView = false // Ensure touches pass through if needed
        textView.addGestureRecognizer(tap)
        
        context.coordinator.textView = textView
        return textView
    }

    func updateUIView(_ uiView: UITextView, context: Context) {
        context.coordinator.parent = self

        // 1. Proactively set width if available to ensure correct calculation immediately
        let targetWidth = width - (uiView.textContainerInset.left + uiView.textContainerInset.right)
        if targetWidth > 0 && abs(uiView.textContainer.size.width - targetWidth) > 0.5 {
             uiView.textContainer.size.width = targetWidth
        }

        if context.coordinator.currentChunkID != chunk.chunkIndex {
            uiView.attributedText = buildAttributedText(from: chunk)
            context.coordinator.currentChunkID = chunk.chunkIndex
            
            // Force layout update when text changes
            // This order is important: 
            // 1. setNeedsLayout marks that layoutSubviews should run (which invalidates intrinsic size)
            // 2. layoutIfNeeded forces that to happen NOW, ensuring width is correct
            // 3. invalidateIntrinsicContentSize triggers SwiftUI to read the new size
            uiView.setNeedsLayout()
            uiView.layoutIfNeeded()
        }
        
        // Always invalidate intrinsic content size to ensure SwiftUI gets the latest height
        uiView.invalidateIntrinsicContentSize()
        
        context.coordinator.applyPageSelection(in: uiView, selectedPage: selectedPageIndex)
    }
    
    private func buildAttributedText(from chunk: AudioChunk) -> NSAttributedString {
        guard let fullDisplay = chunk.fullChunkDisplay,
              let pages = chunk.pages else {
            return NSAttributedString(string: chunk.originalText ?? "Loading...", attributes: [
                .font: UIFont.systemFont(ofSize: 20),
                .foregroundColor: UIColor.white
            ])
        }
        
        let finalString = NSMutableAttributedString()
        let baseFont = UIFont.systemFont(ofSize: 22, weight: .regular)
        let baseColor = UIColor.white.withAlphaComponent(0.8)
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.lineHeightMultiple = 1.3
        paragraphStyle.paragraphSpacing = 16
        paragraphStyle.lineBreakMode = .byWordWrapping
        
        func getPageInfo(for wordIdx: Int) -> (index: Int, startTime: Double) {
            if let page = pages.first(where: { page in
                guard let words = page.words, let first = words.first?.index, let last = words.last?.index else { return false }
                return wordIdx >= first && wordIdx <= last
            }) {
                return (page.pageIndex, page.startTime)
            }
            return (0, 0)
        }
        
        for element in fullDisplay.displayElements {
            var attrs: [NSAttributedString.Key: Any] = [
                .font: baseFont,
                .foregroundColor: baseColor,
                .paragraphStyle: paragraphStyle
            ]
            
            if let wordIdx = element.wordIndex {
                let info = getPageInfo(for: wordIdx)
                attrs[.pageIndex] = info.index
                attrs[.pageCueTime] = info.startTime
            }
            
            if let word = element.word {
                finalString.append(NSAttributedString(string: word + " ", attributes: attrs))
            } else if element.type == "paragraph-break" {
                finalString.append(NSAttributedString(string: "\n", attributes: attrs))
            } else if element.type == "line-break" {
                finalString.append(NSAttributedString(string: "\n", attributes: attrs))
            } else if element.type == "bullet-item" {
                let bulletStyle = NSMutableParagraphStyle()
                bulletStyle.lineHeightMultiple = 1.3
                bulletStyle.headIndent = 20
                bulletStyle.firstLineHeadIndent = 0
                bulletStyle.lineBreakMode = .byWordWrapping
                attrs[.paragraphStyle] = bulletStyle
                let bulletStr = (element.bullet ?? "•") + " " + (element.content ?? "") + "\n"
                finalString.append(NSAttributedString(string: bulletStr, attributes: attrs))
            } else if element.type == "numbered-item" {
                let numStyle = NSMutableParagraphStyle()
                numStyle.lineHeightMultiple = 1.3
                numStyle.headIndent = 25
                numStyle.lineBreakMode = .byWordWrapping
                attrs[.paragraphStyle] = numStyle
                let numStr = (element.number ?? "1.") + " " + (element.content ?? "") + "\n"
                finalString.append(NSAttributedString(string: numStr, attributes: attrs))
            }
        }
        return finalString
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject {
        var parent: FullChunkTextView
        weak var textView: UITextView?
        var currentChunkID: Int = -1
        
        init(_ parent: FullChunkTextView) {
            self.parent = parent
        }
        
        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let textView = textView else { return }
            let location = gesture.location(in: textView)
            let layoutManager = textView.layoutManager
            let charIndex = layoutManager.characterIndex(for: location, in: textView.textContainer, fractionOfDistanceBetweenInsertionPoints: nil)
            
            if charIndex < textView.textStorage.length {
                let attributes = textView.textStorage.attributes(at: charIndex, effectiveRange: nil)
                
                if let pageIndex = attributes[.pageIndex] as? Int,
                   let cueTime = attributes[.pageCueTime] as? Double {
                    parent.selectedPageIndex = pageIndex
                    parent.onCueRequest(cueTime)
                }
            }
        }
        
        func applyPageSelection(in textView: UITextView, selectedPage: Int) {
            let storage = textView.textStorage
            let fullRange = NSRange(location: 0, length: storage.length)
            storage.beginEditing()
            storage.enumerateAttribute(.pageIndex, in: fullRange) { value, range, _ in
                guard let pageIdx = value as? Int else { return }
                if pageIdx == selectedPage {
                    storage.addAttribute(.foregroundColor, value: UIColor.white, range: range)
                    storage.addAttribute(.backgroundColor, value: UIColor.black, range: range)
                } else {
                    storage.addAttribute(.foregroundColor, value: UIColor.white.withAlphaComponent(0.6), range: range)
                    storage.removeAttribute(.backgroundColor, range: range)
                }
            }
            storage.endEditing()
        }
    }
}

extension NSAttributedString.Key {
    static let pageIndex = NSAttributedString.Key("pageIndex")
    static let pageCueTime = NSAttributedString.Key("pageCueTime")
}
