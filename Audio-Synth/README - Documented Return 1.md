# Cloud Run Return Payload - Test 1

## Test Configuration
- **Test Name**: Primary threshold only (121ms)
- **Session ID**: `threshold-test-121ms-primary-only`
- **Thresholds**: `usePrimary: true, useSecondary: false`
- **Primary Threshold**: 121ms
- **Secondary Threshold**: 70ms (disabled)

## Request Payload
```json
{
  "userText": "This test uses only the primary threshold at 121 milliseconds. We want to see how many page breaks are detected with this higher threshold setting. The secondary threshold should be completely disabled for this test.",
  "originalParams": {
    "voiceGender": "shuffled",
    "speakerMode": "readingRainbow",
    "speed": 0.8
  },
  "sessionId": "threshold-test-121ms-primary-only",
  "customVoices": [],
  "thresholds": {
    "breakPauseFirst": 121,
    "breakPauseSecond": 70,
    "usePrimary": true,
    "useSecondary": false
  }
}
```

## Response Payload
```json
{
  "success": true,
  "sessionId": "threshold-test-121ms-primary-only",
  "totalChunks": 1,
  "chunkIndex": 0,
  "audioUrl": "https://storage.googleapis.com/storage_audio_gcs/audioalchemy_combined/FTA_1757466693406_threshold-test-121ms-primary-only_audio_Part_1_of_1.mp3?GoogleAccessId=749667521285-compute%40developer.gserviceaccount.com&Expires=1758071493&Signature=...",
  "timestampsUrl": "https://storage.googleapis.com/storage_audio_gcs/audioalchemy_combined/FTA_1757466693406_threshold-test-121ms-primary-only_timestamps_Part_1_of_1.json?GoogleAccessId=749667521285-compute%40developer.gserviceaccount.com&Expires=1758071493&Signature=...",
  "pageBreaksUrl": "https://storage.googleapis.com/storage_audio_gcs/audioalchemy_combined/FTA_1757466693406_threshold-test-121ms-primary-only_pageBreaks_Part_1_of_1.json?GoogleAccessId=749667521285-compute%40developer.gserviceaccount.com&Expires=1758071493&Signature=...",
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

## Key Results
- **Audio Generated**: 42 words, 16.126 seconds duration
- **Page Breaks**: 5 breaks detected using primary threshold only
- **Total Pages**: 6 pages (5 breaks + 1)
- **Threshold Used**: "primary-121ms" (confirms only primary threshold was active)
- **Break Detection**: Found pauses > 121ms in the audio
