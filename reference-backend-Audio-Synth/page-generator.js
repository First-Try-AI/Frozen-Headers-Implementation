// Page Generation Module
// Handles page creation and gap elimination

const DEBUG = process.env.PAGINATION_DEBUG === 'true';

function debugLog(module, message, data = null) {
  if (DEBUG) {
    console.log(`🔍 [${module}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

/**
 * Generate pages array from page breaks and word timestamps
 * @param {Array} wordTimestamps - Array of word timestamp objects
 * @param {Array} pageBreaks - Array of word indices where breaks occur
 * @returns {Array} Array of page objects with words, startTime, endTime
 */
function generatePagesFromBreaks(wordTimestamps, pageBreaks) {
  debugLog('PAGE-GENERATOR', 'Starting page generation', { 
    wordTimestampsCount: wordTimestamps?.length || 0, 
    pageBreaksCount: pageBreaks?.length || 0 
  });
  
  if (!wordTimestamps || wordTimestamps.length === 0) {
    console.error('❌ [PAGINATION] generatePagesFromBreaks: wordTimestamps is empty');
    throw new Error('Cannot generate pages: wordTimestamps is empty');
  }
  
  const sortedBreaks = [...pageBreaks].sort((a, b) => a - b);
  const pages = [];
  
  let currentPageStart = 0;
  
  // Create pages based on break points
  for (let i = 0; i <= sortedBreaks.length; i++) {
    const isLastPage = i === sortedBreaks.length;
    const pageEndIndex = isLastPage ? wordTimestamps.length : sortedBreaks[i] + 1;
    
    const pageWords = [];
    for (let wordIdx = currentPageStart; wordIdx < pageEndIndex; wordIdx++) {
      if (wordIdx < wordTimestamps.length) {
        pageWords.push(wordTimestamps[wordIdx]);
      }
    }
    
    if (pageWords.length > 0) {
      const pageStartTime = pageWords[0].start;
      const pageEndTime = pageWords[pageWords.length - 1].end;
      
      // Calculate character count for this page
      const pageText = pageWords.map(w => w.word).join(' ');
      const characterCount = pageText.length;
      
      const page = {
        pageIndex: i,
        words: pageWords,
        startTime: pageStartTime,
        endTime: pageEndTime,
        wordCount: pageWords.length,
        characterCount: characterCount
      };
      pages.push(page);
      
      debugLog('PAGE-GENERATOR', `Created page ${i}`, { 
        pageIndex: page.pageIndex,
        wordCount: page.wordCount,
        characterCount: page.characterCount,
        duration: (page.endTime - page.startTime).toFixed(3) + 's'
      });
    }
    
    currentPageStart = pageEndIndex;
  }
  
  debugLog('PAGE-GENERATOR', 'Page generation complete', { totalPages: pages.length });
  
  return pages;
}

/**
 * Eliminate gaps between consecutive pages by adjusting boundaries
 * @param {Array} pages - Array of page objects
 * @returns {Array} Adjusted pages array with no gaps
 */
/**
 * Finds gaps between pages and adds transition info for the frontend.
 * This does NOT modify the page start/end times.
 * @param {Array} pages - Array of page objects
 * @returns {Array} The same pages array, now with transitionInfo added
 */
function calculatePageTransitions(pages) {
  debugLog('PAGE-GENERATOR', 'Starting page transition calculation', { pageCount: pages?.length || 0 });
  
  if (!pages || pages.length <= 1) {
    debugLog('PAGE-GENERATOR', 'Skipping transition calculation (insufficient pages)');
    return pages;
  }
  
  // We'll work directly on the pages array.
  for (let i = 0; i < pages.length - 1; i++) {
    const currentPage = pages[i];
    const nextPage = pages[i + 1];
  
    // Use true start/end times to find the gap
    const gap = nextPage.startTime - currentPage.endTime;
    
    // We only care about gaps that are large enough to need this logic.
    // A tiny gap (e.g., < 10ms) can be ignored.
    const gapThreshold = 0.01; // 10 milliseconds

    if (gap > gapThreshold) {
      const gapStartTime = currentPage.endTime; // True end of Page A
      const gapEndTime = nextPage.startTime;   // True start of Page B
      const gapMidpointTime = Math.round((gapStartTime + (gap / 2)) * 1000) / 1000;

      // Add the new transitionInfo object to the *current* page
      currentPage.transitionInfo = {
        gapStartTime: gapStartTime,
        gapEndTime: gapEndTime,
        gapMidpointTime: gapMidpointTime
      };

      debugLog('PAGE-GENERATOR', `Added transition info to page ${i}`, {
        gap: gap.toFixed(3) + 's',
        midpoint: gapMidpointTime.toFixed(3) + 's'
      });
    }
  }
  
  debugLog('PAGE-GENERATOR', 'Page transition calculation complete');
  
  return pages; // Return the pages, now with transitionInfo
}

module.exports = {
  generatePagesFromBreaks,
  calculatePageTransitions // <-- Updated function name
};
