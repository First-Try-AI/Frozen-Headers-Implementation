import SwiftUI

// Explicit State Definition
enum HeaderState {
    case active   // Gold Text, Black Background
    case inactive // White Text (50%), Clear Background
}

struct AppHeaderView: View {
    var state: HeaderState = .active
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Attention, Retention, and Timing.")
                .font(.system(size: 100, weight: .bold))
                .minimumScaleFactor(0.01)
                .lineLimit(1)
                // ACTIVE = Theme.accent (Gold)
                // INACTIVE = White (Opacity handled below)
                .foregroundColor(
                    state == .active
                    ? Theme.accent
                    : Color.white  // CHANGED: White for inactive state
                )
                // ACTIVE = 100% Opacity
                // INACTIVE = 50% Opacity (Applied to the View)
                .opacity(state == .active ? 1.0 : 0.5)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(8)
                // ACTIVE = Black BG
                // INACTIVE = Clear (0% Opacity)
                .background(
                    state == .active
                    ? Color.black
                    : Color.clear
                )
                .cornerRadius(8)
                // ACTIVE = Shadow | INACTIVE = No Shadow
                .shadow(
                    color: state == .active ? .black.opacity(0.3) : .clear,
                    radius: 4, x: 0, y: 2
                )
        }
        .padding(.horizontal, 20)
    }
}

#Preview {
    ZStack {
        Color.gray
        VStack(spacing: 20) {
            AppHeaderView(state: .active)
            AppHeaderView(state: .inactive)
        }
    }
}
