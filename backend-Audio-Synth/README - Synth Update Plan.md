# Synth Update Plan - Text Chunking Optimization

## Overview
Plan to retool the text chunking system to optimize voice variety while maintaining natural speech flow and ElevenLabs processing efficiency.

## Current State
- Max chunk size: 420 characters (reduced from 500)
- Search range: 270-420 characters
- Target chunks: 6 (removed - obsolete with 15k input limit)
- Privacy + tail scripts: ~400 characters total

## Goals
1. **Voice Variety**: More frequent voice changes for richer audio experience
2. **Natural Speech Flow**: Respect natural break points in text
3. **Optimal Processing**: Stay within ElevenLabs sweet spot (400-500 chars)
4. **Progressive Search**: Find best breaks closest to 400 characters

## Planned Changes

### 1. Progressive Search Range
- **Start**: 400-500 characters (optimal voice variety)
- **Expand downward**: 350-500, 300-500, 250-500 if no breaks found
- **Logic**: Always choose break closest to 400 characters within range

### 2. Break Point Hierarchy
**Primary breaks** (preferred):
1. Double newlines (`\n\n`)
2. Single newlines (`\n`)
3. Sentence endings (`. `, `! `, `? `)

**Secondary breaks** (only after range expansion):
4. Semicolon + space (`; `)
5. Colon + space (`: `)
6. Comma + space (`, `)

**Last resort**:
7. Simple space boundaries

### 3. Configuration Updates
- Remove target chunk count logic entirely
- Use 500 character limit as controlling factor
- Let algorithm create as many chunks as needed based on natural breaks

### 4. Dev Panel Enhancement
- Add privacy script field for testing
- Add tail script field for testing
- Keep configuration hidden from users (internal development tooling)

## Implementation Approach
1. Update `findBestSplitPoint()` function with progressive search logic
2. Modify break point detection to prioritize breaks closest to 400 characters
3. Remove chunk count calculations from `calculateChunkSize()`
4. Add dev panel controls for script testing

## Expected Results
- Chunks closer to 400 characters (optimal for voice variety)
- More natural speech breaks
- Better voice distribution throughout longer texts
- Maintained ElevenLabs processing efficiency

## Voice Validation Strategy

### Voice Assignment Process
1. **Primary voice**: Assigned from selected pool (shuffled/higher/lower/custom)
2. **Backup voice**: Different voice from same pool
3. **Fallback voice**: Guaranteed working voice (M: ZthjuvLPty3kTMaNKVKb, F: sScFwemjGrAkDDiTXWMH)

### Validation Flow
1. Collect all voice IDs (primary, backup, fallback) from all chunks
2. Batch validate with ElevenLabs in single API call
3. Use primary if available, backup if primary fails, fallback if both fail
4. Proceed with synthesis using validated voices

### Benefits
- Prevents mid-process failures due to invalid voice IDs
- Single validation API call for efficiency
- Guaranteed fallback ensures processing never fails
- Maintains voice variety while ensuring reliability

## FFmpeg Trimming Optimization

### Current Approach
- Searches through alignment data for specific text patterns
- Looks for spaces within 50 characters after user content end
- Complex logic to find natural break points

### Simplified Approach
Since we know the exact text structure, use pure character counting to get precise timestamp markers:

**Privacy Timestamp**: Count privacy script characters + break tag characters → find timestamp of last break tag character (before user text begins)
**Tail Timestamp**: Count privacy script + break tags + user text + break tags → find timestamp of first break tag character (after user text ends)

### Implementation
1. Calculate privacy cut position = privacy script + break tag character count
2. Find timestamp at that exact character position (end of break sequence)
3. Calculate tail cut position = privacy + breaks + user text + break tag start
4. Find timestamp at that exact character position (start of tail break sequence)
5. Round timestamps to milliseconds (e.g., 0min 2sec 587ms)

