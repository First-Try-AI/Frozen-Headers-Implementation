# Audio-Synth Cloud Run Service

**Purpose**: Generates audio files for audio-based reading experiences

**Payload Type**: Audio payload (text, voice, similarity, stability, style)

This directory contains the Node.js backend service responsible for handling text-to-speech synthesis for the ArT Reader application.

## Purpose

The Audio-Synth service receives text input and a set of synthesis parameters, processes the text, generates audio using the ElevenLabs API, and returns the audio files along with detailed timing and structural data for synchronized playback on the frontend.

## Key Features & Logic

-   **Text Chunking:** Automatically splits long texts into smaller, manageable chunks to meet API limitations and improve performance.
-   **Voice Selection:** Dynamically selects voices from predefined pools based on gender and speaker mode parameters.
    -   `speakerMode: 'oneVoice'` (Solo): Selects a single random voice from the specified gender pool and uses it consistently across all chunks.
    -   `speakerMode: 'readingRainbow'` (Group): Selects a different random voice for each chunk.
-   **Gender Mapping:**
    -   `voiceGender: 'female'` maps to the `higher` pitch voice pool.
    -   `voiceGender: 'male'` maps to the `lower` pitch voice pool.
    -   `voiceGender: 'shuffled'` maps to a combined pool of all voices.
-   **Audio Processing:** Generates audio files and creates detailed word- and letter-level timestamps.
-   **Pagination:** Calculates page breaks based on silence duration in the generated audio.
-   **Detailed Reporting:** The API response includes a `synthesisParams` object for each chunk, detailing the exact `voiceGender` and `speakerMode` used during generation for easier debugging.

## API Endpoint

-   **URL:** `https://new-synth-service-pyh6ygakfa-uc.a.run.app`
-   **Path:** `/process-input`
-   **Method:** `POST`

## Deployment

This service is deployed to Google Cloud Run. The deployment process is managed by the `deploy-new-synth.sh` script located in the parent `cloud-run-services` directory.
