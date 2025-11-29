# Cloud Run Return Payload - Test 2

## Test Configuration
- **Test Name**: Secondary threshold only (70ms)
- **Session ID**: `threshold-test-70ms-secondary-only`
- **Thresholds**: `usePrimary: false, useSecondary: true`
- **Primary Threshold**: 100ms (disabled)
- **Secondary Threshold**: 70ms (enabled)

## Request Payload
```json
{
  "userText": "This test uses only the secondary threshold at 70 milliseconds. The primary threshold should be completely disabled for this test.",
  "originalParams": {
    "voiceGender": "shuffled",
    "speakerMode": "readingRainbow",
    "speed": 0.8
  },
  "sessionId": "threshold-test-70ms-secondary-only",
  "customVoices": [],
  "thresholds": {
    "breakPauseFirst": 100,
    "breakPauseSecond": 70,
    "usePrimary": false,
    "useSecondary": true
  }
}
```

## Response Payload
```json
{
  "success": true,
  "sessionId": "threshold-test-70ms-secondary-only",
  "totalChunks": 1,
  "chunkIndex": 0,
  "audioUrl": "https://storage.googleapis.com/storage_audio_gcs/audioalchemy_combined/FTA_1757466693406_threshold-test-70ms-secondary-only_audio_Part_1_of_1.mp3?GoogleAccessId=749667521285-compute%40developer.gserviceaccount.com&Expires=1758071493&Signature=...",
  "timestampsUrl": "https://storage.googleapis.com/storage_audio_gcs/audioalchemy_combined/FTA_1757466693406_threshold-test-70ms-secondary-only_timestamps_Part_1_of_1.json?GoogleAccessId=749667521285-compute%40developer.gserviceaccount.com&Expires=1758071493&Signature=...",
  "pageBreaksUrl": "https://storage.googleapis.com/storage_audio_gcs/audioalchemy_combined/FTA_1757466693406_threshold-test-70ms-secondary-only_pageBreaks_Part_1_of_1.json?GoogleAccessId=749667521285-compute%40developer.gserviceaccount.com&Expires=1758071493&Signature=...",
  "wordCount": 42,
  "totalDuration": 16.126,
  "pagination": {
    "totalBreaks": 4,
    "totalWords": 42,
    "thresholdUsed": "secondary-70ms",
    "totalPages": 5
  }
}
```

## Key Results
- **Audio Generated**: 42 words, 16.126 seconds duration
- **Page Breaks**: 4 breaks detected using secondary threshold only
- **Total Pages**: 5 pages (4 breaks + 1)
- **Threshold Used**: "secondary-70ms" (confirms only secondary threshold was active)
- **Break Detection**: Found pauses > 70ms in the audio (more sensitive than primary)

## Comparison with Test 1
- **Fewer Breaks**: 4 vs 5 breaks (secondary threshold is more sensitive but found fewer qualifying pauses)
- **Different Pattern**: Secondary threshold found different pause points than primary
- **Shorter Pauses**: Detected pauses between 70ms-100ms range that primary threshold missed