### Usage of Cut Point Markers
These two precise timestamp markers are used in three places:
1. **FFmpeg for audio trim** - Cut audio file at exact timestamps
2. **Word timestamps for alignment** - Filter word-level timestamps to user content only
3. **Letter timestamps for alignment** - Filter letter-level timestamps to user content only

### Benefits
- Eliminates complex search logic
- More reliable and predictable cuts
- Synchronized trimming across all data streams
- Uses known text structure for precision
- Eliminates sync issues between audio and timestamp data

## Streaming/Progressive Delivery Architecture

### Current Approach
- Process all chunks in batches
- Wait for all batches to complete
- Return everything at once to frontend

### Optimized Approach
- **Batch processing** with configurable chunk limits (start with 4, test 5)
- **Immediate streaming** - return results as each batch completes
- **Frontend ready** to handle partial results and start playing early
- **Progressive delivery** rather than waiting for everything to finish

### Benefits
- Dramatically improved perceived performance
- Users hear audio much sooner
- Better resource management
- Scalable architecture for large texts
- Frontend can start playing while later batches process

### Implementation
- **Streaming response approach**: Keep connection open, send each batch as it completes
- Frontend receives chunks incrementally until connection closes
- Single connection handles everything, very efficient
- Immediate audio playback, no progress tracking needed
- Low complexity - frontend just receives chunks as they come
- Build streaming architecture from the start (not retrofit)
- Configurable batch size limits to prevent resource exhaustion

## Frontend Integration Requirements

Based on the TY-Jesus frontend architecture, the streaming system needs to integrate with:

**Current Frontend Architecture (16 modular JS files under 300 lines)**
- `audio-system.js` - Core audio system coordinator
- `audio-input-cloudrun.js` - Cloud Run API integration  
- `audio-loading.js` - Loading interface management
- `audio-playback.js` - Audio playback management
- `audio-progress.js` - Progress bar visualization
- `audio-controls.js` - Play/pause/seek controls
- `captioning-manager.js` - Manages different captioning styles
- `caption-original.js` - Original highlighting style with enhanced features

**Integration Points for Streaming**
1. **audio-input-cloudrun.js** - Modify to handle streaming responses instead of single response
2. **audio-loading.js** - Update to show progressive loading as batches complete
3. **audio-playback.js** - Handle incremental audio chunks and seamless playback
4. **captioning-manager.js** - Process streaming timestamp data as it arrives
5. **audio-system.js** - Coordinate streaming data flow and state management

**Frontend Capabilities to Leverage**
- ✅ **Multi-chunk audio support** - Already handles multiple audio parts
- ✅ **Real-time pagination** - Pages advance automatically during playback  
- ✅ **Word-level timestamps** - Ready for streaming timestamp data
- ✅ **Seamless part transitions** - Can handle incremental chunks
- ✅ **Modular architecture** - Easy to modify individual components

## Letter-Timestamp-First Architecture

### Current Flow (Word-Timestamp Based)
1. Text chunking
2. Voice assignment
3. ElevenLabs API call → get audio + alignment data
4. FFmpeg trimming (using privacy/tail timestamp markers)
5. Upload to GCS
6. Return data

### New Flow (Letter-Timestamp-First Foundation)
1. Text chunking
2. Voice assignment
3. ElevenLabs API call → get audio + alignment data
4. **Letter timestamp generation** ← NEW STEP
5. Create Trim Timemarkers for Privacy
6. Create Trim Timemarkers for Tail
7. FFmpeg trimming (using privacy/tail timestamp markers)
8. Align Letter timestamps to new 00:00
9. Generate Word level timestamps from aligned letter timestamps
10. [future: generate syllable level timestamps]
11. Upload to GCS: Audio file, Letter timestamps, Word timestamps
12. Return data: Signed URLs for each chunk containing:
    - Audio file URL
    - Letter timestamps URL
    - Word timestamps URL

### Benefits
- Letter timestamps become the source of truth
- Word timestamps derived from letters (not separate systems)
- All timestamp data uses same trimming logic
- Synchronized data across all timestamp levels
- Foundation ready for future syllable-level animations
- Clean, unified architecture

