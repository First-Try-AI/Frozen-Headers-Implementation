// Pagination Core Module
// Main orchestration logic and core pagination functions

const { findNumberedItemBreaks, findProtectedContentBreaks } = require('./protected-content-detector');
const { generatePagesFromBreaks, calculatePageTransitions } = require('./page-generator');
const { findConjunctionBreaks, applyConjunctionBreaksToLongPages, applyBreathingGapsToLongPages } = require('./page-splitter');
const { isInProtectedRange } = require('./pagination-utils');

const DEBUG = process.env.PAGINATION_DEBUG === 'true';

function debugLog(module, message, data = null) {
  if (DEBUG) {
    console.log(`🔍 [${module}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}


/**
 * Find sentence ending breaks (3rd priority)
 * @param {Array} words - Array of words
 * @param {Array} protectedRanges - Array of protected range objects to skip
 * @returns {Array} Array of word indices where sentence endings occur
 */
function findSentenceBreaks(words, protectedRanges = []) {
  debugLog('PAGINATION-CORE', 'Starting sentence break detection', { 
    wordCount: words.length, 
    protectedRangesCount: protectedRanges.length 
  });
  
  const breaks = [];
  for (let i = 0; i < words.length; i++) {
    // Skip if in protected range
    if (isInProtectedRange(i, protectedRanges)) continue;
    
    const word = words[i];
    const punctMatch = word.match(/([.!?]+)$/);
    if (punctMatch) {
      breaks.push(i);
      debugLog('PAGINATION-CORE', `Found sentence break`, { 
        wordIndex: i, 
        word, 
        punctuation: punctMatch[1] 
      });
    }
  }
  
  debugLog('PAGINATION-CORE', 'Sentence break detection complete', { breaksFound: breaks.length });
  
  return breaks;
}

/**
 * Find middle punctuation breaks (4th priority)
 * @param {Array} words - Array of words
 * @param {Array} sentenceBreaks - Array of sentence break indices to skip
 * @param {Array} protectedRanges - Array of protected range objects to skip
 * @returns {Array} Array of word indices where middle punctuation occurs
 */
function findMiddlePunctuationBreaks(words, sentenceBreaks, protectedRanges = []) {
  debugLog('PAGINATION-CORE', 'Starting middle punctuation break detection', { 
    wordCount: words.length, 
    sentenceBreaksCount: sentenceBreaks.length,
    protectedRangesCount: protectedRanges.length 
  });
  
  const breaks = [];
  for (let i = 0; i < words.length; i++) {
    // Skip if already a sentence break or in protected range
    if (sentenceBreaks.includes(i) || isInProtectedRange(i, protectedRanges)) continue;
    
    const word = words[i];
    const punctMatch = word.match(/([,;:—–…-]+)$/);
    if (punctMatch) {
      breaks.push(i);
      debugLog('PAGINATION-CORE', `Found middle punctuation break`, { 
        wordIndex: i, 
        word, 
        punctuation: punctMatch[1] 
      });
    }
  }
  
  debugLog('PAGINATION-CORE', 'Middle punctuation break detection complete', { breaksFound: breaks.length });
  
  return breaks;
}

// Create page breaks using hierarchical punctuation analysis
function createPageBreaks(wordTimestamps, thresholds = {}) {
  debugLog('PAGINATION-CORE', 'Starting main pagination orchestration', { 
    wordTimestampsCount: wordTimestamps?.length || 0,
    thresholds 
  });
  
  // Error handling - no fallbacks
  if (!wordTimestamps || wordTimestamps.length === 0) {
    console.error('❌ [PAGINATION] Error: wordTimestamps is empty or undefined');
    throw new Error('Pagination failed: wordTimestamps is empty or undefined');
  }

  // Extract text from wordTimestamps
  const text = wordTimestamps.map(w => w.word).join(' ');
  if (!text || text.trim().length === 0) {
    console.error('❌ [PAGINATION] Error: Could not extract text from wordTimestamps');
    throw new Error('Pagination failed: Could not extract text from wordTimestamps');
  }

  const words = text.split(/\s+/).filter(w => w.length > 0);

  console.log('🔍 [PAGINATION] Input wordTimestamps count:', wordTimestamps.length);
  console.log('🔍 [PAGINATION] Extracted text length:', text.length);
  console.log('🔍 [PAGINATION] Extracted text preview:', text.substring(0, 100) + '...');
  console.log('🔍 [PAGINATION] Words count:', words.length);
  console.log('🔍 [PAGINATION] First 10 words:', words.slice(0, 10));

  // First pass: Find numbered items (1., 2., 10., etc.)
  debugLog('PAGINATION-CORE', 'Calling protected-content-detector for numbered items');
  const numberedItems = findNumberedItemBreaks(words);
  console.log('🔢 [NUMBERED] Numbered item ranges found:', numberedItems.protectedRanges.length);
  console.log('🔢 [NUMBERED] Numbered item details:', numberedItems.protectedRanges);
  console.log('🔢 [NUMBERED] Numbered item breaks found:', numberedItems.breaks);

  // Second pass: Find protected content (quotes, parentheses, brackets, etc.)
  debugLog('PAGINATION-CORE', 'Calling protected-content-detector for delimited content');
  const protectedContent = findProtectedContentBreaks(text, words);
  console.log('🛡️ [PROTECTED] Protected ranges found:', protectedContent.protectedRanges.length);
  console.log('🛡️ [PROTECTED] Protected content details:', protectedContent.protectedRanges);
  console.log('🛡️ [PROTECTED] Protected breaks found:', protectedContent.breaks);

  // Combine all protected ranges (numbered items + delimited content)
  const allProtectedRanges = [...numberedItems.protectedRanges, ...protectedContent.protectedRanges];

  // Third pass: Find sentence endings (skip all protected content)
  debugLog('PAGINATION-CORE', 'Finding sentence breaks');
  const sentenceBreaks = findSentenceBreaks(words, allProtectedRanges);
  console.log('🔍 [PAGINATION] Sentence breaks found:', sentenceBreaks);

  // Fourth pass: Find middle punctuation (skip all protected content)
  debugLog('PAGINATION-CORE', 'Finding middle punctuation breaks');
  const middleBreaks = findMiddlePunctuationBreaks(words, [...sentenceBreaks], allProtectedRanges);
  console.log('🔍 [PAGINATION] Middle breaks found:', middleBreaks);

  // Fifth pass: Find conjunction breaks (skip all protected content, only for pages >64 chars later)
  debugLog('PAGINATION-CORE', 'Calling page-splitter for conjunction breaks');
  const conjunctionBreaks = findConjunctionBreaks(words, [...sentenceBreaks, ...middleBreaks], allProtectedRanges);
  console.log('🔍 [PAGINATION] Conjunction breaks found:', conjunctionBreaks);

  // Combine and sort all breaks (numbered items + protected + punctuation, conjunctions applied later)
  const allBreaks = [...numberedItems.breaks, ...protectedContent.breaks, ...sentenceBreaks, ...middleBreaks].sort((a, b) => a - b);
  console.log('🔍 [PAGINATION] All breaks combined:', allBreaks);

  // Error if no punctuation found
  if (allBreaks.length === 0) {
    console.error('❌ [PAGINATION] No punctuation found - cannot paginate');
    throw new Error('Pagination failed: No punctuation marks found in text');
  }

  const pageBreaks = allBreaks;
  console.log('🔍 [PAGINATION] Final page breaks:', pageBreaks);

  // Generate pages array from page breaks and word timestamps
  debugLog('PAGINATION-CORE', 'Calling page-generator to create pages');
  const pages = generatePagesFromBreaks(wordTimestamps, pageBreaks);
  
  // Calculate transition info for gaps between consecutive pages
  debugLog('PAGINATION-CORE', 'Calling page-generator to calculate transitions');
  const pagesWithTransitions = calculatePageTransitions(pages);
  
  // Apply conjunction breaks to long pages (pages > 64 characters)
  const minPageLength = 64;
  console.log(`🔗 [CONJUNCTION] Applying conjunction breaks to pages > ${minPageLength} chars`);
  debugLog('PAGINATION-CORE', 'Calling page-splitter for conjunction splitting');
  const pagesWithConjunctions = applyConjunctionBreaksToLongPages(pagesWithTransitions, conjunctionBreaks, wordTimestamps, minPageLength);
  console.log(`🔗 [CONJUNCTION] Pages after conjunction split: ${pagesWithConjunctions.length} (was ${pagesWithTransitions.length})`);
  
  // Apply breathing gaps to long pages (pages > 64 characters)
  const breathingGapThreshold = thresholds.breakPauseSecond || 60;
  console.log(`💨 [BREATHING-GAP] Applying breathing gaps with minPageLength: ${minPageLength}, threshold: ${breathingGapThreshold}ms`);
  debugLog('PAGINATION-CORE', 'Calling page-splitter for breathing gap splitting');
  const finalPages = applyBreathingGapsToLongPages(pagesWithConjunctions, minPageLength, breathingGapThreshold);
  console.log(`💨 [BREATHING-GAP] Pages after breathing gap split: ${finalPages.length} (was ${pagesWithConjunctions.length})`);

  // Create page break details with break priority info
  const pageBreakDetails = pageBreaks.map((wordIndex, index) => ({
    breakNumber: index + 1,
    pauseDuration: 0,
    breakType: numberedItems.breaks.includes(wordIndex) ? 'numbered-item' :
               protectedContent.breaks.includes(wordIndex) ? 'protected-content' :
               sentenceBreaks.includes(wordIndex) ? 'sentence-ending' : 
               middleBreaks.includes(wordIndex) ? 'middle-punctuation' : 'conjunction',
    thresholdUsed: 'N/A',
    wordIndex: wordIndex,
    wordText: words[wordIndex] || 'unknown',
    punctuation: words[wordIndex]?.match(/([.!?,;:—–…-]+)$/)?.[1] || 'unknown'
  }));

  const result = {
    pageBreaks: pageBreaks,
    pageBreakDetails: pageBreakDetails,
    pages: finalPages,
    summary: {
      totalWords: words.length,
      totalPages: finalPages.length,
      averagePageSize: Math.round(words.length / finalPages.length),
      thresholdsUsed: {},
      thresholdUsed: 'numbered-protected-punctuation-hierarchical-with-conjunctions-and-breathing-gaps',
      totalBreaks: pageBreaks.length,
      numberedItemBreaks: numberedItems.breaks.length,
      numberedItemRanges: numberedItems.protectedRanges.length,
      protectedContentBreaks: protectedContent.breaks.length,
      protectedRanges: protectedContent.protectedRanges.length,
      sentenceBreaks: sentenceBreaks.length,
      middleBreaks: middleBreaks.length,
      conjunctionBreaks: conjunctionBreaks.length,
      breathingGapSplits: finalPages.length - pagesWithConjunctions.length
    }
  };
  
  debugLog('PAGINATION-CORE', 'Pagination orchestration complete', { 
    totalPages: result.pages.length,
    totalBreaks: result.pageBreaks.length,
    summary: result.summary
  });
  
  return result;
}

module.exports = {
  createPageBreaks
};
