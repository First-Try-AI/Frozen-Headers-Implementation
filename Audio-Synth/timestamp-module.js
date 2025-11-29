// Timestamp Generation Module
// Handles word timestamp generation from filtered letter-level timestamp data.

/**
 * Generates word timestamps by mapping words to their corresponding, pre-filtered
 * and zero-based letter timestamps. This ensures perfect sync with trimmed audio.
 * @param {object} structuredChunk - The structured chunk with original text.
 * @param {object} filteredLetterTimestamps - The clean, user-content-only letter timestamps.
 * @returns {object} An object containing word timestamps and metadata.
 */
async function generateTimestamps(structuredChunk, filteredLetterTimestamps) {
  const userInputText = structuredChunk.inputText;
  const letters = filteredLetterTimestamps.letters;
  const chunkIndex = structuredChunk.chunkIndex;

  if (!letters || letters.length === 0) {
    console.warn(`[TIMESTAMPS] No letter timestamps provided for chunk ${chunkIndex}.`);
    return {
      wordTimestamps: [],
      wordTimestampsJson: JSON.stringify({ originalText: userInputText, words: [] }),
      wordCount: 0,
      totalDuration: 0
    };
  }

  const words = userInputText.trim().split(/\s+/).filter(w => w.length > 0);
  const letterString = letters.map(l => l.character).join('');
  
  const wordTimestamps = [];
  let searchOffset = 0;

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    const wordPos = letterString.indexOf(word, searchOffset);

    if (wordPos === -1) {
      console.warn(`[TIMESTAMPS] Word "${word}" not found in letter string for chunk ${chunkIndex}.`);
      continue;
    }

    const wordStartLetterIndex = wordPos;
    const wordEndLetterIndex = wordPos + word.length - 1;

    if (wordStartLetterIndex >= letters.length || wordEndLetterIndex >= letters.length) {
      console.warn(`[TIMESTAMPS] Word "${word}" boundary exceeds letter array length.`);
      continue;
    }

    const startTime = letters[wordStartLetterIndex].startTime;
    const endTime = letters[wordEndLetterIndex].endTime;

    wordTimestamps.push({
      word,
      start: Math.round(startTime * 1000) / 1000,
      end: Math.round(endTime * 1000) / 1000,
      index: wordIndex + 1
    });

    searchOffset = wordPos + word.length;
  }

  const totalDuration = wordTimestamps.length > 0 ? wordTimestamps[wordTimestamps.length - 1].end : 0;
  const enhancedStructure = {
    originalText: userInputText,
    processedText: userInputText, // Keeping for compatibility
    totalDuration: Math.round(totalDuration * 1000) / 1000,
    partIndex: chunkIndex,
    words: wordTimestamps
  };

  return {
    wordTimestamps,
    wordTimestampsJson: JSON.stringify(enhancedStructure),
    wordCount: wordTimestamps.length,
    totalDuration: enhancedStructure.totalDuration
  };
}

module.exports = {
  generateTimestamps
};