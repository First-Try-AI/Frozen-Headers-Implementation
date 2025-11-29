// Cloud Run Audio Processing Service
// Main entry point for audio generation and processing

const express = require('express');
const cors = require('cors');
const { chunkText, structureChunk } = require('./textProcessor');
const { generateAudio, processAudioOptimized } = require('./audioProcessor');
const { generateTimestamps, createPageBreaks, uploadPaginationData, uploadToGCS, uploadWordTimestamps, uploadLetterTimestamps } = require('./outputProcessor');
const { generateLetterTimestamps, calculateTrimMarkers, filterLetterTimestamps } = require('./letter-timestamps');


const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// YON: Helper function to create full chunk display data
function createFullChunkDisplay(originalText, wordTimestamps) {
  console.log('🎨 [DISPLAY] Creating display elements for text length:', originalText.length);
  console.log('🎨 [DISPLAY] Word timestamps count:', wordTimestamps.length);
  console.log('🎨 [DISPLAY] Text preview:', originalText.substring(0, 100) + '...');
  
  // Create full chunk display structure preserving line breaks and paragraph breaks
  const displayElements = [];
  let wordIndex = 0;

  // Split text by line breaks and paragraph breaks while preserving them
  const lines = originalText.split(/(\n+)/);

  for (const line of lines) {
    if (line.match(/\n{2,}/)) {
      // Multiple consecutive newlines - create one visual break per additional newline
      const newlineCount = line.length;
      const visualBreakCount = newlineCount - 1; // Each newline beyond the first creates a visual break

      for (let i = 0; i < visualBreakCount; i++) {
        displayElements.push({
          type: 'paragraph-break',
          content: '\n\n'
        });
      }
    } else if (line === '\n') {
      // Single line break
      displayElements.push({
        type: 'line-break',
        content: '\n'
      });
    } else if (line.trim()) {
      // Check for bulleted list items
      const bulletMatch = line.match(/^(\s*)([•◦▪\-\*])\s+(.+)$/);
      if (bulletMatch) {
        // This is a bulleted list item
        const [, indentSpaces, bulletChar, content] = bulletMatch;
        const indentLevel = Math.floor(indentSpaces.length / 2); // 2 spaces = 1 indent level

        // Process content as words for timing
        const words = content.split(/\s+/).filter(w => w.length > 0);
        const startWordIndex = wordIndex;

        // Calculate timing for the entire bullet item
        let itemStartTime = 0;
        let itemEndTime = 0;
        if (words.length > 0 && wordTimestamps[startWordIndex]) {
          itemStartTime = wordTimestamps[startWordIndex].start;
          if (wordTimestamps[startWordIndex + words.length - 1]) {
            itemEndTime = wordTimestamps[startWordIndex + words.length - 1].end;
          }
        }

        displayElements.push({
          type: 'bullet-item',
          bullet: bulletChar,
          indent: indentLevel,
          content: content.trim(),
          startTime: itemStartTime,
          endTime: itemEndTime,
          wordIndex: startWordIndex
        });

        // Advance word index
        wordIndex += words.length;
      } else {
        // Check for numbered list items
        const numberedMatch = line.match(/^(\s*)(\d+\.)\s+(.+)$/);
        if (numberedMatch) {
          // This is a numbered list item
          const [, indentSpaces, numberMarker, content] = numberedMatch;
          const indentLevel = Math.floor(indentSpaces.length / 2); // 2 spaces = 1 indent level

          // Process content as words for timing
          const words = content.split(/\s+/).filter(w => w.length > 0);
          const startWordIndex = wordIndex;

          // Calculate timing for the entire numbered item
          let itemStartTime = 0;
          let itemEndTime = 0;
          if (words.length > 0 && wordTimestamps[startWordIndex]) {
            itemStartTime = wordTimestamps[startWordIndex].start;
            if (wordTimestamps[startWordIndex + words.length - 1]) {
              itemEndTime = wordTimestamps[startWordIndex + words.length - 1].end;
            }
          }

          displayElements.push({
            type: 'numbered-item',
            number: numberMarker,
            indent: indentLevel,
            content: content.trim(),
            startTime: itemStartTime,
            endTime: itemEndTime,
            wordIndex: startWordIndex
          });

          // Advance word index
          wordIndex += words.length;
        } else {
          // Regular text line - split into words
          const words = line.split(/\s+/).filter(w => w.length > 0);

      for (const word of words) {
        // Find corresponding timestamp for this word
        const wordTimestamp = wordTimestamps[wordIndex];
        if (wordTimestamp) {
          displayElements.push({
            type: 'word',
            word: word,
            startTime: wordTimestamp.start,
            endTime: wordTimestamp.end,
            wordIndex: wordTimestamp.index
          });
          wordIndex++;
        } else {
          // Word without timestamp (fallback)
          displayElements.push({
            type: 'word',
            word: word,
            startTime: 0,
            endTime: 0,
            wordIndex: wordIndex + 1
          });
          wordIndex++;
        }
      }
        }
      }
    }
  }

  console.log('🎨 [DISPLAY] Display elements created:', displayElements.length);
  console.log('🎨 [DISPLAY] Element types:', displayElements.reduce((acc, el) => {
    acc[el.type] = (acc[el.type] || 0) + 1;
    return acc;
  }, {}));
  console.log('🎨 [DISPLAY] First 5 displayElements:', displayElements.slice(0, 5));

  return {
    originalText: originalText,
    displayElements: displayElements,
    totalWords: wordTimestamps.length,
    chunkIndex: wordTimestamps.length > 0 ? wordTimestamps[0].index - 1 : 0
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'fta-synth-service'
  });
});

