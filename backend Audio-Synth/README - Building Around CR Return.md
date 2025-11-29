# Building Around Cloud Run Return Payload

## Overview
This document outlines how to build a frontend that properly receives, unpacks, and plays the audio content returned from the Cloud Run `/process-input` endpoint.

## Cloud Run Response Structure
The `/process-input` endpoint returns a structured response with audio URLs, timestamps, and pagination data:

```json
{
  "success": true,
  "sessionId": "unique-session-id",
  "totalChunks": 1,
  "chunkIndex": 0,
  "audioUrl": "https://storage.googleapis.com/.../audio.mp3?signature=...",
  "timestampsUrl": "https://storage.googleapis.com/.../timestamps.json?signature=...",
  "pageBreaksUrl": "https://storage.googleapis.com/.../pageBreaks.json?signature=...",
  "wordCount": 42,
  "totalDuration": 16.126,
  "pagination": {
    "totalBreaks": 5,
    "totalWords": 42,
    "thresholdUsed": "primary-121ms",
    "totalPages": 6
  }
}
```

## Key Components to Build

### 1. Audio Player
- **HTML5 Audio Element**: For playing the generated MP3
- **Play/Pause Controls**: Basic playback functionality
- **Progress Bar**: Visual representation of playback progress
- **Time Display**: Current time / total duration

### 2. Text Display with Highlighting
- **Word-by-Word Highlighting**: Sync with audio timestamps
- **Page Break Visualization**: Show page boundaries
- **Current Word Indicator**: Highlight the word currently being spoken
- **Lookahead/Lookback**: Show context around current word

### 3. Pagination System
- **Page Navigation**: Previous/Next page controls
- **Page Indicators**: Show current page / total pages
- **Page Break Timestamps**: Jump to specific pages
- **Auto-Page Turn**: Advance pages based on audio progress

### 4. Data Management
- **Fetch Handler**: Send requests to Cloud Run endpoint
- **Response Parser**: Extract URLs and metadata
- **Timestamp Loader**: Fetch and parse word timing data
- **Page Break Loader**: Fetch and parse pagination data

## Technical Implementation

### Frontend Architecture
```
index.html
├── audio-player.js      # Audio playback controls
├── text-highlighter.js  # Word highlighting system
├── pagination.js        # Page navigation logic
├── data-manager.js      # Cloud Run API integration
└── styles.css          # Visual styling
```

### Data Flow
1. **User Input** → Send text to Cloud Run
2. **Cloud Run Response** → Extract audio/timestamps/pageBreaks URLs
3. **Fetch Timestamps** → Load word timing data
4. **Fetch Page Breaks** → Load pagination data
5. **Initialize Player** → Set up audio with highlighting
6. **User Interaction** → Play/pause, page navigation

### Key JavaScript Functions Needed
- `fetchCloudRunData(userText, thresholds)` - Send request to Cloud Run
- `loadTimestamps(timestampsUrl)` - Fetch word timing data
- `loadPageBreaks(pageBreaksUrl)` - Fetch pagination data
- `initializeAudioPlayer(audioUrl, timestamps)` - Set up audio with highlighting
- `highlightCurrentWord(currentTime, timestamps)` - Update word highlighting
- `handlePageBreaks(currentTime, pageBreaks)` - Manage page navigation

## Visual Design Principles
- **Eyes Up Philosophy**: Keep active content above the fold
- **Clean, Expensive Feel**: Avoid glassmorphism, use clean lines
- **Mobile-First**: Optimized for Chrome on iOS mobile
- **Accessibility**: Clear visual hierarchy and readable text

## Integration Points
- **Cloud Run Endpoint**: `https://fta-synth-pyh6ygakfa-uc.a.run.app/process-input`
- **Request Format**: JSON with userText, originalParams, sessionId, customVoices, thresholds
- **Response Handling**: Extract URLs and metadata for audio playback
- **Error Handling**: Graceful fallbacks for network issues

## Next Steps
1. Create basic HTML structure
2. Implement Cloud Run API integration
3. Build audio player with basic controls
4. Add word-by-word highlighting system
5. Implement pagination navigation
6. Style with clean, mobile-optimized design
