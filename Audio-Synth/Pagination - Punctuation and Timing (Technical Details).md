# Pagination - Punctuation and Timing (Technical Details)

## Overview

This document details the technical implementation of ArT Reader's hierarchical pagination system in `cloud-run-services/Audio-Synth/pagination-module.js`.

## Architecture

The pagination system operates as a multi-pass analysis pipeline that processes text and audio timing data to generate optimal page breaks.

### Input
- `wordTimestamps`: Array of `{word, start, end}` objects from TTS audio generation
- `thresholds`: Configuration object (currently uses `breakPauseSecond` for breathing gap threshold)

### Output
```javascript
{
  pageBreaks: [3, 7, 12, ...],           // Word indices where breaks occur
  pageBreakDetails: [...],                // Metadata for each break
  pages: [{                               // Complete page objects
    pageIndex: 0,
    words: [...],                         // Word timestamp objects
    startTime: 0.0,
    endTime: 2.5,
    wordCount: 8,
    characterCount: 45
  }, ...],
  summary: {                              // Analytics
    totalWords: 150,
    totalPages: 12,
    numberedItemBreaks: 3,
    numberedItemRanges: 3,
    protectedContentBreaks: 2,
    sentenceBreaks: 8,
    middleBreaks: 15,
    conjunctionBreaks: 3,
    breathingGapSplits: 2
  }
}
```

---

## Core Function: `createPageBreaks(wordTimestamps, thresholds)`

### Phase 1: Text Extraction
```javascript
const text = wordTimestamps.map(w => w.word).join(' ');
const words = text.split(/\s+/).filter(w => w.length > 0);
```
Reconstructs full text and word array from timestamp data.

### Phase 2: Numbered Item Detection (1st Priority)
```javascript
const numberedItems = findNumberedItemBreaks(words);
```
- Detects numbered list items: `1.`, `2.)`, `3.]`, `4:`, `5 -`, etc.
- Regex: `/^(\d+)[\.:\)\]]+/` for most patterns, plus special handling for `# -` pattern
- Protects only "number + separator + first three words" (e.g., "1. First numbered item")
- Rest of the line processed normally by other pagination rules
- Returns: `{protectedRanges: [], breaks: []}`

### Phase 3: Protected Content Detection (2nd Priority)
```javascript
const protectedContent = findProtectedContentBreaks(text, words);
```
- Detects content bounded by `""`, `()`, `[]`, `{}`, `<>`, `<<>>`
- Calculates character count of bounded content
- Creates protected ranges for content ≤64 characters
- Returns: `{protectedRanges: [], breaks: []}`

### Phase 4: Combine Protected Ranges
```javascript
const allProtectedRanges = [...numberedItems.protectedRanges, ...protectedContent.protectedRanges];
```
All subsequent passes skip these protected ranges.

### Phase 5: Sentence Breaks (3rd Priority)
```javascript
const sentenceBreaks = findSentenceBreaks(words, allProtectedRanges);
```
- Regex: `/([.!?]+)$/`
- Skips words in all protected ranges (numbered items + delimited content)
- Returns: Array of word indices

### Phase 6: Middle Punctuation Breaks (4th Priority)
```javascript
const middleBreaks = findMiddlePunctuationBreaks(words, sentenceBreaks, allProtectedRanges);
```
- Regex: `/([,;:—–…-]+)$/`
- Skips sentence breaks and all protected ranges
- Returns: Array of word indices

### Phase 7: Conjunction Breaks (5th Priority)
```javascript
const conjunctionBreaks = findConjunctionBreaks(words, [...sentenceBreaks, ...middleBreaks], allProtectedRanges);
```
- Detects: `and`, `or`, `but`, `nor`, `yet`, `so`, `however`
- Creates break BEFORE conjunction (i-1)
- Skips existing breaks and all protected ranges
- Applied only to pages >64 chars later in pipeline

### Phase 8: Combine Initial Breaks
```javascript
const allBreaks = [...numberedItems.breaks, ...protectedContent.breaks, ...sentenceBreaks, ...middleBreaks].sort((a, b) => a - b);
```
Conjunctions are NOT included yet - they're applied post-processing.

### Phase 9: Generate Pages
```javascript
const pages = generatePagesFromBreaks(wordTimestamps, pageBreaks);
```
Creates page objects with:
- Word arrays
- Start/end timestamps
- Word count
- **Character count** (critical for subsequent filtering)

### Phase 10: Eliminate Gaps
```javascript
const adjustedPages = eliminatePageGaps(pages);
```
Adjusts page boundaries so `page[i].endTime === page[i+1].startTime` (no gaps or overlaps).

### Phase 11: Apply Conjunction Breaks (5th Priority)
```javascript
const pagesWithConjunctions = applyConjunctionBreaksToLongPages(adjustedPages, conjunctionBreaks, wordTimestamps, minPageLength);
```
- Filters pages with `characterCount > 64`
- For each long page, checks for conjunction breaks within its word range
- Splits page at conjunction break points
- Returns expanded page array

