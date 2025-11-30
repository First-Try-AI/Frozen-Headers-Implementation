import SwiftUI

struct ProgressHeaderView: View {
    let totalChunks: Int
    @Binding var currentChunkIndex: Int
    let isPlaying: Bool
    let progress: Double // 0.0 to 1.0 representing playback within current chunk
    
    // New closure to handle tapping the header (nav bar)
    var onHeaderTap: (() -> Void)? = nil
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<totalChunks, id: \.self) { index in
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        // Background Track
                        Rectangle()
                            .fill(Color.white.opacity(0.15))
                        
                        // Fill Logic
                        Rectangle()
                            .fill(fillColor(for: index))
                            .frame(width: calculateFillWidth(for: index, totalWidth: geo.size.width))
                    }
                }
                .frame(height: 20) // Thick bars
                .cornerRadius(2)
                .onTapGesture {
                    // Navigation logic
                    withAnimation {
                        currentChunkIndex = index
                    }
                    // Trigger the mode switch callback
                    onHeaderTap?()
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        // Make the whole area tappable if needed, but bars are fine targets.
        // User said "tapping the nav bar". The bars are the main element.
    }
    
    // Determine color based on state
    func fillColor(for index: Int) -> Color {
        if index == currentChunkIndex {
            return Theme.accent // Active chunk is Gold
        } else if index < currentChunkIndex {
            return Theme.accent.opacity(0.5) // Completed chunks are dimmed Gold
        } else {
            return Color.clear // Future chunks are empty
        }
    }
    
    // Determine width based on progress
    func calculateFillWidth(for index: Int, totalWidth: CGFloat) -> CGFloat {
        if index < currentChunkIndex {
            return totalWidth // 100% full
        } else if index == currentChunkIndex {
            return totalWidth * CGFloat(progress) // Partial fill
        } else {
            return 0 // 0% full
        }
    }
}
