import SwiftUI

struct ProgressHeaderView: View {
    let totalChunks: Int
    @Binding var currentChunkIndex: Int
    let isPlaying: Bool
    let progress: Double // 0.0 to 1.0 representing playback within current chunk
    
    // Controls the visual style of the active border
    let isInPlaybackMode: Bool
    
    // New closure to handle tapping the header (nav bar)
    var onHeaderTap: (() -> Void)? = nil
    
    // Royal Blue Color Definition
    let royalBlue = Color(hex: "4169E1")
    
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
                .cornerRadius(.infinity) // PILL DESIGN
                // VISUAL POLISH: Active State
                .overlay(
                    RoundedRectangle(cornerRadius: .infinity)
                        .stroke(
                            borderColor(for: index),
                            lineWidth: index == currentChunkIndex ? 2 : 0
                        )
                )
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
    }
    
    // Helper for Border Color
    func borderColor(for index: Int) -> Color {
        guard index == currentChunkIndex else { return .clear }
        
        if isInPlaybackMode {
            return Color.white.opacity(0.5)
        } else {
            // CHANGED: Replaced Gold with Royal Blue at 75% opacity
            return royalBlue.opacity(0.75)
        }
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
