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
function eliminatePageGaps(pages) {
  debugLog('PAGE-GENERATOR', 'Starting gap elimination', { pageCount: pages?.length || 0 });
  
  if (!pages || pages.length <= 1) {
    debugLog('PAGE-GENERATOR', 'Skipping gap elimination (insufficient pages)');
    return pages;
  }
  
  const adjustedPages = [...pages];
  
  for (let i = 0; i < adjustedPages.length - 1; i++) {
    const currentPage = adjustedPages[i];
    const nextPage = adjustedPages[i + 1];
    
    const gap = nextPage.startTime - currentPage.endTime;
    
    if (gap > 0) {
      const gapMidpoint = Math.round((currentPage.endTime + (gap / 2)) * 1000) / 1000;
      const oldEndTime = currentPage.endTime;
      const oldStartTime = nextPage.startTime;
      
      currentPage.endTime = gapMidpoint;
      nextPage.startTime = Math.round((gapMidpoint + 0.001) * 1000) / 1000;
      
      debugLog('PAGE-GENERATOR', `Eliminated gap between pages ${i} and ${i + 1}`, { 
        gap: gap.toFixed(3) + 's',
        oldEndTime: oldEndTime.toFixed(3) + 's',
        newEndTime: gapMidpoint.toFixed(3) + 's',
        oldStartTime: oldStartTime.toFixed(3) + 's',
        newStartTime: nextPage.startTime.toFixed(3) + 's'
      });
    }
  }
  
  debugLog('PAGE-GENERATOR', 'Gap elimination complete', { adjustedPagesCount: adjustedPages.length });
  
  return adjustedPages;
}

module.exports = {
  generatePagesFromBreaks,
  eliminatePageGaps
};