// Main processing endpoint - handles all text input and routing
app.post('/process-input', async (req, res) => {
  try {
    const { userText, originalParams, sessionId, customVoices, thresholds } = req.body;
    
    if (!userText || typeof userText !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid userText: text is required and must be a string' 
      });
    }

    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Invalid input: sessionId is required' 
      });
    }

    console.log(`🎯 [PROCESS-INPUT] Starting processing for session: ${sessionId}`);
    console.log(`📝 [PROCESS-INPUT] Input length: ${userText.length} characters`);

    // Step 1: Always chunk the text first
    const chunkResult = chunkText(userText);
    const chunks = chunkResult.chunks;
    console.log(`📦 [PROCESS-INPUT] Created ${chunks.length} chunks`);

    // Pre-select a single voice if in 'oneVoice' mode to ensure consistency across chunks
    let singleVoiceForSession = null;
    if (originalParams && originalParams.speakerMode === 'oneVoice') {
        // Use a temporary structure to select a voice based on the provided gender
        const tempChunk = { inputText: chunks[0] || '' }; // Use first chunk's text for context if needed
        const voiceSelectionParams = { ...originalParams };
        // Ensure no override is accidentally used for this selection process
        delete voiceSelectionParams.vovr;

        const structuredForVoice = await structureChunk(tempChunk.inputText, voiceSelectionParams, 0, 1, customVoices);
        singleVoiceForSession = structuredForVoice.voiceId;
        console.log(`[PROCESS-INPUT] 'oneVoice' mode active. Using single voice ID for all chunks: ${singleVoiceForSession}`);
    }

    // Step 2: Process all chunks with voice selection and structuring
    const structuredChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const paramsForThisChunk = { ...originalParams };
      if (singleVoiceForSession) {
          paramsForThisChunk.oneVoiceId = singleVoiceForSession;
      }
      const structuredChunk = await structureChunk(chunk, paramsForThisChunk, i, chunks.length, customVoices);
      structuredChunks.push(structuredChunk);
    }

    console.log(`🎭 [PROCESS-INPUT] Structured ${structuredChunks.length} chunks`);

    // Step 3: Route based on actual chunk count
    if (structuredChunks.length === 1) {
      console.log(`🔄 [PROCESS-INPUT] Routing to single chunk processing`);
      const result = await processSingleChunk(structuredChunks[0], sessionId, thresholds, userText);
      return res.json(result);
    } else {
      console.log(`🔄 [PROCESS-INPUT] Routing to multi-chunk processing`);
      const result = await processAllChunks(structuredChunks, sessionId, thresholds, userText);
      return res.json(result);
    }

  } catch (error) {
    console.error('❌ [PROCESS-INPUT] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error during processing',
      details: error.message 
    });
  }
});

