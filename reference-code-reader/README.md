# ArT Reader - Reader Version

**Last Updated:** November 2025

## Overview
ArT Reader (Attention, Retention & Timing) is an advanced screen reading platform that transforms text into synchronized audio narration with real-time word highlighting. This is the **desktop/reader version** optimized for larger screens.

## Current Status
✅ **FULLY FUNCTIONAL** - All core systems operational and tested.

### Breakthrough Implementation (November 2025)
- ✅ **Zero Reflow PageLineBalancer** - Pre-scaled measurements (1.13x) eliminate layout shifts during playback
- ✅ **Perfect Container Hierarchy** - `.text-content` fills `.text-display` parent completely (100% width, no extra padding)
- ✅ **Spoon-Feed Page Transitions** - Backend calculates transition timing, frontend pre-emptively shows next page
- ✅ **Smooth Transitions** - Removed 50ms delay for buttery smooth page changes
- ✅ **Optimal Line Lengths** - Uses 100% of available space for attention-friendly reading
- ✅ **Production Clean** - Removed all debug visuals and timing delays

### Previous Fixes (January 2025)
- ✅ **Word Highlighting Baseline Alignment** - Fixed active word dropping below baseline by restoring duplicate CSS rule structure from backup
- ✅ **Active Word Scaling** - Active words now scale to 1.13x with proper baseline alignment using `vertical-align: middle;`
- ✅ **CSS Architecture Separation** - Completely separated PageViewMode and FullChunkDisplay CSS to prevent style conflicts
- ✅ **Spacing System** - Implemented custom spacing with extra space after sentence-ending punctuation (`.`, `!`, `?`, `:`, `;`, `-`)
- ✅ **Top Padding** - Set to `1vh` for PageViewMode

## CSS Architecture

### File Structure
The CSS is organized into focused modules, all under 300 lines:

- **`styles-core.css`** - CSS variables, reset, base typography
- **`styles-journey-coordinator.css`** - Orchestrates CSS loading order
- **`styles-overlay.css`** - Built-in overlay system, resizer
- **`styles-input-interface.css`** - Text input, form controls, generate button
- **`styles-loading-interface.css`** - Loading states
- **`styles-responsive.css`** - Media queries, responsive design
- **`styles-slideshow.css`** - Background slideshow system
- **`styles-controls-panel.css`** - Controls panel styling
- **`styles-dev-panel-specific.css`** - Reader-specific dev panel styles
- **`styles-dev-shared.css`** - Shared dev panel styles
- **`styles-returns-interface-navigation.css`** - Navigation controls
- **`styles-returns-interface-pageview.css`** - PageViewMode display styles
- **`styles-returns-interface-fullchunk.css`** - FullChunkDisplay styles
- **`styles-word-highlighting.css`** - Word highlighting system

### Critical CSS Architecture: PageViewMode vs FullChunkDisplay

**IMPORTANT:** PageViewMode and FullChunkDisplay have completely separate CSS to prevent style conflicts:

- **PageViewMode** (`.text-display.pages-mode`):
  - Uses `styles-returns-interface-pageview.css`
  - Spans are `display: inline;` by default
  - Active words get `display: inline-block;` via duplicate rule
  - Words get padding from `.text-display span` rule (2px 4px)

- **FullChunkDisplay** (`.text-display.fullchunk-mode`):
  - Uses `styles-returns-interface-fullchunk.css`
  - Page containers are `display: inline;` for natural wrapping
  - Scoped with `.text-display.fullchunk-mode .page-container`

### Word Highlighting System

**Key Structure:**
- Base `.word` class: `display: inline;`, `padding: 0;`, `vertical-align: baseline;`
- Active `.word.active` class: `display: inline-block;`, `vertical-align: middle;`, `transform: scale(1.13);`, `transform-origin: bottom;`

**Critical Duplicate Rule:**
The system uses a **duplicate active word rule** in `styles-returns-interface-pageview.css`:
- `.text-display.playing span.active` (specificity: 0,3,1) overrides `.word.active` (specificity: 0,1,1)
- This ensures proper baseline alignment with `vertical-align: middle;`
- **DO NOT REMOVE** this duplicate rule - it's intentional and necessary

**CSS Load Order (via `styles-journey-coordinator.css`):**
1. `styles-returns-interface-pageview.css` (loads first)
2. `styles-word-highlighting.css` (loads second)
3. Pageview rule takes precedence due to higher specificity

## JavaScript Architecture