### Phase 12: Apply Breathing Gaps (6th Priority)
```javascript
const finalPages = applyBreathingGapsToLongPages(pagesWithConjunctions, minPageLength, breathingGapThreshold);
```
- Filters pages with `characterCount > 64`
- Analyzes word-to-word timing gaps
- Splits at gaps ≥60ms (configurable via `thresholds.breakPauseSecond`)
- Returns final page array

---

## Key Helper Functions

### `findNumberedItemBreaks(words)`

**Algorithm:**
1. Iterate through words array
2. Check each word for numbered patterns:
   - `/^(\d+)[\.:\)\]]+/` - matches `1.`, `2.)`, `3.]`, `4:`, etc.
   - Special case: `/^(\d+)$/` followed by `-` in next word (e.g., `5 -`)
3. If match found:
   - Determine start and end of "number + separator + first three words"
   - Skip dash word if `# -` pattern detected
   - Stop after third word (no continuation to next numbered item)
   - Calculate character count for protected portion
   - Create protected range for first three words only
   - Add break at end of third word
4. Skip ahead to avoid overlapping ranges

**Key Logic:**
```javascript
for (let i = 0; i < words.length; i++) {
  const word = words[i];
  
  // Check for numbered patterns: "1.", "2.)", "3.]", "4:", "5" (followed by "-")
  let numberMatch = word.match(/^(\d+)[\.:\)\]]+/);
  let skipNext = false;
  
  // Special case: "4 -" pattern (number followed by dash in next word)
  if (!numberMatch && word.match(/^(\d+)$/)) {
    if (i + 1 < words.length && words[i + 1] === '-') {
      numberMatch = word.match(/^(\d+)$/);
      skipNext = true; // We'll skip the dash word
    }
  }
  
  if (!numberMatch) continue; // No fallback behavior
  
  // Find end of numbered item
  let endIndex = i;
  
  // If we matched "4 -" pattern, skip the dash
  if (skipNext && i + 1 < words.length) {
    endIndex = i + 1; // Include the dash word
  }
  
  // Stop after third word - only protect number + separator + first three words
  // Let the rest of the line be processed normally by other pagination rules
  
  // Create protected range
  protectedRanges.push({
    start: i,
    end: endIndex,
    type: 'numbered-item',
    charCount: words.slice(i, endIndex + 1).join(' ').length
  });
  
  i = endIndex; // Skip ahead
}
```

**No Fallback Behavior:** If pattern doesn't match exactly, word is skipped. No arbitrary breaks created.

**Protected Content:**
- `1. First numbered item` - number + period + first three words
- `2.) Second numbered item` - number + period + paren + first three words  
- `3.] Third numbered item` - number + period + bracket + first three words
- `4: Fourth numbered item` - number + colon + first three words
- `5 - Fifth numbered item` - number + space + dash + first three words

**Rest of Line:** Everything after the first three words is processed normally by sentence endings, middle punctuation, conjunctions, and breathing gaps.

### `findProtectedContentBreaks(text, words)`

**Algorithm:**
1. Build word position map (word index → character positions in text)
2. For each delimiter type, scan text character-by-character
3. Handle double delimiters (`<<>>`) with special logic
4. Handle single delimiters with depth tracking for nesting
5. Calculate content length (characters between delimiters)
6. If ≤64 chars, map character positions to word indices
7. Create protected range object and add break at closing word

**Key Logic:**
```javascript
// Build position map
const wordPositions = []; // {wordIndex, startChar, endChar}
for (let i = 0; i < words.length; i++) {
  const wordStart = text.indexOf(words[i], charPos);
  const wordEnd = wordStart + words[i].length;
  wordPositions.push({ wordIndex: i, startChar: wordStart, endChar: wordEnd });
  charPos = wordEnd;
}

// Find word index at character position
const findWordIndexAtChar = (charIndex) => {
  for (const pos of wordPositions) {
    if (charIndex >= pos.startChar && charIndex <= pos.endChar) {
      return pos.wordIndex;
    }
  }
  return -1;
};
```

**Delimiter Processing:**
- Double delimiters (`<<text>>`): Use `text.indexOf(closeChar + closeChar, searchStart)`
- Single delimiters: Use depth tracking to handle nesting (parentheses can contain parentheses)
- Quotes: Don't track depth (quotes don't nest)

### `isInProtectedRange(wordIndex, protectedRanges)`

Simple range check used by all downstream functions:
```javascript
return protectedRanges.some(range => 
  wordIndex >= range.start && wordIndex <= range.end
);
```

### `generatePagesFromBreaks(wordTimestamps, pageBreaks)`

**Algorithm:**
1. Iterate through pageBreaks array
2. For each segment, extract word timestamp slice
3. Calculate page metadata:
   - `startTime`: First word's start
   - `endTime`: Last word's end
   - `wordCount`: Word array length
   - `characterCount`: `words.map(w => w.word).join(' ').length`
4. Return page object array

### `eliminatePageGaps(pages)`

**Purpose:** Ensure continuous playback without timing gaps.