## Secret Management & API Keys

### Current Environment Variables
- `ELEVENLABS_TTS_ENT` - ElevenLabs API key
- `GOOGLE_CLOUD_PROJECT_ID` - GCP project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Service account key file path
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket name (defaults to "storage_audio_gcs")

### Cloud Run Secret Manager Setup
**1. Store secrets in Secret Manager:**
```bash
# ElevenLabs API key
gcloud secrets create elevenlabs-api-key --data-file=-

# GCP Project ID  
gcloud secrets create gcp-project-id --data-file=-

# GCS Bucket Name
gcloud secrets create gcs-bucket-name --data-file=-
```

**2. Grant Cloud Run access to secrets:**
```bash
# Get Cloud Run service account
gcloud run services describe fta-synth --region=us-central1 --format="value(spec.template.spec.serviceAccountName)"

# Grant secret access
gcloud secrets add-iam-policy-binding elevenlabs-api-key \
    --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
```

**3. Deploy with secrets:**
```bash
gcloud run deploy art-reader-backend \
    --set-secrets="ELEVENLABS_TTS_ENT=elevenlabs-api-key:latest" \
    --set-secrets="GOOGLE_CLOUD_PROJECT_ID=gcp-project-id:latest" \
    --set-secrets="GCS_BUCKET_NAME=gcs-bucket-name:latest"
```

### Benefits
- API keys stored securely in Google Secret Manager
- No hardcoded credentials in code
- Automatic rotation capabilities
- Audit trail for secret access

## Deployment Strategy

### Current Approach
- Keep existing `fta-synth` service running unchanged
- Build new service as `art-reader-backend` (entirely separate Cloud Run service)
- Validate new service completely before any changes to current system
- Only decommission current synth after new service is fully validated

### Benefits
- Zero risk to current production system
- Complete validation of new architecture
- Easy rollback if issues arise
- Gradual migration path
- Current system remains stable during development

## Modular Architecture Design (300-Line Rule)

### Core Modules (under 300 lines each)
- `index.js` - Main entry point and routing
- `text-processor.js` - Text chunking and voice assignment
- `letter-timestamps.js` - Letter timestamp generation from ElevenLabs data
- `word-timestamps.js` - Word timestamp derivation from letters
- `audio-processor.js` - ElevenLabs API calls and audio generation
- `ffmpeg-processor.js` - Audio trimming and processing
- `gcs-uploader.js` - File uploads to Google Cloud Storage
- `streaming-coordinator.js` - Batch processing and streaming responses

### Benefits
- Each file has one clear responsibility
- Easy to understand and modify individual components
- Reliable AI agent editing (no files over 300 lines)
- Clean separation of concerns
- Easy to test and debug individual modules
- Prevents code bloat and technical debt

### Design Philosophy
- Single responsibility per module
- Clear interfaces between modules
- No shared state between modules
- Easy to add new features without modifying existing code
- Built for maintainability from day one

## ART Reader Backend - Fresh Build Approach

### Complete Separation from Existing Synth
- **No modifications** to current `fta-synth` service
- **No updates** to existing files or logic
- **No gradual migration** or incremental changes
- **Fresh build** from empty directory
- **Clean slate** architecture designed from day one

### What We're Building
A completely new `art-reader-backend` Cloud Run service with:
- Letter-timestamp-first architecture
- Streaming/progressive delivery system
- Modular design (300-line rule)
- Secret management integration
- All features built from scratch

### Current Synth Remains Unchanged
- Keep `fta-synth` running as-is
- No risk to existing production system
- Complete validation of new system before any changes
- Only decommission after new system is fully validated

## Status
- ✅ Configuration updated (420 char limit, removed target chunks)
- 🔄 Fresh ART Reader backend build pending
- 🔄 Modular architecture design pending
- 🔄 Letter-timestamp-first implementation pending
- 🔄 Streaming/progressive delivery implementation pending
- 🔄 Secret management setup pending
- 🔄 Cloud Run service deployment pending