### Core Files
- `audio-input-display.js` - Text display, page management, and spoon-feed page transitions
- `audio-input-data-core.js` - Core data loading and audio initialization with pages data structure
- `audio-input-ui.js` - User interface controls
- `audio-input-cloudrun.js` - Cloud Run API integration
- `audio-input-coordinator.js` - Input module coordinator
- `input-regex.js` - Text cleaning and regex transformations
- `page-line-balancer.js` - Zero-reflow intelligent line distribution using pre-scaled measurements

### Audio Components
- `audio-system.js` - Core audio system coordinator
- `audio-loading.js` - Loading interface management
- `audio-navigation.js` - Audio navigation controls
- `audio-playback.js` - Audio playback management
- `audio-progress.js` - Progress bar visualization
- `audio-controls.js` - Play/pause/seek controls

### PageLineBalancer System
The breakthrough `page-line-balancer.js` implements zero-reflow text layout:
- **Pre-scaled Measurements**: Canvas measures words at 1.13x scale to prevent layout shifts
- **Full Width Utilization**: Uses 100% of available container space
- **Synchronous Layout**: Removed delays for buttery smooth page transitions
- **Dynamic Resizing**: Handles window resize events automatically

### Spoon-Feed Page Transitions
Backend calculates transition timing for smooth page changes:
- `transitionInfo` object contains gap timing data
- Frontend pre-emptively shows next page during audio gaps
- Eliminates distracting page pauses during playback

### Spacing Implementation
The system implements custom spacing logic in `audio-input-display.js`:
- Regular words: Single space between words
- Sentence endings: Double space after punctuation (`.`, `!`, `?`, `:`, `;`, `-`)
- Page containers: Natural wrapping with proper spacing

## Key Features
- **AI-powered text-to-speech** with word-level timestamps
- **Spoon-feed page transitions** - Backend calculates timing, frontend pre-emptively advances pages
- **Zero-reflow PageLineBalancer** - Pre-scaled measurements prevent layout shifts during playback
- **Real-time pagination** - Pages advance automatically during playback
- **Multi-chunk audio support** - Handles long texts split into multiple parts
- **Two display modes:**
  - **PageViewMode** - Word-by-word highlighting during playback with zero reflow
  - **FullChunkDisplay** - Full text with preserved formatting
- **Active word highlighting** - Scales to 1.13x with black background and proper baseline alignment
- **Custom spacing** - Extra space after sentence-ending punctuation
- **Perfect container hierarchy** - Text fills 100% of available space for optimal line lengths
- **Desktop-optimized design** with attention-friendly layout

## Configuration
- **API Endpoint**: Cloud Run - `https://fta-synth-pyh6ygakfa-uc.a.run.app`
- **Deployment**: https://artreader.art/reader/
- **Environment**: Production

## Development Notes

### CSS Specificity and Cascade
- PageViewMode active words are controlled by `.text-display.playing span.active` in `pageview.css`
- This rule has higher specificity (0,3,1) than `.word.active` (0,1,1) in `word-highlighting.css`
- The duplicate rule is **intentional** and ensures proper baseline alignment

### Recent Work (November 2025)
1. **Zero Reflow Implementation** - Breakthrough PageLineBalancer with pre-scaled measurements
2. **Container Hierarchy Fix** - .text-content fills parent completely for optimal line lengths
3. **Spoon-Feed Transitions** - Backend-calculated page transition timing
4. **Smooth Transitions** - Removed 50ms delay for buttery smooth page changes
5. **Production Cleanup** - Removed debug visuals and timing delays

### Previous Work (January 2025)
1. **Baseline Alignment Fix** - Restored duplicate active word rule from backup to fix baseline drop
2. **CSS Separation** - Completely separated PageViewMode and FullChunkDisplay CSS
3. **Spacing System** - Added custom spacing logic for sentence endings
4. **Top Padding** - Set to 1vh for better visual spacing

### Known Issues
- None currently - all systems operational with breakthrough zero-reflow performance

## Next Agent Context

When working on this codebase:
1. **DO NOT remove** the duplicate `.text-display.playing span.active` rule in `pageview.css` - it's required for proper baseline alignment
2. **Keep PageViewMode and FullChunkDisplay CSS separate** - they have different requirements
3. **Word highlighting** is controlled by both `word-highlighting.css` and `pageview.css` - this is intentional
4. **Spacing logic** is in `audio-input-display.js` - look for `addExtraSpaceAfterSentence` function
5. **CSS load order** matters - check `styles-journey-coordinator.css` for import sequence
6. **PageLineBalancer** uses pre-scaled measurements (1.13x) - this is critical for zero reflow
7. **Container hierarchy** must maintain `.text-content` filling `.text-display` parent completely
8. **Page transitions** use `transitionInfo` from backend for spoon-feed timing
9. **Synchronous layout** - no setTimeout delays in PageLineBalancer for smooth transitions