// Internal function: Process individual chunk (used for both single and multi-chunk scenarios)
async function processIndividualChunk(structuredChunk, totalChunks, sessionId, thresholds, userText) {
  try {
    console.log(`🎵 [CHUNK] Processing chunk ${structuredChunk.chunkIndex + 1}/${totalChunks}`);

    // Generate audio
    const audioResult = await generateAudio(structuredChunk);

    // Process audio
    const processedAudio = await processAudioOptimized(audioResult, structuredChunk);

    // YON: Generate and filter letter timestamps
    const fullLetterTs = generateLetterTimestamps(processedAudio.timestampData, structuredChunk.combinedText);
    const trimMarkers = calculateTrimMarkers(fullLetterTs, structuredChunk);
    const letterTs = filterLetterTimestamps(fullLetterTs, trimMarkers);

    // YON: Generate word timestamps from filtered letter timestamps
    const wordTs = await generateTimestamps(structuredChunk, letterTs);

    // YON: Create full chunk display data preserving line breaks and paragraph breaks
    const fullChunkDisplay = createFullChunkDisplay(structuredChunk.inputText, wordTs.wordTimestamps);

    // Create page breaks for this chunk using simplified audio-driven approach
    const pageBreaksData = createPageBreaks(wordTs.wordTimestamps, thresholds);

    // Upload to GCS
    const [audioUpload, wordTsUpload, letterTsUpload] = await Promise.all([
      uploadToGCS(processedAudio, null, structuredChunk.chunkIndex, totalChunks, sessionId),
      uploadWordTimestamps(wordTs.wordTimestampsJson, sessionId, structuredChunk.chunkIndex),
      uploadLetterTimestamps(letterTs, sessionId, structuredChunk.chunkIndex)
    ]);

    console.log(`✅ [CHUNK] Completed chunk ${structuredChunk.chunkIndex + 1}`);

    return {
      chunkIndex: structuredChunk.chunkIndex,
      inputText: structuredChunk.inputText, // YON - Add raw text to response
      originalText: userText, // YON - Add full original text for line break preservation
      fullChunkDisplay: fullChunkDisplay, // YON: Add full chunk display data
      audioUrl: audioUpload.audioUrl,
      timestampsUrl: wordTsUpload.url,
      letterTimestampsUrl: letterTsUpload.url, // YON: Add new URL
      pages: pageBreaksData.pages, // Pass page data directly
      wordCount: wordTs.wordCount,
      totalDuration: wordTs.totalDuration,
      voiceUsed: audioResult.voiceUsed, // YON: Add voice ID used
      fallbackUsed: audioResult.fallbackUsed, // YON: Add fallback info
      synthesisParams: {
        speed: structuredChunk.speed,
        stability: structuredChunk.stability,
        similarityBoost: structuredChunk.similarityBoost,
        styleExaggeration: structuredChunk.styleExaggeration,
        voiceGender: structuredChunk.voiceGender, // YON: Add for debugging
        speakerMode: structuredChunk.speakerMode // YON: Add for debugging
      },
      pagination: {
        totalBreaks: pageBreaksData.summary.totalBreaks,
        totalWords: pageBreaksData.summary.totalWords,
        thresholdUsed: pageBreaksData.summary.thresholdUsed,
        totalPages: pageBreaksData.summary.totalPages
      }
    };
  } catch (error) {
    console.error(`❌ [CHUNK] Error processing chunk ${structuredChunk.chunkIndex + 1}:`, error);
    throw error;
  }
}

