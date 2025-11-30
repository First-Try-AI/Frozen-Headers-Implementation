# Agent Handover: ArT Reader Project

## Project Overview
**ArT (Attention, Retention, Timing)** is an iOS Reader application with a specific "Cinematic" aesthetic (Gold #fbbf24 on Dark Grey) and an "Eyes Up" UX philosophy.

### Monorepo Structure
*   **`iOS-Art-Reader/`**: The active SwiftUI workspace. Main project: `ArtReader.xcodeproj`.
*   **`backend-Audio-Synth/`**: Cloud Run Node.js API (Audio generation).
*   **`reference-code-reader/`**: Read-only logic reference.
*   **`reference-design-mobile/`**: Read-only design reference.

---

## Core Architecture: The 3-Mode System
The app state is managed by `SessionManager.swift`. It is **NOT** binary; it has three distinct modes:

1.  **`.writing` (Input Mode)**
    *   **View:** `InputView.swift`
    *   **Logic:** User enters text. No "Generate" button in the header; explicit button at the bottom.
    *   **Transition:** Submitting text triggers API -> `.processing` -> `.reading`.

2.  **`.reading` (Visual Review / Reading Mode)**
    *   **View:** `ReaderView` -> `FullChunkDisplayView`
    *   **Logic:** User reads the full text silently.
    *   **Controls:** Integrated into the scroll flow (40pt spacer above).
    *   **Navigation:**
        *   **Left Button:** **Disabled** (Grayed out).
        *   **Right Button:** **Reset Session** (Refresh icon) -> Returns to `.writing`.

3.  **`.listening` (Cinematic Playback / Listening Mode)**
    *   **View:** `ReaderView` -> `PageViewMode`
    *   **Logic:** Audio plays; text displays as "Pages" (Slideshow/Karaoke).
    *   **UX:** No scrolling. Text replaces itself centrally.
    *   **Controls:** Anchored at the bottom.
    *   **Navigation:** **Both Disabled** (Play/Pause only).

---

## Critical Technical Implementation Details ("Gotchas")

### 1. Text Layout (The "TextKit 1 Hack")
**File:** `FullChunkTextView.swift`
*   **Issue:** SwiftUI `Text` and standard `UITextView` cause layout jumps or calculate "0 height" for complex attributed strings in ScrollViews.
*   **Solution:** We MUST use `UITextView` with **TextKit 1**.
    *   Init: `usingTextLayoutManager: false`
    *   Calculation: `textContainer.heightTracksTextView = false`
    *   **Hack:** `textContainer.size.height = .greatestFiniteMagnitude` (Forces immediate intrinsic size calculation).
    *   **Constraint:** You MUST pass the explicit width from `GeometryReader` to this view.

### 2. Audio Service & Caching
**File:** `AudioService.swift`
*   **Strict Caching:** No streaming fallback. Audio is downloaded to `Library/Caches` before playback.
*   **Time Observation:** Uses `0.05s` interval for high-precision Karaoke highlighting.
*   **Resume Logic:** Checks if `currentURL` matches to avoid re-buffering.

### 3. Shared Components & Dependencies
*   **`AppHeaderView.swift`:**
    *   **Mandatory:** Must be present in `InputView` and `ReaderView`.
    *   **Padding:** Hardcoded `padding(.top, 60)` to clear Dynamic Island. Do not change this without testing on a device.
*   **`AudioControlsView.swift`:**
    *   **Argument Order:** When initializing, strict argument order is required: `(sessionManager, leftAction, leftIcon, rightAction, rightIcon, isLeftDisabled, isRightDisabled)`.
    *   **Customization:** Supports overriding actions and explicit disable flags.

### 4. UI/UX Standards
*   **Colors:** Defined in `Theme.swift`.
    *   Accent: Gold `#fbbf24`
    *   Background: Dark `#0c1445` -> `#16213e`
*   **Progress Header:**
    *   Bar Height: **20pt** (Cinematic thick bars).
    *   Active Color: Gold.
    *   Future Color: Clear/Dark.

---

## Recent Work (Refactoring Status)
*   **InputView:** Refactored to remove "Paste Text Here" headers. TextEditor now expands. Generation button is bottom-anchored.
*   **Controls Logic:**
    *   Reader Mode: Left disabled, Right = Refresh.
    *   Listening Mode: Navigation disabled.
*   **Compilation:** Fixed missing `AppHeaderView` and `AudioControlsView` argument order issues.

## Next Steps / Backlog
*   If future changes require "Next Chunk" navigation in Reader/Listening modes, the flags in `FullChunkDisplayView` and `PageViewMode` need to be toggled.
*   Verify memory usage on long sessions (AudioService caching).
