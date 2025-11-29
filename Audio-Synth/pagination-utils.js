// Pagination Utilities Module
// Shared utility functions used across pagination modules

/**
 * Check if a word index falls within any protected range
 * @param {number} wordIndex - Word index to check
 * @param {Array} protectedRanges - Array of protected range objects
 * @returns {boolean} True if word is in a protected range
 */
function isInProtectedRange(wordIndex, protectedRanges) {
  return protectedRanges.some(range => 
    wordIndex >= range.start && wordIndex <= range.end
  );
}

module.exports = {
  isInProtectedRange
};