// Internal function: Process single chunk
async function processSingleChunk(structuredChunk, sessionId, thresholds, userText) {
  try {
    console.log(`🎵 [SINGLE] Processing single chunk`);

    const chunkData = await processIndividualChunk(structuredChunk, 1, sessionId, thresholds, userText);

    return {
      success: true,
      sessionId: sessionId,
      totalChunks: 1,
      chunks: [chunkData],
      summary: {
        totalWords: chunkData.wordCount,
        totalDuration: chunkData.totalDuration,
        totalPageBreaks: chunkData.pagination.totalBreaks
      }
    };

  } catch (error) {
    console.error(`❌ [SINGLE] Error processing chunk:`, error);
    throw error;
  }
}

// Internal function: Process all chunks with batched parallel processing
async function processAllChunks(structuredChunks, sessionId, thresholds, userText) {
  try {
    console.log(`🎵 [MULTI] Processing ${structuredChunks.length} chunks with batched parallel processing`);
    
    const results = [];
    let totalPageBreaks = 0;
    let totalWords = 0;
    let totalDuration = 0;
    const CONCURRENT_LIMIT = 4; // Balanced for performance while avoiding upload conflicts

    // Process chunks in batches to respect ElevenLabs concurrency limits
    for (let batchStart = 0; batchStart < structuredChunks.length; batchStart += CONCURRENT_LIMIT) {
      const batchEnd = Math.min(batchStart + CONCURRENT_LIMIT, structuredChunks.length);
      const batch = structuredChunks.slice(batchStart, batchEnd);
      const batchNumber = Math.floor(batchStart / CONCURRENT_LIMIT) + 1;
      const totalBatches = Math.ceil(structuredChunks.length / CONCURRENT_LIMIT);
      
      console.log(`🎵 [MULTI] Processing batch ${batchNumber}/${totalBatches}: chunks ${batchStart + 1}-${batchEnd}`);

      // Process batch chunks in parallel using Promise.all
      const batchPromises = batch.map(async (structuredChunk) => {
        return await processIndividualChunk(structuredChunk, structuredChunks.length, sessionId, thresholds, userText);
      });

      // Wait for all chunks in this batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Accumulate results from this batch
      for (const result of batchResults) {
        results.push({
          chunkIndex: result.chunkIndex,
          inputText: result.inputText, // YON - Add raw text to response
          originalText: result.originalText, // YON - Add full original text for line break preservation
          fullChunkDisplay: result.fullChunkDisplay, // YON: Add full chunk display data
          audioUrl: result.audioUrl,
          timestampsUrl: result.timestampsUrl,
          letterTimestampsUrl: result.letterTimestampsUrl, // YON: Add new URL
          pages: result.pages, // Pass page data directly
          wordCount: result.wordCount,
          totalDuration: result.totalDuration,
          voiceUsed: result.voiceUsed, // YON: Add voice ID used
          fallbackUsed: result.fallbackUsed, // YON: Add fallback info
          synthesisParams: result.synthesisParams, // YON: FIX - Pass through the synthesis params
          pagination: result.pagination
        });
        
        totalPageBreaks += result.pagination.totalBreaks;
        totalWords += result.wordCount;
        totalDuration += result.totalDuration;
      }
      
      console.log(`✅ [MULTI] Batch ${batchNumber}/${totalBatches} completed (${batchResults.length} chunks)`);
    }

    // Sort results by chunk index to maintain proper order
    results.sort((a, b) => a.chunkIndex - b.chunkIndex);

    console.log(`✅ [MULTI] All chunks processed successfully`);
    console.log(`📊 [MULTI] Total: ${totalWords} words, ${totalDuration.toFixed(2)}s duration`);

    return {
      success: true,
      sessionId: sessionId,
      totalChunks: structuredChunks.length,
      chunks: results,
      summary: {
        totalWords: totalWords,
        totalDuration: totalDuration,
        totalPageBreaks: totalPageBreaks
      }
    };

  } catch (error) {
    console.error(`❌ [MULTI] Error processing chunks:`, error);
    throw error;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 [SERVER] FTA Synth Service running on port ${PORT}`);
  console.log(`📡 [SERVER] Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 [SERVER] Main endpoint: http://localhost:${PORT}/process-input`);
});

module.exports = app;