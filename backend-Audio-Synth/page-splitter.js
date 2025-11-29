// Page Splitting Module
// Handles conjunction and breathing gap based page splitting

const { isInProtectedRange } = require('./pagination-utils');

const DEBUG = process.env.PAGINATION_DEBUG === 'true';

function debugLog(module, message, data = null) {
  if (DEBUG) {
    console.log(`🔍 [${module}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

/**
 * Find conjunction breaks (5th priority)
 * @param {Array} words - Array of words
 * @param {Array} existingBreaks - Array of existing break indices to skip
 * @param {Array} protectedRanges - Array of protected range objects to skip
 * @returns {Array} Array of word indices where conjunctions occur (break before the conjunction)
 */
function findConjunctionBreaks(words, existingBreaks, protectedRanges = []) {
  debugLog('PAGE-SPLITTER', 'Starting conjunction break detection', { 
    wordCount: words.length, 
    existingBreaksCount: existingBreaks.length,
    protectedRangesCount: protectedRanges.length 
  });
  
  const breaks = [];
  const conjunctions = ['and', 'or', 'but', 'nor', 'yet', 'so', 'however'];
  
  for (let i = 0; i < words.length; i++) {
    // Skip if already a break point or in protected range
    if (existingBreaks.includes(i) || isInProtectedRange(i, protectedRanges)) continue;
    
    // Get word without punctuation for comparison
    const cleanWord = words[i].toLowerCase().replace(/[.,;:!?—–…-]+$/, '');
    
    // Check if word is a conjunction
    if (conjunctions.includes(cleanWord)) {
      // Create break BEFORE the conjunction (so conjunction starts next page)
      if (i > 0 && !isInProtectedRange(i - 1, protectedRanges)) {
        breaks.push(i - 1);
        debugLog('PAGE-SPLITTER', `Found conjunction break before "${cleanWord}"`, { 
          wordIndex: i, 
          breakIndex: i - 1,
          word: words[i]
        });
      }
    }
  }
  
  debugLog('PAGE-SPLITTER', 'Conjunction break detection complete', { breaksFound: breaks.length });
  
  return breaks;
}

/**
 * Apply conjunction breaks to pages longer than minPageLength
 * @param {Array} pages - Array of page objects
 * @param {Array} conjunctionBreaks - Array of word indices where conjunctions occur
 * @param {Array} wordTimestamps - Original word timestamps array
 * @param {number} minPageLength - Minimum character count to apply conjunctions (default 64)
 * @returns {Array} Array of pages with long pages split by conjunctions
 */
function applyConjunctionBreaksToLongPages(pages, conjunctionBreaks, wordTimestamps, minPageLength = 64) {
  if (!pages || pages.length === 0 || conjunctionBreaks.length === 0) {
    return pages;
  }
  
  const resultPages = [];
  
  for (const page of pages) {
    // Check if page is long enough to need conjunction splitting
    if (page.characterCount > minPageLength) {
      console.log(`🔗 [CONJUNCTION] Page ${page.pageIndex} has ${page.characterCount} chars - checking for conjunctions`);
      
      // Find which conjunction breaks fall within this page's word range
      const pageStartWordIndex = page.words[0].index - 1; // Convert to 0-based index
      const pageEndWordIndex = page.words[page.words.length - 1].index - 1;
      
      const conjunctionsInPage = conjunctionBreaks.filter(
        breakIdx => breakIdx >= pageStartWordIndex && breakIdx < pageEndWordIndex
      );
      
      if (conjunctionsInPage.length > 0) {
        console.log(`🔗 [CONJUNCTION] Found ${conjunctionsInPage.length} conjunctions in page ${page.pageIndex}`);
        
        // Split page by conjunctions
        const splitPages = splitPageByConjunctions(page, conjunctionsInPage, pageStartWordIndex);
        resultPages.push(...splitPages);
      } else {
        console.log(`🔗 [CONJUNCTION] No conjunctions found in page ${page.pageIndex}`);
        resultPages.push(page);
      }
    } else {
      // Page is short enough - keep as is
      resultPages.push(page);
    }
  }
  
  // Renumber pages with correct pageIndex
  return resultPages.map((page, index) => ({
    ...page,
    pageIndex: index
  }));
}

/**
 * Split a page by conjunction breaks
 * @param {Object} page - Page object to split
 * @param {Array} conjunctionBreaks - Array of word indices where conjunctions occur
 * @param {number} pageStartWordIndex - Starting word index of this page in full text
 * @returns {Array} Array of split page objects
 */
function splitPageByConjunctions(page, conjunctionBreaks, pageStartWordIndex) {
  if (!conjunctionBreaks || conjunctionBreaks.length === 0) {
    return [page];
  }
  
  const splitPages = [];
  let currentStart = 0;
  
  // Convert global word indices to page-local indices
  const localBreaks = conjunctionBreaks.map(idx => idx - pageStartWordIndex);
  
  // Create pages based on conjunction breaks
  for (let i = 0; i <= localBreaks.length; i++) {
    const isLastPage = i === localBreaks.length;
    const pageEnd = isLastPage ? page.words.length : localBreaks[i] + 1;
    
    const pageWords = page.words.slice(currentStart, pageEnd);
    
    if (pageWords.length > 0) {
      const pageStartTime = pageWords[0].start;
      const pageEndTime = pageWords[pageWords.length - 1].end;
      const pageText = pageWords.map(w => w.word).join(' ');
      const characterCount = pageText.length;
      
      splitPages.push({
        pageIndex: page.pageIndex,
        words: pageWords,
        startTime: pageStartTime,
        endTime: pageEndTime,
        wordCount: pageWords.length,
        characterCount: characterCount
      });
    }
    
    currentStart = pageEnd;
  }
  
  return splitPages;
}

/**
 * Apply breathing gaps to pages longer than minPageLength
 * @param {Array} pages - Array of page objects
 * @param {number} minPageLength - Minimum character count to apply breathing gaps (default 64)
 * @param {number} breathingGapThreshold - Breathing gap threshold in ms (default 75)
 * @returns {Array} Array of pages with long pages split by breathing gaps
 */
function applyBreathingGapsToLongPages(pages, minPageLength = 64, breathingGapThreshold = 60) {
  if (!pages || pages.length === 0) {
    return pages;
  }
  
  const resultPages = [];
  
  for (const page of pages) {
    // Check if page is long enough to need breathing gap splitting
    if (page.characterCount > minPageLength) {
      console.log(`📏 [BREATHING-GAP] Page ${page.pageIndex} has ${page.characterCount} chars - applying breathing gaps`);
      
      // Find breathing gaps within this page
      const breathingGaps = findBreathingGapsInPage(page, breathingGapThreshold);
      
      if (breathingGaps.length > 0) {
        console.log(`💨 [BREATHING-GAP] Found ${breathingGaps.length} breathing gaps in page ${page.pageIndex}`);
        
        // Split page by breathing gaps
        const splitPages = splitPageByBreathingGaps(page, breathingGaps);
        resultPages.push(...splitPages);
      } else {
        console.log(`💨 [BREATHING-GAP] No breathing gaps found in page ${page.pageIndex} - keeping as single page`);
        resultPages.push(page);
      }
    } else {
      // Page is short enough - keep as is
      resultPages.push(page);
    }
  }
  
  // Renumber pages with correct pageIndex
  return resultPages.map((page, index) => ({
    ...page,
    pageIndex: index
  }));
}

/**
 * Find breathing gaps (pauses) within a page
 * @param {Object} page - Page object with words array
 * @param {number} breathingGapThreshold - Threshold in ms for breathing gap (default 75)
 * @returns {Array} Array of word indices where breathing gaps occur
 */
function findBreathingGapsInPage(page, breathingGapThreshold = 60) {
  if (!page.words || page.words.length <= 1) {
    return [];
  }
  
  const breathingGaps = [];
  
  for (let i = 0; i < page.words.length - 1; i++) {
    const currentWord = page.words[i];
    const nextWord = page.words[i + 1];
    const pauseDuration = (nextWord.start - currentWord.end) * 1000;
    
    if (pauseDuration >= breathingGapThreshold) {
      breathingGaps.push(i); // Index within the page's words array
    }
  }
  
  return breathingGaps;
}

/**
 * Split a page by breathing gaps
 * @param {Object} page - Page object to split
 * @param {Array} breathingGaps - Array of word indices where breathing gaps occur
 * @returns {Array} Array of split page objects
 */
function splitPageByBreathingGaps(page, breathingGaps) {
  if (!breathingGaps || breathingGaps.length === 0) {
    return [page];
  }
  
  const splitPages = [];
  let currentStart = 0;
  
  // Create pages based on breathing gaps
  for (let i = 0; i <= breathingGaps.length; i++) {
    const isLastPage = i === breathingGaps.length;
    const pageEnd = isLastPage ? page.words.length : breathingGaps[i] + 1;
    
    const pageWords = page.words.slice(currentStart, pageEnd);
    
    if (pageWords.length > 0) {
      const pageStartTime = pageWords[0].start;
      const pageEndTime = pageWords[pageWords.length - 1].end;
      const pageText = pageWords.map(w => w.word).join(' ');
      const characterCount = pageText.length;
      
      splitPages.push({
        pageIndex: page.pageIndex, // Will be renumbered by parent function
        words: pageWords,
        startTime: pageStartTime,
        endTime: pageEndTime,
        wordCount: pageWords.length,
        characterCount: characterCount
      });
    }
    
    currentStart = pageEnd;
  }
  
  return splitPages;
}

module.exports = {
  findConjunctionBreaks,
  applyConjunctionBreaksToLongPages,
  applyBreathingGapsToLongPages
};
