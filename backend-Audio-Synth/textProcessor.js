// Text and Voice Preparation Module
// Handles text processing, voice selection, chunk structuring, and text chunking

// Configuration for voices and text processing
const CONFIG = {
  voices: {
    lower: [
      "0wH0jvEaKFYagIQkhqeG", "okHxMu8VqPJSDzvWl7jh",
      "vSvM9si9z6a4MMdKdS2T", "lP1EpPqqTU5DCn2ga6OD", "CJgwg9MvsyDQ2txugmBS",
      "r3FEfrSVUzCHT11RX0l4", "Gpn64ViAPE8OHwnBHpEs", "BFRpaxrEUROGMFK7LBRT",
      "s2fH3npO5HyoVpalFy6U", "ZCtBm65V5P2WRgHF7fKI", "hH2PlxWs8rI3FQNdgREU",
      "OMXq6p1ijZGeOlsJ8Jqx", "4f33a3SNP16KjO2dgHZI", "hYjzO0gkYN6FIXTHyEpi",
      "JPebmqlSqzZByHeisFPx", "KH1SQLVulwP6uG4O3nmT", "U9wNM2BNANqtBCawWLgA",
      "2xwsH0780nkIQ684Jc5B", "0pa5K4pOrbnP5VS5eH6k", "MIOw3GwXZZcvnQHYJjnQ",
      "pQrnUyGDD4ly2kvGWkxx", "UOsudtiwQVrIvIRyyCHn", "zbmGm4vYKNMh5E1BId36",
      "3zAVc87GARsxcj72rLUF", "0AvU52GOBJWaslYtDQbj", "43EwOfIMJShg3J9RLxZJ",
      "f7vvnP66omATFbJFopnZ", "PnTU6nhvGLMS2NnGWPkh",
      "CGv6jJfHyvyDsrhuAjcD", "8BWxz4Gm4lqwJSfubGb8", "KmI10VzYBh5TR7PksDcc",
      "iyZZ2rpPw5XY3ZQltAWV", "pfasRj3s2OHQc2pPkjCK", "q1UaN10vD9lUfZW8F8QL",
      "YociFXwrcIMVxaNzLvDg", "Hsmirri4X6khvaZNtgT5", "gWaDC0oXAheKoZfljzuI",
      "SVdvKlYuyNTd1xzQqWD", "Q2ELiWzbuj5F0eFHXK6S", "eWNJGO7R0mtZgW8BqJYN",
      "W78pxv1enhu0qj6t6IaC", "s3TPKV1kjDlVtZbl4Ksh", "IRHApOXLvnW57QJPQH2P",
      "xKhbyU7E3bC6T89Kn26c", "FRfK9ktUgII8Yh5EUCn1", "XLGOsWMj26dAyK7wHEfW",
      "TPH31dCvEQ2aybIZHorF", "TwDvT7Iy9phe6BzylUWu", "uShMnNluVYEPk3ah7RIY",
      "VjifOP4EZWYK9ddB8CTV", "S9UjcNYIwfBOtZiDnIQT", "mNDAlXbiDkuVNwYWVP7R",
      "uaoDE0wnDOzhW8B5hUik", "0Eut1K2uVqd2FAP2i4XV", "jR6tjweqjDI3m7B2nd5t",
      "QCOsaFukRxK1IUh7WVlM", "L1xUIshtTbSBoOSqBFaP", "PSqRw3ln34TxQZrTS6Wt",
      "h1i3CVVBUuF6s46cxUGG", "6UIMccPL5WP8B6KSdFsI", "xTZlmU8dKXdyk4XGYGFg",
      "ErXwobaYiN019PkySvjV", "oQV06a7Gn8pbCJh5DXcO", "Xce1lRzKiSUZR2PHTgse",
      "rStTjtRBJU23YM0JaoOV", "IFEvkitzF8OoHeggkJUu", "AOLUVLMs1jzrUpQeAea8",
      "sfJopaWaOtauCD3HKX6Q", "I4TdxxdceksGRDmeu7Nz", "oEANnwelxbJ5RG7TqeKx",
      "4Tha3hqCsECEKz5JttmV", "pVYHFs8oaIDPWJxvmXWW", "oUbjcKlrUrhnYf9kwdmI",
      "LEfbhb9oqtzxg1yUjOqk", "IjL0wC6VWrQy6wdG6YzT", "p28fY1cl6tovhD2M4WEH",
      "QYrOVogqhHWUzdZFXf0E", "K8RBkZM3VaxoGBaGvie0",
      "YmP1fAL2C7KGze05u879", "vVnXvLYPFjIyE2YrjUBE", "hnu83udpXxIAiBp91Ci5",
      "PGoKnSD4gKn2aS99wOR2", "8xSjPf9a1DglAuS3xmDz", "IKne3meq5aSn9XLyUdCD",
      "iP95p4xoKVk53GoZ742B", "TYkIHhDWzXPHalxGXze5",
      "7JxUWWyYwXK8kmqmKEnT", "wyWA56cQNU2KqUW4eCsI", "p4obTiHKLtDPScKL6P2f",
      "6TFhsqnoNUsm5YZhNJ8L", "u8GDilEiJPUbRk87Lcqs", "MlHIkPdx2ZF9MhznglHQ"
    ],
    higher: [
      "8N2ng9i2uiUWqstgmWlH", "sgk995upfe3tYLvoGcBN", "0s2MqkqwzPYZVFGZpMXE",
      "1eHrpOW5l98cxiSRjbzJ", "1rnYMVDXZksVr6x7pZPX", "1Z7Y8o9cvUeWq8oLKgMY",
      "5vkxOzoz40FrElmLP4P7", "6JsmTroalVewG1gA6Jmw", "8tEnOGk5amLt4MjXVe6w",
      "BewlJwjEWiFLWoXrbGMf", "JSWO6cw2AyFE324d5kEr", "khYwAWwYSjlxlcrwGQ16",
      "oflwtV9KmZO1p0N9Rv4x", "p9aflnsbBe1o0aDeQa97", "RABOvaPec1ymXz02oDQi",
      "T3b0vsQ5dQwMZ5ckOwBk", "WZlYpi1yf6zJhNWXih74", "XeomjZYoU5rr4yNIg16w"
    ]
  },
  synthesis: {
    modelId: "eleven_turbo_v2",
    stability: 0.50,
    similarityBoost: 0.69,
    styleExaggeration: 0.50,
    ssmlVersion: null,
    xmlLang: "en-US"
  },
  audio: {
    maxChunkSize: 420,
    maxInputSize: 15000,
    speed: {
      min: 0.5,
      max: 2.0,
      default: 0.85
    }
  },
  text: {
    calmScript: "<break/> <break/> I am here to speak with a calm and balanced tone. My delivery will be steady, clear, and without added emotion, so that each word comes through plainly and evenly. <break/> <break/>",
    tailText: "<break/> <break/> This has been a brief moment of speech. Once these words finish, I will fade. Thank you for your time. Goodbye. <break/> <break/>"
  }
};

