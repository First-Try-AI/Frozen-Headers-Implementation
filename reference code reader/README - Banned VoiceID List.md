# Voice ID Management & Banned List

## Quick Reference: Banned Voice IDs

| Voice ID | Reason | Date Banned |
|----------|--------|------------|
| iq1GS1mcjc63xtqTrsFh | License revocation/quality issues | TBD |
| 5kMbtRSEKIkRZSdXxrZg | Establishing official removal process | 2025-09-27 |
| hoSRtERLhFa8UfJ6P1JP | Sounds like an intro announcer | 2025-09-27 |
| p4obTiHKLtDPScKL6P2f | Sounds stiff and robotic | 2025-09-27 |
| UgBBYS2sOqTuMpoF3BR0 | Too recognizable as "Mark" | 2025-01-02 |

---

## Process to Ban a Voice ID

### Step 1: Obtain the Voice ID to Ban
Receive the specific voice ID that needs to be removed.

### Step 2: Search for All Occurrences
Use grep to find every instance of the voice ID across the codebase:
```bash
grep -r "VOICE_ID_HERE" /Users/yonyonson/Desktop/firsttryai/
```

Check these specific locations:
- `cloud-run-services/New-Synth/textProcessor.js` - Lower and higher voice arrays
- `dev/artreader.art/reader/index.html` - vlist3-vlist6 override inputs
- `dev/artreader.art/mobile/index.html` - vlist3-vlist6 override inputs
- `dev/artreader.art/ElevenLabsDemo/index.html` - vlist3-vlist6 override inputs

### Step 3: Document the Banned Voice ID
Add the voice ID to the table above with the date and reason for removal.

### Step 4: Remove the Voice ID from the Codebase
Edit each file found in Step 2 to remove the voice ID. Get consent from Yon before applying changes.

### Step 5: Verify Removal
Run the same grep command again to confirm no results:
```bash
grep -r "VOICE_ID_HERE" /Users/yonyonson/Desktop/firsttryai/
```

---

## Why This Matters

### Current Problem
The system experiences critical failures during multi-chunk audio processing because voice IDs in the pool become invalid over time:
- Human voice owners remove their ElevenLabs licenses
- Voice IDs expire or get deactivated
- ElevenLabs voice availability changes

### Impact of Invalid Voice IDs
- ❌ System fails around chunks 10-17 during processing
- ❌ Entire audio generation fails despite partial success
- ❌ Users experience incomplete audio output
- ❌ Server resources wasted on invalid requests
- ❌ Increased error rates in production logs

### Current System Architecture
- **Voice Pool Location**: `cloud-run-services/New-Synth/textProcessor.js` (100+ male voices, 18+ female voices)
- **Selection Logic**: `Utils.selectVoice()` function
- **Frontend Overrides**: HTML vlist1-vlist6 inputs allow custom voice sequences

---

## MANDATORY REMOVAL PROCESS

When a voice ID is added to the banned list, it **MUST** be removed from ALL voice pools. This is a critical step to prevent system failures.

### Files to Update
1. **Cloud Run Services**: `cloud-run-services/New-Synth/textProcessor.js`
2. **Frontend (all three versions)**:
   - `dev/artreader.art/reader/index.html`
   - `dev/artreader.art/mobile/index.html`
   - `dev/artreader.art/ElevenLabsDemo/index.html`
3. **This Documentation**: Update the banned list table above

### Verification
- Search confirms voice ID appears nowhere in the codebase
- All three frontend versions have been checked
- Backend voice pools have been updated
- Documentation is current

**Failure to remove banned voice IDs will compromise production reliability.**

---

## Future Solution: Voice ID Pre-Validation

### Recommended Approach
Build a validation layer that checks voice availability with ElevenLabs before processing:

1. **Pre-flight Check**: Query ElevenLabs API with planned voice IDs
2. **Availability Response**: ElevenLabs confirms which voices are available
3. **Pool Cleanup**: Remove invalid voice IDs from processing pool
4. **Reassignment**: Redistribute chunks to use only validated voices
5. **Proceed**: Begin audio generation with verified voice pool

### Technical Requirements
- ElevenLabs API integration for voice availability checking
- Dynamic voice pool filtering
- Fallback voice assignment logic
- Real-time voice pool health monitoring
- Graceful degradation when many voices are invalid

---

## Related Files

### Backend
- `cloud-run-services/New-Synth/textProcessor.js` - Voice pool and selection logic
- `cloud-run-services/New-Synth/index.js` - Main processing endpoint

### Frontend
- `dev/artreader.art/reader/index.html` - vlist3-vlist6 override inputs
- `dev/artreader.art/mobile/index.html` - vlist3-vlist6 override inputs
- `dev/artreader.art/ElevenLabsDemo/index.html` - vlist3-vlist6 override inputs
