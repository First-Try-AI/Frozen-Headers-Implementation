# Agent Handover: ArT Reader Project

## Project Overview
**ArT (Attention, Retention, Timing)** is an iOS Reader application with a specific "Cinematic" aesthetic (Gold #fbbf24 on Dark Grey) and an "Eyes Up" UX philosophy.

### Monorepo Structure
* **`iOS-Art-Reader/`**: The active SwiftUI workspace. Main project: `ArtReader.xcodeproj`.
* **`backend-Audio-Synth/`**: Cloud Run Node.js API (Audio generation).
* **`reference-code-reader/`**: Read-only logic reference.
* **`reference-design-mobile/`**: Read-only design reference.

---

## Core Architecture: The 3-Mode System
The app state is managed by `SessionManager.swift`. It is **NOT** binary; it has three distinct modes:

1.  **`.writing` (Input Mode)**
    * **View:** `InputView.swift`
    * **Layout:** Uses `FrozenPanelView` for a consistent dashboard header.
    * **Logic:** User enters text. No "Generate" button in the header; explicit button at the bottom.
    * **Features:** Reactive background (dims on focus), centered "Ghost" placeholder, vanishing labels.

2.  **`.reading` (Visual Review / Reading Mode)**
    * **View:** `ReaderView` -> `FullChunkDisplayView`
    * **Logic:** User reads the full text silently.
    * **Controls:** Integrated into the scroll flow.
    * **Navigation:** Swipe gestures (Left/Right) to navigate chunks.

3.  **`.listening` (Cinematic Playback Mode)**
    * **View:** `ReaderView` -> `PageViewMode`
    * **Logic:** Karaoke-style word highlighting synchronized with audio.
    * **UX:** Immersive; background dims further, controls minimize.

---

## Shared Components & Layouts
* **`FrozenPanelView.swift` (NEW):**
    * **Purpose:** The core layout engine for the app.
    * **Mechanism:** Uses `GeometryReader` preference keys to measure the Header height dynamically and push the Content ZStack down by that exact amount.
    * **Goal:** Creates a "Dashboard" feel where the top panel (Title + Nav) never moves or overlaps content.

* **`AppHeaderView.swift`:**
    * **Mandatory:** Must be present in the Header Slot of `FrozenPanelView`.
    * **Padding:** Top padding fixed at **60pt** (Dynamic Island). Bottom padding fixed at **20pt** (Standard spacing).
    * **States:** `.active` (Gold/Black) vs `.inactive` (Ghost White/Clear).

* **`Theme.swift`:**
    * **Accent:** Gold `#fbbf24` (Used for cursors, active borders, play buttons).
    * **Background:** Deep Navy/Black Gradient (`#0c1445` -> `#16213e`).

---

## Recent Work (Refactoring Log)
* **Architecture Refactor:**
    * Created `FrozenPanelView` to replace manual `Spacer` calculations across all views.
    * Migrated `InputView`, `LoadingView`, and `ReaderView` to use this new wrapper.
* **InputView Polish:**
    * Removed "Paste Text" labels.
    * Centered the placeholder text vertically; it now vanishes instantly on focus.
    * Added visual "dimming" logic: Background darkens by 10% when user is typing.
    * Added **10pt** top padding to content to align with the Reader's nav bar spacing.
* **Project Cleanup:**
    * **Deleted:** `AudioControlsView.swift` (Dead code).
    * **Deleted:** `Services/ReaderView.swift`, `Services/PageViewMode.swift` (Duplicate ghosts).
    * **Deleted:** `PlaybackViewModel.swift` (Old logic replaced by `ArtPlaybackViewModel`).

---

## ⚠️ Known Issues / Backlog

### 1. ReaderView Layout Collision (CRITICAL)
* **Issue:** Despite implementing `FrozenPanelView` in `ReaderView.swift`, the content views (`FullChunkDisplayView` and `PageViewMode`) are still rendering **inside** or **underneath** the header area, rather than being pushed down.
* **Suspected Cause:** * The internal `GeometryReader` or `ScrollView` inside `FullChunkDisplayView` might be ignoring the top padding passed down by `FrozenPanelView`.
    * Potential conflict between the `ZStack` z-indexes in `ReaderView`.
* **Next Step:** Debug `FullChunkDisplayView` isolation. Verify if `edgesIgnoringSafeArea` is being applied too aggressively on the content views.

### 2. General Polish
* **Typography:** Verify line-height consistency between `FullChunkTextView` (UIKit) and SwiftUI text views.
* **Loading View:** Ensure the 10pt top padding matches exactly with the new `InputView` spacing.
