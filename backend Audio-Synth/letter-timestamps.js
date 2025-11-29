// Letter Timestamp Generation Module
// This module contains the core logic for creating, trimming, and filtering
// letter-level timestamps, adapted from the art-reader-backend.

/**
 * Generates letter timestamps from the raw alignment data returned by ElevenLabs.
 * @param {object} alignmentData - The alignment object from the ElevenLabs API response.
 * @param {string} combinedText - The full text sent to ElevenLabs, including privacy/tail.
 * @returns {object} An object containing the letter timestamps and metadata.
 */
function generateLetterTimestamps(alignmentData, combinedText) {
  console.log(`🔤 [LETTER-TS] Generating letter timestamps from alignment data`);
  
  if (!alignmentData || !alignmentData.characters || !alignmentData.characters.length) {
    throw new Error('Invalid alignment data: missing characters array');
  }

  const characters = alignmentData.characters;
  const startTimes = alignmentData.character_start_times_seconds;
  const endTimes = alignmentData.character_end_times_seconds;

  if (characters.length !== startTimes.length || characters.length !== endTimes.length) {
    throw new Error('Alignment data mismatch: character, start, and end arrays must have same length');
  }

  const letterTimestamps = characters.map((char, index) => ({
    character: char,
    startTime: startTimes[index],
    endTime: endTimes[index],
    position: index
  }));

  console.log(`✅ [LETTER-TS] Generated ${letterTimestamps.length} letter timestamps`);
  
  return {
    letters: letterTimestamps,
    totalDuration: endTimes[endTimes.length - 1],
    characterCount: characters.length,
    text: combinedText
  };
}

/**
 * Calculates the precise start and end times for trimming audio.
 * This is based on the character counts of the privacy and user text.
 * @param {object} letterTimestamps - The full object from generateLetterTimestamps.
 * @param {object} structuredChunk - The structured chunk object with text details.
 * @returns {object} An object containing the precise cut times and positions.
 */
function calculateTrimMarkers(letterTimestamps, structuredChunk) {
  console.log(`✂️ [TRIM-MARKERS] Calculating privacy and tail trim markers`);
  
  const { privacyText, processedInputText } = structuredChunk;
  const breakSequence = " <break/> <break/> ";
  
  const privacyCutPosition = privacyText.length + breakSequence.length;
  const tailCutPosition = privacyCutPosition + processedInputText.length;
  
  console.log(`📏 [TRIM-MARKERS] Privacy cut at character ${privacyCutPosition}`);
  console.log(`📏 [TRIM-MARKERS] Tail cut at character ${tailCutPosition}`);
  
  let privacyCutTime = 0;
  let tailCutTime = letterTimestamps.totalDuration;

  // Find the end time of the character just before the user content starts.
  if (privacyCutPosition > 0 && privacyCutPosition <= letterTimestamps.letters.length) {
    privacyCutTime = letterTimestamps.letters[privacyCutPosition - 1].endTime;
  }

  // Find the start time of the character where the tail script begins.
  if (tailCutPosition < letterTimestamps.letters.length) {
    tailCutTime = letterTimestamps.letters[tailCutPosition].startTime;
  }
  
  console.log(`⏰ [TRIM-MARKERS] Privacy cut at ${privacyCutTime.toFixed(3)}s`);
  console.log(`⏰ [TRIM-MARKERS] Tail cut at ${tailCutTime.toFixed(3)}s`);
  
  return {
    privacyCutTime,
    tailCutTime,
    privacyCutPosition,
    tailCutPosition
  };
}

/**
 * Filters the full letter timestamps to include only the user's content.
 * It also adjusts the timestamps to be zero-based, matching the trimmed audio.
 * @param {object} letterTimestamps - The full object from generateLetterTimestamps.
 * @param {object} trimMarkers - The object from calculateTrimMarkers.
 * @returns {object} A new object with the filtered and adjusted letter timestamps.
 */
function filterLetterTimestamps(letterTimestamps, trimMarkers) {
  console.log(`🔍 [FILTER-LETTERS] Filtering letter timestamps to user content`);
  
  const { privacyCutTime, tailCutTime } = trimMarkers;
  const { letters } = letterTimestamps;
  
  const filteredLetters = letters.filter(letter => 
    letter.startTime >= privacyCutTime && letter.endTime <= tailCutTime
  );
  
  const adjustedLetters = filteredLetters.map(letter => ({
    ...letter,
    startTime: letter.startTime - privacyCutTime,
    endTime: letter.endTime - privacyCutTime
  }));
  
  const filteredDuration = tailCutTime - privacyCutTime;
  
  console.log(`✅ [FILTER-LETTERS] Filtered to ${adjustedLetters.length} letters`);
  console.log(`⏱️ [FILTER-LETTERS] New duration: ${filteredDuration.toFixed(3)}s`);
  
  return {
    letters: adjustedLetters,
    totalDuration: filteredDuration,
    characterCount: adjustedLetters.length,
    originalStartTime: privacyCutTime
  };
}

module.exports = {
  generateLetterTimestamps,
  calculateTrimMarkers,
  filterLetterTimestamps
};