**Algorithm:**
```javascript
for (let i = 0; i < pages.length - 1; i++) {
  const currentPage = pages[i];
  const nextPage = pages[i + 1];
  
  // Adjust current page's end to match next page's start
  currentPage.endTime = nextPage.startTime;
  
  // Also adjust last word's end time in current page
  if (currentPage.words.length > 0) {
    currentPage.words[currentPage.words.length - 1].end = nextPage.startTime;
  }
}
```

### `applyConjunctionBreaksToLongPages(pages, conjunctionBreaks, wordTimestamps, minPageLength)`

**Algorithm:**
1. Filter pages where `page.characterCount > minPageLength` (64)
2. For each long page:
   - Determine page's word range: `[startIdx, endIdx]`
   - Find conjunction breaks within this range
   - Call `splitPageByConjunctions(page, relevantBreaks, wordTimestamps)`
3. Replace long pages with split pages in final array
4. Recalculate `pageIndex` for all pages

**Split Logic:**
```javascript
function splitPageByConjunctions(page, conjunctionBreaks, wordTimestamps) {
  // Sort breaks
  const breaks = conjunctionBreaks.sort((a, b) => a - b);
  
  // Create segments between breaks
  // Each break splits: [start...breakIdx] [breakIdx+1...end]
  
  // For each segment, create new page with recalculated metadata
}
```

### `applyBreathingGapsToLongPages(pages, minPageLength, breathingGapThreshold)`

**Algorithm:**
1. Filter pages where `page.characterCount > minPageLength` (64)
2. For each long page:
   - Call `findBreathingGapsInPage(page, breathingGapThreshold)`
   - If gaps found, call `splitPageByBreathingGaps(page, gapIndices)`
3. Replace long pages with split pages
4. Recalculate `pageIndex`

**Gap Detection:**
```javascript
function findBreathingGapsInPage(page, threshold) {
  const gapIndices = [];
  const words = page.words;
  
  for (let i = 0; i < words.length - 1; i++) {
    const currentWordEnd = words[i].end;
    const nextWordStart = words[i + 1].start;
    const gap = (nextWordStart - currentWordEnd) * 1000; // Convert to ms
    
    if (gap >= threshold) {
      gapIndices.push(i); // Break after word i
    }
  }
  
  return gapIndices;
}
```

---

## Error Handling

**No Fallback Philosophy:** The system throws errors rather than falling back to arbitrary breaks.

```javascript
// Error if no wordTimestamps
if (!wordTimestamps || wordTimestamps.length === 0) {
  throw new Error('Pagination failed: wordTimestamps is empty or undefined');
}

// Error if no text extracted
if (!text || text.trim().length === 0) {
  throw new Error('Pagination failed: Could not extract text from wordTimestamps');
}

// Error if no punctuation found
if (allBreaks.length === 0) {
  throw new Error('Pagination failed: No punctuation marks found in text');
}
```

This forces upstream systems to provide valid input and makes failures explicit.

---

## Configuration

### Constants
```javascript
const minPageLength = 64;                           // Character threshold
const breathingGapThreshold = thresholds.breakPauseSecond || 60;  // Milliseconds
```

### Thresholds Object
```javascript
{
  breakPauseFirst: 100,    // Not currently used (legacy)
  breakPauseSecond: 60,    // Used for breathing gaps
  usePrimary: true,        // Not currently used (legacy)
  useSecondary: false      // Not currently used (legacy)
}
```

---

## Logging

Comprehensive console logging at each phase:
- `🔍 [PAGINATION]` - Main pagination flow
- `🔢 [NUMBERED]` - Numbered item detection
- `🛡️ [PROTECTED]` - Protected content detection
- `🔗 [CONJUNCTION]` - Conjunction break processing
- `💨 [BREATHING-GAP]` - Breathing gap processing

Example:
```javascript
console.log('🔢 [NUMBERED] Numbered item ranges found:', numberedItems.protectedRanges.length);
console.log('🛡️ [PROTECTED] Protected ranges found:', protectedContent.protectedRanges.length);
console.log('🔍 [PAGINATION] Sentence breaks found:', sentenceBreaks);
console.log('🔗 [CONJUNCTION] Applying conjunction breaks to pages > 64 chars');
```

---

## Integration with Frontend

The frontend (`dev/artreader.art/reader/`) receives the `pages` array and uses it to:
1. Populate `this.audioSystem.pages`
2. Render text for each page via `displayElements`
3. Sync audio playback with page navigation
4. Calculate page transition timing

The `characterCount` property on each page is used by the frontend for layout calculations and future enhancements.

---

## Performance Considerations

1. **Single Pass Text Processing:** Text is extracted once and reused
2. **Early Filtering:** Protected ranges filter out words before punctuation analysis
3. **Post-Processing Split:** Conjunctions and breathing gaps only process long pages (>64 chars)
4. **Sorted Arrays:** Break arrays are sorted once and maintained in order

---

## Future Enhancements

Potential areas for expansion:
- Dynamic `minPageLength` based on viewport size
- Configurable protected content thresholds per delimiter type
- Machine learning to detect semantic units beyond punctuation
- Language-specific punctuation rules (e.g., Spanish `¿?`, French `« »`)
- Custom breathing gap thresholds per voice/speed combination

