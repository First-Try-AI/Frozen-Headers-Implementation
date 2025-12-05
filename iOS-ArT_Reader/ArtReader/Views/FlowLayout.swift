import SwiftUI

@available(iOS 16.0, *)
struct FlowLayout: Layout {
    var alignment: Alignment = .center
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = arrangeSubviews(proposal: proposal, subviews: subviews)
        
        // Calculate total size
        var totalHeight: CGFloat = 0
        var maxWidth: CGFloat = 0
        
        for row in rows {
            totalHeight += row.height
            maxWidth = max(maxWidth, row.width)
        }
        
        // Add spacing between rows
        if !rows.isEmpty {
            totalHeight += CGFloat(rows.count - 1) * spacing
        }
        
        return CGSize(width: maxWidth, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = arrangeSubviews(proposal: proposal, subviews: subviews)
        
        var yOffset = bounds.minY
        
        for row in rows {
            var xOffset = bounds.minX
            
            // Handle row alignment (center by default)
            let remainingSpace = bounds.width - row.width
            if alignment == .center {
                xOffset += remainingSpace / 2
            } else if alignment == .trailing {
                xOffset += remainingSpace
            }
            
            for item in row.items {
                // Center vertically within the row line height
                let yPosition = yOffset + (row.height - item.size.height) / 2
                
                item.view.place(
                    at: CGPoint(x: xOffset, y: yPosition),
                    proposal: ProposedViewSize(item.size)
                )
                xOffset += item.size.width + spacing
            }
            
            yOffset += row.height + spacing
        }
    }
    
    // Helper to calculate rows
    private func arrangeSubviews(proposal: ProposedViewSize, subviews: Subviews) -> [Row] {
        let maxWidth = proposal.width ?? .infinity
        var rows: [Row] = []
        var currentRow: Row = Row()
        
        for subview in subviews {
            let viewSize = subview.sizeThatFits(.unspecified)
            
            if currentRow.width + viewSize.width + spacing > maxWidth && !currentRow.items.isEmpty {
                // Finish current row
                rows.append(currentRow)
                currentRow = Row()
            }
            
            // Add spacing if not first item
            let spacingToAdd = currentRow.items.isEmpty ? 0 : spacing
            
            currentRow.items.append(LayoutItem(view: subview, size: viewSize))
            currentRow.width += viewSize.width + spacingToAdd
            currentRow.height = max(currentRow.height, viewSize.height)
        }
        
        if !currentRow.items.isEmpty {
            rows.append(currentRow)
        }
        
        return rows
    }
    
    struct Row {
        var items: [LayoutItem] = []
        var width: CGFloat = 0
        var height: CGFloat = 0
    }
    
    struct LayoutItem {
        var view: LayoutSubview
        var size: CGSize
    }
}
