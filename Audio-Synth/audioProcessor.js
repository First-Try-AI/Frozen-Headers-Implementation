// Audio Generation and Processing Module
// Handles ElevenLabs API calls and FFmpeg audio processing

const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { calculateTrimMarkers } = require('./letter-timestamps'); // YON - Import new function

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Voice fallback configuration
const VOICE_FALLBACK_ORDER = [
  '5kMbtRSEKIkRZSdXxrZg',  // First fallback for any failure
  '0wH0jvEaKFYagIQkhqeG',  // Third fallback for additional failures
  'sgk995upfe3tYLvoGcBN',  // Fourth fallback for additional failures
  'okHxMu8VqPJSDzvWl7jh'   // Fifth fallback for additional failures
];

// Generate audio using ElevenLabs API with improved voice fallback
async function generateAudio(structuredChunk, fallbackAttempt = 0) {
  const apiKey = process.env.ELEVENLABS_TTS_ENT;
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_TTS_ENT API key");
  }

  const voice_settings = {
    stability: structuredChunk.stability,
    similarity_boost: structuredChunk.similarityBoost,
    style_exaggeration: structuredChunk.styleExaggeration,
    use_speaker_boost: false
  };

  // Determine which voice to use
  let voiceIdToUse;
  if (fallbackAttempt === 0) {
    voiceIdToUse = structuredChunk.voiceId;
  } else {
    const fallbackIndex = (fallbackAttempt - 1) % VOICE_FALLBACK_ORDER.length;
    voiceIdToUse = VOICE_FALLBACK_ORDER[fallbackIndex];
  }

  try {
    console.log(`🎤 [AUDIO] Generating audio with voice: ${voiceIdToUse} (attempt ${fallbackAttempt + 1})`);
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceIdToUse}/with-timestamps`,
      {
        text: structuredChunk.combinedText,
        model_id: structuredChunk.modelId,
        voice_settings
      },
      {
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        timeout: 60000
      }
    );

    console.log(`✅ [AUDIO] Audio generated successfully with voice: ${voiceIdToUse}`);
    return {
      audio_base64: response.data.audio_base64,
      alignment: response.data.alignment,
      voiceUsed: voiceIdToUse,
      privacyText: structuredChunk.privacyText,
      tailText: structuredChunk.tailText,
      fallbackUsed: fallbackAttempt > 0,
      fallbackAttempt: fallbackAttempt
    };
        
  } catch (error) {
    // Handle voice fallback for 404 (invalid voice) or other API errors
    if (error.response?.status === 404 || error.response?.status >= 500) {
      const maxFallbacks = VOICE_FALLBACK_ORDER.length;
      
      if (fallbackAttempt < maxFallbacks) {
        console.log(`⚠️ [AUDIO] Voice ${voiceIdToUse} failed (${error.response?.status}), trying fallback ${fallbackAttempt + 1}/${maxFallbacks}`);
        return await generateAudio(structuredChunk, fallbackAttempt + 1);
      } else {
        console.error(`❌ [AUDIO] All voice fallbacks exhausted after ${maxFallbacks} attempts`);
        throw new Error(`Audio generation failed: All voice fallbacks exhausted. Last error: ${error.message}`);
      }
    }
    
    // For other errors, don't retry
    console.error(`❌ [AUDIO] Audio generation failed with non-retryable error:`, error.message);
    throw new Error(`Audio generation failed: ${error.message}`);
  }
}

// Optimized audio processing function with volume normalization
async function processAudioOptimized(audioResult, structuredChunk) {
  const chunkId = `chunk${structuredChunk.chunkIndex}`;
  const firstTryPath = path.join(os.tmpdir(), `audio_${chunkId}_full.mp3`);
  const processedPath = path.join(os.tmpdir(), `audio_${chunkId}_processed.mp3`);

  try {
    // Write base64 audio to temporary file
    await fs.writeFile(firstTryPath, Buffer.from(audioResult.audio_base64, "base64"));
    console.log(`🎵 [AUDIO] Decoded base64 audio to temporary file`);

    // YON - New Trim Logic
    // Use the precise character-counting method to determine trim points.
    const fullLetterTimestamps = {
        letters: audioResult.alignment.characters.map((char, index) => ({
            character: char,
            startTime: audioResult.alignment.character_start_times_seconds[index],
            endTime: audioResult.alignment.character_end_times_seconds[index]
        })),
        totalDuration: audioResult.alignment.character_end_times_seconds[audioResult.alignment.character_end_times_seconds.length - 1]
    };

    const trimMarkers = calculateTrimMarkers(fullLetterTimestamps, structuredChunk);
    const { privacyCutTime, tailCutTime } = trimMarkers;

    console.log(`✂️ [AUDIO] Trimming audio precisely from ${privacyCutTime.toFixed(3)}s to ${tailCutTime.toFixed(3)}s`);

    // Process audio with FFmpeg
    return new Promise((resolve, reject) => {
      ffmpeg(firstTryPath)
        .inputOptions([
          `-ss ${privacyCutTime.toFixed(3)}`,
          `-to ${tailCutTime.toFixed(3)}`
        ])
        .outputOptions([
          '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',  // Audio normalization
          '-ar', '44100'  // Sample rate
        ])
        .output(processedPath)
        .on('end', async () => {
          try {
            // Clean up temporary file
            await fs.unlink(firstTryPath);
            console.log(`✅ [AUDIO] Audio processing completed successfully`);
            
            resolve({
              filePath: processedPath,
              privacyCutTime,
              tailCutTime,
              duration: tailCutTime - privacyCutTime,
              timestampData: audioResult.alignment, // Pass full alignment data
              usedNormalize: true,
              voiceUsed: audioResult.voiceUsed,
              fallbackUsed: audioResult.fallbackUsed || false
            });
          } catch (cleanupError) {
            console.error(`⚠️ [AUDIO] Cleanup error:`, cleanupError.message);
            resolve({
              filePath: processedPath,
              privacyCutTime,
              tailCutTime,
              duration: tailCutTime - privacyCutTime,
              timestampData: audioResult.alignment, // Pass full alignment data
              usedNormalize: true,
              voiceUsed: audioResult.voiceUsed,
              fallbackUsed: audioResult.fallbackUsed || false
            });
          }
        })
        .on('error', async (err) => {
          try {
            // Clean up files on error
            await fs.unlink(firstTryPath);
            await fs.unlink(processedPath);
          } catch (cleanupError) {
            console.error(`⚠️ [AUDIO] Cleanup error during failure:`, cleanupError.message);
          }
          console.error(`❌ [AUDIO] FFmpeg processing failed:`, err.message);
          reject(new Error(`Audio processing failed: ${err.message}`));
        })
        .run();
    });

  } catch (error) {
    console.error(`❌ [AUDIO] Audio processing error:`, error.message);
    throw new Error(`Audio processing failed: ${error.message}`);
  }
}

module.exports = {
  generateAudio,
  processAudioOptimized
};