// Utility functions for text and voice processing
const Utils = {
  selectVoice(voiceGender, vovr, voiceMode, oneVoiceId, chunkIndex) {
    if (vovr) {
      return vovr;
    }
    if (voiceMode === 'oneVoice' && oneVoiceId) {
      return oneVoiceId;
    }
    let pool;
    if (voiceGender === 'shuffled') {
      pool = [...CONFIG.voices.lower, ...CONFIG.voices.higher];
    } else {
      pool = voiceGender === "female" ? CONFIG.voices.higher : CONFIG.voices.lower;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  },

  processText(inputText) {
    const processed = inputText.trim()
      .replace(/\n\n/g, ' <break/> <break/> ')
      .replace(/\n/g, ' <break/> ');
    
    return {
      inputText: inputText.trim(),
      processedText: processed,
      combinedText: `${CONFIG.text.calmScript} <break/> <break/> ${processed} <break/> <break/> ${CONFIG.text.tailText}`
    };
  },

  normalizeSpeed(speed) {
    return Math.max(CONFIG.audio.speed.min, Math.min(CONFIG.audio.speed.max, Number(speed) || CONFIG.audio.speed.default));
  },

  // Text chunking utilities
  validateInput(input) {
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      throw new Error('Input must be a non-empty string');
    }
    return input.trim();
  },

  calculateChunkSize(inputLength) {
    return CONFIG.audio.maxChunkSize;
  }
};

