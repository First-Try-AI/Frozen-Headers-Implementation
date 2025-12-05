import SwiftUI
import UIKit

struct FullChunkTextView: UIViewRepresentable {
    let chunk: AudioChunk
    let width: CGFloat
    @Binding var selectedPageIndex: Int
    @Binding var dynamicHeight: CGFloat
    let onCueRequest: (Double) -> Void
    
    // MARK: - Internal Subclass
    class DynamicTextView: UITextView {
        var onHeightChange: ((CGFloat) -> Void)?
        var expectedWidth: CGFloat = 0 {
            didSet {
                // If width changes, force a container update immediately
                if expectedWidth > 0 && abs(textContainer.size.width - expectedWidth) > 0.5 {
                    textContainer.size.width = expectedWidth
                    invalidateIntrinsicContentSize()
                }
            }
        }
        
        override var intrinsicContentSize: CGSize {
            // 1. Force Width Stability
            if expectedWidth > 0 {
                textContainer.size.width = expectedWidth
            }
            
            // 2. Calculate Height
            layoutManager.ensureLayout(for: textContainer)
            let usedRect = layoutManager.usedRect(for: textContainer)
            
            // 3. CONSOLIDATED HEIGHT CALCULATION
            // The extra space is now fully handled by textContainerInset.bottom
            let totalHeight = usedRect.height + textContainerInset.top + textContainerInset.bottom
            
            return CGSize(width: UIView.noIntrinsicMetric, height: totalHeight)
        }
        
        override func layoutSubviews() {
            super.layoutSubviews()
            
            // Trigger height calculation
            let size = self.intrinsicContentSize
            
            if let onHeightChange = onHeightChange {
                onHeightChange(size.height)
            }
        }
    }
    
    // MARK: - UIViewRepresentable
    func makeUIView(context: Context) -> UITextView {
        // NOTE: usingTextLayoutManager: false ensures compatibility with TextKit 1
        let textView = DynamicTextView(usingTextLayoutManager: false)
        
        textView.isEditable = false
        textView.backgroundColor = .clear
        textView.isScrollEnabled = false
        textView.showsVerticalScrollIndicator = false
        
        // Initial Width Setup
        textView.expectedWidth = width - 40
        
        textView.textContainer.heightTracksTextView = false
        textView.textContainer.size.height = .greatestFiniteMagnitude
        textView.textContainer.widthTracksTextView = false
        textView.textContainer.lineBreakMode = .byWordWrapping
        
        // CONSOLIDATED PADDING:
        // Top: 20
        // Bottom: 20 (Reduced from 35 per request)
        textView.textContainerInset = UIEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
        
        textView.setContentCompressionResistancePriority(.required, for: .vertical)
        textView.setContentHuggingPriority(.required, for: .vertical)
        
        // Debounced Height Reporting
        textView.onHeightChange = { newHeight in
            if newHeight > 30 {
                DispatchQueue.main.async {
                    if abs(self.dynamicHeight - newHeight) > 1.0 {
                        self.dynamicHeight = newHeight
                    }
                }
            }
        }
        
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        tap.cancelsTouchesInView = false
        textView.addGestureRecognizer(tap)
        
        context.coordinator.textView = textView
        return textView
    }

    func updateUIView(_ uiView: UITextView, context: Context) {
        guard let dynamicView = uiView as? DynamicTextView else { return }
        context.coordinator.parent = self

        // 1. UPDATE WIDTH
        let contentWidth = width - (uiView.textContainerInset.left + uiView.textContainerInset.right)
        
        if contentWidth > 0 {
            dynamicView.expectedWidth = contentWidth
        }

        // 2. Update Content
        if context.coordinator.currentChunkID != chunk.chunkIndex {
            uiView.attributedText = buildAttributedText(from: chunk)
            context.coordinator.currentChunkID = chunk.chunkIndex
            
            uiView.setNeedsLayout()
            uiView.layoutIfNeeded()
        }
        
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
        
        let elements = fullDisplay.displayElements
        
        for (index, element) in elements.enumerated() {
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
                if index < elements.count - 1 {
                    finalString.append(NSAttributedString(string: "\n", attributes: attrs))
                }
            } else if element.type == "line-break" {
                if index < elements.count - 1 {
                    finalString.append(NSAttributedString(string: "\n", attributes: attrs))
                }
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
        
        // Remove trailing whitespace/newlines
        while finalString.string.last?.isWhitespace == true || finalString.string.last?.isNewline == true {
            finalString.deleteCharacters(in: NSRange(location: finalString.length - 1, length: 1))
        }
        
        return finalString
    }
    
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    
    class Coordinator: NSObject {
        var parent: FullChunkTextView
        weak var textView: UITextView?
        var currentChunkID: Int = -1
        
        init(_ parent: FullChunkTextView) { self.parent = parent }
        
        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let textView = textView else { return }
            let location = gesture.location(in: textView)
            let layoutManager = textView.layoutManager
            let charIndex = layoutManager.characterIndex(for: location, in: textView.textContainer, fractionOfDistanceBetweenInsertionPoints: nil)
            
            if charIndex < textView.textStorage.length {
                let attributes = textView.textStorage.attributes(at: charIndex, effectiveRange: nil)
                if let pageIndex = attributes[.pageIndex] as? Int, let cueTime = attributes[.pageCueTime] as? Double {
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
