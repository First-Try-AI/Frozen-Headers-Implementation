// Protected Content Detection Module
// Handles numbered item detection and delimited content protection

const DEBUG = process.env.PAGINATION_DEBUG === 'true';

function debugLog(module, message, data = null) {
  if (DEBUG) {
    console.log(`🔍 [${module}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

/**
 * Find numbered item breaks (1st priority)
 * Detects numbered list items: 1., 2.), 3.], 4:, 5 -, etc.
 * Entire numbered item stays together regardless of length
 * No fallback behavior - numbered items must match the pattern exactly
 * @param {Array} words - Array of words
 * @returns {Object} Object with protectedRanges array and breaks array
 */
function findNumberedItemBreaks(words) {
  debugLog('PROTECTED-CONTENT-DETECTOR', 'Starting numbered item detection', { wordCount: words.length });
  
  const protectedRanges = [];
  const breaks = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check for numbered patterns: "1.", "2.)", "3.]", "4:", "5" (followed by "-"), or "#1.", "#2.)", "#3.]", "#4:", "#5" (followed by "-")
    let numberMatch = word.match(/^#?(\d+)[\.:\)\]]+/);
    let skipNext = false;
    
    // Special case: "4 -" pattern (number followed by dash in next word)
    // Also handles "#4 -" pattern
    if (!numberMatch && word.match(/^#?(\d+)$/)) {
      if (i + 1 < words.length && words[i + 1] === '-') {
        numberMatch = word.match(/^#?(\d+)$/);
        skipNext = true; // We'll skip the dash word
      }
    }
    
    if (!numberMatch) continue; // Skip if not a numbered item - no fallback
    
    debugLog('PROTECTED-CONTENT-DETECTOR', `Found numbered item at index ${i}`, { word, numberMatch: numberMatch[0] });
    
    // Find the end of the entire numbered sentence
    let endIndex = i;
    
    // If we matched "4 -" pattern, include the dash word
    if (skipNext && i + 1 < words.length) {
      endIndex = i + 1; // Include the dash word
    }
    
    // If there's content after the marker in same word, count it as first word
    if (word.length > numberMatch[0].length) {
      // Word has content after the marker: "1.Text" or "2.)content"
      endIndex = i;
      // Now include 2 more words (total 3 words including this one)
      let wordsAdded = 1;
      while (wordsAdded < 3 && endIndex + 1 < words.length) {
        endIndex = endIndex + 1;
        wordsAdded++;
      }
    } else {
      // Word is just the marker - include up to 3 words after
      let wordsAdded = 0;
      while (wordsAdded < 3 && endIndex + 1 < words.length) {
        endIndex = endIndex + 1;
        wordsAdded++;
      }
      // If we couldn't get 3 words (end of text), keep what we have
      // No fallback - just protect whatever words are available
    }
    
    // Stop after third word - only protect number + separator + first three words
    // Let the rest of the line be processed normally by other pagination rules
    
    // Calculate character count for the protected portion (number + separator + first three words)
    const protectedWords = words.slice(i, endIndex + 1);
    const protectedText = protectedWords.join(' ');
    const protectedLength = protectedText.length;
    
    // Always protect the number + separator + first three words (no character limit)
    const protectedRange = {
      start: i,
      end: endIndex,
      type: 'numbered-item',
      charCount: protectedLength
    };
    protectedRanges.push(protectedRange);
    breaks.push(endIndex);
    
    debugLog('PROTECTED-CONTENT-DETECTOR', `Created numbered item range`, { 
      range: protectedRange, 
      protectedText: protectedText,
      length: protectedLength
    });
    
    // Skip ahead to avoid overlapping
    i = endIndex;
  }
  
  // Sort and deduplicate breaks
  const uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b);
  
  debugLog('PROTECTED-CONTENT-DETECTOR', 'Numbered item detection complete', { 
    protectedRangesCount: protectedRanges.length, 
    breaksCount: uniqueBreaks.length 
  });
  
  return { protectedRanges, breaks: uniqueBreaks };
}

/**
 * Find protected content breaks (2nd priority)
 * Detects content bounded by quotes, parentheses, brackets, braces, angle brackets, or guillemets
 * If bounded content is ≤64 characters, it becomes a protected zone (no other pagination rules apply)
 * @param {string} text - Full text to analyze
 * @param {Array} words - Array of words
 * @returns {Object} Object with protectedRanges array and breaks array
 */
function findProtectedContentBreaks(text, words) {
  debugLog('PROTECTED-CONTENT-DETECTOR', 'Starting protected content detection', { 
    textLength: text.length, 
    wordCount: words.length 
  });
  
  const protectedRanges = []; // Array of {start, end, type} objects marking protected word ranges
  const breaks = []; // Array of word indices where protected content ends
  
  // Define delimiter pairs: [opening, closing, name, minLength for double delimiters]
  const delimiters = [
    ['"', '"', 'quotes', 1],
    ['(', ')', 'parentheses', 1],
    ['[', ']', 'brackets', 1],
    ['{', '}', 'braces', 1],
    ['<', '>', 'angle', 2], // Need << >> or single < >
  ];
  
  // Track character position in text
  let charPos = 0;
  const wordPositions = []; // Array of {wordIndex, startChar, endChar}
  
  // Build word position map
  for (let i = 0; i < words.length; i++) {
    const wordStart = text.indexOf(words[i], charPos);
    const wordEnd = wordStart + words[i].length;
    wordPositions.push({ wordIndex: i, startChar: wordStart, endChar: wordEnd });
    charPos = wordEnd;
  }
  
  // Helper: Find word index at character position
  const findWordIndexAtChar = (charIndex) => {
    for (const pos of wordPositions) {
      if (charIndex >= pos.startChar && charIndex <= pos.endChar) {
        return pos.wordIndex;
      }
    }
    return -1;
  };
  
  // Process each delimiter type
  for (const [openChar, closeChar, delimType, minLen] of delimiters) {
    debugLog('PROTECTED-CONTENT-DETECTOR', `Processing delimiter type: ${delimType}`, { openChar, closeChar, minLen });
    let i = 0;
    
    while (i < text.length) {
      // Check for double delimiters first (guillemets: <<text>>)
      if (minLen === 2 && text[i] === openChar && text[i + 1] === openChar) {
        const openPos = i;
        const searchStart = i + 2;
        
        // Find matching closing delimiter
        const closePos = text.indexOf(closeChar + closeChar, searchStart);
        
        if (closePos !== -1) {
          const content = text.substring(openPos + 2, closePos);
          const contentLength = content.length;
          
          // Only protect if ≤64 characters
          if (contentLength <= 64) {
            const startWordIdx = findWordIndexAtChar(openPos);
            const endWordIdx = findWordIndexAtChar(closePos + 1);
            
            if (startWordIdx !== -1 && endWordIdx !== -1) {
              const protectedRange = {
                start: startWordIdx,
                end: endWordIdx,
                type: 'guillemets',
                charCount: contentLength
              };
              protectedRanges.push(protectedRange);
              breaks.push(endWordIdx);
              
              debugLog('PROTECTED-CONTENT-DETECTOR', `Found guillemets content`, { 
                range: protectedRange, 
                content: content.substring(0, 30) + (content.length > 30 ? '...' : '')
              });
            }
          } else {
            debugLog('PROTECTED-CONTENT-DETECTOR', `Skipping guillemets content (too long)`, { contentLength });
          }
          
          i = closePos + 2;
          continue;
        }
      }
      
      // Check for single delimiters
      if (text[i] === openChar) {
        const openPos = i;
        const searchStart = i + 1;
        
        // Find matching closing delimiter
        let closePos = -1;
        let depth = 1;
        
        // Handle nested delimiters properly
        for (let j = searchStart; j < text.length; j++) {
          if (text[j] === openChar && openChar !== '"') { // Quotes don't nest
            depth++;
          } else if (text[j] === closeChar) {
            depth--;
            if (depth === 0) {
              closePos = j;
              break;
            }
          }
        }
        
        if (closePos !== -1) {
          const content = text.substring(openPos + 1, closePos);
          const contentLength = content.length;
          
          // Only protect if ≤64 characters
          if (contentLength <= 64) {
            const startWordIdx = findWordIndexAtChar(openPos);
            const endWordIdx = findWordIndexAtChar(closePos);
            
            if (startWordIdx !== -1 && endWordIdx !== -1) {
              const protectedRange = {
                start: startWordIdx,
                end: endWordIdx,
                type: delimType,
                charCount: contentLength
              };
              protectedRanges.push(protectedRange);
              breaks.push(endWordIdx);
              
              debugLog('PROTECTED-CONTENT-DETECTOR', `Found ${delimType} content`, { 
                range: protectedRange, 
                content: content.substring(0, 30) + (content.length > 30 ? '...' : '')
              });
            }
          } else {
            debugLog('PROTECTED-CONTENT-DETECTOR', `Skipping ${delimType} content (too long)`, { contentLength });
          }
          
          i = closePos + 1;
          continue;
        }
      }
      
      i++;
    }
  }
  
  // Sort protected ranges by start position
  protectedRanges.sort((a, b) => a.start - b.start);
  
  // Sort and deduplicate breaks
  const uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b);
  
  debugLog('PROTECTED-CONTENT-DETECTOR', 'Protected content detection complete', { 
    protectedRangesCount: protectedRanges.length, 
    breaksCount: uniqueBreaks.length 
  });
  
  return { protectedRanges, breaks: uniqueBreaks };
}

module.exports = {
  findNumberedItemBreaks,
  findProtectedContentBreaks
};