// Text chunking functions
function smartChunkText(text, targetSize, maxSize) {
  const chunks = [];
  let remaining = text;
    
  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining.trim());
      break;
    }
      
    const splitPoint = findBestSplitPoint(remaining, targetSize, maxSize);
    const chunk = remaining.substring(0, splitPoint).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
      
    remaining = remaining.substring(splitPoint).trim();
  }
    
  return chunks;
}

function findBestSplitPoint(text, targetSize, maxSize) {
  if (text.length <= targetSize) {
    return text.length;
  }
    
  const searchRangeStart = Math.max(0, targetSize - 150);
  const searchRangeEnd = Math.min(text.length, maxSize);
    
  // First priority: paragraph breaks (double newlines)
  const paragraphBreak = findLastOccurrence(text, '\n\n', searchRangeStart, searchRangeEnd);
  if (paragraphBreak !== -1) {
    return paragraphBreak + 2;
  }
    
  // Second priority: single newlines (potential paragraph boundaries)
  const newlineBreak = findLastOccurrence(text, '\n', searchRangeStart, searchRangeEnd);
  if (newlineBreak !== -1) {
    return newlineBreak + 1;
  }
    
  // Third priority: sentence endings (period, exclamation, question mark)
  const sentencePatterns = [
    { pattern: '. ', offset: 2 },
    { pattern: '! ', offset: 2 },
    { pattern: '? ', offset: 2 }
  ];
    
  for (const { pattern, offset } of sentencePatterns) {
    const position = findLastOccurrence(text, pattern, searchRangeStart, searchRangeEnd);
    if (position !== -1) {
      return position + offset;
    }
  }
    
  // Fourth priority: other punctuation that might indicate natural breaks
  const otherPatterns = [
    { pattern: '; ', offset: 2 },
    { pattern: ': ', offset: 2 },
    { pattern: ', ', offset: 2 }
  ];
    
  for (const { pattern, offset } of otherPatterns) {
    const position = findLastOccurrence(text, pattern, searchRangeStart, searchRangeEnd);
    if (position !== -1) {
      return position + offset;
    }
  }
    
  // Last resort: space boundaries (but never cut mid-word)
  const spaceBreak = findLastOccurrence(text, ' ', searchRangeStart, searchRangeEnd);
  if (spaceBreak !== -1) {
    return spaceBreak + 1;
  }
    
  // If we can't find any good break point, we must cut at maxSize
  // This should rarely happen with the expanded search range
  return maxSize;
}

function findLastOccurrence(text, pattern, start, end) {
  let bestPosition = -1;
    
  for (let i = start; i <= end - pattern.length; i++) {
    if (text.substring(i, i + pattern.length) === pattern) {
      bestPosition = i;
    }
  }
    
  return bestPosition;
}

