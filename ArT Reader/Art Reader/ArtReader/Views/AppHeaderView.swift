import SwiftUI

struct AppHeaderView: View {
    // Controls the style:
    // false = "Prompt Mode" (Gold text, Black background)
    // true  = "Content Mode" (White text, Clear background)
    var isActive: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Attention, Retention, and Timing.")
                .font(.system(size: 100, weight: .bold))
                .minimumScaleFactor(0.01)
                .lineLimit(1)
                .foregroundColor(isActive ? .white : Theme.accent)
                .opacity(isActive ? 0.8 : 1.0)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(8)
                .background(isActive ? Color.clear : Color.black)
                .cornerRadius(8)
                .shadow(
                    color: isActive ? .clear : .black.opacity(0.3),
                    radius: 4, x: 0, y: 2
                )
        }
        .padding(.horizontal, 20)
        // CHANGED: Fixed 60pt padding to absolutely clear the Dynamic Island
        .padding(.top, 60)
        .padding(.bottom, 14)
    }
}

#Preview {
    VStack {
        AppHeaderView(isActive: false) // Gold
        AppHeaderView(isActive: true)  // White
    }
    .background(Color.gray)
}