// Main function to structure a chunk for processing
async function structureChunk(chunkText, originalParams, chunkIndex, totalChunks, customVoices) {
  const { voiceGender, vovr, speed, speakerMode } = originalParams || {};
  const voiceMode = speakerMode || 'readingRainbow';
  const oneVoiceId = originalParams?.oneVoiceId;

  let selectedVoiceId;
  if (Array.isArray(customVoices) && customVoices.length > 0) {
    if (voiceMode === 'oneVoice') {
      selectedVoiceId = customVoices[0];
    } else {
      const idx = (chunkIndex - 1) % customVoices.length;
      selectedVoiceId = customVoices[idx];
    }
  } else {
    selectedVoiceId = Utils.selectVoice(voiceGender, vovr, voiceMode, oneVoiceId, chunkIndex);
  }
  
  const textProcessing = Utils.processText(chunkText);
      
  return {
    inputText: textProcessing.inputText,
    privacyText: CONFIG.text.calmScript,
    tailText: CONFIG.text.tailText,
    combinedText: textProcessing.combinedText,
    processedInputText: textProcessing.processedText,
    voiceId: selectedVoiceId,
    voiceGender: voiceGender, // Pass this through
    speakerMode: voiceMode, // Pass this through
    modelId: CONFIG.synthesis.modelId,
    speed: Utils.normalizeSpeed(speed),
    stability: CONFIG.synthesis.stability,
    similarityBoost: CONFIG.synthesis.similarityBoost,
    styleExaggeration: CONFIG.synthesis.styleExaggeration,
    chunkIndex,
    totalChunks
  };
}

// Primary chunking function - splits by marker and handles edge cases
function primaryChunkByMarker(userText, marker) {
  // Split by marker
  const rawChunks = userText.split(marker);

  // Trim each chunk and filter out empty chunks
  const filteredChunks = rawChunks
    .map(chunk => chunk.trim())  // Trim leading/trailing whitespace
    .filter(chunk => chunk.length > 0);  // Remove empty chunks

  return {
    chunks: filteredChunks,
    chunkCount: filteredChunks.length,
    originalLength: userText.length,
    markerUsed: marker
  };
}

// Secondary chunking function - traditional punctuation-based chunking
function secondaryChunkText(inputText) {
  const validatedText = Utils.validateInput(inputText);
  const inputLength = validatedText.length;

  // Check if input exceeds maximum allowed size
  if (inputLength > CONFIG.audio.maxInputSize) {
    throw new Error(`Input text (${inputLength} characters) exceeds maximum allowed size of ${CONFIG.audio.maxInputSize} characters`);
  }

  // If text is small enough, return as single chunk
  if (inputLength <= CONFIG.audio.maxChunkSize) {
    return {
      chunks: [validatedText],
      chunkCount: 1,
      originalLength: inputLength,
      chunkLengths: [inputLength],
      targetChunkSize: inputLength
    };
  }

  // Calculate target chunk size and create chunks
  const targetChunkSize = Utils.calculateChunkSize(inputLength);
  const chunks = smartChunkText(validatedText, targetChunkSize, CONFIG.audio.maxChunkSize);

  return {
    chunks: chunks,
    chunkCount: chunks.length,
    originalLength: inputLength,
    chunkLengths: chunks.map(c => c.length),
    targetChunkSize: targetChunkSize
  };
}

// Main function to chunk text and prepare for processing
function chunkText(inputText) {
  const marker = '///';

  // Check if text contains the marker
  if (inputText.includes(marker)) {
    // Primary chunking by marker
    const primaryResult = primaryChunkByMarker(inputText, marker);
    const finalChunks = [];

    // Secondary chunking for oversized primary chunks
    for (const chunk of primaryResult.chunks) {
      if (chunk.length <= CONFIG.audio.maxChunkSize) {
        finalChunks.push(chunk);
      } else {
        // Use secondary chunking for oversized chunks
        const secondaryResult = secondaryChunkText(chunk);
        finalChunks.push(...secondaryResult.chunks);
      }
    }

    return {
      chunks: finalChunks,
      chunkCount: finalChunks.length,
      originalLength: inputText.length,
      markerUsed: marker,
      primaryChunks: primaryResult.chunkCount,
      secondaryChunks: finalChunks.length - primaryResult.chunkCount
    };
  } else {
    // Original behavior - no marker found, use traditional chunking
    return secondaryChunkText(inputText);
  }
}

module.exports = {
  CONFIG,
  Utils,
  structureChunk,
  chunkText,
  secondaryChunkText,
  primaryChunkByMarker,
  smartChunkText,
  findBestSplitPoint,
  findLastOccurrence
};